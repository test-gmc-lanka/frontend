import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiShoppingCart, FiPackage,
  FiMail, FiPhone, FiMapPin,
  FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { getProducts, getCategories } from '../api/products';
import { addToCart } from '../api/cart';
import { useAuth } from '../context/AuthContext';
import { formatLKR, getErrorMessage } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const PAGE_SIZE = 8;

/* ── badge by category name ─────────────────────────────────────────────── */
function getBadge(product) {
  const cat = (product.category?.name || '').toLowerCase();
  if (cat.includes('cnc')) return { text: 'CNC SERIES', bg: '#0f766e' };
  if (cat.includes('artisan')) return { text: 'ARTISAN', bg: '#1e3a5c' };
  if (cat.includes('precision') || cat.includes('parts')) return { text: 'PRECISION', bg: '#374151' };
  if (cat.includes('furniture')) {
    return product.stockQuantity > 20
      ? { text: 'IN STOCK', bg: '#6b7280' }
      : { text: 'SIGNATURE', bg: '#5c3317' };
  }
  if (product.price > 100000) return { text: 'SIGNATURE', bg: '#5c3317' };
  if (product.stockQuantity > 25) return { text: 'IN STOCK', bg: '#6b7280' };
  return { text: "ARTIST'S PROOF", bg: '#4b5563' };
}

/* ── component ──────────────────────────────────────────────────────────── */
export default function HomePage({ onLoginClick }) {
  const { user, isAdmin, isTechnician, refreshCart } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([pRes, cRes]) => {
        setProducts(pRes.data);
        setCategories(cRes.data);
        setLoadError('');
      })
      .catch((err) => {
        const msg =
          err.code === 'ERR_NETWORK' || err.message?.includes('Network')
            ? 'Cannot connect to the server. Make sure the backend is running on port 8080.'
            : 'Failed to load products. Please refresh.';
        setLoadError(msg);
        toast.error(msg, { duration: 5000 });
      })
      .finally(() => setLoading(false));
  }, []);

  /* Reset page when filter/sort changes */
  useEffect(() => { setPage(1); }, [selectedCategory, sort]);

  const filtered = useMemo(() => {
    let list = products.filter(
      (p) => !selectedCategory || p.category?.categoryId == selectedCategory,
    );
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, selectedCategory, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();
    if (!user) { onLoginClick(); return; }
    if (isAdmin || isTechnician) return;
    setAddingId(productId);
    try {
      await addToCart({ productId, quantity: 1 });
      toast.success('Added to cart!');
      refreshCart();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingId(null);
    }
  };

  if (loading) return <div style={{ background: '#fff', minHeight: '100vh' }}><LoadingSpinner /></div>;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: '#111827' }}>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem 3.5rem' }}>
          {loadError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              ⚠️ {loadError}
            </div>
          )}
          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', color: '#0f766e', marginBottom: '0.75rem' }}>
            PRECISION ENGINEERING
          </div>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 800, color: '#111827', marginBottom: '0.875rem', lineHeight: 1.1 }}>
            Product Catalog
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280', maxWidth: 560, lineHeight: 1.7 }}>
            Explore our collection of precision-engineered industrial solutions and handcrafted artisanal
            wood products, where modern technology meets traditional craftsmanship.
          </p>
        </div>
      </div>

      {/* ── Filters + Grid ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <FilterChip active={!selectedCategory} onClick={() => setSelectedCategory('')}>ALL PRODUCTS</FilterChip>
            {categories.map((c) => (
              <FilterChip
                key={c.categoryId}
                active={selectedCategory == c.categoryId}
                onClick={() => setSelectedCategory(selectedCategory == c.categoryId ? '' : c.categoryId)}
              >
                {c.name.toUpperCase()}
              </FilterChip>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.35rem 0.75rem', fontSize: '0.875rem', fontWeight: 600, background: '#fff', color: '#111827', cursor: 'pointer' }}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price Low → High</option>
              <option value="price-desc">Price High → Low</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9ca3af' }}>
            <FiPackage size={40} style={{ marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>No products found</div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Try a different category or filter</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
            {paginated.map((p) => {
              const badge = getBadge(p);
              const isQuote = p.price === 0;
              return (
                <div
                  key={p.productId}
                  onClick={() => navigate(`/products/${p.productId}`)}
                  style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', background: '#fff', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative' }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ height: 200, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🪵</div>
                    )}
                    <div style={{
                      position: 'absolute', top: '0.5rem', left: '0.5rem',
                      background: badge.bg, color: '#fff',
                      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em',
                      padding: '0.2rem 0.55rem', borderRadius: 2,
                    }}>{badge.text}</div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '0.875rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '0.35rem', lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{
                      fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.55, marginBottom: '0.875rem',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{p.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                        {isQuote ? 'Quote' : formatLKR(p.price)}
                      </div>
                      {!isAdmin && !isTechnician && !isQuote && p.stockQuantity > 0 && (
                        <button
                          onClick={(e) => handleAddToCart(e, p.productId)}
                          disabled={addingId === p.productId}
                          title="Add to cart"
                          style={{
                            background: addingId === p.productId ? '#2d5a8c' : '#1e3a5c',
                            color: '#fff', border: 'none', borderRadius: 4,
                            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: addingId === p.productId ? 'not-allowed' : 'pointer', flexShrink: 0,
                          }}
                        >
                          <FiShoppingCart size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', marginTop: '2.5rem' }}>
            <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <FiChevronLeft size={14} />
            </PagBtn>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <PagBtn key={n} active={page === n} onClick={() => setPage(n)}>{n}</PagBtn>
            ))}
            {totalPages > 5 && <span style={{ fontSize: '0.875rem', color: '#9ca3af', padding: '0 0.25rem' }}>...</span>}
            <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <FiChevronRight size={14} />
            </PagBtn>
          </div>
        )}
      </div>

      {/* ── Custom CNC Solutions CTA ─────────────────────────────────────── */}
      <div style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', margin: '1rem 0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#111827', marginBottom: '1rem' }}>Custom CNC Solutions</h2>
            <p style={{ color: '#6b7280', lineHeight: 1.75, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Need something specific? We offer bespoke manufacturing services for both industrial parts and unique
              furniture pieces. Our state-of-the-art CNC machines ensure precision up to 0.01mm.
            </p>
            <button
              onClick={() => user ? navigate('/appointments') : onLoginClick()}
              style={{ background: '#1e3a5c', color: '#fff', border: 'none', borderRadius: 6, padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer' }}
            >
              REQUEST A QUOTE
            </button>
          </div>
          <div style={{ borderRadius: 4, overflow: 'hidden', height: 280 }}>
            <img
              src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=700&q=70"
              alt="CNC Machine"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '1rem' }}>QUICK LINKS</div>
            {['About Us', 'Our Services', 'CNC Machines', 'Wood Portfolio'].map((l) => (
              <div key={l} style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.6rem', cursor: 'pointer' }}>{l}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '1rem' }}>CONTACT</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>
              <FiMail size={14} color="#6b7280" /> contact@gmclanka.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>
              <FiPhone size={14} color="#6b7280" /> +94 11 234 5678
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
              <FiMapPin size={14} color="#6b7280" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>123 Industrial Zone,<br />Colombo, Sri Lanka</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '1rem' }}>LEGAL</div>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((l) => (
              <div key={l} style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.6rem', cursor: 'pointer' }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '1rem 1.5rem', maxWidth: 1120, margin: '0 auto' }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>© 2024 GMC Lanka. Engineered for Excellence.</span>
        </div>
      </div>
    </div>
  );
}

/* ── Small helper components ────────────────────────────────────────────── */
function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#1e3a5c' : 'transparent',
        color: active ? '#fff' : '#374151',
        border: `1px solid ${active ? '#1e3a5c' : '#d1d5db'}`,
        borderRadius: 4,
        padding: '0.45rem 1rem',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function PagBtn({ active, disabled, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 32, height: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${active ? '#1e3a5c' : '#d1d5db'}`,
        borderRadius: 4,
        background: active ? '#1e3a5c' : '#fff',
        color: active ? '#fff' : '#374151',
        fontSize: '0.875rem', fontWeight: active ? 700 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        padding: '0 0.4rem',
      }}
    >
      {children}
    </button>
  );
}
