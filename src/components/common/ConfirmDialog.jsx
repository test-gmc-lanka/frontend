import { useEffect } from 'react';
import { FiAlertTriangle, FiHelpCircle } from 'react-icons/fi';

const TONES = {
  primary: { button: 'var(--brand-accent)', iconBg: 'var(--brand-tint)', icon: 'var(--brand-accent)' },
  danger: { button: '#ef4444', iconBg: '#fee2e2', icon: '#dc2626' },
  warning: { button: '#f59e0b', iconBg: '#fef3c7', icon: '#b45309' },
};

/**
 * Confirmation modal. `children` renders extra inputs between the message and the
 * buttons (e.g. a date picker); `confirmDisabled` blocks confirming until they are valid.
 */
export default function ConfirmDialog({
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}) {
  const t = TONES[tone] || TONES.primary;
  const Icon = tone === 'primary' ? FiHelpCircle : FiAlertTriangle;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, onCancel]);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: t.iconBg,
              color: t.icon,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              id="confirm-dialog-title"
              style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: '0 0 0.35rem' }}
            >
              {title}
            </h3>
            <div style={{ color: '#4b5563', fontSize: '0.88rem', lineHeight: 1.5 }}>{message}</div>
          </div>
        </div>

        {children && <div style={{ marginTop: '1rem' }}>{children}</div>}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.6rem',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: '#fff',
              color: '#374151',
              fontWeight: 500,
              fontSize: '0.88rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            autoFocus
            style={{
              flex: 1,
              padding: '0.6rem',
              border: 'none',
              borderRadius: 8,
              background: t.button,
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: loading || confirmDisabled ? 'not-allowed' : 'pointer',
              opacity: loading || confirmDisabled ? 0.6 : 1,
            }}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
