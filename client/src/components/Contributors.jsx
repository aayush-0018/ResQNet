import React, { useState, useEffect } from "react";
import "./Contributors.css";

export default function Contributors() {
  const [ndrfTeams, setNdrfTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedNdrfTeam, setSelectedNdrfTeam] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const isContributor = currentUser?.user?.role === "CONTRIBUTOR";
  const isNDRF = currentUser?.user?.role === "NDRF";

  // Fetch NDRF teams
  useEffect(() => {
    fetchNDRFTeams();
  }, []);

  // Fetch contributors when team is selected
  useEffect(() => {
    if (selectedTeam) {
      fetchContributors(selectedTeam);
    }
  }, [selectedTeam]);

  const fetchNDRFTeams = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dept/ndrf-teams`);
      if (response.ok) {
        const data = await response.json();
        setNdrfTeams(data.teams || []);
      }
    } catch (error) {
      console.error("Error fetching NDRF teams:", error);
    }
  };

  const fetchContributors = async (ndrfTeamId) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contributors/${ndrfTeamId}`);
      if (response.ok) {
        const data = await response.json();
        setContributors(data.contributors || []);
      }
    } catch (error) {
      console.error("Error fetching contributors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedNdrfTeam) {
      alert("Please select an NDRF team");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorId: currentUser?.user?.id,
          ndrfTeamId: selectedNdrfTeam
        }),
      });

      if (response.ok) {
        alert("Successfully subscribed to NDRF team!");
        setShowSubscribeModal(false);
        setSelectedNdrfTeam("");
        // Refresh contributors if viewing a team
        if (selectedTeam) {
          fetchContributors(selectedTeam);
        }
      } else {
        const error = await response.json();
        alert("Error: " + error.error);
      }
    } catch (error) {
      alert("Error subscribing: " + error.message);
    }
  };

  const handleUnsubscribe = async (ndrfTeamId) => {
    if (!confirm("Are you sure you want to unsubscribe from this NDRF team?")) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorId: currentUser?.user?.id,
          ndrfTeamId: ndrfTeamId
        }),
      });

      if (response.ok) {
        alert("Successfully unsubscribed from NDRF team!");
        // Refresh contributors if viewing the same team
        if (selectedTeam === ndrfTeamId) {
          fetchContributors(selectedTeam);
        }
      } else {
        const error = await response.json();
        alert("Error: " + error.error);
      }
    } catch (error) {
      alert("Error unsubscribing: " + error.message);
    }
  };

  return (
    <div className="contributors-page">
      <div className="contributors-header">
        <h1>Contributors Management</h1>
        {isContributor && (
          <button 
            className="subscribe-btn"
            onClick={() => setShowSubscribeModal(true)}
          >
            + Subscribe to NDRF Team
          </button>
        )}
      </div>

      {isNDRF && (
        <div className="ndrf-section">
          <h2>Your NDRF Team Contributors</h2>
          <div className="team-selector">
            <label>Select NDRF Team:</label>
            <select 
              value={selectedTeam || ""} 
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">Select a team...</option>
              {ndrfTeams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name} - {team.state}
                </option>
              ))}
            </select>
          </div>

          {selectedTeam && (
            <div className="contributors-section">
              <h3>Contributors ({contributors.length})</h3>
              {loading ? (
                <div className="loading">Loading contributors...</div>
              ) : (
                <div className="contributors-grid">
                  {contributors.map(contributor => (
                    <div key={contributor.id} className="contributor-card">
                      <div className="contributor-info">
                        <h4>{contributor.name}</h4>
                        <p className="contributor-email">{contributor.email}</p>
                        <p className="contributor-state">📍 {contributor.state}</p>
                        <p className="contributor-role">👤 {contributor.role}</p>
                        <p className="subscription-date">
                          Subscribed: {new Date(contributor.subscribedAt).toLocaleDateString()}
                        </p>
                        {contributor.notificationCount > 0 && (
                          <span className="notification-badge">
                            {contributor.notificationCount} unread
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {contributors.length === 0 && (
                    <div className="no-contributors">
                      No contributors subscribed to this NDRF team yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isContributor && (
        <div className="contributor-section">
          <h2>Your NDRF Team Subscriptions</h2>
          <div className="subscriptions-list">
            {ndrfTeams.map(team => {
              const subscribed = subscriptions?.some?.(s => String(s.ndrfTeamId) === String(team._id));
              return (
              <div key={team._id} className="subscription-card">
                <div className="subscription-info">
                  <h4>{team.name}</h4>
                  <p>📍 {team.state}</p>
                  <p>👤 NDRF Team</p>
                </div>
                {subscribed ? (
                  <button 
                    className="unsubscribe-btn"
                    onClick={() => handleUnsubscribe(team._id)}
                  >
                    Unsubscribe
                  </button>
                ) : (
                  <button 
                    className="subscribe-btn"
                    onClick={() => setShowSubscribeModal(true)}
                  >
                    Subscribe
                  </button>
                )}
              </div>
            );})}
            {ndrfTeams.length === 0 && (
              <div className="no-subscriptions">
                You haven't subscribed to any NDRF teams yet.
                <br />
                <button 
                  className="subscribe-btn"
                  onClick={() => setShowSubscribeModal(true)}
                >
                  Subscribe Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Subscribe to NDRF Team</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSubscribeModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <label>Select NDRF Team:</label>
              <select 
                value={selectedNdrfTeam} 
                onChange={(e) => setSelectedNdrfTeam(e.target.value)}
              >
                <option value="">Choose a team...</option>
                {ndrfTeams.map(team => (
                  <option key={team._id} value={team._id}>
                    {team.name} - {team.state}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowSubscribeModal(false)}
              >
                Cancel
              </button>
              <button 
                className="subscribe-submit-btn"
                onClick={handleSubscribe}
                disabled={!selectedNdrfTeam}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}