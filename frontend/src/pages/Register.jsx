import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.username.trim() || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({ username: form.username.trim(), password: form.password });
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {showPassword ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1 className="auth-logo">CrewDo</h1>

        {error && <div className="auth-error">{error}</div>}

        {/* Username */}
        <div className="auth-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            className="input"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
          />
        </div>

        {/* Password */}
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="input"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-input-wrapper__eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon />
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="auth-field">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="auth-input-wrapper">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              className="input"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Creating Account…' : 'SIGN UP'}
        </button>

        <p className="auth-footer">
          Already have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/login')}>
            [login]
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;