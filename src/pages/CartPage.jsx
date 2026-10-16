import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { getCart, updateCartItem, removeCartItem, clearCart } from '../api/cart';
import { getCheckoutSummary } from '../api/orders';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatLKR, getErrorMessage } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CartPage() {
  const navigate = useNavigate();
  const { refreshCart } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null); // VAT rate etc. from the server
  const [pendingId, setPendingId] = useState(null); // item whose quantity is being saved
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    getCart()
      .then((r) => setCart(r.data))
      .catch(() => toast.error('Failed to load cart'))
      .finally(() => setLoading(false));
    getCheckoutSummary().then((r) => setSummary(r.data)).catch(() => {});
  }, []);

  const handleUpdateQty = async (itemId, qty) => {
    if (pendingId) return; // ignore rapid clicks until the last change is saved
    if (qty === 0) { handleRemove(itemId); return; }
    setPendingId(itemId);
    try {
      const { data } = await updateCartItem(itemId, qty);
      setCart(data);
      refreshCart();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      const { data } = await removeCartItem(itemId);
      setCart(data);
      refreshCart();
      toast.success('Item removed');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleClearCart = async () => {
    setConfirmClear(false);
    try {
      await clearCart();
      setCart((c) => ({ ...c, items: [], totalAmount: 0 }));
      refreshCart();
      toast.success('Cart cleared');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  // Delivery details, payment method and the final total are handled on the checkout page
  const handleCheckout = () => navigate('/checkout');

  if (loading) return <LoadingSpinner />;

  const items = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + (i.subtotal || 0), 0);
  // VAT comes from the server so the cart always matches checkout (delivery is added there)
  const taxRate = (summary?.taxRatePercent ?? 0) / 100;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '1.5rem 1.5rem 3rem' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>HOME</Link>
            <span style={{ color: '#d1d5db' }}>›</span>
            <span style={{ color: '#0f766e' }}>SHOPPING CART</span>
          </div>

          {/* Page title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>Shopping Cart</h1>
            {items.length > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#ef4444', fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                <FiTrash2 size={15} /> Clear Cart
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
              <FiShoppingCart size={52} color="#d1d5db" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: '#374151', fontWeight: 600, marginBottom: '0.5rem' }}>Your cart is empty</h3>
              <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Browse our products and add items to your cart</p>
              <button
                onClick={() => navigate('/')}
                style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '0.65rem 1.5rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="layout-cart">

              {/* ── Left: Cart items ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {items.map((item) => (
                  <div key={item.cartItemId} style={{
                    display: 'flex', gap: '1rem',
                    border: '1px solid #e5e7eb', borderRadius: 12,
                    padding: '1rem', background: '#fff',
                  }}>
                    {/* Image */}
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl} alt={item.product.name}
                        style={{ width: 100, height: 90, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: 100, height: 90, background: '#f3f4f6', borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🪵</div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 3 }}>
                            {(item.product?.category?.name || 'PRODUCT').toUpperCase()}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 4 }}>
                            {item.product?.name}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                            {item.product?.description
                              ? item.product.description.slice(0, 100) + (item.product.description.length > 100 ? '…' : '')
                              : item.product?.material || ''}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f766e', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                          {formatLKR(item.subtotal)}
                        </div>
                      </div>

                      {/* Qty + Remove row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                          <button
                            onClick={() => handleUpdateQty(item.cartItemId, item.quantity - 1)}
                            disabled={pendingId === item.cartItemId}
                            aria-label={`Decrease quantity of ${item.product?.name}`}
                            style={qtyBtnStyle}
                          >−</button>
                          <span style={{ padding: '0.35rem 1rem', fontWeight: 600, fontSize: '0.9rem', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', minWidth: 40, textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.cartItemId, item.quantity + 1)}
                            disabled={pendingId === item.cartItemId || item.quantity >= (item.product?.stockQuantity ?? Infinity)}
                            aria-label={`Increase quantity of ${item.product?.name}`}
                            title={item.quantity >= (item.product?.stockQuantity ?? Infinity) ? 'No more in stock' : undefined}
                            style={{ ...qtyBtnStyle, opacity: item.quantity >= (item.product?.stockQuantity ?? Infinity) ? 0.4 : 1 }}
                          >+</button>
                        </div>
                        <button
                          onClick={() => handleRemove(item.cartItemId)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.82rem', fontWeight: 500 }}
                        >
                          <FiTrash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Right: Order summary ── */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem', background: '#fff', position: 'sticky', top: 90 }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.15rem', color: '#111827', marginBottom: '1rem' }}>Order Summary</h2>
                <div style={{ height: 1, background: '#f3f4f6', marginBottom: '1rem' }} />

                <div style={summaryRowStyle}>
                  <span style={summaryLabel}>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                  <span style={summaryValue}>{formatLKR(subtotal)}</span>
                </div>
                <div style={summaryRowStyle}>
                  <span style={summaryLabel}>Shipping Estimate</span>
                  <span style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: 500 }}>Calculated at next step</span>
                </div>
                <div style={{ ...summaryRowStyle, marginBottom: '1rem' }}>
                  <span style={summaryLabel}>VAT{summary ? ` (${summary.taxRatePercent}%)` : ''}</span>
                  <span style={summaryValue}>{formatLKR(tax)}</span>
                </div>

                <div style={{ height: 1, background: '#f3f4f6', marginBottom: '1rem' }} />

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 4 }}>ESTIMATED TOTAL (BEFORE DELIVERY)</div>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111827' }}>{formatLKR(total)}</div>
                </div>

                <button
                  onClick={handleCheckout}
                  style={{
                    width: '100%', background: '#0f3460',
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '0.875rem', fontSize: '0.95rem', fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginBottom: '0.875rem',
                  }}
                >
                  <span>Proceed to Checkout</span><FiArrowRight size={17} />
                </button>

                <button
                  onClick={() => navigate('/')}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#0f766e', fontWeight: 600, fontSize: '0.9rem', padding: '0.4rem', marginBottom: '1rem' }}
                >
                  Continue Shopping
                </button>

              </div>
            </div>
          )}
        </div>
      </div>

      {confirmClear && (
        <ConfirmDialog
          title="Clear your cart?"
          message="All items will be removed from your cart."
          confirmLabel="Clear cart"
          cancelLabel="Keep items"
          tone="danger"
          onConfirm={handleClearCart}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}

const qtyBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '0.35rem 0.65rem', fontSize: '1rem', fontWeight: 500, color: '#374151',
};

const summaryRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' };
const summaryLabel = { fontSize: '0.85rem', color: '#6b7280' };
const summaryValue = { fontSize: '0.85rem', color: '#111827', fontWeight: 500 };
