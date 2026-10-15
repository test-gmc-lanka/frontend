import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiArrowRight, FiCheckCircle, FiStar } from 'react-icons/fi';
import { getProduct } from '../api/products';
import { addToCart } from '../api/cart';
import { useAuth } from '../context/AuthContext';
import { formatLKR, getErrorMessage } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

/* ── Gallery: cover image first, then the rest in admin order ──────────── */
function buildGallery(product) {
  const images = product.imageUrls?.length ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);
  if (!product.imageUrl || !images.includes(product.imageUrl)) return images;
  return [product.imageUrl, ...images.filter((img) => img !== product.imageUrl)];
}

/* ── Spec generator ─────────────────────────────────────────────────────── */
function buildSpecs(product) {
  const mat = product.material || 'Natural Wood';
  const cat = product.category?.name || '';
  if (cat === 'Furniture') {
    return [
      { param: 'Material', spec: mat },
      { param: 'Finish', spec: 'Smooth Lacquer Coat' },
      { param: 'Weight Capacity', spec: '150 kg' },
      { param: 'Assembly', spec: 'Minimal assembly required' },
    ];
  }
  if (cat === 'CNC Art Panels') {
    return [
      { param: 'Material', spec: mat },
      { param: 'Thickness', spec: '18 mm' },
      { param: 'Cut Precision', spec: '0.1 mm' },
      { param: 'Surface', spec: 'Sanded & Sealed' },
    ];
  }
  return [
    { param: 'Material', spec: mat },
    { param: 'Finish', spec: 'Premium Coat' },
    { param: 'Dimensions', spec: 'Custom on request' },
    { param: 'Stock', spec: `${product.stockQuantity || 0} units available` },
  ];
}

/* ── Feature bullets generator ─────────────────────────────────────────── */
function buildFeatures(product) {
  const cat = product.category?.name || '';
  if (cat === 'Furniture') return ['Solid ' + (product.material || 'wood') + ' construction', 'Premium lacquer finish'];
  if (cat === 'CNC Art Panels') return ['High-precision CNC routing', 'Custom design available'];
  if (cat === 'Home Decor') return ['Handcrafted artisan quality', 'Eco-friendly materials'];
  if (cat === 'Outdoor Products') return ['Weather-resistant treatment', 'Durable hardwood frame'];
  return ['Quality craftsmanship', 'Made to last'];
}

/* ── Mock reviews ───────────────────────────────────────────────────────── */
const MOCK_REVIEWS = [
  { name: 'Kamal P.', rating: 5, text: '"Exceptional quality. The craftsmanship is outstanding and delivery was right on time. Highly recommend GMC Lanka!"' },
  { name: 'Nimal S.', rating: 4, text: '"Solid build quality. Very happy with the purchase. The team was helpful during the entire process."' },
  { name: 'Ayesha R.', rating: 5, text: '"Beautiful product that perfectly matches our home decor. Worth every rupee. Will definitely order again."' },
];

function Stars({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          size={size}
          style={{ color: s <= rating ? '#f59e0b' : '#d1d5db', fill: s <= rating ? '#f59e0b' : 'transparent' }}
        />
      ))}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────────────── */
export default function ProductDetailPage({ onLoginClick }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isTechnician, refreshCart } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const [quantity] = useState(1);

  useEffect(() => {
    setActiveThumb(0);
    getProduct(id)
      .then((r) => setProduct(r.data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) { onLoginClick(); return; }
    if (isAdmin || isTechnician) return;
    setAdding(true);
    try {
      await addToCart({ productId: product.productId, quantity });
      toast.success('Added to cart!');
      refreshCart();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div style={{ background: '#fff', minHeight: '100vh' }}><LoadingSpinner /></div>;
  if (!product) return <div style={{ background: '#fff', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>Product not found.</div>;

  const gallery = buildGallery(product);
  const mainImage = gallery[activeThumb] || gallery[0];
  const specs = buildSpecs(product);
  const features = buildFeatures(product);
  const inStock = (product.stockQuantity || 0) > 0;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: '#111827' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '3rem', alignItems: 'start' }}>

          {/* Left — image + thumbnails */}
          <div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: '0.75rem' }}>
              {mainImage ? (
                <img src={mainImage} alt={product.name}
                  style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ height: 340, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🪵</div>
              )}
            </div>
            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {gallery.map((img, i) => (
                  <div
                    key={img}
                    onClick={() => setActiveThumb(i)}
                    style={{
                      border: activeThumb === i ? '2px solid #1e3a5c' : '1px solid #e5e7eb',
                      borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — details */}
          <div style={{ paddingTop: '1rem' }}>
            {/* In Stock badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: inStock ? '#6b7280' : '#ef4444' }}>
                {inStock ? 'IN STOCK' : 'OUT OF STOCK'}
              </span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', marginBottom: '0.6rem', lineHeight: 1.2 }}>
              {product.name}
            </h1>

            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.875rem' }}>
              {formatLKR(product.price)}
            </div>

            {product.description && (
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                {product.description}
              </p>
            )}

            {/* Feature bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.75rem' }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FiCheckCircle size={15} style={{ color: '#6b7280', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            {!isAdmin && !isTechnician && (
              <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                {inStock ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: adding ? '#2d5a8c' : '#1e3a5c',
                      color: '#fff', border: 'none', borderRadius: 6,
                      padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 600,
                      cursor: adding ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <FiShoppingCart size={16} />
                    {adding ? 'Adding...' : 'Add to Cart'}
                    {!adding && <FiArrowRight size={15} />}
                  </button>
                ) : null}
                <button
                  onClick={() => user ? navigate('/appointments') : onLoginClick()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'transparent', color: '#1e3a5c',
                    border: '1.5px solid #1e3a5c', borderRadius: 6,
                    padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Book a Demo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #e5e7eb' }} />

      {/* ── Description + Specs ───────────────────────────────────────────── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>

          {/* Product Description */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>Product Description</h2>
            <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {product.description || `${product.name} is a premium handcrafted product from GMC Lanka Creations, built with attention to detail and quality materials. Designed to meet both functional and aesthetic requirements.`}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                `Made from premium ${product.material || 'natural wood'}`,
                'Handcrafted by skilled artisans',
                'Quality checked before delivery',
                'Custom sizing available on request',
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
                  <span style={{ marginTop: 2, color: '#9ca3af' }}>○</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Technical Specifications */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>Technical Specifications</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.65rem 1rem', fontWeight: 700, color: '#374151' }}>Parameter</th>
                  <th style={{ textAlign: 'left', padding: '0.65rem 1rem', fontWeight: 700, color: '#374151' }}>Specification</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#374151', fontWeight: 500 }}>{s.param}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{s.spec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #e5e7eb' }} />

      {/* ── Customer Reviews ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem' }}>Customer Reviews</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Stars rating={5} size={16} />
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>4.8 stars (12 reviews)</span>
            </div>
          </div>
          <button
            onClick={() => user ? navigate('/appointments') : onLoginClick()}
            style={{
              background: 'transparent', color: '#1e3a5c',
              border: '1.5px solid #1e3a5c', borderRadius: 6,
              padding: '0.55rem 1.1rem', fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Write a Review
          </button>
        </div>

        {/* Review cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {MOCK_REVIEWS.map((r, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{r.name}</span>
                <Stars rating={r.rating} size={13} />
              </div>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.65, fontStyle: 'italic', margin: 0 }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
