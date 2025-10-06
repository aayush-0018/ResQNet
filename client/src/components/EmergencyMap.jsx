import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./EmergencyMap.css";
import L from "leaflet";
import { addMessageHandler, removeMessageHandler } from "../services/wsService";
// import {Notification} from "./Notification"
import Notification from "./Notification";

// Blinking marker icon
const blinkingIcon = new L.DivIcon({
  className: "blinking-marker",
  html: '<div class="blinking-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// State → [lat,lng] mapping
const stateCoords = {
  "Andhra Pradesh": [15.9129, 79.74],
  Bihar: [25.0961, 85.3131],
  Gujarat: [22.2587, 71.1924],
  Karnataka: [15.3173, 75.7139],
  Maharashtra: [19.7515, 75.7139],
  Rajasthan: [27.0238, 74.2179],
  Delhi: [28.7041, 77.1025],
  // … add others as required
};

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function EmergencyMap({ emergencies = [], onMarkerClick, onStatusUpdate }) {
  // console.log(emergencies);
  const [center, setCenter] = useState([22.9734, 78.6569]); // India center
  const [zoom, setZoom] = useState(5);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [selectedEmergencyIds, setSelectedEmergencyIds] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [localEmergencies, setLocalEmergencies] = useState(emergencies);
  const [notificationMessage, setNotificationMessage] = useState("");


  // Helpers to normalize missing fields
  const getNormalizedStatus = (e) => (e.status && typeof e.status === 'string' ? e.status : 'open');
  const getNormalizedType = (e) => (e.type && typeof e.type === 'string' ? e.type : 'emergency');

  // Update local emergencies when props change
  useEffect(() => {
    setLocalEmergencies(emergencies);
  }, [emergencies]);

  // Auto-focus map on user's state if present
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user"));
    const userState = stored?.user?.state;
    if (userState && stateCoords[userState]) {
      setCenter(stateCoords[userState]);
      setZoom(7);
    }
  }, []);

  // Set up WebSocket status update handler
  useEffect(() => {
    const handleStatusUpdate = (data) => {
      console.log("📡 Received status update:", data);

      // Update local emergencies with new status (works for both emergencies and normal tasks)
      setLocalEmergencies(prev => {
        console.log("Updating emergency status:", data.id, data.status);
        console.log("Current emergencies:", prev);

        // Check if the emergency exists in our local state
        const exists = prev.some(item => item.id === data.id);
        if (!exists) {
          console.warn("Received status update for unknown emergency:", data.id);
          return prev;
        }

        return prev.map(item =>
          item.id === data.id
            ? { ...item, status: data.status }
            : item
        );
      });

      // Notify parent component if callback provided
      if (onStatusUpdate) {
        onStatusUpdate(data);
      }
    };

    addMessageHandler("statusUpdate", handleStatusUpdate);

    return () => {
      removeMessageHandler("statusUpdate");
    };
  }, [onStatusUpdate, localEmergencies]);

  // Check if current user is NDRF team
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const isNDRF = currentUser?.user?.role === "NDRF";

  // Update status for emergency or resource allocation
  const handleStatusUpdate = async (id, newStatus, type) => {
    setUpdatingStatus(prev => ({ ...prev, [id]: true }));

    try {
      const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
      const endpoint = type === 'emergency' ? `/api/sos/${id}/status` : `/api/normal/${id}/status`;

      const response = await fetch(`${API}${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Status update successful - the WebSocket will handle real-time updates
      console.log("✅ Status updated successfully");
      setNotificationMessage("Status Updated");
    } catch (error) {
      // alert("Error updating status: " + error.message);
      setNotificationMessage("Error updating status: " + error.message);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [id]: false }));
    }
  };

  // Broadcast emergency to contributors
  const handleBroadcastEmergency = async () => {
    if (!broadcastMessage.trim()) {
      alert("Please enter a broadcast message");
      return;
    }

    setBroadcasting(true);
    try {
      const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
      const response = await fetch(`${API}/api/emergency/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: broadcastMessage,
          ndrfTeamId: currentUser?.user?.id,
          emergencyArray: filtered
            .filter(e => selectedEmergencyIds.includes(e.id))
            .map(e => ({
              id: e.id,
              type: e.type,
              status: e.status,
              reporterId: e.reporterId,
              email: e.email,
              mobileNumber: e.mobileNumber,
              address: e.address,
              location: e.location,
              createdAt: e.createdAt
            }))
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to broadcast emergency");
      }

      const result = await response.json();
      // alert(`Emergency broadcast sent to ${result.subscriberCount} contributors`);
      setNotificationMessage(`Broadcast sent to ${result.subscriberCount} contributors`);
      setBroadcastMessage("");
      setSelectedEmergencyIds([]);
      setShowBroadcastModal(false);
    } catch (error) {
      // alert("Error broadcasting emergency: " + error.message);
      setNotificationMessage("Error broadcasting emergency: " + error.message);
    } finally {
      setBroadcasting(false);
    }
  };


  const filtered = localEmergencies.filter((e) => {
    const typeVal = getNormalizedType(e);
    const statusVal = getNormalizedStatus(e);
    const matchType = typeFilter === "all" || typeVal === typeFilter;
    const matchStatus = statusFilter === "all" || statusVal === statusFilter;
    return matchType && matchStatus;
  });

  // Options
  const discoveredTypes = Array.from(new Set(localEmergencies.map((e) => getNormalizedType(e))));
  const typeOptions = ["all", ...(discoveredTypes.length ? discoveredTypes : ["emergency"])];
  const statusOptions = ["all", "open", "assigned", "resolved"];
  const statusUpdateOptions = ["open", "assigned", "resolved"];

  return (
    <>
      <Notification
        message={notificationMessage}
        type="success"
        onClose={() => setNotificationMessage("")}
      />
      <div className="emergency-dashboard">
        {/* Map Column */}
        <div className="map-section">
          <div className="map-header">
            <span>📍 Emergency Locations Map</span>
            <div className="map-header-actions">
              <span className="live-dot">● Live Updates</span>
              {isNDRF && (
                <button
                  className="broadcast-btn"
                  onClick={() => setShowBroadcastModal(true)}
                  title="Broadcast Emergency Alert"
                >
                  Broadcast Alert
                </button>
              )}
            </div>
          </div>

          <MapContainer center={center} zoom={zoom} className="emergency-map">
            <ChangeMapView center={center} zoom={zoom} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filtered.map((e, idx) => {
              const statusVal = getNormalizedStatus(e);
              const [lng, lat] = e.location.coordinates || [];
              if (lat == null || lng == null) return null;
              return (
                <Marker
                  key={e.id || idx}
                  position={[lat, lng]}
                  icon={blinkingIcon}
                  eventHandlers={{ click: () => onMarkerClick?.(e) }}
                >
                  <Popup>
                    <b>{getNormalizedType(e)}</b>
                    <br />
                    Status: {statusVal}
                    <br />
                    Reporter: {e.reporterId || "N/A"}
                    <br />
                    Phone: {e.mobileNumber || "N/A"}
                    <br />
                    Email: {e.email || "N/A"}
                    <br />
                    {e.address ? (<span>Address: {e.address}</span>) : null}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Feed Column */}
        <div className="feed-section">
          <div className="feed-header">⚠️ Live Emergency Feed</div>

          <div className="feed-filters">
            <label>Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              {typeOptions.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="feed-list">
            {filtered.map((e, idx) => {
              const statusVal = getNormalizedStatus(e);
              const typeVal = getNormalizedType(e);
              return (
                <div key={e.id || idx} className="feed-card">
                  {/* Title + Tags */}
                  <div className="feed-title-row">
                    <div className="feed-title">
                      {typeVal === "emergency" ? typeVal.toUpperCase() : typeVal}
                    </div>
                    <span className={`sev-tag ${e.severity || "CRITICAL"}`}>
                      {/* {e.severity || "CRITICAL"} */}
                    </span>
                    <span className={`status-tag ${statusVal}`}>
                      {statusVal}
                    </span>
                  </div>

                  {/* Address or Resource Details */}
                  {e.type === 'Resource Allocation' ? (
                    <div className="feed-desc">
                      <strong>{e.resourceType}</strong> - {e.quantity}
                      {e.urgency && <span style={{ marginLeft: 8, fontSize: '12px', color: e.urgency === 'critical' ? '#dc2626' : e.urgency === 'high' ? '#ea580c' : '#6b7280' }}>({e.urgency})</span>}
                      {e.description && <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>{e.description}</div>}
                    </div>
                  ) : (
                    <div className="feed-desc">
                      <span style={{ marginLeft: 2, fontSize: '12px', color: '#dc2626' }}>(CRITICAL)</span>
                    </div>
                  )}

                  {/* Location & Time */}
                  <div className="feed-meta">
                    <span className="feed-meta-item">
                      <i className="ri-map-pin-line"></i>
                      {e.address || "Unknown Location"}
                    </span>
                    <span className="feed-meta-item">
                      <i className="ri-time-line"></i>
                      {new Date(e.createdAt || Date.now()).toLocaleString()}
                    </span>
                  </div>

                  {/* Reporter + Actions */}
                  <div className="feed-reporter-row">
                    <span>
                      <b>Reporter:</b> {e.reporterId || "N/A"}
                    </span>
                    <div className="feed-actions">
                      <button title="Call" onClick={() => e.mobileNumber && window.open(`tel:${e.mobileNumber}`)}>
                        <i className="ri-phone-line"></i>
                      </button>
                      <button title="Email" onClick={() => e.email && window.open(`mailto:${e.email}`)}>
                        <i className="ri-mail-line"></i>
                      </button>
                    </div>
                  </div>

                  {/* Status Update (only for NDRF users) */}
                  {isNDRF && e.id && (
                    <div className="feed-status-update">
                      <label>Update Status:</label>
                      <select
                        value={statusVal}
                        onChange={(event) => handleStatusUpdate(e.id, event.target.value, typeVal === 'Resource Allocation' ? 'resource' : 'emergency')}
                        disabled={updatingStatus[e.id]}
                        className="status-select"
                      >
                        {statusUpdateOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {updatingStatus[e.id] && <span className="updating-text">Updating...</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Broadcast Modal */}
        {showBroadcastModal && (
          <div className="broadcast-modal-overlay">
            <div className="broadcast-modal">
              <div className="broadcast-modal-header">
                <h3>🚨 Broadcast Emergency Alert</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowBroadcastModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="broadcast-modal-body">
                <label className="input-label">Emergency Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter emergency alert message for contributors..."
                  rows={4}
                  maxLength={500}
                  className="broadcast-textarea"
                />
                <div className="char-count">{broadcastMessage.length}/500</div>

                <div className="emergency-section">
                  <label className="input-label">Select Emergencies</label>
                  <p className="subtext">
                    List is sourced from currently visible emergencies on the map.
                  </p>
                  <div className="emergency-list">
                    {filtered.filter(em => !!em.id).length === 0 && (
                      <div className="empty-list">No emergencies visible on map</div>
                    )}
                    {filtered.filter(em => !!em.id).map((em) => {
                      const [lng, lat] = em.location?.coordinates || [];
                      const checked = selectedEmergencyIds.includes(em.id);
                      return (
                        <label
                          key={em.id}
                          className={`emergency-item ${checked ? "selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(ev) => {
                              setSelectedEmergencyIds(prev =>
                                ev.target.checked
                                  ? [...prev, em.id]
                                  : prev.filter(id => id !== em.id)
                              );
                            }}
                          />
                          <div>
                            <div className="emergency-title">{em.type || "Emergency"}</div>
                            <div className="emergency-date">
                              {new Date(em.createdAt || Date.now()).toLocaleString()}
                            </div>
                          </div>
                          <div className="emergency-coords">
                            {lat ?? "?"}, {lng ?? "?"}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="char-count">{selectedEmergencyIds.length} selected</div>
                </div>
              </div>

              <div className="broadcast-modal-footer">
                <button
                  className="broadcast-submit-btn"
                  onClick={handleBroadcastEmergency}
                  disabled={broadcasting || !broadcastMessage.trim()}
                >
                  {broadcasting ? "Broadcasting..." : "Send Broadcast"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
