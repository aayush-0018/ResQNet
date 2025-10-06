import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./EmergencySuccess.css";

const EmergencySuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const workerMsg = location.state;

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">✔</div>
        <h2>Emergency Services Contacted</h2>
        <p>
          {workerMsg?.message ||
            "Help is on the way. Stay calm and remain at your location."}
        </p>

        <div className="info-box">
          <div className="info-row">
            <span>Response Time:</span>
            <span className="highlight">3–5 minutes</span>
          </div>
          <div className="info-row">
            <span>Location Shared:</span>
            <span className="highlight">✔</span>
          </div>
        </div>

        <div className="fallback-message">
          <p>
            If you do not receive a call, try contacting nearby emergency
            services:
          </p>
          <div className="emergency-list">
            <div className="emergency-item">
              <span className="service">Police</span>
              <span className="number">100</span>
            </div>
            <div className="emergency-item">
              <span className="service">Fire Department</span>
              <span className="number">101</span>
            </div>
            <div className="emergency-item">
              <span className="service">Medical Emergency</span>
              <span className="number">102</span>
            </div>
            <div className="emergency-item">
              <span className="service">Disaster Management</span>
              <span className="number">108</span>
            </div>
          </div>
        </div>

        <button className="return-btn" onClick={() => navigate("/")}>
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default EmergencySuccess;
