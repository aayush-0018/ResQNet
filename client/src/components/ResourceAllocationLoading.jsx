import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { connectWorkerWS, addWorkerListener } from "../services/wsWorker";
import "./ResourceAllocationLoading.css";

export default function ResourceAllocationLoading() {
  const navigate = useNavigate();
  const location = useLocation();
  const taskData = location.state; // passed from form
  const [message, setMessage] = useState("Processing your request...");

  useEffect(() => {
    const userId = taskData?.reporterId || "user12345";
    connectWorkerWS(userId);
    const unsubscribe = addWorkerListener((data) => {
      if (data.event === "worker.notification") {
        const workerMsg = data.data;
        navigate("/resource-success", {
          replace: true,
          state: {
            ...taskData,
            workerMsg
          }
        });
      }
    });

    // Fallback after 8s to go to success even if no WS message
    const timeout = setTimeout(() => {
      navigate("/resource-success", {
        replace: true,
        state: {
          ...taskData,
          workerMsg: {
            message:
              "Your resource allocation request has been submitted successfully! Our team will review and get back to you shortly."
          }
        }
      });
    }, 8000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, taskData]);

  return (
    <div className="ra-loading-page">
      <div className="ra-loader-card">
        <div className="ra-spinner" aria-label="Loading" />
        <h2>Submitting Request</h2>
        <p>{message}</p>

        {taskData?.meta?.resourceType && (
          <div className="ra-brief">
            <div className="row">
              <span>Resource:</span>
              <strong>{taskData.meta.resourceType}</strong>
            </div>
            <div className="row">
              <span>Quantity:</span>
              <strong>{taskData.meta.quantity}</strong>
            </div>
            <div className="row">
              <span>Urgency:</span>
              <strong className={`urgency-${taskData.meta.urgency}`}>{taskData.meta.urgency}</strong>
            </div>
          </div>
        )}

        <div className="hint">This may take a few seconds.</div>
      </div>
    </div>
  );
}

