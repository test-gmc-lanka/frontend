import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiShoppingBag, FiCreditCard, FiCalendar, FiTool, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { getNotifications, getUnreadCount, markNotificationRead, markNotificationsRead } from '../../api/users';

const POLL_MS = 30000; // check for new notifications every 30 seconds

const TYPE_ICON = {
  ORDER: { icon: FiShoppingBag, color: '#0f766e', bg: '#e6f4f1' },
  PAYMENT: { icon: FiCreditCard, color: '#15803d', bg: '#dcfce7' },
  APPOINTMENT: { icon: FiCalendar, color: '#1d4ed8', bg: '#dbeafe' },
  MAINTENANCE: { icon: FiTool, color: '#b45309', bg: '#fef3c7' },
  COMPLAINT: { icon: FiAlertCircle, color: '#b91c1c', bg: '#fee2e2' },
};

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Bell with unread badge; works for customers, admins and technicians alike. */
export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const refreshCount = useCallback(() => {
    getUnreadCount()
      .then((r) => setUnread(r.data.count || 0))
      .catch(() => {});
  }, []);

  // Poll, and refresh as soon as the tab is focused again
  useEffect(() => {
    refreshCount();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refreshCount();
    }, POLL_MS);
    window.addEventListener('focus', refreshCount);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refreshCount);
    };
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      getNotifications()
        .then((r) => setItems(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
      refreshCount();
    }
  };

  const openNotification = (n) => {
    if (!n.read) {
      markNotificationRead(n.notificationId).catch(() => {});
      setItems((prev) => prev.map((x) => (x.notificationId === n.notificationId ? { ...x, read: true } : x)));
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAll = () => {
    markNotificationsRead().catch(() => {});
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex' }}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        title="Notifications"
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          display: 'flex',
        }}
      >
        <FiBell size={21} />
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -7,
              right: -9,
              background: '#ef4444',
              color: '#fff',
              borderRadius: 999,
              minWidth: 18,
              height: 18,
              padding: '0 4px',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position: 'absolute',
            right: -60,
            top: 'calc(100% + 12px)',
            width: 360,
            maxWidth: 'calc(100vw - 24px)',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(15, 42, 63, 0.18)',
            zIndex: 300,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <span style={{ fontWeight: 700, color: '#111827' }}>Notifications</span>
            {items.some((n) => !n.read) && (
              <button
                type="button"
                onClick={markAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0f766e',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {loading && items.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#9ca3af' }}>
                <FiBell size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                <div style={{ fontSize: '0.875rem' }}>You&rsquo;re all caught up</div>
              </div>
            ) : (
              items.map((n) => {
                const t = TYPE_ICON[n.type] || { icon: FiInfo, color: '#6b7280', bg: '#f3f4f6' };
                const Icon = t.icon;
                return (
                  <button
                    key={n.notificationId}
                    type="button"
                    onClick={() => openNotification(n)}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.8rem 1rem',
                      background: n.read ? '#fff' : '#f0fdfa',
                      border: 'none',
                      borderBottom: '1px solid #f8fafc',
                      cursor: n.link ? 'pointer' : 'default',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: t.bg,
                        color: t.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={15} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '0.84rem',
                          color: '#111827',
                          lineHeight: 1.4,
                          fontWeight: n.read ? 400 : 600,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {n.message}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', marginTop: 3 }}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && (
                      <span
                        aria-label="Unread"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#0f766e',
                          flexShrink: 0,
                          marginTop: 6,
                        }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
