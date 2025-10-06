import Emergency from "../models/Emergency.js";
import { publishEvent } from "../services/pubsub.service.js";
import { emitEmergencyImmediate, emitStatusUpdate } from "../services/websocket.service.js";
import { pushEmergencyAtFront, pushStatusUpdate } from "../services/queue.service.js";
import { log, err } from "../utils/logger.js";
import { 
  geocodeAddress, 
  geocodeAddressComponents, 
  reverseGeocode, 
  validateCoordinates, 
  getDefaultCoordinates 
} from "../utils/geocoding.js";

/**
 * handleSOS
 * - persist emergency (Mongo Atlas)
 * - immediately notify connected clients via WebSocket (no worker needed for immediate notify)
 * - publish to Redis Pub/Sub channel "emergency.sos"
 * - LPUSH a follow-up job into Redis queue (front) for workers to pick up
 */
export const handleSOS = async (req, res) => {
  try {
    const { type, location, reporterId, meta, mobileNumber, email, addressDetails } = req.body;

    console.log(type, location, reporterId, meta, mobileNumber);

    // Validate mobile number (10-digit Indian number)
    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      return res.status(400).json({ 
        error: "Invalid payload: mobileNumber is required and must be a 10-digit Indian number" 
      });
    }

    let coordinates = null;
    let address = undefined;

    // Handle different location input formats
    if (location && Array.isArray(location.coordinates)) {
      // Direct coordinates provided
      coordinates = location.coordinates;
      if (!validateCoordinates(coordinates)) {
        return res.status(400).json({ 
          error: "Invalid coordinates: must be [longitude, latitude] with valid values" 
        });
      }
      
      // Reverse geocode to get address
      const [lng, lat] = coordinates;
      address = await reverseGeocode(lng, lat);
    } else if (addressDetails || location?.address) {
      // Address provided - geocode to coordinates
      const addressToGeocode = addressDetails || location;
      coordinates = await geocodeAddressComponents(addressToGeocode);
      
      if (!coordinates) {
        // Fallback to default coordinates if geocoding fails
        coordinates = getDefaultCoordinates();
        log("⚠️ Geocoding failed, using default coordinates");
      }
      
      // Build address string from components
      if (addressDetails) {
        const { street, city, state, pincode, country = "India" } = addressDetails;
        const addressParts = [street, city, state, pincode, country].filter(Boolean);
        address = addressParts.join(", ");
      } else {
        address = location.address;
      }
    } else {
      return res.status(400).json({ 
        error: "Invalid payload: require either location.coordinates [lng,lat] or addressDetails/address for geocoding" 
      });
    }

    if (!type) {
      return res.status(400).json({ 
        error: "Invalid payload: type is required" 
      });
    }

    // 1) Persist immediately
    const saved = await Emergency.create({
      type,
      location: {
        type: "Point",
        coordinates
      },
      reporterId,
      email,
      mobileNumber,
      meta,
      address,
      addressDetails
    });

    const eventPayload = {
      id: saved._id.toString(),
      type: saved.type,
      location: saved.location,
      reporterId: saved.reporterId,
      email: saved.email,
      mobileNumber: saved.mobileNumber, // include in payload
      meta: saved.meta,
      address: saved.address,
      createdAt: saved.createdAt
    };

    // 2) Immediate notify via primary server (WebSocket broadcast)
    try {
      emitEmergencyImmediate(eventPayload);
      log(eventPayload);
      log("🔊 Immediate WebSocket broadcast sent");
    } catch (e) {
      err("WebSocket broadcast error:", e);
    }

    // 3) Publish to Redis Pub/Sub (decoupled listeners)
    try {
      await publishEvent("emergency.sos", eventPayload);
      log("📣 Published emergency.sos to Pub/Sub");
    } catch (e) {
      err("Publish event error:", e);
    }

    // 4) Push a follow-up job at the FRONT of Redis queue for workers
    try {
      await pushEmergencyAtFront({
        taskType: "emergency",
        reporterId: saved.reporterId,
        emergencyId: eventPayload.id,
        payload: eventPayload,
        enqueuedAt: Date.now()
      });
      log("⚡ Emergency follow-up job queued at front");
    } catch (e) {
      err("Queue push error:", e);
    }

    return res.status(201).json({ 
      message: "SOS handled (immediate notify + queued follow-up)", 
      emergency: eventPayload 
    });

  } catch (e) {
    err("SOS controller error:", e);
    return res.status(500).json({ error: e.message });
  }
};

// GET /api/sos?limit=20
export const listRecentEmergencies = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const emergencies = await Emergency.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id type location reporterId mobileNumber meta status address addressDetails email createdAt');
    return res.json({
      emergencies: emergencies.map(e => ({
        id: e._id.toString(),
        type: e.type,
        location: e.location,
        reporterId: e.reporterId,
        mobileNumber: e.mobileNumber,
        meta: e.meta,
        status: e.status || 'open',
        address: e.address,
        addressDetails: e.addressDetails,
        email: e.email,
        createdAt: e.createdAt
      }))
    });
  } catch (e) {
    err('List emergencies error:', e);
    return res.status(500).json({ error: e.message });
  }
};

// PATCH /api/sos/:id/status
export const updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'assigned', 'resolved'].includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status. Must be one of: open, assigned, resolved" 
      });
    }

    const emergency = await Emergency.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('_id type status reporterId email mobileNumber address addressDetails location createdAt');

    if (!emergency) {
      return res.status(404).json({ error: "Emergency not found" });
    }

    const statusUpdatePayload = {
      id: emergency._id.toString(),
      type: emergency.type,
      status: emergency.status,
      reporterId: emergency.reporterId,
      email: emergency.email,
      mobileNumber: emergency.mobileNumber,
      address: emergency.address,
      addressDetails: emergency.addressDetails,
      location: emergency.location,
      createdAt: emergency.createdAt,
      updatedAt: new Date()
    };

    // 1️⃣ Immediate WebSocket broadcast
    try {
      emitStatusUpdate(statusUpdatePayload);
      log("🔊 Status update WebSocket broadcast sent");
    } catch (e) {
      err("Status update WebSocket broadcast error:", e);
    }

    // 2️⃣ Publish to Redis Pub/Sub
    try {
      await publishEvent("status.update", statusUpdatePayload);
      log("📣 Published status.update to Pub/Sub");
    } catch (e) {
      err("Status update Pub/Sub error:", e);
    }

    // 3️⃣ Queue status update job for workers
    try {
      await pushStatusUpdate({
        taskType: "status_update",
        itemType: "emergency",
        itemId: emergency._id.toString(),
        status: emergency.status,
        payload: statusUpdatePayload,
        enqueuedAt: Date.now()
      });
      log("⚡ Status update job queued");
    } catch (e) {
      err("Status update queue error:", e);
    }

    return res.json({ 
      message: "Emergency status updated successfully",
      emergency: statusUpdatePayload
    });
  } catch (e) {
    err("Update emergency status error:", e);
    return res.status(500).json({ error: e.message });
  }
};
