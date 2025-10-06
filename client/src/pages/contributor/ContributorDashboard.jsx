import React, { useEffect, useState } from "react";
import "./contributor.css";

export default function ContributorDashboard() {
  const [ndrfTeams, setNdrfTeams] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const contributorId = currentUser?.user?.id;

  useEffect(() => {
    let isMounted = true;
    const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
    async function load() {
      try {
        const [teamsRes, subsRes, notifRes] = await Promise.all([
          fetch(`${API}/api/dept/ndrf-teams`),
          fetch(`${API}/api/contributor/${contributorId}/subscriptions`),
          fetch(`${API}/api/contributor/${contributorId}/notifications`),
        ]);
        const teams = (await teamsRes.json()).teams || [];
        const subs = (await subsRes.json()).subscriptions || [];
        const notifs = (await notifRes.json()).notifications || [];
        if (!isMounted) return;
        setNdrfTeams(teams);
        setSubscriptions(subs);
        setNotifications(notifs);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (contributorId) load();

    const interval = setInterval(() => {
      const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
      fetch(`${API}/api/contributor/${contributorId}/notifications`)
        .then(r => r.json())
        .then(d => setNotifications(d.notifications || []))
        .catch(() => {});
    }, 15000);

    return () => { isMounted = false; clearInterval(interval); };
  }, [contributorId]);

  const isSubscribed = (teamId) => subscriptions.some(s => String(s.ndrfTeamId) === String(teamId));

  const handleSubscribe = async (teamId) => {
    const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
    await fetch(`${API}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contributorId, ndrfTeamId: teamId })
    });
    const subs = await (await fetch(`${API}/api/contributor/${contributorId}/subscriptions`)).json();
    setSubscriptions(subs.subscriptions || []);
  };

  const handleUnsubscribe = async (teamId) => {
    const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
    await fetch(`${API}/api/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contributorId, ndrfTeamId: teamId })
    });
    const subs = await (await fetch(`${API}/api/contributor/${contributorId}/subscriptions`)).json();
    setSubscriptions(subs.subscriptions || []);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div className="contrib-dashboard">
      <aside className="contrib-sidebar">
  <div className="brand">
    <div className="logo-circle">R</div>
    <div>
      <div className="brand-title">ResQNet</div>
      <div className="brand-sub">
        Contributor Panel ({currentUser?.user?.name})
      </div>
    </div>
  </div>

  <nav className="menu">
    <button
      className={activeTab === "alerts" ? "menu-item active" : "menu-item"}
      onClick={() => setActiveTab("alerts")}
    >
      Broadcast Alerts
    </button>
    <button
      className={activeTab === "teams" ? "menu-item active" : "menu-item"}
      onClick={() => setActiveTab("teams")}
    >
      NDRF Teams
    </button>
  </nav>

  <div className="sidebar-footer">
    <div className="footer-user">{currentUser?.user?.name}</div>
    <button
      className="logout-btn"
      onClick={() => {
        localStorage.removeItem("user");
        window.location.href = "/"; // redirect to homepage/login
      }}
    >
      Logout
    </button>
  </div>
</aside>
      <main className="contrib-content">
        {activeTab === 'teams' && (
        <section className="contrib-section">
          <div className="section-header">
            <h3>NDRF Teams</h3>
            <div className="section-sub">Subscribe to receive alerts</div>
          </div>
          <div className="teams-grid">
            {ndrfTeams.map(team => {
              const subscribed = isSubscribed(team._id);
              return (
                <div className="team-card" key={team._id}>
                  <div className="team-name">{team.name}</div>
                  <div className="team-meta">📍 {team.state}</div>
                  <div className="team-actions">
                    {!subscribed && (
                      <button className="sub-btn" onClick={() => handleSubscribe(team._id)}>Subscribe</button>
                    )}
                    {subscribed && (
                      <button className="unsub-btn" onClick={() => handleUnsubscribe(team._id)}>Unsubscribe</button>
                    )}
                  </div>
                </div>
              );
            })}
            {ndrfTeams.length === 0 && <div>No teams found</div>}
          </div>
        </section>
        )}

{activeTab === 'alerts' && (
  <section className="contrib-section">
    <div className="section-header">
      <div>
        <h3>Broadcast Alerts</h3>
        <div className="section-sub">
          Live incoming alerts from your subscribed NDRF teams
        </div>
      </div>
      <button
        className="refresh-btn"
        onClick={() => window.location.reload()}
      >
        🔄 Refresh
      </button>
    </div>

    <div className="alerts-list-advanced">
      {notifications.length === 0 && (
        <div className="no-alerts">
          <span>All clear! No active broadcasts.</span>
        </div>
      )}

      {notifications.map((n, idx) => (
        <div className="alert-advanced-card" key={idx}>
          <div className="alert-header">
            <div className="alert-team">
              <div className="team-icon">🛡️</div>
              <div>
                <div className="alert-team-name">{n.ndrfTeamName || "NDRF Team"}</div>
                <div className="alert-time">
                  {new Date(n.sentAt).toLocaleString()}
                </div>
              </div>
            </div>
            <span className="alert-badge">
              {n.priority?.toUpperCase() || "ALERT"}
            </span>
          </div>

          <div className="alert-body">
            <p className="alert-message">{n.message}</p>

            {!!(n.attachments && n.attachments.length) && (
              <div className="alert-section">
                <div className="alert-section-title">📎 Attached Emergencies</div>
                <div className="alert-attachments">
                  {n.attachments.map((att) => {
                    const coords = att?.location?.coordinates || [];
                    const lng = coords[0];
                    const lat = coords[1];
                    const mapUrl =
                      lat != null && lng != null
                        ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=14`
                        : `https://www.openstreetmap.org/`;
                    return (
                      <div className="attachment-card" key={att.id}>
                        <div className="attachment-header">
                          <strong>{att.type}</strong>
                          <a href={mapUrl} target="_blank" rel="noreferrer">
                            View Map
                          </a>
                        </div>
                        <div className="attachment-meta">
                          {new Date(att.createdAt).toLocaleString()}
                        </div>
                        {att.address && <div>{att.address}</div>}
                        {(lat != null && lng != null) && (
                          <div className="coords">📍 {lat}, {lng}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!!(n.emergencyArray && n.emergencyArray.length) && (
              <div className="alert-section">
                <div className="alert-section-title">Emergency Details</div>
                <div className="alert-emergencies">
                  {n.emergencyArray.map((em) => {
                    const coords = em?.location?.coordinates || [];
                    const lng = coords[0];
                    const lat = coords[1];
                    const mapUrl =
                      lat != null && lng != null
                        ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=14`
                        : `https://www.openstreetmap.org/`;
                    return (
                      <div className="emergency-card" key={em.id}>
                        <div className="emergency-header">
                          <strong>{em.type}</strong>
                          <span className={`status-badge ${em.status?.toLowerCase()}`}>
                            {em.status}
                          </span>
                        </div>
                        <div className="emergency-meta">
                          {new Date(em.createdAt).toLocaleString()}
                        </div>
                        {em.address && <div>{em.address}</div>}
                        <div className="emergency-actions">
                          {em.mobileNumber && (
                            <button onClick={() => window.open(`tel:${em.mobileNumber}`)}>
                              📞 Call
                            </button>
                          )}
                          {em.email && (
                            <button onClick={() => window.open(`mailto:${em.email}`)}>
                              ✉️ Email
                            </button>
                          )}
                          <a href={mapUrl} target="_blank" rel="noreferrer">
                            🗺️ Map
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </section>
)}

      </main>
    </div>
  );
}

