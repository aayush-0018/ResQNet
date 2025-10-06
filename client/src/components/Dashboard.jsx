import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Emergencies from "./Emergencies";
import Contributors from "./Contributors";
import "./Dashboard.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("emergency");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const [emergencies] = useState([
    { id: 1, title: "Flood Alert", status: "resolved", location: "City A" },
    { id: 2, title: "Fire in Market", status: "unresolved", location: "City B" },
    { id: 3, title: "Road Accident", status: "resolved", location: "City C" },
  ]);

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const filteredEmergencies =
    filter === "all"
      ? emergencies
      : emergencies.filter((e) => e.status === filter);

  return (
    <div className="ngo-dashboard">
      {/* Sidebar */}
      <aside className="ngo-sidebar">
        <div className="ngo-header">
          <h2 className="ngo-logo">NDRF</h2>
          <h3 className="ngo-state">{user?.user?.state || "Unknown State"}</h3>
        </div>

        <nav className="ngo-menu">
          <ul>
            <li
              className={activeTab === "emergency" ? "active" : ""}
              onClick={() => setActiveTab("emergency")}
            >
              Emergency
            </li>
            <li
              className={activeTab === "contributors" ? "active" : ""}
              onClick={() => setActiveTab("contributors")}
            >
              Contributors
            </li>
          </ul>
        </nav>

        {/* Logout Button */}
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="ngo-content">
        {activeTab === "emergency" && <Emergencies />}
        {activeTab === "contributors" && <Contributors />}
      </main>
    </div>
  );
}
