import { useState, useEffect, useMemo } from 'react';
import { FiCalendar, FiMapPin, FiUser, FiSearch, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { adminGetAppointments, adminUpdateAppointmentStatus } from '../../api/appointments';
import { getErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const PAGE_SIZES = [3, 5, 10];

/* Backend statuses available */
const APT_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

function statusLabel(status) {
  const map = { PENDING: 'REQUESTED', CONFIRMED: 'CONFIRMED', CANCELLED: 'CANCELLED', COMPLETED: 'COMPLETED' };
  return map[status] || status;
}

function StatusBadge({ status }) {
  const styles = {
    PENDING:   { bg: '#1e3a5c', color: '#fff' },
    CONFIRMED: { bg: '#0f766e', color: '#fff' },
    CANCELLED: { bg: '#ef4444', color: '#fff' },
    COMPLETED: { bg: '#6b7280', color: '#fff' },
  };
  const s = styles[status] || { bg: '#e5e7eb', color: '#374151' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em',
      padding: '3px 10px', borderRadius: 4,
    }}>
      {statusLabel(status)}
    </span>
  );
}

/* Format date as "YYYY-MM-DD  HH:MM" */
function formatApptDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return `${date}  ${time}`;
}

/* Derive a short title from the first sentence of the message */
function deriveTitle(message, id) {
  if (!message) return `Appointment #${id}`;
  const first = message.split(/[.!?\n]/)[0].trim();
  return first.length > 6 ? (first.length > 55 ? first.slice(0, 55) + '…' : first) : `Appointment #${id}`;
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [pendingFilter, setPendingFilter] = useState({ status: '', pageSize: 5 });
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAppointments = (sf) =>
    adminGetAppointments(sf ? { status: sf } : {})
      .then((r) => setAppointments(r.data))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));

  useEffect(() => { setLoading(true); fetchAppointments(''); }, []);

  const applyFilter = () => {
    setStatusFilter(pendingFilter.status);
    setPageSize(pendingFilter.pageSize);
    setPage(1);
    setLoading(true);
    fetchAppointments(pendingFilter.status);
  };

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      const { data } = await adminUpdateAppointmentStatus(id, status);
      setAppointments((prev) => prev.map((a) => (a.appointmentId === id ? data : a)));
      toast.success('Appointment updated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(appointments.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => appointments.slice((safePage - 1) * pageSize, safePage * pageSize),
    [appointments, safePage, pageSize]
  );
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', paddingBottom: '3rem' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
        padding: '2.5rem 2.5rem 1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            Manage Appointments
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>
            Review and respond to industrial consultation requests.
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <div style={filterLabelStyle}>SHOW</div>
            <div style={{ position: 'relative' }}>
              <select
                value={pendingFilter.pageSize}
                onChange={(e) => setPendingFilter((f) => ({ ...f, pageSize: Number(e.target.value) }))}
                style={selectStyle}
              >
                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <FiChevronDown size={13} style={chevronStyle} />
            </div>
          </div>

          <div>
            <div style={filterLabelStyle}>STATUS</div>
            <div style={{ position: 'relative' }}>
              <select
                value={pendingFilter.status}
                onChange={(e) => setPendingFilter((f) => ({ ...f, status: e.target.value }))}
                style={{ ...selectStyle, minWidth: 120 }}
              >
                <option value="">All</option>
                {APT_STATUSES.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
              <FiChevronDown size={13} style={chevronStyle} />
            </div>
          </div>

          <button
            onClick={applyFilter}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#0f766e', color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '0.6rem 1.1rem', fontSize: '0.88rem', fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', height: 38,
            }}
          >
            <FiSearch size={15} /> Apply Filter
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {paginated.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>No appointments found</div>
        ) : paginated.map((a) => {
          const isTerminal = a.status === 'COMPLETED' || a.status === 'CANCELLED';
          const isUpdating = updatingId === a.appointmentId;

          return (
            <div key={a.appointmentId} style={{
              background: '#fff', borderRadius: 12,
              border: '1px solid #e5e7eb', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {/* Left: appointment info */}
                <div style={{ flex: 1, padding: '1.25rem 1.25rem 1.25rem 1.5rem' }}>

                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.4rem' }}>
                    <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827', margin: 0 }}>
                      {deriveTitle(a.message, a.appointmentId)}
                    </h2>
                    <StatusBadge status={a.status} />
                  </div>

                  {/* Customer row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                    <FiUser size={14} />
                    <span>{a.userName} (Customer ID: #{a.userId ? 8000 + a.userId : a.appointmentId + 8800})</span>
                  </div>

                  {/* Date & Meeting type boxes */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem' }}>
                    <div style={infoBoxStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiCalendar size={16} color="#6b7280" />
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500 }}>Date &amp; Time</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827', marginTop: 4 }}>
                        {formatApptDate(a.date)}
                      </div>
                    </div>
                    <div style={infoBoxStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiMapPin size={16} color="#6b7280" />
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500 }}>Meeting Type</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827', marginTop: 4 }}>
                        In-person
                      </div>
                    </div>
                  </div>

                  {/* Message box */}
                  <div style={{
                    background: '#f9fafb', borderLeft: '3px solid #e5e7eb',
                    borderRadius: '0 6px 6px 0', padding: '0.65rem 0.875rem',
                  }}>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500, marginBottom: 4 }}>Message</div>
                    <p style={{ fontStyle: 'italic', color: '#374151', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                      &ldquo;{a.message}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Right: action buttons */}
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '0.6rem',
                  padding: '1.25rem 1.25rem 1.25rem 0',
                  justifyContent: 'center', flexShrink: 0, minWidth: 150,
                }}>
                  <ActionBtn
                    color="#22c55e"
                    disabled={isTerminal || isUpdating || a.status === 'CONFIRMED'}
                    onClick={() => handleStatusChange(a.appointmentId, 'CONFIRMED')}
                  >
                    APPROVED
                  </ActionBtn>
                  <ActionBtn
                    color="#f59e0b"
                    disabled={isTerminal || isUpdating}
                    onClick={() => handleStatusChange(a.appointmentId, 'PENDING')}
                  >
                    RESCHEDULED
                  </ActionBtn>
                  <ActionBtn
                    color="#ef4444"
                    disabled={isTerminal || isUpdating || a.status === 'CANCELLED'}
                    onClick={() => handleStatusChange(a.appointmentId, 'CANCELLED')}
                  >
                    CANCELLED
                  </ActionBtn>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: '2rem' }}>
          <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
            <FiChevronLeft size={15} />
          </PagBtn>
          {pageNums.map((n) => (
            <PagBtn key={n} active={n === safePage} onClick={() => setPage(n)}>{n}</PagBtn>
          ))}
          <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
            <FiChevronRight size={15} />
          </PagBtn>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: '4rem', borderTop: '1px solid #e5e7eb',
        padding: '1.5rem 2.5rem',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem', marginBottom: 4 }}>GMC Lanka</div>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 4, maxWidth: 220 }}>
            Industrial Modernism in Engineering Services and Solutions.
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            &copy; 2024 Industrial Modernism Corp. All rights reserved.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {['Privacy Policy', 'Terms of Service', 'System Status', 'Technical Support'].map((t) => (
            <a key={t} href="#" style={{ fontSize: '0.8rem', color: '#9ca3af', textDecoration: 'none' }}>{t}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}

function ActionBtn({ children, color, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#f3f4f6' : color,
        color: disabled ? '#d1d5db' : '#fff',
        border: 'none', borderRadius: 8,
        padding: '0.55rem 0.75rem',
        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: '100%', transition: 'opacity 0.15s',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36, height: 36, borderRadius: 8,
        border: active ? 'none' : '1px solid #e5e7eb',
        background: active ? '#0f766e' : '#fff',
        color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
        fontWeight: active ? 700 : 500, fontSize: '0.875rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

const filterLabelStyle = {
  fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af',
  letterSpacing: '0.07em', marginBottom: 4,
};

const selectStyle = {
  appearance: 'none', WebkitAppearance: 'none',
  padding: '0.5rem 2rem 0.5rem 0.8rem',
  border: '1px solid #e5e7eb', borderRadius: 8,
  background: '#fff', fontSize: '0.875rem', color: '#374151',
  cursor: 'pointer', outline: 'none', fontWeight: 500,
  height: 38,
};

const chevronStyle = {
  position: 'absolute', right: 9, top: '50%',
  transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280',
};

const infoBoxStyle = {
  background: '#f9fafb', border: '1px solid #f3f4f6',
  borderRadius: 8, padding: '0.6rem 0.875rem', flex: 1,
};
