import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import { resetPassword } from '../api/auth';
import { getErrorMessage } from '../utils/formatters';

const MIN_LENGTH = 8;

export default function ResetPasswordPage({ onLoginClick, onForgotPassword }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const tooShort = form.password.length > 0 && form.password.length < MIN_LENGTH;
  const mismatch = form.confirm.length > 0 && form.password !== form.confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < MIN_LENGTH || form.password !== form.confirm) return;
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, form.password);
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigate('/');
    onLoginClick();
  };
  const requestNewLink = () => {
    navigate('/');
    onForgotPassword();
  };

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: '2.25rem 2rem' }}>
        {!token ? (
          <Message
            icon={<FiAlertTriangle size={24} />}
            tone="danger"
            title="Invalid reset link"
            text="This link is missing its reset code. Please use the link from your email, or request a new one."
            action={
              <button className="btn btn-primary w-full" onClick={requestNewLink}>
                Request a new link
              </button>
            }
          />
        ) : done ? (
          <Message
            icon={<FiCheckCircle size={24} />}
            tone="success"
            title="Password updated"
            text="Your password has been reset and you've been signed out of other devices. You can now log in with your new password."
            action={
              <button className="btn btn-primary w-full" onClick={goToLogin}>
                Log in <FiArrowRight />
              </button>
            }
          />
        ) : (
          <>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Choose a new password
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Enter a new password for your GMC Lanka account.
            </p>

            {error && (
              <div
                role="alert"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  borderRadius: 8,
                  padding: '0.65rem 0.875rem',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                {error}{' '}
                <button
                  type="button"
                  onClick={requestNewLink}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#b91c1c',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Request a new link
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label htmlFor="new-password" className="form-label">
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={iconStyle} />
                  <input
                    id="new-password"
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={`Min. ${MIN_LENGTH} characters`}
                    autoComplete="new-password"
                    autoFocus
                    required
                  />
                </div>
                {tooShort && (
                  <span className="form-hint" style={{ color: 'var(--danger)' }}>
                    Use at least {MIN_LENGTH} characters.
                  </span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password" className="form-label">
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={iconStyle} />
                  <input
                    id="confirm-password"
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    placeholder="Re-enter the new password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                {mismatch && (
                  <span className="form-hint" style={{ color: 'var(--danger)' }}>
                    Passwords don&rsquo;t match.
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || form.password.length < MIN_LENGTH || form.password !== form.confirm}
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Message({ icon, tone, title, text, action }) {
  const colors = tone === 'success' ? { bg: '#e6f4f1', fg: '#0f766e' } : { bg: '#fee2e2', fg: '#dc2626' };
  return (
    <div role="status">
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: colors.bg,
          color: colors.fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.1rem',
        }}
      >
        {icon}
      </div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        {title}
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        {text}
      </p>
      {action}
    </div>
  );
}

const iconStyle = {
  position: 'absolute',
  left: '0.875rem',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
};
