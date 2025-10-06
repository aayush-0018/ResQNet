import React, { useState, useMemo } from "react";
import "./EmergencyTable.css";

export default function EmergencyTable({ emergencies }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return emergencies;
    return emergencies.filter((e) =>
      filter === "resolved" ? e.resolved : !e.resolved
    );
  }, [filter, emergencies]);

  return (
    <div className="table-wrapper">
      <div className="table-filter">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "resolved" ? "active" : ""}
          onClick={() => setFilter("resolved")}
        >
          Resolved
        </button>
        <button
          className={filter === "unresolved" ? "active" : ""}
          onClick={() => setFilter("unresolved")}
        >
          Not Resolved
        </button>
      </div>
      <table className="emergency-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Reporter</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e, idx) => (
            <tr key={idx}>
              <td>{e.type}</td>
              <td>{e.reporterId}</td>
              <td>
                {e.location?.coordinates?.[1]?.toFixed(2)}, 
                {e.location?.coordinates?.[0]?.toFixed(2)}
              </td>
              <td className={e.resolved ? "resolved" : "unresolved"}>
                {e.resolved ? "Resolved" : "Not Resolved"}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan="4" className="no-data">
                No emergencies found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
