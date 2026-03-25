import { useNavigate } from 'react-router-dom';

const CLAN_ICONS = {
  study: '📖',
  workout: '🏋️',
  leetcode: '</>', 
  default: '🔥',
};

const CLAN_COLORS = [
  '#00ff88',
  '#00cfff',
  '#ff6b6b',
  '#ffd93d',
  '#c77dff',
];

function getClanIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('study')) return CLAN_ICONS.study;
  if (n.includes('workout') || n.includes('gym') || n.includes('fitness')) return CLAN_ICONS.workout;
  if (n.includes('leet') || n.includes('code')) return CLAN_ICONS.leetcode;
  return CLAN_ICONS.default;
}

export default function GroupCard({ clan, index = 0 }) {
  const navigate = useNavigate();
  const accent = CLAN_COLORS[index % CLAN_COLORS.length];
  const icon = getClanIcon(clan.name);

  return (
    <div
      className="group-card"
      style={{ '--accent': accent }}
      onClick={() => navigate(`/clan/${clan._id}`)}
    >
      <div className="group-card-glow" />
      <div className="group-card-icon">{icon}</div>
      <div className="group-card-info">
        <h3>{clan.name}</h3>
        <p className="group-card-members">
          {clan.members?.length || 0} member{clan.members?.length !== 1 ? 's' : ''}
        </p>
        {clan.streak !== undefined && (
          <p className="group-card-streak">🔥 {clan.streak} day streak</p>
        )}
      </div>
      <div className="group-card-arrow">→</div>
    </div>
  );
}