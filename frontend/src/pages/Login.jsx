import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.username || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const res =
        mode === 'login'
          ? await loginUser({ username: form.username, password: form.password })
          : await registerUser(form);

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="login-root">
      {/* Animated background grid */}
      <div className="login-grid-bg" />
      <div className="login-glow" />

      <div className="login-card">
        <div className="login-logo">
          <span className="logo-text">CrewDo</span>
        </div>

        <div className="login-fields">
          {mode === 'signup' && (
            <div className="field-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="email"
              />
            </div>
          )}

          <div className="field-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              autoComplete="username"
            />
          </div>

          <div className="field-group">
            <label>Password</label>
            <div className="pw-wrap">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
              />
              <span className="eye-icon">👁</span>
            </div>
          </div>
        </div>

        {error && <p className="login-error">{error}</p>}

        <button
          className="login-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : mode === 'login' ? 'LOGIN' : 'SIGN UP'}
        </button>

        <p className="login-switch">
          {mode === 'login' ? (
            <>don't have an account?{' '}
              <span onClick={() => { setMode('signup'); setError(''); }}>[sign up]</span>
            </>
          ) : (
            <>already have an account?{' '}
              <span onClick={() => { setMode('login'); setError(''); }}>[log in]</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}