import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clanAPI } from "../services/api";
import GroupCard from "../components/GroupCard";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [clans, setClans] = useState([]);
  const [teamCode, setTeamCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newClanName, setNewClanName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔥 Fetch clans
  const fetchClans = async () => {
    try {
      setLoading(true);
      const data = await clanAPI.getMyClans();
      setClans(data?.clans || data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load clans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClans();
  }, []);

  // 🔥 Join clan
  const handleJoin = async () => {
    if (!teamCode.trim()) return;
    setError("");

    try {
      await clanAPI.joinClan(teamCode.trim().toUpperCase());
      setTeamCode("");
      fetchClans();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid team code.");
    }
  };

  // 🔥 Create clan
  const handleCreate = async () => {
    if (!newClanName.trim()) return;
    setError("");

    try {
      const data = await clanAPI.createClan({
        name: newClanName.trim(),
      });

      setShowCreate(false);
      setNewClanName("");

      const clanId = data?.clan?._id || data?._id;
      if (clanId) {
        navigate(`/clan/${clanId}`);
      } else {
        fetchClans();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not create clan.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("crewdo_token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-root">
      {/* Nav */}
      <nav className="dash-nav">
        <span className="dash-logo">CrewDo</span>
        <div className="dash-nav-right">
          <button className="nav-icon-btn" title="Settings">⚙</button>
          <button className="nav-icon-btn" title="Help">?</button>
          <div className="nav-user" onClick={handleLogout} title="Logout">
            <div className="nav-avatar">
              {user.username?.[0]?.toUpperCase() || "U"}
            </div>
            <span>{user.username || "User"}</span>
          </div>
        </div>
      </nav>

      <div className="dash-content">
        {/* Join section */}
        <p className="dash-section-label">ENTER TEAM CODE</p>
        <div className="dash-join-row">
          <input
            className="dash-code-input"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            maxLength={8}
          />
        </div>

        <button className="dash-btn-primary" onClick={handleJoin}>
          JOIN GROUP
        </button>

        <div className="dash-divider" />

        <button
          className="dash-btn-primary"
          onClick={() => setShowCreate(!showCreate)}
        >
          CREATE GROUP
        </button>

        {showCreate && (
          <div className="dash-create-row">
            <input
              placeholder="Group name..."
              value={newClanName}
              onChange={(e) => setNewClanName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="dash-code-input"
            />
            <button className="dash-btn-secondary" onClick={handleCreate}>
              Create
            </button>
          </div>
        )}

        {error && <p className="dash-error">{error}</p>}

        {/* Groups */}
        <div className="dash-groups-box">
          <p className="dash-section-label">YOUR GROUPS</p>

          {loading ? (
            <div className="dash-loading">Loading...</div>
          ) : clans.length === 0 ? (
            <p className="dash-empty">
              No groups yet. Join or create one!
            </p>
          ) : (
            <div className="dash-groups-list">
              {clans.map((clan, i) => (
                <GroupCard key={clan._id} clan={clan} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}