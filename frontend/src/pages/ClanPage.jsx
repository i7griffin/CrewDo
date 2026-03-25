import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { clanAPI } from "../services/api";
import {
  connectSocket,
  joinClanRoom,
  leaveClanRoom,
} from "../socket/socket";

import MemberList from "../components/MemberList";
import ProgressDisplay from "../components/ProgressDisplay";
import ChatBox from "../components/ChatBox";

export default function ClanPage() {
  const { id: clanId } = useParams(); // FIXED param name
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [clan, setClan] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [progress, setProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch clan
  const fetchClan = async () => {
    try {
      setLoading(true);
      const data = await clanAPI.getClan(clanId);
      setClan(data?.clan || data);
      setProgress(data?.dailyProgress ?? 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load clan.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch streak
  const fetchStreak = async () => {
    try {
      const data = await clanAPI.getStreakHistory(clanId);
      setStreak(data?.streak ?? 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClan();
    fetchStreak();

    // ✅ SOCKET SETUP
    const token = localStorage.getItem("crewdo_token");
    if (token) {
      connectSocket(token);
      joinClanRoom(clanId);
    }

    return () => {
      leaveClanRoom(clanId);
    };
  }, [clanId]);

  if (loading) {
    return (
      <div className="clan-loading">
        <p>Loading clan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clan-loading">
        <p className="error-text">{error}</p>
        <button onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
      </div>
    );
  }

  const tasks =
    clan?.dailyTasks ||
    clan?.tasks || [
      { type: "WORKOUT", completed: false },
      { type: "STUDY", completed: false },
      { type: "LEETCODE", completed: false },
    ];

  return (
    <div className="clan-root">
      {/* Nav */}
      <nav className="dash-nav">
        <div>
          <button onClick={() => navigate("/dashboard")}>
            ←
          </button>
          <span>CrewDo</span>
        </div>

        <span>{clan?.name}</span>

        <div>
          <span>🔥 {streak} day streak</span>
          <span>
            {user.username?.[0]?.toUpperCase() || "U"}
          </span>
        </div>
      </nav>

      <div className="clan-content">
        {/* LEFT */}
        <div>
          <MemberList
            members={clan?.members || []}
            onlineUsers={onlineUsers}
          />
        </div>

        {/* CENTER */}
        <div>
          <ProgressDisplay
            clanId={clanId}
            progress={progress}
            tasks={tasks}
            onProofSubmit={() => {
              fetchClan();
              fetchStreak();
            }}
          />
        </div>

        {/* RIGHT */}
        <div>
          <ChatBox clanId={clanId} onlineUsers={onlineUsers} />
        </div>
      </div>
    </div>
  );
}