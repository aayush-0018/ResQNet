import React from "react";
import "./EmergencyModal.css";

export default function EmergencyModal({ data, onClose }) {
  const isResourceAllocation = data.type === 'Resource Allocation';
  
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>{isResourceAllocation ? 'Resource Allocation Request' : 'Emergency Details'}</h2>
        <p><b>Type:</b> {data.type || 'emergency'}</p>
        <p><b>Status:</b> {data.status || 'open'}</p>
        <p><b>Reporter:</b> {data.reporterId || 'N/A'}</p>
        
        {isResourceAllocation && (
          <>
            <p><b>Resource Type:</b> {data.resourceType || 'N/A'}</p>
            <p><b>Quantity:</b> {data.quantity || 'N/A'}</p>
            {/* <p><b>Urgency:</b> {data.urgency || 'medium'}</p> */}
            {data.description && <p><b>Description:</b> {data.description}</p>}
            <p><b>Contact Name:</b> {data.contactName || 'N/A'}</p>
          </>
        )}
        
        <p><b>Phone:</b> {data.mobileNumber || 'N/A'}</p>
        <p><b>Email:</b> {data.email || 'N/A'}</p>
        {data.address && <p><b>Address:</b> {data.address}</p>}
        
        {Array.isArray(data?.location?.coordinates) && data.location.coordinates[0] !== 0 && data.location.coordinates[1] !== 0 && (
          <>
            <p><b>Latitude:</b> {data.location.coordinates[1]}</p>
            <p><b>Longitude:</b> {data.location.coordinates[0]}</p>
          </>
        )}
        
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <button onClick={() => data.mobileNumber && window.open(`tel:${data.mobileNumber}`)}>📞 Call</button>
          <button onClick={() => data.email && window.open(`mailto:${data.email}`)}>✉️ Email</button>
          <button onClick={onClose}>Close</button>
        </div>
        
      </div>
    </div>
  );
}
