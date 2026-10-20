import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiCreditCard, FiBell, FiStar, FiTool, FiMail } from 'react-icons/fi';
import { getProducts, getCategories } from '../api/products';
import { useAuth } from '../context/AuthContext';
import SectionHeading from '../components/common/SectionHeading';
import { cardStyle, iconBoxStyle, stepNumberStyle, mutedText } from '../utils/contentStyles';

const PROCESS = [
  {
    title: 'Talk it through',
    text: 'Book a consultation online. We agree on the design, materials, size and price with you.',
  },
  {
    title: 'Design & cut',
    text: 'The design is prepared for our CNC machines, which cut wood and metal parts accurately.',
  },
  { title: 'Finish by hand', text: 'Every piece is assembled, sanded and finished by hand in our workshop.' },
  {
    title: 'Deliver & support',
    text: 'We deliver to your address and stay available if anything needs attention later.',
  },
];

const PROMISES = [
  {
    icon: FiCreditCard,
    title: 'Clear prices, secure payment',
    text: 'Prices are shown in LKR. Pay securely by card through Stripe, or choose cash on delivery.',
  },
  {
    icon: FiBell,
    title: 'Updates at every step',
    text: 'You get a notification and an email whenever your order or appointment changes.',
  },
  {
    icon: FiCalendar,
    title: 'Consultations that suit you',
    text: 'Pick a time for your consultation, share reference images, and join online if that’s easier.',
  },
  {
    icon: FiTool,
    title: 'Help after delivery',
    text: 'If something isn’t right, raise it from your order and a technician is assigned to follow up.',
  },
  {
    icon: FiStar,
    title: 'Honest reviews',
    text: 'Only customers who received a product can review it, so the ratings you see are real.',
  },
];

export default function AboutPage({ onLoginClick }) {
  const { user, isAdmin, isTechnician } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const isStaff = isAdmin || isTechnician;

  // Show the real product ranges, with how many items are in each
  useEffect(() => {
    Promise.all([getCategories(), getProducts()])
      .then(([cRes, pRes]) => {
        const products = (pRes.data || []).filter((p) => p.active !== false);
        const withCounts = (cRes.data || []).map((c) => ({
          ...c,
          count: products.filter((p) => p.category?.categoryId === c.categoryId).length,
        }));
        setCategories(withCounts.filter((c) => c.count > 0));
      })
      .catch(() => setCategories([]));
  }, []);

  const bookConsultation = () => (user ? navigate('/appointments') : onLoginClick());

  return (
    <div style={{ background: '#fff', color: '#1f2328' }}>
      {/* ── Intro ─────────────────────────────────────────────────── */}
      <section className="wood-band">
        <div className="page-wrap" style={{ padding: 'clamp(2.75rem, 7vw, 4.5rem) 16px' }}>
          <div className="eyebrow-label" style={{ color: 'var(--wood-200)', marginBottom: '0.9rem' }}>
            About GMC Lanka
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.9rem, 4.5vw, 2.9rem)',
              lineHeight: 1.15,
              fontWeight: 800,
              color: '#fff8ef',
              maxWidth: 700,
              marginBottom: '1rem',
            }}
          >
            Where CNC precision meets traditional woodwork
          </h1>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#ead8c0', maxWidth: 620 }}>
            We&apos;re a Sri Lankan workshop that designs and makes furniture, décor and machined parts. Our CNC
            machines give every piece accurate, repeatable cuts; our craftspeople give it the finish.
          </p>
        </div>
      </section>

      {/* ── Who we are ────────────────────────────────────────────── */}
      <section
        className="page-wrap layout-two-col"
        style={{ paddingTop: '3.75rem', paddingBottom: '3.25rem', gap: '2.5rem', alignItems: 'start' }}
      >
        <div>
          <SectionHeading eyebrow="Who we are" title="Two crafts, one workshop" />
          <p style={{ ...mutedText, marginBottom: '1rem' }}>
            GMC Lanka brings metal machining and woodworking together. The same CNC equipment that cuts precise metal
            parts also carves and shapes timber, which lets us make pieces that would be slow or costly to make by hand
            alone.
          </p>
          <p style={mutedText}>
            You can buy ready-made products from our catalogue, or work with us on something made to your own design,
            from a single part to a full set of furniture.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <MaterialCard
            variant="wood"
            title="Wood"
            text="Furniture, décor and joinery, shaped by CNC and finished by hand."
          />
          <MaterialCard
            variant="steel"
            title="Metal"
            text="Machined parts and fittings cut to the measurements you need."
          />
        </div>
      </section>

      {/* ── What we make (real categories) ─────────────────────────── */}
      {categories.length > 0 && (
        <section
          style={{ background: 'var(--wood-50)', borderTop: '1px solid #eadfce', borderBottom: '1px solid #eadfce' }}
        >
          <div className="page-wrap" style={{ paddingTop: '3.25rem', paddingBottom: '3.25rem' }}>
            <SectionHeading eyebrow="What we make" title="Our product ranges" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {categories.map((c) => (
                <Link
                  key={c.categoryId}
                  to="/products"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    textDecoration: 'none',
                    background: '#fff',
                    border: '1px solid #e2d3bd',
                    borderRadius: 999,
                    padding: '0.55rem 0.6rem 0.55rem 1.1rem',
                    color: 'var(--wood-900)',
                    fontWeight: 600,
                  }}
                >
                  {c.name}
                  <span
                    style={{
                      background: 'var(--wood-700)',
                      color: '#f6ead9',
                      borderRadius: 999,
                      padding: '0.1rem 0.6rem',
                      fontSize: '0.78rem',
                    }}
                  >
                    {c.count} item{c.count === 1 ? '' : 's'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How we work ────────────────────────────────────────────── */}
      <section className="page-wrap" style={{ paddingTop: '3.75rem', paddingBottom: '3.25rem' }}>
        <SectionHeading eyebrow="How we work" title="From idea to your door" />
        <ol className="steps-grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {PROCESS.map((s, i) => (
            <li key={s.title} style={{ ...cardStyle, padding: '1.25rem' }}>
              <div style={stepNumberStyle}>{i + 1}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.85rem 0 0.4rem' }}>{s.title}</h3>
              <p style={{ ...mutedText, fontSize: '0.88rem' }}>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── What you can expect ───────────────────────────────────── */}
      <section className="page-wrap" style={{ paddingBottom: '4rem' }}>
        <SectionHeading eyebrow="Shopping with us" title="What you can expect" />
        <div className="feature-grid">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <div key={title} style={{ ...cardStyle, flexDirection: 'row', gap: '1rem', padding: '1.25rem' }}>
              <div style={iconBoxStyle}>
                <Icon size={19} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.3rem' }}>{title}</h3>
                <p style={{ ...mutedText, fontSize: '0.88rem' }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Call to action ───────────────────────────────────────── */}
      <section className="steel-band">
        <div
          className="page-wrap"
          style={{
            paddingTop: '3rem',
            paddingBottom: '3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--steel-800)' }}>
              Let&apos;s make something together
            </h2>
            <p style={{ color: 'var(--steel-600)', lineHeight: 1.65 }}>
              Browse the catalogue, or tell us about the piece you have in mind.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn-wood">
              Shop products <FiArrowRight />
            </Link>
            {!isStaff && (
              <button
                type="button"
                className="btn-outline-wood"
                style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.55)' }}
                onClick={bookConsultation}
              >
                <FiCalendar /> Book a consultation
              </button>
            )}
            <Link to="/contact" className="btn-outline-wood" style={{ background: 'rgba(255,255,255,0.55)' }}>
              <FiMail /> Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MaterialCard({ variant, title, text }) {
  const wood = variant === 'wood';
  return (
    <div
      className={wood ? 'wood-band' : 'steel-band'}
      style={{
        borderRadius: 12,
        padding: '1.5rem 1.25rem',
        minHeight: 190,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: '1.4rem',
          marginBottom: '0.4rem',
          color: wood ? '#fff8ef' : 'var(--steel-800)',
        }}
      >
        {title}
      </div>
      <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: wood ? '#ead8c0' : 'var(--steel-600)' }}>{text}</p>
    </div>
  );
}
