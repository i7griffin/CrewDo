// Renders a single member row in the members list sidebar
const MemberItem = ({ member, onClick }) => {
  const { username, flamePoints, isOnline } = member;
  const initial = username ? username[0].toUpperCase() : '?';

  return (
    <div className="member-item" onClick={onClick}>
      <div className="member-item__initials">{initial}</div>
      <div className="member-item__info">
        <div className="member-item__name">{username}</div>
        <div className="member-item__points">{flamePoints ?? 0} flame points</div>
      </div>
      <div
        className={`member-item__status-dot ${
          isOnline ? 'member-item__status-dot--online' : 'member-item__status-dot--offline'
        }`}
      />
    </div>
  );
};

export default MemberItem;