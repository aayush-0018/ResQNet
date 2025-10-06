import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectWorkerWS, addWorkerListener } from "../services/wsWorker";
import "./ResourceAllocationForm.css";


export default function ResourceAllocationForm() {
  const userId = "user12345";
  const navigate = useNavigate();
  const [form, setForm] = useState({
    taskType: "Resource Allocation",
    reporterId: "user12345", // Default user ID
    location: {
      address: "",
      pincode: "",
      city: "",
      state: "",
      country: "India"
    },
    meta: {
      resourceType: "",
      quantity: "",
      urgency: "medium",
      description: "",
      contactName: "",
      contactPhone: "",
      contactEmail: ""
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setForm(prev => ({
        ...prev,
        location: { ...prev.location, [field]: value }
      }));
    } else if (name.startsWith("meta.")) {
      const field = name.split(".")[1];
      setForm(prev => ({
        ...prev,
        meta: { ...prev.meta, [field]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    connectWorkerWS(userId);
    e.preventDefault();
    
    // Validation
    if (!form.location.address || !form.location.pincode) {
      setError("Address and pincode are required");
      return;
    }
    if (!form.meta.resourceType || !form.meta.quantity) {
      setError("Resource type and quantity are required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
      const response = await fetch(`${API}/api/normal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to submit resource allocation request");
      }

      const result = await response.json();
      console.log("Resource allocation submitted:", result);

      
      const unsubscribe = addWorkerListener((data) => {
        if (data.event === "worker.notification") {
          // const workerMsg = data.data;
          // navigate("/resource-success", {
          //   replace: true,
          //   state: {
          //     ...taskData,
          //     workerMsg
          //   }
          // });
          navigate("/resource-success", { state: data.data });
          if (typeof unsubscribe === "function") unsubscribe();
        }
      });
      
      // Navigate to loader page with task data
      // navigate("/resource-loading", { 
      //   state: {
      //     ...form,
      //     taskId: result.task?.taskId
      //   }
      // });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="resource-form-page">
      <div className="resource-form-container">
        <div className="form-header">
          <button onClick={() => navigate("/")} className="back-button">
            ← Back to Home
          </button>
          <h1>Resource Allocation Request</h1>
          <p>Request resources for emergency response or community needs</p>
        </div>

        <form onSubmit={handleSubmit} className="resource-form">
          {error && <div className="error-message">{error}</div>}

          {/* Resource Details */}
          <div className="form-section">
            <h3>Resource Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Resource Type *</label>
                <select
                  name="meta.resourceType"
                  value={form.meta.resourceType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select resource type</option>
                  <option value="Medical Supplies">Medical Supplies</option>
                  <option value="Food & Water">Food & Water</option>
                  <option value="Shelter Materials">Shelter Materials</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Communication Equipment">Communication Equipment</option>
                  <option value="Personnel">Personnel</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Quantity/Amount *</label>
                <input
                  type="text"
                  name="meta.quantity"
                  value={form.meta.quantity}
                  onChange={handleInputChange}
                  placeholder="e.g., 100 units, 50 kg, 10 people"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Urgency Level</label>
                <select
                  name="meta.urgency"
                  value={form.meta.urgency}
                  onChange={handleInputChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="meta.description"
                value={form.meta.description}
                onChange={handleInputChange}
                placeholder="Provide additional details about the resource requirements..."
                rows={3}
              />
            </div>
          </div>

          {/* Location Details */}
          <div className="form-section">
            <h3>Delivery Location</h3>
            <div className="form-group">
              <label>Address *</label>
              <textarea
                name="location.address"
                value={form.location.address}
                onChange={handleInputChange}
                placeholder="Enter complete address"
                rows={2}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Pincode *</label>
                <input
                  type="text"
                  name="location.pincode"
                  value={form.location.pincode}
                  onChange={handleInputChange}
                  placeholder="e.g., 110001"
                  required
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="location.city"
                  value={form.location.city}
                  onChange={handleInputChange}
                  placeholder="City name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="location.state"
                  value={form.location.state}
                  onChange={handleInputChange}
                  placeholder="State name"
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="location.country"
                  value={form.location.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="form-section">
            <h3>Contact Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Contact Name</label>
                <input
                  type="text"
                  name="meta.contactName"
                  value={form.meta.contactName}
                  onChange={handleInputChange}
                  placeholder="Primary contact person"
                />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  name="meta.contactPhone"
                  value={form.meta.contactPhone}
                  onChange={handleInputChange}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contact Email</label>
              <input
                type="email"
                name="meta.contactEmail"
                value={form.meta.contactEmail}
                onChange={handleInputChange}
                placeholder="Email address"
              />
            </div>
          </div>

          <div className="form-actions">
            {/* <button
              type="button"
              onClick={() => navigate("/")}
              className="cancel-btn"
            >
              Cancel
            </button> */}
            <button
              type="submit"
              disabled={submitting}
              className="submit-btn"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}