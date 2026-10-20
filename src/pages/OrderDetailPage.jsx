import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCheck,
  FiPrinter,
  FiHeadphones,
  FiCreditCard,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { getOrder, startOrderPayment, confirmOrderPayment } from '../api/orders';
import { formatLKR, formatDateTime, getErrorMessage, formatDate, ORDER_STATUS_LABEL } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getMyComplaints, submitComplaint, getMyFeedback, submitFeedback, updateFeedback } from '../api/feedback';
import { Stars, StarPicker } from '../components/common/StarRating';
import { CONTACT } from '../utils/contact';
import toast from 'react-hot-toast';

/* ── Payment labels ─────────────────────────────────────────────────────── */
const PAYMENT_METHOD_LABEL = { CARD: 'Credit / debit card', CASH_ON_DELIVERY: 'Cash on delivery' };

function paymentBadge(order) {
  if (order.paymentStatus === 'COMPLETED') return { text: 'PAID', bg: '#dcfce7', color: '#15803d' };
  if (order.paymentStatus === 'REFUNDED') return { text: 'REFUNDED', bg: '#ede9fe', color: '#6d28d9' };
  if (order.status === 'CANCELLED') return { text: 'NOT CHARGED', bg: '#f3f4f6', color: '#6b7280' };
  if (order.paymentMethod === 'CASH_ON_DELIVERY') return { text: 'PAY ON DELIVERY', bg: '#e0f2fe', color: '#0369a1' };
  if (order.paymentStatus === 'FAILED') return { text: 'PAYMENT FAILED', bg: '#fee2e2', color: '#b91c1c' };
  return { text: 'AWAITING PAYMENT', bg: '#fef3c7', color: '#b45309' };
}

const STEPS = [
  { status: 'PENDING', label: 'PENDING', num: 1 },
  { status: 'PROCESSING', label: 'PROCESSING', num: 2 },
  { status: 'SHIPPED', label: 'SHIPPED', num: 3 },
  { status: 'DELIVERED', label: 'DELIVERED', num: 4 },
];

const STATUS_ORDER = { PENDING: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3 };

/* ── Component ──────────────────────────────────────────────────────────── */
export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [justPlaced] = useState(searchParams.get('placed') === '1');
  const [paymentSession, setPaymentSession] = useState(null);
  const [startingPayment, setStartingPayment] = useState(false);

  useEffect(() => {
    // Returning from a payment method that redirects (e.g. bank 3-D Secure): verify it first
    const returning = searchParams.get('payment') === 'return';
    const load = returning ? confirmOrderPayment(id) : getOrder(id);
    load
      .then((r) => {
        setOrder(r.data);
        if (returning) {
          if (r.data.paymentStatus === 'COMPLETED') toast.success('Payment successful!');
          else toast.error('The payment was not completed. You can try again below.');
        }
      })
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
    if (searchParams.toString()) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePayNow = async () => {
    setStartingPayment(true);
    try {
      const { data } = await startOrderPayment(order.orderId);
      if (data.alreadyPaid) {
        const fresh = await getOrder(order.orderId);
        setOrder(fresh.data);
        toast.success('This order is already paid.');
      } else {
        setPaymentSession(data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStartingPayment(false);
    }
  };

  // Complaints already filed about this order, shown next to each product
  const [complaints, setComplaints] = useState([]);
  const [reportItem, setReportItem] = useState(null);
  const [reportText, setReportText] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    getMyComplaints()
      .then((r) => setComplaints(r.data.filter((c) => String(c.orderId) === String(id))))
      .catch(() => {});
  }, [id]);

  // Reviews: only for delivered orders, one per product
  const [myReviews, setMyReviews] = useState([]);
  const [reviewItem, setReviewItem] = useState(null);
  const [editingReview, setEditingReview] = useState(null); // existing review being edited
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    getMyFeedback()
      .then((r) => setMyReviews(r.data.filter((f) => String(f.orderId) === String(id))))
      .catch(() => {});
  }, [id]);

  const handleReview = async () => {
    setSubmittingReview(true);
    try {
      if (editingReview) {
        const { data } = await updateFeedback(editingReview.feedbackId, {
          rating: reviewRating,
          comment: reviewText.trim(),
        });
        setMyReviews((prev) => prev.map((f) => (f.feedbackId === data.feedbackId ? data : f)));
        toast.success('Your review has been updated.');
      } else {
        const { data } = await submitFeedback({
          orderId: order.orderId,
          productId: reviewItem.product?.productId,
          rating: reviewRating,
          comment: reviewText.trim(),
        });
        setMyReviews((prev) => [...prev, data]);
        toast.success('Thank you for your review!');
      }
      setReviewItem(null);
      setEditingReview(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReport = async () => {
    setReporting(true);
    try {
      const { data } = await submitComplaint({
        orderId: order.orderId,
        productId: reportItem.product?.productId,
        description: reportText.trim(),
      });
      setComplaints((prev) => [...prev, data]);
      setReportItem(null);
      setReportText('');
      toast.success('Thanks — our team has been notified and will get back to you.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReporting(false);
    }
  };

  const handlePaid = (updated) => {
    setOrder(updated);
    setPaymentSession(null);
    if (updated.paymentStatus === 'COMPLETED') toast.success('Payment successful! Your order is confirmed.');
    else toast('Payment is processing. We\u2019ll update your order shortly.');
  };

  if (loading)
    return (
      <div style={{ background: 'var(--page-bg)', minHeight: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  if (!order)
    return (
      <div
        style={{
          background: 'var(--page-bg)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#6b7280' }}>Order not found.</p>
      </div>
    );

  const stepIndex = order.status === 'CANCELLED' ? -1 : (STATUS_ORDER[order.status] ?? 0);
  // Orders placed before checkout existed only stored the items total
  const subtotal = order.subtotal ?? order.totalAmount ?? 0;
  const badge = paymentBadge(order);
  const canPayNow =
    order.paymentMethod === 'CARD' && order.paymentStatus !== 'COMPLETED' && order.status !== 'CANCELLED';

  return (
    <div style={{ background: 'var(--page-bg)', minHeight: '100vh', color: '#111827' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* ── Back link ─────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/orders')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#6b7280',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            padding: 0,
          }}
        >
          <FiArrowLeft size={15} /> Back to My Orders
        </button>

        {/* ── Page heading ──────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', marginBottom: '0.4rem' }}>
            Order details
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            View and track your active industrial equipment and woodcraft orders.
          </p>
        </div>

        {justPlaced && (
          <div
            role="status"
            style={{
              display: 'flex',
              gap: '0.875rem',
              alignItems: 'flex-start',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <FiCheckCircle size={22} color="#15803d" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#14532d' }}>
                Thank you! Your order #{order.orderId} has been placed.
              </div>
              <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: 2 }}>
                {canPayNow
                  ? 'Complete the card payment below to confirm it.'
                  : 'A confirmation has been sent to your email. We\u2019ll notify you as it ships.'}
              </div>
            </div>
          </div>
        )}

        {/* ── Main order card ───────────────────────────────────────────── */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            marginBottom: '1.25rem',
            overflow: 'hidden',
          }}
        >
          {/* Card top: order meta */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '1.5rem 1.75rem',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand)' }}>Order #{order.orderId}</div>
              <div style={{ fontSize: '0.825rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                Placed on {formatDate(order.orderDate)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <span
                style={{
                  background: order.status === 'CANCELLED' ? '#fee2e2' : 'var(--brand)',
                  color: order.status === 'CANCELLED' ? '#b91c1c' : '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '0.3rem 0.75rem',
                  borderRadius: 999,
                }}
              >
                {(ORDER_STATUS_LABEL[order.status] || order.status).toUpperCase()}
              </span>
              <button
                onClick={() => window.print()}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: '#374151',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
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
                    <div
                      key={step.status}
                      style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}
                    >
                      {/* Circle + label */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Short leading line for first step */}
                        {i === 0 && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              width: '100%',
                              justifyContent: 'center',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                width: 20,
                                height: 2,
                                background: done ? 'var(--brand)' : '#d1d5db',
                                marginRight: -2,
                              }}
                            />
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: done ? 'var(--brand)' : '#f3f4f6',
                                border: `2px solid ${done ? 'var(--brand)' : '#d1d5db'}`,
                                color: done ? '#fff' : '#9ca3af',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                zIndex: 1,
                              }}
                            >
                              {done ? <FiCheck size={16} strokeWidth={3} /> : step.num}
                            </div>
                          </div>
                        )}
                        {i > 0 && (
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: done ? 'var(--brand)' : '#f3f4f6',
                              border: `2px solid ${done ? 'var(--brand)' : '#d1d5db'}`,
                              color: done ? '#fff' : '#9ca3af',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                            }}
                          >
                            {done ? <FiCheck size={16} strokeWidth={3} /> : step.num}
                          </div>
                        )}
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            marginTop: '0.5rem',
                            whiteSpace: 'nowrap',
                            color: active ? 'var(--brand)' : '#9ca3af',
                          }}
                        >
                          {i + 1} {step.label}
                        </span>
                      </div>

                      {/* Connecting line to next step */}
                      {i < STEPS.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            height: 2,
                            background: i < stepIndex ? 'var(--brand)' : '#d1d5db',
                            margin: '0 2px',
                            marginBottom: 20,
                          }}
                        />
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
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.25rem 1.75rem',
                  borderBottom: idx < order.items.length - 1 ? '1px solid #f9fafb' : 'none',
                }}
              >
                {/* Image */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  {item.product?.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem',
                      }}
                    >
                      🪵
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.3rem' }}>
                    {item.product?.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    {[item.product?.material, item.product?.category?.name].filter(Boolean).join(' · ')}
                    {item.product?.material || item.product?.category?.name ? ' · ' : ''}Qty {item.quantity} ×{' '}
                    {formatLKR(item.unitPrice)}
                  </div>

                  {order.status === 'DELIVERED' &&
                    (() => {
                      const review = myReviews.find((f) => f.productId === item.product?.productId);
                      return review ? (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#4b5563' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600 }}>Your review:</span>{' '}
                            <Stars value={review.rating} size={12} />
                            {review.updatedAt && <span style={{ color: '#9ca3af' }}>(edited)</span>}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingReview(review);
                                setReviewItem(item);
                                setReviewRating(review.rating);
                                setReviewText(review.comment);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: 'var(--brand-accent)',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                              }}
                            >
                              Edit
                            </button>
                          </div>
                          {review.hidden && (
                            <div style={{ color: '#b45309', marginTop: 2 }}>
                              This review is hidden from the product page by GMC Lanka. Contact support if you have
                              questions.
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReview(null);
                            setReviewItem(item);
                            setReviewRating(0);
                            setReviewText('');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            marginTop: '0.4rem',
                            marginRight: '0.9rem',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: 6,
                            padding: '3px 10px',
                            color: '#b45309',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ★ Write a review
                        </button>
                      );
                    })()}
                  {(() => {
                    const complaint = complaints.find((c) => c.productId === item.product?.productId);
                    if (complaint) {
                      const resolved = complaint.status === 'RESOLVED';
                      return (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            marginTop: '0.4rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: resolved ? '#15803d' : '#b45309',
                          }}
                        >
                          <FiAlertCircle size={13} />
                          {resolved
                            ? 'Problem resolved'
                            : complaint.status === 'IN_PROGRESS'
                              ? 'Problem reported · being handled'
                              : 'Problem reported · awaiting review'}
                        </div>
                      );
                    }
                    return (
                      order.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setReportItem(item);
                            setReportText('');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            marginTop: '0.4rem',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: '#6b7280',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          <FiAlertCircle size={13} /> Report a problem
                        </button>
                      )
                    );
                  })()}
                </div>

                {/* Subtotal */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#9ca3af',
                      marginBottom: '0.25rem',
                    }}
                  >
                    SUBTOTAL
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand)' }}>
                    {formatLKR(item.subtotal)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom: delivery address + price breakdown */}
          <div className="layout-split" style={{ borderTop: '1px solid #e5e7eb', padding: '1.5rem 1.75rem' }}>
            {/* Delivery address */}
            <div>
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  color: '#9ca3af',
                  marginBottom: '0.6rem',
                }}
              >
                DELIVERY ADDRESS
              </div>
              {order.shippingAddress ? (
                <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.65 }}>
                  <strong>{order.shippingName}</strong>
                  <br />
                  {order.shippingAddress}
                  <br />
                  {order.shippingCity}
                  {order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ''}, Sri Lanka
                  <br />
                  {order.shippingPhone}
                </div>
              ) : (
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                  No delivery address recorded for this order.
                </div>
              )}
              {order.notes && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic', marginTop: '0.5rem' }}>
                  Note: {order.notes}
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '0.5rem',
                }}
              >
                <span>Subtotal</span>
                <span>{formatLKR(subtotal)}</span>
              </div>
              {order.shippingFee != null && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span>Delivery</span>
                  <span>{Number(order.shippingFee) === 0 ? 'Free' : formatLKR(order.shippingFee)}</span>
                </div>
              )}
              {order.taxAmount != null && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span>VAT</span>
                  <span>{formatLKR(order.taxAmount)}</span>
                </div>
              )}
              <div
                style={{
                  borderTop: '1px solid #e5e7eb',
                  marginTop: '0.375rem',
                  paddingTop: '0.875rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Total</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand)' }}>
                  {formatLKR(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment ───────────────────────────────────────────────────── */}
        {order.paymentMethod && (
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              padding: '1.5rem 1.75rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiCreditCard size={20} color="var(--brand)" />
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: '#9ca3af' }}>
                    PAYMENT
                  </div>
                  <div style={{ fontWeight: 700, color: '#111827' }}>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</div>
                  {order.paidAt && (
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Paid on {formatDateTime(order.paidAt)}</div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    background: badge.bg,
                    color: badge.color,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    padding: '0.3rem 0.7rem',
                    borderRadius: 999,
                  }}
                >
                  {badge.text}
                </span>
                {canPayNow && !paymentSession && (
                  <button
                    onClick={handlePayNow}
                    disabled={startingPayment}
                    style={{
                      background: 'var(--brand)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '0.6rem 1.2rem',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: startingPayment ? 'wait' : 'pointer',
                    }}
                  >
                    {startingPayment ? 'Loading...' : `Pay ${formatLKR(order.totalAmount)} now`}
                  </button>
                )}
              </div>
            </div>
            {canPayNow && !paymentSession && (
              <p style={{ fontSize: '0.8rem', color: '#b45309', margin: '0.875rem 0 0' }}>
                This order is waiting for payment. Unpaid card orders are cancelled automatically after 60 minutes.
              </p>
            )}
            {paymentSession && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <StripePaymentForm
                  orderId={order.orderId}
                  clientSecret={paymentSession.clientSecret}
                  publishableKey={paymentSession.publishableKey}
                  amount={order.totalAmount}
                  onPaid={handlePaid}
                />
              </div>
            )}
          </div>
        )}

        {reviewItem && (
          <ConfirmDialog
            title={editingReview ? 'Edit your review' : 'Write a review'}
            message={
              <>
                How was <strong>{reviewItem.product?.name}</strong>? Your review will appear on the product page with
                your first name{editingReview ? ', marked as edited' : ''}.
              </>
            }
            confirmLabel={editingReview ? 'Save changes' : 'Post review'}
            loading={submittingReview}
            confirmDisabled={reviewRating === 0 || reviewText.trim().length < 5}
            onConfirm={handleReview}
            onCancel={() => {
              setReviewItem(null);
              setEditingReview(null);
            }}
          >
            <div style={{ marginBottom: '0.85rem' }}>
              <StarPicker value={reviewRating} onChange={setReviewRating} />
            </div>
            <label
              htmlFor="review-text"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}
            >
              Your review
            </label>
            <textarea
              id="review-text"
              rows={4}
              maxLength={1000}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you like? How is the quality and finish?"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.6rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>
              {reviewRating === 0
                ? 'Choose a star rating.'
                : reviewText.trim().length < 5
                  ? 'Write at least a few words.'
                  : `${reviewText.length}/1000`}
            </div>
          </ConfirmDialog>
        )}

        {reportItem && (
          <ConfirmDialog
            title="Report a problem"
            message={
              <>
                Tell us what&rsquo;s wrong with <strong>{reportItem.product?.name}</strong> from order #{order.orderId}.
                Our team will review it and reply to you.
              </>
            }
            confirmLabel="Send report"
            tone="warning"
            loading={reporting}
            confirmDisabled={reportText.trim().length < 10}
            onConfirm={handleReport}
            onCancel={() => setReportItem(null)}
          >
            <label
              htmlFor="complaint-text"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}
            >
              What happened?
            </label>
            <textarea
              id="complaint-text"
              rows={4}
              maxLength={2000}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="e.g. One chair leg arrived cracked and the finish is scratched."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.6rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>
              {reportText.trim().length < 10
                ? 'Please describe the problem in at least 10 characters.'
                : `${reportText.length}/2000`}
            </div>
          </ConfirmDialog>
        )}

        {/* ── Support card ──────────────────────────────────────────────── */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: '1.5rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiHeadphones size={22} color="var(--brand)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#111827', marginBottom: '0.2rem' }}>
              Need assistance with your order?
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Email or call us about delivery, or use &ldquo;Report a problem&rdquo; on an item above.
            </div>
          </div>
          <a
            href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(`Order #${order.orderId}`)}`}
            style={{
              flexShrink: 0,
              background: 'var(--brand)',
              color: '#fff',
              borderRadius: 8,
              padding: '0.7rem 1.4rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            }}
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
