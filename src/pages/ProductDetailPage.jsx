import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { getProduct, getProductReviews } from '../api/products';
import { Stars } from '../components/common/StarRating';
import { addToCart } from '../api/cart';
import { useAuth } from '../context/AuthContext';
import { formatLKR, getErrorMessage } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

/* ── Gallery: cover image first, then the rest in admin order ──────────── */
function buildGallery(product) {
  const images = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
  if (!product.imageUrl || !images.includes(product.imageUrl)) return images;
  return [product.imageUrl, ...images.filter((img) => img !== product.imageUrl)];
}

/* ── Specifications: only data the admin actually entered ────────────── */
function buildSpecs(product) {
  return [
    product.category?.name && { param: 'Category', spec: product.category.name },
    product.material && { param: 'Material', spec: product.material },
    {
      param: 'Availability',
      spec: (product.stockQuantity || 0) > 0 ? `${product.stockQuantity} in stock` : 'Out of stock',
    },
  ].filter(Boolean);
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

  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    setReviews(null);
    getProductReviews(id)
      .then((r) => setReviews(r.data))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setActiveThumb(0);
    getProduct(id)
      .then((r) => setProduct(r.data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      onLoginClick();
      return;
    }
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

  if (loading)
    return (
      <div style={{ background: '#fff', minHeight: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  if (!product)
    return (
      <div style={{ background: '#fff', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
        Product not found.
      </div>
    );

  const gallery = buildGallery(product);
  const mainImage = gallery[activeThumb] || gallery[0];
  const specs = buildSpecs(product);
  const inStock = (product.stockQuantity || 0) > 0;
  // Price 0 means "price on request" across the site; it must never be bought at LKR 0.00
  const isQuote = Number(product.price) === 0;
  const archived = product.active === false;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: '#111827' }}>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div className="layout-product-hero">
          {/* Left — image + thumbnails */}
          <div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: '0.75rem' }}>
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div
                  style={{
                    height: 340,
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                  }}
                >
                  🪵
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {gallery.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveThumb(i)}
                    aria-label={`View image ${i + 1} of ${gallery.length}`}
                    aria-pressed={activeThumb === i}
                    style={{
                      border: activeThumb === i ? '2px solid var(--brand)' : '1px solid #e5e7eb',
                      borderRadius: 4,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      padding: 0,
                      background: 'none',
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — details */}
          <div style={{ paddingTop: '1rem' }}>
            {/* In Stock badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: inStock && !archived ? '#6b7280' : '#ef4444',
                }}
              >
                {archived ? 'NO LONGER AVAILABLE' : inStock ? 'IN STOCK' : 'OUT OF STOCK'}
              </span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            <h1
              style={{
                fontSize: '1.875rem',
                fontWeight: 800,
                color: '#111827',
                marginBottom: '0.6rem',
                lineHeight: 1.2,
              }}
            >
              {product.name}
            </h1>

            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.875rem' }}>
              {isQuote ? 'Price on request' : formatLKR(product.price)}
            </div>

            {product.description && (
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                {product.description}
              </p>
            )}

            {/* Buttons */}
            {!isAdmin && !isTechnician && !archived && (
              <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                {inStock && !isQuote ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: adding ? 'var(--brand-hover)' : 'var(--brand)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: adding ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <FiShoppingCart size={16} />
                    {adding ? 'Adding...' : 'Add to Cart'}
                    {!adding && <FiArrowRight size={15} />}
                  </button>
                ) : null}
                <button
                  onClick={() => (user ? navigate('/appointments') : onLoginClick())}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: isQuote ? 'var(--brand)' : 'transparent',
                    color: isQuote ? '#fff' : 'var(--brand)',
                    border: '1.5px solid var(--brand)',
                    borderRadius: 6,
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isQuote ? 'Request a quote' : 'Book a consultation'}
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
        <div className="layout-two-col">
          {/* Product Description */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
              Product Description
            </h2>
            <p
              style={{
                color: product.description ? '#4b5563' : '#9ca3af',
                lineHeight: 1.75,
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              {product.description || 'No description has been added for this product yet.'}
            </p>
          </div>

          {/* Technical Specifications */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
              Specifications
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.65rem 1rem', fontWeight: 700, color: '#374151' }}>
                    Parameter
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.65rem 1rem', fontWeight: 700, color: '#374151' }}>
                    Specification
                  </th>
                </tr>
              </thead>
              <tbody>
                {specs.map((s) => (
                  <tr key={s.param} style={{ borderBottom: '1px solid #e5e7eb' }}>
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

      {/* ── Customer Reviews (verified purchases only) ──────────────────────── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem' }}>
              Customer Reviews
            </h2>
            {reviews && reviews.reviewCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stars value={reviews.averageRating} size={16} />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {Number(reviews.averageRating).toFixed(1)} out of 5 · {reviews.reviewCount} review
                  {reviews.reviewCount !== 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>No reviews yet.</span>
            )}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', maxWidth: 320, textAlign: 'right' }}>
            Bought this? You can review it from your delivered order in{' '}
            <button
              onClick={() => (user ? navigate('/orders') : onLoginClick())}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--brand)',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: 'inherit',
              }}
            >
              My Orders
            </button>
            .
          </div>
        </div>

        {/* Review cards */}
        {reviews && reviews.reviewCount > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {reviews.reviews.map((r) => (
              <div
                key={r.reviewId}
                style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', background: '#fff' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{r.reviewerName}</span>
                  <Stars value={r.rating} size={13} />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.6rem' }}>
                  {r.verifiedPurchase && (
                    <span style={{ color: '#15803d', fontWeight: 700 }}>✓ Verified purchase · </span>
                  )}
                  {new Date(r.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {r.edited && ' · Edited'}
                </div>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#4b5563',
                    lineHeight: 1.65,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {r.comment}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              border: '1px dashed #e5e7eb',
              borderRadius: 8,
              padding: '2rem',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '0.9rem',
            }}
          >
            Be the first to review this product after your order is delivered.
          </div>
        )}
      </div>
    </div>
  );
}
