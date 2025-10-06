import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">NGO Dashboard</h2>
      <nav className="sidebar-nav">
        <NavLink to="/" end className="sidebar-link">
          Dashboard
        </NavLink>
        <NavLink to="/emergencies" className="sidebar-link">
          Emergencies
        </NavLink>
        <NavLink to="/contributors" className="sidebar-link">
          Contributors
        </NavLink>
      </nav>
    </aside>
  );
}
