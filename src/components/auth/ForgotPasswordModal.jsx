import { useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiMail } from 'react-icons/fi';
import { forgotPassword } from '../../api/auth';
import { getErrorMessage } from '../../utils/formatters';

export default function ForgotPasswordModal({ onClose, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setError(err.code === 'ERR_NETWORK'
        ? 'Cannot connect to server. Please make sure the backend is running.'
        : getErrorMessage(err));
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
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, padding: '2.75rem 2.5rem 2.25rem',
        width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', position: 'relative',
      }}>
        {sentTo ? (
          <div role="status">
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: '#e6f4f1', color: '#0f766e',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem',
            }}>
              <FiMail size={24} />
            </div>
            <h2 style={headingStyle}>Check your email</h2>
            <p style={{ color: '#4b5563', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              If an account exists for <strong>{sentTo}</strong>, we&rsquo;ve sent a link to reset your password.
            </p>
            <p style={{ color: '#8a9ab0', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              The link expires in 30 minutes. Don&rsquo;t see it? Check your spam folder, or try again.
            </p>
            <button type="button" onClick={onBackToLogin} style={primaryButtonStyle(false)}>
              <FiArrowLeft size={18} /> Back to Login
            </button>
            <button type="button" onClick={() => setSentTo('')} style={linkButtonStyle}>
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h2 style={headingStyle}>Forgot password?</h2>
            <p style={{ color: '#8a9ab0', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Enter your account email and we&rsquo;ll send you a link to reset your password.
            </p>

            {error && <div role="alert" style={errorStyle}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="forgot-email" style={labelStyle}>EMAIL</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
                {loading ? 'Sending...' : <><span>Send Reset Link</span><FiArrowRight size={18} /></>}
              </button>
            </form>

            <button type="button" onClick={onBackToLogin} style={linkButtonStyle}>
              <FiArrowLeft size={14} /> Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const headingStyle = {
  fontSize: '2rem', fontWeight: 800, color: '#0f3460', marginBottom: '0.4rem', lineHeight: 1.2,
};

const labelStyle = {
  display: 'block', fontSize: '0.7rem', fontWeight: 700,
  color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 6,
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: '#f0f4f8',
  border: 'none', outline: 'none', borderRadius: 10,
  padding: '0.85rem 1.1rem', fontSize: '0.95rem', color: '#1a2a3a',
};

const errorStyle = {
  background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8,
  padding: '0.65rem 0.875rem', fontSize: '0.85rem', marginBottom: '1.25rem',
};

const primaryButtonStyle = (loading) => ({
  width: '100%', background: loading ? '#2d6a8a' : '#0f3460', color: '#fff',
  border: 'none', borderRadius: 50, padding: '0.9rem 1.5rem',
  fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
});

const linkButtonStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  width: '100%', marginTop: '1.25rem', background: 'none', border: 'none',
  color: '#0e7490', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0,
};
