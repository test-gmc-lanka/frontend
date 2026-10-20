import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiBox, FiPenTool, FiTool, FiCalendar, FiMail } from 'react-icons/fi';
import { getProducts } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { formatLKR } from '../utils/formatters';
import SectionHeading from '../components/common/SectionHeading';
import { cardStyle, iconBoxStyle, stepNumberStyle } from '../utils/contentStyles';
import heroImage from '../assets/hero-collage.webp';

const OFFERS = [
  {
    icon: FiBox,
    title: 'Ready-made products',
    text: 'Furniture, décor and machined parts made in our workshop. Order online and pay by card or cash on delivery.',
    to: '/products',
    cta: 'Browse products',
  },
  {
    icon: FiPenTool,
    title: 'Custom design & consultation',
    text: 'Bring us a sketch, a photo or just an idea. Book a consultation and we’ll plan the piece with you.',
    to: '/appointments',
    cta: 'Book a consultation',
    needsLogin: true,
  },
  {
    icon: FiTool,
    title: 'Maintenance & support',
    text: 'Something not right with your order? Raise it from your order page and our technicians will follow up.',
    to: '/orders',
    cta: 'View my orders',
    needsLogin: true,
  },
];

const STEPS = [
  { title: 'Choose', text: 'Pick a product, or book a consultation for a custom piece.' },
  { title: 'Order', text: 'Check out with your delivery details and pay by card or cash on delivery.' },
  { title: 'We make & pack', text: 'Track every status change from your orders page and by email.' },
  { title: 'Delivered', text: 'Receive your order, then leave a review to help other customers.' },
];

export default function HomePage({ onLoginClick }) {
  const { user, isAdmin, isTechnician } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    getProducts()
      .then((r) => {
        const list = (r.data || []).filter((p) => p.active !== false && p.stockQuantity > 0 && Number(p.price) > 0);
        setFeatured(list.slice(0, 4));
      })
      .catch(() => setFeatured([]));
  }, []);

  // Customer-only pages ask guests to log in first
  const go = (to, needsLogin) => {
    if (needsLogin && !user) {
      onLoginClick();
      return;
    }
    navigate(to);
  };
  const isStaff = isAdmin || isTechnician;

  return (
    <div style={{ background: '#fff', color: '#1f2328' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="wood-band">
        <div
          className="page-wrap hero-grid"
          style={{ paddingTop: 'clamp(2.5rem, 7vw, 4.5rem)', paddingBottom: 'clamp(3rem, 7vw, 4.5rem)' }}
        >
          <div>
            <div className="eyebrow-label" style={{ color: 'var(--wood-200)', marginBottom: '1rem' }}>
              CNC machining · Woodwork · Sri Lanka
            </div>
            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                lineHeight: 1.1,
                fontWeight: 800,
                maxWidth: 720,
                color: '#fff8ef',
                marginBottom: '1.1rem',
              }}
            >
              Wood shaped with care, metal cut with precision.
            </h1>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 580, color: '#ead8c0', marginBottom: '2rem' }}>
              GMC Lanka makes furniture, décor and machined parts on our own CNC machines and finishes them by hand.
              Shop ready-made pieces or work with us on something custom.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/products" className="btn-steel">
                Shop products <FiArrowRight />
              </Link>
              {!isStaff && (
                <button
                  type="button"
                  className="btn-outline-light"
                  style={{ cursor: 'pointer' }}
                  onClick={() => go('/appointments', true)}
                >
                  <FiCalendar /> Book a consultation
                </button>
              )}
            </div>
          </div>
          <img
            src={heroImage}
            alt="Engraved wooden gifts made by GMC Lanka: a clock, coasters, a music box, a desk organiser and keepsakes"
            className="hero-image"
            width={1339}
            height={844}
          />
        </div>
      </section>

      {/* ── What we offer ───────────────────────────────────────────── */}
      <section className="page-wrap" style={{ paddingTop: '4rem', paddingBottom: '3.5rem' }}>
        <SectionHeading eyebrow="What we offer" title="From the catalogue or made to order" />
        <div className="feature-grid">
          {OFFERS.map(({ icon: Icon, title, text, to, cta, needsLogin }) => (
            <div key={title} style={cardStyle}>
              <div style={iconBoxStyle}>
                <Icon size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>{title}</h3>
              <p style={{ color: '#5b6168', fontSize: '0.92rem', lineHeight: 1.65, flex: 1 }}>{text}</p>
              {!(isStaff && needsLogin) && (
                <button type="button" onClick={() => go(to, needsLogin)} style={linkButtonStyle}>
                  {cta} <FiArrowRight size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured products (only shown when there are some) ──────── */}
      {featured.length > 0 && (
        <section
          style={{ background: 'var(--wood-50)', borderTop: '1px solid #eadfce', borderBottom: '1px solid #eadfce' }}
        >
          <div className="page-wrap" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '1rem',
                flexWrap: 'wrap',
                marginBottom: '1.75rem',
              }}
            >
              <SectionHeading eyebrow="In stock now" title="Featured products" noMargin />
              <Link to="/products" className="btn-outline-wood">
                See all products <FiArrowRight />
              </Link>
            </div>
            <div className="grid-products">
              {featured.map((p) => (
                <Link key={p.productId} to={`/products/${p.productId}`} style={productCardStyle}>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 190,
                        background: '#efe6da',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.75rem',
                      }}
                    >
                      🪵
                    </div>
                  )}
                  <div style={{ padding: '0.9rem' }}>
                    {p.category?.name && (
                      <div
                        className="eyebrow-label"
                        style={{ color: 'var(--wood-400)', fontSize: '0.65rem', marginBottom: '0.3rem' }}
                      >
                        {p.category.name}
                      </div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                      {p.name}
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--wood-700)' }}>{formatLKR(p.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How ordering works ──────────────────────────────────────── */}
      <section className="page-wrap" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <SectionHeading eyebrow="How it works" title="Ordering in four steps" />
        <ol className="steps-grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {STEPS.map((s, i) => (
            <li key={s.title} style={{ ...cardStyle, padding: '1.25rem' }}>
              <div style={stepNumberStyle}>{i + 1}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.85rem 0 0.4rem' }}>{s.title}</h3>
              <p style={{ color: '#5b6168', fontSize: '0.88rem', lineHeight: 1.6 }}>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Call to action ──────────────────────────────────────────── */}
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
              Have a custom piece in mind?
            </h2>
            <p style={{ color: 'var(--steel-600)', lineHeight: 1.65 }}>
              Tell us what you need. We&apos;ll talk through materials, sizes and price before anything is made.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {!isStaff && (
              <button type="button" className="btn-wood" onClick={() => go('/appointments', true)}>
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

const linkButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginTop: '1.1rem',
  alignSelf: 'flex-start',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: 'var(--wood-600)',
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: '0.9rem',
};

const productCardStyle = {
  display: 'block',
  color: 'inherit',
  textDecoration: 'none',
  background: '#fff',
  border: '1px solid #e7e1d8',
  borderRadius: 10,
  overflow: 'hidden',
};
