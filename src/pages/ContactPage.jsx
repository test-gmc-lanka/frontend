import { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiMapPin, FiClock, FiExternalLink, FiCheckCircle, FiSend } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { sendContactMessage } from '../api/contact';
import { getErrorMessage } from '../utils/formatters';
import { CONTACT, telHref, mapHref } from '../utils/contact';
import SectionHeading from '../components/common/SectionHeading';
import { cardStyle, iconBoxStyle, mutedText } from '../utils/contentStyles';
const SUBJECTS = [
  'General question',
  'Product enquiry',
  'Custom order',
  'Order or delivery',
  'Maintenance & repairs',
  'Other',
];

const EMPTY = { name: '', email: '', phone: '', subject: SUBJECTS[0], message: '' };

// Same rules as the backend's ContactRequest, so most mistakes are caught before sending
function validate(f) {
  const errors = {};
  if (!f.name.trim()) errors.name = 'Please enter your name.';
  else if (f.name.trim().length > 100) errors.name = 'Name must be 100 characters or fewer.';
  if (!f.email.trim()) errors.email = 'Please enter your email so we can reply.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = 'Please enter a valid email address.';
  if (f.phone.trim() && !/^\+?[0-9 ()-]{9,20}$/.test(f.phone.trim()))
    errors.phone = 'Please enter a valid phone number, or leave it empty.';
  const len = f.message.trim().length;
  if (len < 10) errors.message = 'Please write at least 10 characters.';
  else if (len > 2000) errors.message = 'Message must be 2000 characters or fewer.';
  return errors;
}

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sent, setSent] = useState('');

  // Logged-in users don't need to type their name and email again
  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }));
    }
  }, [user]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSending(true);
    setSendError('');
    try {
      const { data } = await sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      setSent(data?.message || 'Thanks! Your message has been sent.');
      setForm({ ...EMPTY, name: user?.name || '', email: user?.email || '' });
    } catch (err) {
      setSendError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ background: '#fff', color: '#1f2328' }}>
      <section className="wood-band">
        <div className="page-wrap" style={{ padding: 'clamp(2.5rem, 6vw, 4rem) 16px' }}>
          <div className="eyebrow-label" style={{ color: 'var(--wood-200)', marginBottom: '0.9rem' }}>
            Contact us
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.9rem, 4.5vw, 2.75rem)',
              lineHeight: 1.15,
              fontWeight: 800,
              color: '#fff8ef',
              marginBottom: '0.9rem',
            }}
          >
            We&apos;d like to hear from you
          </h1>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#ead8c0', maxWidth: 600 }}>
            Questions about a product, a custom piece or an existing order? Send us a message and we&apos;ll reply by
            email.
          </p>
        </div>
      </section>

      <section
        className="page-wrap layout-split"
        style={{ paddingTop: '3.25rem', paddingBottom: '4rem', alignItems: 'start' }}
      >
        {/* ── Details ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SectionHeading eyebrow="Get in touch" title="Visit, call or write" noMargin />
          <div style={{ ...cardStyle, gap: '1.15rem' }}>
            <DetailRow icon={FiMail} label="Email">
              <a href={`mailto:${CONTACT.email}`} style={linkStyle}>
                {CONTACT.email}
              </a>
            </DetailRow>
            <DetailRow icon={FiPhone} label="Phone">
              <a href={telHref(CONTACT.phone)} style={linkStyle}>
                {CONTACT.phone}
              </a>
            </DetailRow>
            <DetailRow icon={FiMapPin} label="Workshop">
              {CONTACT.addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
              <a
                href={mapHref()}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...linkStyle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 6,
                  fontSize: '0.85rem',
                }}
              >
                Open in Google Maps <FiExternalLink size={13} />
              </a>
            </DetailRow>
            <DetailRow icon={FiClock} label="Opening hours">
              <table style={{ borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <tbody>
                  {CONTACT.hours.map((h) => (
                    <tr key={h.days}>
                      <td style={{ padding: '0.15rem 1rem 0.15rem 0', color: '#5b6168' }}>{h.days}</td>
                      <td style={{ padding: '0.15rem 0', fontWeight: 600 }}>{h.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DetailRow>
          </div>
          <p style={{ ...mutedText, fontSize: '0.88rem' }}>
            Already ordered? You can also follow up from <strong>My Orders</strong>, which keeps everything about your
            order in one place.
          </p>
        </div>

        {/* ── Form ────────────────────────────────────────────────── */}
        <div style={{ ...cardStyle, padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
          {sent ? (
            <div role="status" style={{ textAlign: 'center', padding: '2rem 0.5rem' }}>
              <FiCheckCircle size={44} style={{ color: '#15935a', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>Message sent</h2>
              <p style={{ ...mutedText, marginBottom: '1.5rem' }}>{sent}</p>
              <button
                type="button"
                className="btn-outline-wood"
                style={{ cursor: 'pointer' }}
                onClick={() => setSent('')}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Send us a message</h2>

              <div className="form-row-2">
                <Field id="contact-name" label="Your name" error={errors.name}>
                  <input
                    id="contact-name"
                    className="form-input"
                    value={form.name}
                    onChange={set('name')}
                    autoComplete="name"
                    maxLength={100}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  />
                </Field>
                <Field id="contact-email" label="Email" error={errors.email}>
                  <input
                    id="contact-email"
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="email"
                    maxLength={150}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  />
                </Field>
              </div>

              <div className="form-row-2">
                <Field id="contact-phone" label="Phone (optional)" error={errors.phone}>
                  <input
                    id="contact-phone"
                    type="tel"
                    className="form-input"
                    value={form.phone}
                    onChange={set('phone')}
                    autoComplete="tel"
                    placeholder="07X XXX XXXX"
                    maxLength={20}
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
                  />
                </Field>
                <Field id="contact-subject" label="Subject">
                  <select id="contact-subject" className="form-input" value={form.subject} onChange={set('subject')}>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field
                id="contact-message"
                label="Message"
                error={errors.message}
                hint={`${form.message.trim().length}/2000`}
              >
                <textarea
                  id="contact-message"
                  className="form-input"
                  rows={6}
                  value={form.message}
                  onChange={set('message')}
                  maxLength={2000}
                  placeholder="Tell us what you need. For custom work, sizes and materials help us reply faster."
                  style={{ resize: 'vertical' }}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                />
              </Field>

              {sendError && (
                <div
                  role="alert"
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    borderRadius: 8,
                    padding: '0.7rem 0.9rem',
                    fontSize: '0.88rem',
                  }}
                >
                  {sendError}
                </div>
              )}

              <button type="submit" className="btn-wood" disabled={sending} style={{ alignSelf: 'flex-start' }}>
                <FiSend /> {sending ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div style={{ display: 'flex', gap: '0.9rem' }}>
      <div style={{ ...iconBoxStyle, width: 40, height: 40 }}>
        <Icon size={18} />
      </div>
      <div style={{ fontSize: '0.95rem', lineHeight: 1.55 }}>
        <div
          className="eyebrow-label"
          style={{ color: 'var(--wood-400)', fontSize: '0.66rem', marginBottom: '0.2rem' }}
        >
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ id, label, error, hint, children }) {
  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
        {hint && <span className="form-hint">{hint}</span>}
      </div>
      {children}
      {error && (
        <span id={`${id}-error`} className="form-error">
          {error}
        </span>
      )}
    </div>
  );
}

const linkStyle = { color: 'var(--wood-600)', fontWeight: 600, textDecoration: 'none' };
