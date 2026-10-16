import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiLock, FiShield, FiArrowRight, FiKey } from 'react-icons/fi';
import { register as apiRegister } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

const BG_IMAGE =
  'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=1920&q=60&auto=format&fit=crop';

export default function RegisterModal({ onClose, onRegistered, onSwitchToLogin }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'reg-input-focus';
    style.textContent = '.reg-input:focus { border-color: #1e3a5c !important; box-shadow: 0 0 0 3px rgba(30,58,92,0.12) !important; outline: none !important; }';
    document.head.appendChild(style);
    return () => document.getElementById('reg-input-focus')?.remove();
  }, []);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await apiRegister({ name: form.name, email: form.email, password: form.password });
      login(data);
      toast.success(`Account created! Welcome, ${data.name}!`);
      if (onRegistered) onRegistered(data); else onClose();
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        setError('We can\u2019t reach GMC Lanka right now. Please check your connection and try again.');
      } else if (err.response?.status === 409) {
        setError('An account with this email already exists. Please login instead.');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Create an account"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 2, width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '1.1rem', color: '#374151' }}
      >
        ✕
      </button>
      {/* Background image with white wash */}
      <div
        style={{
          ...bgStyle,
          backgroundImage: `url('${BG_IMAGE}')`,
        }}
      />
      <div style={bgWashStyle} />

      {/* Card */}
      <div style={cardStyle}>
        {/* Badge */}
        <div style={badgeWrapStyle}>
          <div style={badgeStyle}>
            <FiKey size={11} />
            <span>NEW ACCOUNT</span>
          </div>
        </div>

        <h1 style={titleStyle}>Welcome to GMC LANKA</h1>
        <p style={subtitleStyle}>Enter your technical credentials to get services today.</p>

        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Full Name */}
          <div style={fieldGroupStyle}>
            <label htmlFor="reg-name" style={labelStyle}>FULL NAME</label>
            <div style={inputWrapStyle}>
              <FiUser size={15} style={iconStyle} />
              <input
                id="reg-name"
                type="text"
                className="reg-input"
                style={inputStyle}
                placeholder="Johnathan Miller"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div style={fieldGroupStyle}>
            <label htmlFor="reg-email" style={labelStyle}>EMAIL ADDRESS</label>
            <div style={inputWrapStyle}>
              <FiMail size={15} style={iconStyle} />
              <input
                id="reg-email"
                type="email"
                className="reg-input"
                style={inputStyle}
                placeholder="engineering@gmclanka.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>
          </div>

          {/* Password row — 2 columns */}
          <div style={passwordRowStyle}>
            <div style={{ flex: 1 }}>
              <label htmlFor="reg-password" style={labelStyle}>PASSWORD</label>
              <div style={inputWrapStyle}>
                <FiLock size={15} style={iconStyle} />
                <input
                id="reg-password"
                  type="password"
                  className="reg-input"
                  style={inputStyle}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="reg-confirm" style={labelStyle}>CONFIRM PASSWORD</label>
              <div style={inputWrapStyle}>
                <FiShield size={15} style={iconStyle} />
                <input
                id="reg-confirm"
                  type="password"
                  className="reg-input"
                  style={inputStyle}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  required
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <button type="submit" style={btnStyle(loading)} disabled={loading}>
            <span>{loading ? 'Creating account...' : 'Register'}</span>
            {!loading && <FiArrowRight size={16} />}
          </button>
        </form>

        <p style={switchStyle}>
          Already have account ?{' '}
          <button onClick={onSwitchToLogin} style={switchBtnStyle}>Login</button>
        </p>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <span>© {new Date().getFullYear()} GMC Lanka.</span>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  overflowY: 'auto',
};

const bgStyle = {
  position: 'absolute',
  inset: 0,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

const bgWashStyle = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(240, 244, 248, 0.88)',
  backdropFilter: 'blur(1px)',
};

const cardStyle = {
  position: 'relative',
  zIndex: 1,
  background: '#ffffff',
  width: '100%',
  maxWidth: 520,
  padding: '2.75rem 2.5rem 2.25rem',
  borderRadius: 4,
  flex: '0 0 auto',
};

const badgeWrapStyle = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '1.25rem',
};

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  background: '#1e3a5c',
  color: '#fff',
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  padding: '0.35rem 0.9rem',
  borderRadius: 999,
};

const titleStyle = {
  textAlign: 'center',
  fontSize: '2rem',
  fontWeight: 800,
  color: '#1e3a5c',
  marginBottom: '0.5rem',
  lineHeight: 1.2,
};

const subtitleStyle = {
  textAlign: 'center',
  color: '#6b7280',
  fontSize: '0.9rem',
  marginBottom: '1.75rem',
};

const errorStyle = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#dc2626',
  borderRadius: 6,
  padding: '0.65rem 0.875rem',
  fontSize: '0.85rem',
  marginBottom: '1.25rem',
};

const fieldGroupStyle = {
  marginBottom: '1.1rem',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: '#374151',
  marginBottom: '0.4rem',
};

const inputWrapStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const iconStyle = {
  position: 'absolute',
  left: '0.875rem',
  color: '#9ca3af',
  pointerEvents: 'none',
};

const inputStyle = {
  width: '100%',
  paddingLeft: '2.5rem',
  paddingRight: '0.875rem',
  paddingTop: '0.7rem',
  paddingBottom: '0.7rem',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  color: '#111827',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const passwordRowStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '1.75rem',
};

const btnStyle = (loading) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  background: loading ? '#2d5a8c' : '#1e3a5c',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '0.85rem 1.5rem',
  fontSize: '0.975rem',
  fontWeight: 600,
  cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.8 : 1,
  transition: 'background 0.2s',
  marginBottom: '1.25rem',
});

const switchStyle = {
  textAlign: 'center',
  fontSize: '0.875rem',
  color: '#6b7280',
  margin: 0,
};

const switchBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#1e3a5c',
  fontWeight: 700,
  cursor: 'pointer',
  padding: 0,
  fontSize: 'inherit',
};

const footerStyle = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 1200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '0.75rem',
  padding: '1.25rem 1rem 0',
  fontSize: '0.8rem',
  color: '#4b5563',
};

