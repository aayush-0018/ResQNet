import { log, err } from "./logger.js";

/**
 * Geocoding utility service using OpenStreetMap Nominatim API
 * Converts addresses to coordinates [longitude, latitude]
 */

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "ResQNet/1.0 (contact: admin@resqnet.local)";

/**
 * Geocode an address string to coordinates
 * @param {string} address - Full address string
 * @returns {Promise<[number, number]|null>} - [longitude, latitude] or null if failed
 */
export const geocodeAddress = async (address) => {
  if (!address || typeof address !== 'string') {
    return null;
  }

  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `${NOMINATIM_BASE_URL}/search?format=jsonv2&q=${encodedAddress}&limit=1&countrycodes=in`;
    
    const response = await fetch(url, {
      headers: { 
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const results = await response.json();
    
    if (results && results.length > 0) {
      const result = results[0];
      const coordinates = [parseFloat(result.lon), parseFloat(result.lat)];
      log(`📍 Geocoded: "${address}" -> [${coordinates[1]}, ${coordinates[0]}]`);
      return coordinates;
    }

    log(`⚠️ No geocoding results for: "${address}"`);
    return null;
  } catch (error) {
    err(`Geocoding failed for "${address}":`, error.message);
    return null;
  }
};

/**
 * Geocode address components to coordinates
 * @param {Object} addressComponents - Address components object
 * @param {string} addressComponents.street - Street address
 * @param {string} addressComponents.city - City
 * @param {string} addressComponents.state - State
 * @param {string} addressComponents.pincode - Pincode
 * @param {string} addressComponents.country - Country (default: India)
 * @returns {Promise<[number, number]|null>} - [longitude, latitude] or null if failed
 */
export const geocodeAddressComponents = async (addressComponents) => {
  if (!addressComponents) {
    return null;
  }

  const { street, city, state, pincode, country = "India" } = addressComponents;
  
  // Build address string from components
  const addressParts = [street, city, state, pincode, country].filter(Boolean);
  const fullAddress = addressParts.join(", ");
  
  if (!fullAddress.trim()) {
    return null;
  }

  return await geocodeAddress(fullAddress);
};

/**
 * Reverse geocode coordinates to address
 * @param {number} longitude - Longitude
 * @param {number} latitude - Latitude
 * @returns {Promise<string|null>} - Formatted address or null if failed
 */
export const reverseGeocode = async (longitude, latitude) => {
  if (typeof longitude !== 'number' || typeof latitude !== 'number') {
    return null;
  }

  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;
    
    const response = await fetch(url, {
      headers: { 
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result && result.display_name) {
      log(`📍 Reverse geocoded: [${latitude}, ${longitude}] -> "${result.display_name}"`);
      return result.display_name;
    }

    return null;
  } catch (error) {
    err(`Reverse geocoding failed for [${latitude}, ${longitude}]:`, error.message);
    return null;
  }
};

/**
 * Validate coordinates
 * @param {Array} coordinates - [longitude, latitude]
 * @returns {boolean} - True if valid coordinates
 */
export const validateCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }

  const [lng, lat] = coordinates;
  return (
    typeof lng === 'number' && 
    typeof lat === 'number' &&
    lng >= -180 && lng <= 180 &&
    lat >= -90 && lat <= 90
  );
};

/**
 * Get default coordinates for India (fallback)
 * @returns {[number, number]} - [longitude, latitude] for India center
 */
export const getDefaultCoordinates = () => [78.6569, 22.9734]; // India center