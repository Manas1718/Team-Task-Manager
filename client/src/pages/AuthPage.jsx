import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  if (user) { navigate('/'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await signup(form.name, form.email, form.password, form.role);
      navigate('/');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-brand">
        <div className="brand-glow" />
        <div className="brand-content">
          <div className="brand-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#lga)" />
              <path d="M14 34V18L24 12L34 18V34L24 28L14 34Z" stroke="#fff" strokeWidth="2.5" fill="none" />
              <circle cx="24" cy="22" r="4" fill="#fff" opacity="0.9" />
              <defs><linearGradient id="lga" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#8b5cf6" /><stop offset="1" stopColor="#06b6d4" /></linearGradient></defs>
            </svg>
            <h1>Ethara AI</h1>
          </div>
          <p className="brand-tagline">Intelligent Task Management for Modern Teams</p>
          <div className="brand-features">
            <div className="brand-feature"><span className="feature-icon">📊</span><span>Real-time Dashboard</span></div>
            <div className="brand-feature"><span className="feature-icon">👥</span><span>Team Collaboration</span></div>
            <div className="brand-feature"><span className="feature-icon">🔒</span><span>Role-based Access</span></div>
            <div className="brand-feature"><span className="feature-icon">📋</span><span>Smart Task Tracking</span></div>
          </div>
        </div>
      </div>
      <div className="auth-form-wrapper">
        <div className="auth-form-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); }}>Sign In</button>
            <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); }}>Sign Up</button>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="John Doe" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@ethara.ai" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Min 6 characters" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            {!isLogin && (
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              <span>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}</span>
              {!loading && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
