import React, { useEffect, useState } from "react";
import EmergencyTable from "./EmergencyTable";
import "./DashboardHome.css";

export default function DashboardHome() {
  const [emergencies, setEmergencies] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/emergencies`)
      .then((res) => res.json())
      .then(setEmergencies)
      .catch(console.error);
  }, []);

  return (
    <div className="dashboard-home">
      <h1 className="dashboard-heading">All Emergencies</h1>
      <EmergencyTable emergencies={emergencies} />
    </div>
  );
}
