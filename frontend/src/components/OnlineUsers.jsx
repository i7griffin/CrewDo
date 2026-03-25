// Displays a row of online user avatars with green presence dots
const OnlineUsers = ({ users }) => {
  if (!users || users.length === 0) {
    return <p className="text-muted" style={{ fontSize: '0.85rem' }}>No users online</p>;
  }

  return (
    <div className="online-users">
      {users.map((user) => {
        const initial = user.username ? user.username[0].toUpperCase() : '?';
        return (
          <div key={user._id ?? user.username} className="online-user">
            <div className="online-user__avatar-wrap">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="online-user__avatar"
                />
              ) : (
                <div
                  className="online-user__avatar"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-green-dim)',
                    color: '#0a1a0b',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                >
                  {initial}
                </div>
              )}
              <span className="online-user__dot" />
            </div>
            <span className="online-user__name">{user.username}</span>
          </div>
        );
      })}
    </div>
  );
};

export default OnlineUsers;