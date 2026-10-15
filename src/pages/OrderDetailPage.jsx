import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiCheck, FiPrinter, FiHeadphones,
  FiMail, FiPhone, FiMapPin,
} from 'react-icons/fi';
import { getOrder } from '../api/orders';
import { formatLKR, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

/* ── Constants ──────────────────────────────────────────────────────────── */
const SHIPPING_FEE = 1200;
const TAX_RATE = 0.08;

const STEPS = [
  { status: 'PENDING',    label: 'PENDING',      num: 1 },
  { status: 'PROCESSING', label: 'IN PROGRESS',  num: 2 },
  { status: 'SHIPPED',    label: 'COMPLETED',    num: 3 },
  { status: 'DELIVERED',  label: 'DELIVERED',    num: 4 },
];

const STATUS_ORDER = { PENDING: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3 };

/* ── SKU generator ──────────────────────────────────────────────────────── */
function buildSku(item) {
  const id = String(item.product?.productId || 0).padStart(3, '0');
  const mat = (item.product?.material || 'WD').slice(0, 2).toUpperCase();
  return `GMC-W-${id}-${mat}`;
}

/* ── Estimated delivery (15 days after order) ───────────────────────────── */
function estimatedDelivery(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 15);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

/* ── Short date (d/m/yyyy) ───────────────────────────────────────────────── */
function shortDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

/* ── Component ──────────────────────────────────────────────────────────── */
export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrder(id)
      .then((r) => setOrder(r.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ background: '#eef2f7', minHeight: '100vh' }}><LoadingSpinner /></div>;
  if (!order) return (
    <div style={{ background: '#eef2f7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6b7280' }}>Order not found.</p>
    </div>
  );

  const stepIndex = order.status === 'CANCELLED' ? -1 : (STATUS_ORDER[order.status] ?? 0);
  const subtotal = order.totalAmount || 0;
  const shipping = SHIPPING_FEE;
  const tax = Math.round(Number(subtotal) * TAX_RATE);
  const grandTotal = Number(subtotal) + shipping + tax;

  return (
    <div style={{ background: '#eef2f7', minHeight: '100vh', color: '#111827' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* ── Back link ─────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/orders')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0 }}
        >
          <FiArrowLeft size={15} /> Back to My Orders
        </button>

        {/* ── Page heading ──────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', marginBottom: '0.4rem' }}>My Orders</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>View and track your active industrial equipment and woodcraft orders.</p>
        </div>

        {/* ── Main order card ───────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: '1.25rem', overflow: 'hidden' }}>

          {/* Card top: order meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a5c' }}>Order #{order.orderId}</div>
              <div style={{ fontSize: '0.825rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                Placed on: {shortDate(order.orderDate)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              {order.status !== 'CANCELLED' && (
                <span style={{ background: '#1e3a5c', color: '#fff', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', padding: '0.3rem 0.75rem', borderRadius: 999 }}>
                  ESTIMATED DELIVERY: {estimatedDelivery(order.orderDate)}
                </span>
              )}
              <button
                onClick={() => window.print()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#374151', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <FiPrinter size={14} /> INVOICE
              </button>
            </div>
          </div>

          {/* Status stepper */}
          {order.status !== 'CANCELLED' && (
            <div style={{ padding: '1.75rem 2rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                {STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  const active = i === stepIndex;
                  return (
                    <div key={step.status} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                      {/* Circle + label */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Short leading line for first step */}
                        {i === 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center', position: 'relative' }}>
                            <div style={{ width: 20, height: 2, background: done ? '#1e3a5c' : '#d1d5db', marginRight: -2 }} />
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: done ? '#1e3a5c' : '#f3f4f6',
                              border: `2px solid ${done ? '#1e3a5c' : '#d1d5db'}`,
                              color: done ? '#fff' : '#9ca3af',
                              fontWeight: 700, fontSize: '0.875rem',
                              zIndex: 1,
                            }}>
                              {done ? <FiCheck size={16} strokeWidth={3} /> : step.num}
                            </div>
                          </div>
                        )}
                        {i > 0 && (
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: done ? '#1e3a5c' : '#f3f4f6',
                            border: `2px solid ${done ? '#1e3a5c' : '#d1d5db'}`,
                            color: done ? '#fff' : '#9ca3af',
                            fontWeight: 700, fontSize: '0.875rem',
                          }}>
                            {done ? <FiCheck size={16} strokeWidth={3} /> : step.num}
                          </div>
                        )}
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
                          marginTop: '0.5rem', whiteSpace: 'nowrap',
                          color: active ? '#1e3a5c' : '#9ca3af',
                        }}>
                          {i + 1} {step.label}
                        </span>
                      </div>

                      {/* Connecting line to next step */}
                      {i < STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: i < stepIndex ? '#1e3a5c' : '#d1d5db', margin: '0 2px', marginBottom: 20 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items list */}
          <div style={{ borderTop: '1px solid #f1f5f9' }}>
            {order.items?.map((item, idx) => (
              <div
                key={item.orderItemId}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem 1.75rem', borderBottom: idx < (order.items.length - 1) ? '1px solid #f9fafb' : 'none' }}
              >
                {/* Image */}
                <div style={{ flexShrink: 0, width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  {item.product?.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>🪵</div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.3rem' }}>{item.product?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    {item.product?.material ? `Wood: ${item.product.material}` : item.product?.category?.name || ''}
                    &nbsp;&nbsp; Qty: {item.quantity}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#1e3a5c', fontWeight: 600 }}>
                    SKU: {buildSku(item)}
                  </div>
                </div>

                {/* Subtotal */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '0.25rem' }}>SUBTOTAL</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a5c' }}>{formatLKR(item.subtotal)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom: delivery address + price breakdown */}
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '1.5rem 1.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
            {/* Delivery address */}
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '0.6rem' }}>DELIVERY ADDRESS</div>
              <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.65 }}>
                {order.notes
                  ? <span style={{ fontStyle: 'italic', color: '#6b7280' }}>{order.notes}</span>
                  : <>128 Industrial Zone, 4th Cross Street,<br />Colombo 00700, Sri Lanka</>}
              </div>
            </div>

            {/* Price breakdown */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                <span>Shipping &amp; Handling</span>
                <span>{formatLKR(shipping)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.875rem' }}>
                <span>Tax (VAT 8%)</span>
                <span>{formatLKR(tax)}</span>
              </div>
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Total</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3a5c' }}>{formatLKR(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Support card ──────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1.5rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiHeadphones size={22} color="#1e3a5c" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#111827', marginBottom: '0.2rem' }}>Need assistance with your order?</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Contact our dedicated support for delivery concerns or technical specs.</div>
          </div>
          <button
            onClick={() => navigate('/appointments')}
            style={{ flexShrink: 0, background: '#1e3a5c', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.4rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Contact Support
          </button>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #d1d5db', background: '#eef2f7', marginTop: '2rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '1rem' }}>QUICK LINKS</div>
            {['About Us', 'Our Services', 'CNC Machines', 'Wood Portfolio'].map((l) => (
              <div key={l} style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.6rem', cursor: 'pointer' }}>{l}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '1rem' }}>CONTACT</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem', color: '#4b5563' }}>
              <FiMail size={14} color="#6b7280" /> contact@cnclanka.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem', color: '#4b5563' }}>
              <FiPhone size={14} color="#6b7280" /> +94 11 234 5678
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
              <FiMapPin size={14} color="#6b7280" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>123 Industrial Zone,<br />Colombo, Sri Lanka</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '1rem' }}>LEGAL</div>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((l) => (
              <div key={l} style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.6rem', cursor: 'pointer' }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #d1d5db', padding: '1rem 1.5rem', maxWidth: 760, margin: '0 auto' }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>© 2024 GMC Lanka. Engineered for Excellence.</span>
        </div>
      </div>
    </div>
  );
}
