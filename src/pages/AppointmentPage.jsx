import { useState, useEffect, useMemo } from 'react';
import {
  FiCalendar, FiArrowRight, FiChevronDown,
  FiMail, FiPhone, FiMapPin, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import {
  bookAppointment, getMyAppointments, cancelAppointment, rescheduleAppointment,
} from '../api/appointments';
import { getCategories } from '../api/products';
import { getErrorMessage } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const PAGE_SIZE = 3;

/* Why-book items */
const WHY_ITEMS = [
  {
    emoji: '📋',
    title: 'Order Consultation',
    desc: 'Expert guidance on custom machinery specifications and procurement.',
  },
  {
    emoji: '🔧',
    title: 'Technical Support',
    desc: 'In-depth troubleshooting and maintenance strategies for your fleet.',
  },
  {
    emoji: '📊',
    title: 'Facility Tour',
    desc: 'A guided walkthrough of our precision manufacturing and quality control units.',
  },
];

/* CNC machine image */
const CNC_IMAGE = 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=500&q=80';

function statusInfo(status) {
  const map = {
    PENDING:   { label: 'REQUESTED', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    CONFIRMED: { label: 'CONFIRMED', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    CANCELLED: { label: 'CANCELLED', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    COMPLETED: { label: 'COMPLETED', bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  };
  return map[status] || { label: status, bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
}

function formatApptCard(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const date = d.toISOString().slice(0, 10);
  const hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = ((hours % 12) || 12);
  return `${date} at ${h12}:${mins} ${ampm}`;
}

function parseTitle(message) {
  if (!message) return 'Appointment';
  const lines = message.split('\n');
  const first = lines[0].trim();
  return first.length > 4 ? (first.length > 50 ? first.slice(0, 50) + '…' : first) : 'Appointment';
}

function parseDesc(message) {
  if (!message) return '';
  const lines = message.split('\n');
  if (lines.length < 2) return message.length > 60 ? message.slice(0, 60) + '…' : message;
  return lines.slice(1).join(' ').trim().slice(0, 70) || lines[0].slice(0, 60);
}

export default function AppointmentPage() {
  const [appointments, setAppointments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);
  const [page, setPage] = useState(1);

  /* Form state */
  const [form, setForm] = useState({ categoryId: '', date: '', subject: '', message: '' });

  /* Reschedule inline state */
  const [rescheduleId, setRescheduleId] = useState(null);
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    Promise.all([getMyAppointments(), getCategories()])
      .then(([a, c]) => { setAppointments(a.data); setCategories(c.data); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const combinedMessage = form.subject
      ? `${form.subject}\n${form.message}`
      : form.message;
    try {
      await bookAppointment({ date: form.date, message: combinedMessage });
      toast.success('Appointment booked!');
      setForm({ categoryId: '', date: '', subject: '', message: '' });
      const { data } = await getMyAppointments();
      setAppointments(data);
      setPage(1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await cancelAppointment(id);
      toast.success('Appointment cancelled');
      const { data } = await getMyAppointments();
      setAppointments(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleReschedule = async () => {
    if (!newDate) return;
    try {
      await rescheduleAppointment(rescheduleId, { newDate });
      toast.success('Appointment rescheduled');
      setRescheduleId(null); setNewDate('');
      const { data } = await getMyAppointments();
      setAppointments(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const sorted = useMemo(() =>
    [...appointments].sort((a, b) =>
      sortNewest
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    ), [appointments, sortNewest]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, maxWidth: 1060, margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>

        {/* ── Booking card ── */}
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
          display: 'grid', gridTemplateColumns: '1fr 1.1fr',
          overflow: 'hidden', marginBottom: '2.5rem',
        }}>
          {/* Left panel */}
          <div style={{ padding: '2rem', borderRight: '1px solid #e5e7eb' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f3460', marginBottom: '0.4rem' }}>
              Book a Visit
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Schedule a consultation with our technical experts.
            </p>

            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.09em', marginBottom: '0.875rem' }}>
              WHY BOOK AN APPOINTMENT?
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
              {WHY_ITEMS.map((item) => (
                <div key={item.title} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: '#0f3460', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', flexShrink: 0,
                  }}>
                    {item.emoji}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CNC image */}
            <div style={{ borderRadius: 10, overflow: 'hidden' }}>
              <img
                src={CNC_IMAGE}
                alt="CNC Machine"
                style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>

          {/* Right panel — form */}
          <form onSubmit={handleBook} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Related Product */}
            <div>
              <div style={fLabelStyle}>RELATED PRODUCT</div>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  style={fInputStyle}
                >
                  <option value="">Select a product line</option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                  ))}
                </select>
                <FiChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <div style={fLabelStyle}>PREFERRED DATE &amp; TIME</div>
              <input
                type="datetime-local"
                min={minDate}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                style={fInputStyle}
              />
            </div>

            {/* Subject */}
            <div>
              <div style={fLabelStyle}>SUBJECT</div>
              <input
                type="text"
                placeholder="Briefly describe the purpose"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                style={fInputStyle}
              />
            </div>

            {/* Message */}
            <div>
              <div style={fLabelStyle}>MESSAGE</div>
              <textarea
                placeholder="Additional details or specific questions for our engineers"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                rows={5}
                style={{ ...fInputStyle, resize: 'vertical', minHeight: 120 }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? '#2d6a8a' : '#0f3460',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '0.9rem', fontSize: '0.88rem', fontWeight: 700,
                letterSpacing: '0.05em', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {submitting ? 'BOOKING...' : <><span>CONFIRM BOOKING</span><FiArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        {/* ── My Appointments ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#111827' }}>My Appointments</h2>
          <button
            onClick={() => { setSortNewest((s) => !s); setPage(1); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.83rem', color: '#374151',
            }}
          >
            <span style={{ color: '#9ca3af', fontWeight: 500 }}>SORT BY:</span>
            <span style={{ fontWeight: 700 }}>{sortNewest ? 'Newest First' : 'Oldest First'}</span>
            <FiChevronDown size={14} />
          </button>
        </div>

        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
            <FiCalendar size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
            <p>No appointments yet. Book your first one above.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
              {paginated.map((apt) => {
                const si = statusInfo(apt.status);
                const ref = `GMC-${4800 + apt.appointmentId}`;
                const title = parseTitle(apt.message);
                const desc = parseDesc(apt.message);
                const canAct = apt.status === 'PENDING' || apt.status === 'CONFIRMED';

                return (
                  <div key={apt.appointmentId} style={{
                    background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
                    padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  }}>
                    {/* Top row: badge + ref */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        background: si.bg, color: si.color, border: `1px solid ${si.border}`,
                        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em',
                        padding: '2px 8px', borderRadius: 4,
                      }}>{si.label}</span>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Ref: {ref}</span>
                    </div>

                    {/* Title */}
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{title}</div>

                    {/* Description */}
                    {desc && <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4 }}>{desc}</div>}

                    {/* Date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#374151', marginTop: 'auto' }}>
                      <FiCalendar size={13} color="#0f766e" />
                      <span>{formatApptCard(apt.date)}</span>
                    </div>

                    {/* Actions */}
                    {canAct && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {rescheduleId === apt.appointmentId ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                            <input
                              type="datetime-local"
                              min={minDate}
                              value={newDate}
                              onChange={(e) => setNewDate(e.target.value)}
                              style={{ ...fInputStyle, fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
                            />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={handleReschedule} disabled={!newDate} style={smallBtnPrimary}>Confirm</button>
                              <button onClick={() => { setRescheduleId(null); setNewDate(''); }} style={smallBtnGhost}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => { setRescheduleId(apt.appointmentId); setNewDate(''); }} style={smallBtnGhost}>Reschedule</button>
                            <button onClick={() => handleCancel(apt.appointmentId)} style={smallBtnDanger}>Cancel</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                  <FiChevronLeft size={15} />
                </PagBtn>
                {pageNums.map((n) => (
                  <PagBtn key={n} active={n === safePage} onClick={() => setPage(n)}>{n}</PagBtn>
                ))}
                {totalPages > 4 && safePage < totalPages - 1 && <span style={{ color: '#9ca3af' }}>…</span>}
                <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                  <FiChevronRight size={15} />
                </PagBtn>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '3rem 1.5rem 1.5rem', marginTop: '3rem' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <div style={footerHeading}>QUICK LINKS</div>
              {['About Us', 'Our Services', 'CNC Machines', 'Wood Portfolio'].map((t) => (
                <div key={t} style={{ marginBottom: '0.5rem' }}><a href="#" style={footerLink}>{t}</a></div>
              ))}
            </div>
            <div>
              <div style={footerHeading}>CONTACT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiMail size={14} color="#6b7280" /><span style={footerLink}>contact@cnclanka.com</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiPhone size={14} color="#6b7280" /><span style={footerLink}>+94 11 234 5678</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <FiMapPin size={14} color="#6b7280" style={{ marginTop: 2 }} />
                  <span style={footerLink}>123 Industrial Zone,<br />Colombo, Sri Lanka</span>
                </div>
              </div>
            </div>
            <div>
              <div style={footerHeading}>LEGAL</div>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((t) => (
                <div key={t} style={{ marginBottom: '0.5rem' }}><a href="#" style={footerLink}>{t}</a></div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem', fontSize: '0.8rem', color: '#9ca3af' }}>
            &copy; 2024 CNC Lanka. Engineered for Excellence.
          </div>
        </div>
      </footer>
    </div>
  );
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 36, height: 36, borderRadius: 8,
      border: active ? 'none' : '1px solid #e5e7eb',
      background: active ? '#0f3460' : '#fff',
      color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
      fontWeight: active ? 700 : 500, fontSize: '0.875rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  );
}

const fLabelStyle = {
  fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af',
  letterSpacing: '0.09em', marginBottom: 6,
};

const fInputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: '1px solid #e5e7eb', borderRadius: 8,
  padding: '0.65rem 0.875rem', fontSize: '0.875rem',
  color: '#111827', background: '#fff', outline: 'none',
  appearance: 'none', WebkitAppearance: 'none',
};

const smallBtnPrimary = {
  flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', fontWeight: 600,
  background: '#0f3460', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer',
};
const smallBtnGhost = {
  flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', fontWeight: 600,
  background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer',
};
const smallBtnDanger = {
  flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', fontWeight: 600,
  background: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer',
};

const footerHeading = {
  fontSize: '0.72rem', fontWeight: 700, color: '#111827',
  letterSpacing: '0.08em', marginBottom: '0.875rem',
};
const footerLink = { fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none', lineHeight: 1.5 };
