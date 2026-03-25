export default function MemberList({ members = [], onlineUsers = [] }) {
  const isOnline = (userId) =>
    onlineUsers.some((u) => u === userId || u._id === userId || u.userId === userId);

  const sorted = [...members].sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <div className="member-list">
      <h2 className="panel-title">MEMBERS LIST</h2>
      <div className="member-items">
        {sorted.map((member) => {
          const online = isOnline(member._id || member.userId);
          const name = member.username || member.name || 'Unknown';
          const points = member.points ?? member.flamePoints ?? 0;
          return (
            <div key={member._id || member.userId} className="member-item">
              <div className="member-avatar">
                {name[0]?.toUpperCase()}
                <span className={`online-dot ${online ? 'dot-online' : 'dot-offline'}`} />
              </div>
              <div className="member-info">
                <span className="member-name">{name}.</span>
                <span className="member-points">🔥 {points}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}