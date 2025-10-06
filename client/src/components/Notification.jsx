import React, { useEffect, useState } from "react";
import "./Notification.css";

const Notification = ({ message, type = "info", duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`notification ${visible ? "show" : ""} ${type}`}>
      <div className="notification-content">
        {/* <span className="notification-icon">
          {type === "success" && "✅"}
          {type === "error" && "❌"}
          {type === "info" && "ℹ️"}
          {type === "warning" && "⚠️"}
        </span> */}
        <span className="notification-text">{message}</span>
        <button className="notification-close" onClick={() => setVisible(false)}>
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification;
