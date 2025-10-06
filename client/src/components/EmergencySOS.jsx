import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EmergencySOS.css";
import { connectWorkerWS, addWorkerListener } from "../services/wsWorker";

export default function EmergencySOS({ userId }) {
  const navigate = useNavigate();
  const [coords, setCoords] = useState(null);
  const [sending, setSending] = useState(false);
  const [workerMsg, setWorkerMsg] = useState(null);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [timerId, setTimerId] = useState(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [locationMethod, setLocationMethod] = useState("gps"); // "gps" or "address"
  const [addressDetails, setAddressDetails] = useState({
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India"
  });

  useEffect(() => {
    connectWorkerWS(userId);
    // const unsubscribe = addWorkerListener((data) => {
    //   if (data.event === "worker.notification") {
    //     setWorkerMsg(data.data);
    //   }
    // });
    // return unsubscribe;
  }, [userId]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => setError(err.message)
      );
    } else {
      setError("Geolocation not supported");
    }
  }, []);

  const triggerSOS = async () => {
    connectWorkerWS(userId);
    // Validate mobile number
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      return setError("Please enter a valid 10-digit Indian mobile number");
    }

    // Validate location based on method
    if (locationMethod === "gps" && !coords) {
      return alert("GPS location not available yet");
    }
    
    if (locationMethod === "address") {
      const { street, city, state, pincode } = addressDetails;
      if (!street || !city || !state || !pincode) {
        return setError("Please fill in all required address fields");
      }
    }

    setSending(true);
    setError("");

    const payload = {
      type: "emergency",
      reporterId: userId,
      meta: { device: "web" },
      mobileNumber: mobileNumber,
      email: email,
    };

    // Add location data based on method
    if (locationMethod === "gps") {
      payload.location = { type: "Point", coordinates: [coords.lng, coords.lat] };
    } else {
      payload.addressDetails = addressDetails;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to send SOS");

      const json = await res.json();
      console.log("SOS response:", json);

      const unsubscribe = addWorkerListener((data) => {
        console.log("Worker data:", data);
        if (data.event === "worker.notification") {
          setWorkerMsg(data.data);
          navigate("/success", { state: data.data });
          if (typeof unsubscribe === "function") unsubscribe();
        }
      });
      console.log(workerMsg);
      if(workerMsg) navigate("/success", { state: data.data });
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
      setCountdown(null);
    }
  };

  const startCountdown = () => {
    // Validate mobile number before countdown
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      return setError("Please enter a valid 10-digit Indian mobile number");
    }

    // Validate location based on method
    if (locationMethod === "gps" && !coords) {
      return alert("GPS location not available yet");
    }
    
    if (locationMethod === "address") {
      const { street, city, state, pincode } = addressDetails;
      if (!street || !city || !state || !pincode) {
        return setError("Please fill in all required address fields");
      }
    }

    setCountdown(5);
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(id);
          triggerSOS();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerId(id);
  };

  const cancelCountdown = () => {
    if (timerId) clearInterval(timerId);
    setCountdown(null);
    setTimerId(null);
  };

  return (
    <div className="sos-page">
      <div className="sos-card">
        {/* Header */}
        <div className="sos-header">
          <button onClick={() => window.history.back()} className="back-button">
            ← Back
          </button>
          <span className="availability">⏱ 24/7 Available</span>
        </div>

        {/* Alert Icon */}
        <div className="header-icon">❗</div>
        <h1 className="title">Emergency SOS</h1>
        <p className="subtitle">
          Press the button below to alert emergency services
        </p>

        {/* Location Method Selection */}
        {/* <div className="location-box">
          <span className="availability">Location Method:</span>
          <div className="location-method-buttons">
            <button
              className={`method-btn ${locationMethod === "gps" ? "active" : ""}`}
              onClick={() => setLocationMethod("gps")}
            >
              📍 GPS Location
            </button>
            <button
              className={`method-btn ${locationMethod === "address" ? "active" : ""}`}
              onClick={() => setLocationMethod("address")}
            >
              🏠 Enter Address
            </button>
          </div>
        </div> */}

        {/* Location Display/Input */}
        {locationMethod === "gps" ? (
          <div className="location-box">
            <span className="availability">Your current location:</span>
            <span className="location-icon">📍</span>
            {coords ? (
              <span>
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </span>
            ) : (
              <span>Fetching location...</span>
            )}
          </div>
        ) : (
          <div className="address-form">
            <div className="location-box">
              <span className="availability">Emergency Address:</span>
            </div>
            <div className="address-inputs">
              <input
                type="text"
                placeholder="Street Address *"
                value={addressDetails.street}
                onChange={(e) => setAddressDetails(prev => ({ ...prev, street: e.target.value }))}
                required
              />
              <div className="address-row">
                <input
                  type="text"
                  placeholder="City *"
                  value={addressDetails.city}
                  onChange={(e) => setAddressDetails(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="State *"
                  value={addressDetails.state}
                  onChange={(e) => setAddressDetails(prev => ({ ...prev, state: e.target.value }))}
                  required
                />
              </div>
              <div className="address-row">
                <input
                  type="text"
                  placeholder="Pincode *"
                  value={addressDetails.pincode}
                  onChange={(e) => setAddressDetails(prev => ({ ...prev, pincode: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={addressDetails.country}
                  onChange={(e) => setAddressDetails(prev => ({ ...prev, country: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Number */}
        <div className="location-box">
          <span className="availability">Mobile Number:</span>
          <span className="location-icon">📱</span>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Enter your 10-digit mobile number"
            maxLength={10}
          />
        </div>

        {/* Email */}
        <div className="location-box">
          <span className="availability">Email (optional):</span>
          <span className="location-icon">✉️</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>

        {/* SOS / Cancel */}
        {countdown ? (
          <div className="alert-box">
            <h3>Emergency Alert Activating</h3>
            <div className="alert-countdown">{countdown}</div>
            <p>Emergency services will be contacted automatically</p>
            <button className="cancel-btn" onClick={cancelCountdown}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="sos-button"
            onClick={startCountdown}
            disabled={sending}
          >
            SOS
          </button>
        )}

        {/* Info */}
        <div className="info-box">
          <h4>What happens next:</h4>
          <ul>
            <li>Your location will be shared with emergency services</li>
            <li>A dispatcher will contact you immediately</li>
            <li>First responders will be dispatched to your location</li>
            <li>Stay calm and follow dispatcher instructions</li>
          </ul>
        </div>

        {error && <div className="error-msg">{error}</div>}
        {workerMsg && (
          <div className="worker-msg">
            Worker Update: {JSON.stringify(workerMsg)}
          </div>
        )}
      </div>
    </div>
  );
}
