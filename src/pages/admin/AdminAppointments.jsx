import { useState, useEffect, useMemo } from 'react';
import { FiCalendar, FiMapPin, FiUser, FiSearch, FiChevronDown, FiVideo } from 'react-icons/fi';
import { adminGetAppointments, adminUpdateAppointmentStatus, adminRescheduleAppointment } from '../../api/appointments';
import { getErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ImageThumbs from '../../components/common/ImageThumbs';
import Pagination, { clampPage } from '../../components/common/Pagination';
import toast from 'react-hot-toast';

const PAGE_SIZES = [3, 5, 10];

/* Must match the backend AppointmentStatus enum */
const APT_STATUSES = ['PENDING', 'APPROVED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED'];

function statusLabel(status) {
  const map = { PENDING: 'REQUESTED', APPROVED: 'APPROVED', RESCHEDULED: 'RESCHEDULED', CANCELLED: 'CANCELLED', COMPLETED: 'COMPLETED' };
  return map[status] || status;
}

/* Confirmation text for each admin action */
const ACTIONS = {
  APPROVED:   { title: 'Approve appointment?', verb: 'approve', confirmLabel: 'Approve', tone: 'primary' },
  RESCHEDULE: { title: 'Reschedule appointment', verb: 'reschedule', confirmLabel: 'Reschedule', tone: 'warning' },
  CANCELLED:  { title: 'Cancel appointment?', verb: 'cancel', confirmLabel: 'Cancel Appointment', tone: 'danger' },
  COMPLETED:  { title: 'Mark as completed?', verb: 'mark as completed', confirmLabel: 'Mark Completed', tone: 'primary' },
};

const NOTE_PLACEHOLDERS = {
  APPROVED: 'e.g. Please join 5 minutes early and keep your drawings ready.',
  RESCHEDULE: 'e.g. Our technician is unavailable at the original time.',
  CANCELLED: 'e.g. Sorry, we are unable to take this request right now.',
  COMPLETED: 'e.g. Thanks for meeting with us! We will send the quotation soon.',
};

/* Mirrors the backend rule: only full http(s) links are accepted */
function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname;
  } catch {
    return false;
  }
}

/* "YYYY-MM-DDTHH:MM" in local time, the format <input type="datetime-local"> uses */
function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function StatusBadge({ status }) {
  const styles = {
    PENDING:     { bg: '#1e3a5c', color: '#fff' },
    APPROVED:    { bg: '#0f766e', color: '#fff' },
    RESCHEDULED: { bg: '#f59e0b', color: '#fff' },
    CANCELLED:   { bg: '#ef4444', color: '#fff' },
    COMPLETED:   { bg: '#6b7280', color: '#fff' },
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
  return toLocalInputValue(new Date(dateStr)).replace('T', '  ');
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
  const [pendingAction, setPendingAction] = useState(null); // { appointment, action } awaiting confirmation
  const [newDate, setNewDate] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [note, setNote] = useState('');

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

  const requestAction = (appointment, action) => {
    setNewDate(action === 'RESCHEDULE' && appointment.date ? toLocalInputValue(new Date(appointment.date)) : '');
    setMeetingLink(action === 'APPROVED' ? (appointment.meetingLink || '') : '');
    setNote('');
    setPendingAction({ appointment, action });
  };

  const handleConfirmAction = async () => {
    const { appointment, action } = pendingAction;
    const id = appointment.appointmentId;
    setUpdatingId(id);
    try {
      const trimmedNote = note.trim() || null;
      const { data } = action === 'RESCHEDULE'
        ? await adminRescheduleAppointment(id, newDate, trimmedNote)
        : await adminUpdateAppointmentStatus(id, action, {
          note: trimmedNote,
          meetingLink: action === 'APPROVED' ? (meetingLink.trim() || null) : undefined,
        });
      setAppointments((prev) => prev.map((a) => (a.appointmentId === id ? data : a)));
      toast.success('Appointment updated!');
      setPendingAction(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const minDate = toLocalInputValue(new Date());
  const newDateInvalid = !newDate || newDate <= minDate;
  const meetingLinkInvalid = meetingLink.trim() !== '' && !isHttpUrl(meetingLink.trim());

  const safePage = clampPage(page, appointments.length, pageSize);
  const paginated = useMemo(
    () => appointments.slice((safePage - 1) * pageSize, safePage * pageSize),
    [appointments, safePage, pageSize]
  );

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
                    <span>{a.userName} · Customer #{a.userId} · Appointment #{a.appointmentId}</span>
                    {a.categoryName && (
                      <span style={{ marginLeft: 8, background: '#e6f4f1', color: '#0f766e', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        {a.categoryName}
                      </span>
                    )}
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
                        {a.meetingLink ? <FiVideo size={16} color="#6b7280" /> : <FiMapPin size={16} color="#6b7280" />}
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500 }}>Meeting Type</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.meetingLink ? (
                          <>Online · <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0f766e' }}>{a.meetingLink}</a></>
                        ) : 'In-person'}
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
                    {a.imageUrls?.length > 0 && (
                      <div style={{ marginTop: '0.6rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500, marginBottom: 4 }}>
                          Customer images ({a.imageUrls.length}) — click to enlarge
                        </div>
                        <ImageThumbs urls={a.imageUrls} size={64} label="Customer image" />
                      </div>
                    )}
                  </div>

                  {a.adminNote && (
                    <div style={{
                      background: '#f0fdfa', borderLeft: '3px solid #0f766e',
                      borderRadius: '0 6px 6px 0', padding: '0.65rem 0.875rem', marginTop: '0.6rem',
                    }}>
                      <div style={{ fontSize: '0.72rem', color: '#0f766e', fontWeight: 600, marginBottom: 4 }}>Your note to the customer</div>
                      <p style={{ color: '#374151', fontSize: '0.875rem', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{a.adminNote}</p>
                    </div>
                  )}
                </div>

                {/* Right: action buttons */}
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '0.6rem',
                  padding: '1.25rem 1.25rem 1.25rem 0',
                  justifyContent: 'center', flexShrink: 0, minWidth: 150,
                }}>
                  {/* Enabled states mirror the backend's allowed transitions */}
                  <ActionBtn
                    color="#22c55e"
                    disabled={isUpdating || !['PENDING', 'RESCHEDULED'].includes(a.status)}
                    onClick={() => requestAction(a, 'APPROVED')}
                  >
                    APPROVE
                  </ActionBtn>
                  <ActionBtn
                    color="#f59e0b"
                    disabled={isTerminal || isUpdating}
                    onClick={() => requestAction(a, 'RESCHEDULE')}
                  >
                    RESCHEDULE
                  </ActionBtn>
                  <ActionBtn
                    color="#0f766e"
                    disabled={isUpdating || a.status !== 'APPROVED'}
                    onClick={() => requestAction(a, 'COMPLETED')}
                  >
                    COMPLETE
                  </ActionBtn>
                  <ActionBtn
                    color="#ef4444"
                    disabled={isTerminal || isUpdating}
                    onClick={() => requestAction(a, 'CANCELLED')}
                  >
                    CANCEL
                  </ActionBtn>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={{ maxWidth: 960, margin: '1.5rem auto 0', padding: '0 2rem' }}>
        <Pagination
          page={safePage}
          totalItems={appointments.length}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="appointments"
          style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}
        />
      </div>

      {pendingAction && (() => {
        const { appointment: a, action } = pendingAction;
        const cfg = ACTIONS[action];
        const isReschedule = action === 'RESCHEDULE';
        return (
          <ConfirmDialog
            title={cfg.title}
            message={
              isReschedule
                ? <>Pick a new date and time for <strong>{a.userName}</strong>&rsquo;s appointment (currently {formatApptDate(a.date)}). The customer will be notified.</>
                : <>Are you sure you want to {cfg.verb} <strong>{a.userName}</strong>&rsquo;s appointment on <strong>{formatApptDate(a.date)}</strong>? The customer will be notified.</>
            }
            confirmLabel={cfg.confirmLabel}
            cancelLabel="Back"
            tone={cfg.tone}
            loading={updatingId === a.appointmentId}
            confirmDisabled={(isReschedule && newDateInvalid) || (action === 'APPROVED' && meetingLinkInvalid)}
            onConfirm={handleConfirmAction}
            onCancel={() => setPendingAction(null)}
          >
            {action === 'APPROVED' && (
              <div style={{ marginBottom: '0.85rem' }}>
                <label htmlFor="meeting-link" style={dialogLabelStyle}>
                  Meeting link <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional — leave empty for in-person)</span>
                </label>
                <input
                  id="meeting-link"
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  style={dialogInputStyle}
                />
                {meetingLinkInvalid ? (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: 4 }}>Enter a full link starting with https://</div>
                ) : (
                  <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: 4 }}>
                    Create a meeting at{' '}
                    <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" style={{ color: '#0f766e' }}>meet.google.com/new</a>
                    {' '}and paste the link here.
                  </div>
                )}
              </div>
            )}
            {isReschedule && (
              <div>
                <label htmlFor="reschedule-date" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  New date &amp; time
                </label>
                <input
                  id="reschedule-date"
                  type="datetime-local"
                  value={newDate}
                  min={minDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{
                    width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #d1d5db',
                    borderRadius: 7, fontSize: '0.875rem', color: '#111827', boxSizing: 'border-box',
                  }}
                />
                {newDate && newDateInvalid && (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: 4 }}>The new time must be in the future.</div>
                )}
              </div>
            )}
            <div style={{ marginTop: isReschedule ? '0.85rem' : 0 }}>
              <label htmlFor="admin-note" style={dialogLabelStyle}>
                Note to customer <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
              </label>
              <textarea
                id="admin-note"
                rows={3}
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={NOTE_PLACEHOLDERS[action]}
                style={{ ...dialogInputStyle, resize: 'vertical' }}
              />
            </div>
          </ConfirmDialog>
        );
      })()}

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

const dialogLabelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5,
};

const dialogInputStyle = {
  width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #d1d5db',
  borderRadius: 7, fontSize: '0.875rem', color: '#111827', boxSizing: 'border-box',
  fontFamily: 'inherit',
};
