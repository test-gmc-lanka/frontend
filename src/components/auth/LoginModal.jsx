import { useState } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { login as apiLogin } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function LoginModal({ onClose, onSwitchToRegister, onForgotPassword }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiLogin(form);
      login(data);
      toast.success(`Welcome back, ${data.name}!`);
      onClose();
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'linear-gradient(135deg, #dde8f2 0%, #c8daea 50%, #d4e4f0 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Decorative circles in background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[
          { w: 300, h: 300, top: -80, right: -60, opacity: 0.18 },
          { w: 200, h: 200, bottom: 40, left: -60, opacity: 0.13 },
          { w: 150, h: 150, top: '30%', left: '10%', opacity: 0.1 },
          { w: 100, h: 100, bottom: '20%', right: '12%', opacity: 0.1 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: c.w, height: c.h,
            borderRadius: '50%',
            background: 'rgba(14, 116, 144, 0.25)',
            top: c.top, bottom: c.bottom, left: c.left, right: c.right,
            opacity: c.opacity,
          }} />
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '2.75rem 2.5rem 2.25rem',
        width: '100%', maxWidth: 420,
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        position: 'relative',
      }}>
        {/* Heading */}
        <h2 style={{
          fontSize: '2rem', fontWeight: 800,
          color: '#0f3460', marginBottom: '0.4rem',
          lineHeight: 1.2,
        }}>
          Welcome back
        </h2>
        <p style={{ color: '#8a9ab0', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Enter your credentials to access your account.
        </p>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#b91c1c', borderRadius: 8,
            padding: '0.65rem 0.875rem', fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={labelStyle}>EMAIL</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '0.6rem' }}>
            <label style={labelStyle}>PASSWORD</label>
            <input
              type="password"
              placeholder="••••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                background: 'none', border: 'none',
                color: '#0e7490', fontSize: '0.75rem',
                fontWeight: 700, letterSpacing: '0.06em',
                cursor: 'pointer', padding: 0,
              }}
            >
              FORGOT PASSWORD
            </button>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#2d6a8a' : '#0f3460',
              color: '#fff',
              border: 'none',
              borderRadius: 50,
              padding: '0.9rem 1.5rem',
              fontSize: '1rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in...' : <><span>Login</span><FiArrowRight size={18} /></>}
          </button>
        </form>

        {/* Divider */}
        <div style={{ height: 1, background: '#f0f2f5', margin: '1.75rem 0 1.25rem' }} />

        {/* Sign Up section */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#8a9ab0', fontSize: '0.88rem', marginBottom: '0.85rem' }}>
            New to &nbsp;GMC LANKA?
          </p>
          <button
            onClick={onSwitchToRegister}
            style={{
              background: '#fff',
              border: '1.5px solid #0e7490',
              color: '#0e7490',
              borderRadius: 50,
              padding: '0.5rem 2rem',
              fontSize: '0.9rem', fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem', fontWeight: 700,
  color: '#9ca3af', letterSpacing: '0.08em',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#f0f4f8',
  border: 'none', outline: 'none',
  borderRadius: 10,
  padding: '0.85rem 1.1rem',
  fontSize: '0.95rem', color: '#1a2a3a',
};
