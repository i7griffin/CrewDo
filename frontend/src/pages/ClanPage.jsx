import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClanById, getClanStreak } from '../services/api';
import {
  connectSocket,
  joinClanRoom,
  leaveClanRoom,
  onUserOnline,
  onUserOffline,
  onProgressUpdate,
  onStreakUpdate,
  offUserOnline,
  offUserOffline,
  offProgressUpdate,
  offStreakUpdate,
} from '../socket/socket';
import MemberList from '../components/MemberList';
import ProgressDisplay from '../components/ProgressDisplay';
import ChatBox from '../components/ChatBox';

export default function ClanPage() {
  const { clanId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [clan, setClan] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [progress, setProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClan = async () => {
    try {
      const res = await getClanById(clanId);
      const data = res.data?.clan || res.data;
      setClan(data);
      setProgress(data.dailyProgress ?? 0);
    } catch {
      setError('Failed to load clan.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStreak = async () => {
    try {
      const res = await getClanStreak(clanId);
      setStreak(res.data?.streak ?? 0);
    } catch {}
  };

  useEffect(() => {
    fetchClan();
    fetchStreak();

    // Socket setup
    const socket = connectSocket(user._id);
    joinClanRoom(clanId);

    onUserOnline((data) => {
      setOnlineUsers((prev) => {
        const exists = prev.some((u) => u._id === data._id || u.userId === data._id);
        return exists ? prev : [...prev, data];
      });
    });

    onUserOffline((data) => {
      setOnlineUsers((prev) =>
        prev.filter((u) => u._id !== data._id && u.userId !== data._id)
      );
    });

    onProgressUpdate((data) => {
      if (data.clanId === clanId) setProgress(data.progress ?? 0);
    });

    onStreakUpdate((data) => {
      if (data.clanId === clanId) setStreak(data.streak ?? 0);
    });

    return () => {
      leaveClanRoom(clanId);
      offUserOnline();
      offUserOffline();
      offProgressUpdate();
      offStreakUpdate();
    };
  }, [clanId]);

  if (loading) {
    return (
      <div className="clan-loading">
        <div className="loading-spinner" />
        <p>Loading clan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clan-loading">
        <p className="error-text">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
      </div>
    );
  }

  const tasks = clan?.dailyTasks || clan?.tasks || [
    { type: 'WORKOUT', completed: false },
    { type: 'STUDY', completed: false },
    { type: 'LEETCODE', completed: false },
  ];

  return (
    <div className="clan-root">
      {/* Nav */}
      <nav className="dash-nav">
        <div className="dash-nav-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <span className="dash-logo">CrewDo</span>
        </div>
        <span className="clan-nav-name">{clan?.name}</span>
        <div className="dash-nav-right">
          <span className="streak-badge">🔥 {streak} day streak</span>
          <div className="nav-avatar">{user.username?.[0]?.toUpperCase() || 'U'}</div>
          <span className="nav-username">{user.username}</span>
        </div>
      </nav>

      <div className="clan-content">
        {/* LEFT: Members */}
        <div className="clan-left">
          <MemberList members={clan?.members || []} onlineUsers={onlineUsers} />
        </div>

        {/* CENTER: Progress */}
        <div className="clan-center">
          <ProgressDisplay
            clanId={clanId}
            progress={progress}
            tasks={tasks}
            onProofSubmit={() => { fetchClan(); fetchStreak(); }}
          />
        </div>

        {/* RIGHT: Online + Chat */}
        <div className="clan-right">
          <ChatBox clanId={clanId} onlineUsers={onlineUsers} />
        </div>
      </div>
    </div>
  );
}