import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { connectWorkerWS, addWorkerListener } from "../services/wsWorker";
import "./ResourceAllocationSuccess.css";

export default function ResourceAllocationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const taskData = location.state;
  const workerMsg = taskData?.message;
  console.log

  return (
    <div className="resource-success-page">
      <div className="success-container">
        <div className="success-header">
          <div className="success-badge">✔</div>
          <h1>Request Submitted Successfully</h1>
          <p className="subtitle">Thank you. We’ve recorded your request and started coordination.</p>
        </div>

        <div className="message-box">
          <p>{workerMsg || "Our team will review your request and reach out with the next steps."}</p>
        </div>

        {/* {taskData && (
          <div className="details-card">
            <h3>Request Details</h3>
            <div className="details-grid">
              <div className="item">
                <span className="label">Resource</span>
                <span className="value">{taskData.meta?.resourceType || "—"}</span>
              </div>
              <div className="item">
                <span className="label">Quantity</span>
                <span className="value">{taskData.meta?.quantity || "—"}</span>
              </div>
              <div className="item">
                <span className="label">Urgency</span>
                <span className={`value tag urgency-${taskData.meta?.urgency}`}>{taskData.meta?.urgency || "—"}</span>
              </div>
              <div className="item">
                <span className="label">Location</span>
                <span className="value clamp">{taskData.location?.address || "—"}</span>
              </div>
              {taskData.meta?.contactName && (
                <div className="item">
                  <span className="label">Contact</span>
                  <span className="value">{taskData.meta.contactName}</span>
                </div>
              )}
            </div>
          </div>
        )} */}

        <div className="tips-card">
          <h3>What happens next?</h3>
          <ul>
            <li>We verify details and match with available resources</li>
            <li>Team reaches out for any clarifications</li>
            <li>Logistics planned based on urgency and availability</li>
          </ul>
        </div>

        <div className="actions">
          <button className="btn secondary" onClick={() => navigate("/")}>Back to Home</button>
          <button className="btn primary" onClick={() => navigate("/form")}>Submit Another Request</button>
        </div>
      </div>
    </div>
  );
}