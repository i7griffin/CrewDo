import { useNavigate } from 'react-router-dom';

// Top navigation bar — logo, optional center slot, settings icon, user profile
const Navbar = ({ user, centerLabel, onSettingsClick }) => {
  const navigate = useNavigate();
  const initial = user?.username ? user.username[0].toUpperCase() : '?';

  return (
    <nav className="navbar">
      {/* Logo */}
      <span className="navbar__logo" onClick={() => navigate('/groups')} style={{ cursor: 'pointer' }}>
        CrewDo
      </span>

      {/* Optional center label (e.g. group type badge) */}
      {centerLabel && (
        <div
          style={{
            background: 'rgba(26,46,28,0.9)',
            border: '1px solid var(--color-border)',
            borderRadius: '20px',
            padding: '0.3rem 1.1rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          {centerLabel}
        </div>
      )}

      {/* Right actions */}
      <div className="navbar__actions">
        {/* Settings */}
        <button
          className="navbar__icon-btn"
          onClick={onSettingsClick}
          title="Settings"
          aria-label="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Help */}
        <button className="navbar__icon-btn" title="Help" aria-label="Help">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
          </svg>
        </button>

        {/* User */}
        <div className="navbar__user">
          <div className="navbar__avatar-placeholder">{initial}</div>
          <span>{user?.username ?? 'Guest'}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;