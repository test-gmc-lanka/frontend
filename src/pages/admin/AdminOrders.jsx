import { useState, useEffect, useMemo } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { adminGetOrders, adminUpdateOrderStatus } from '../../api/orders';
import { formatLKR, formatDate, getErrorMessage, formatOrderNo } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination, { clampPage } from '../../components/common/Pagination';
import toast from 'react-hot-toast';

/* Map backend statuses to the 4-step display */
const STEPS = [
  { label: 'PENDING',    backend: 'PENDING',    active: '#f59e0b', border: '#f59e0b' },
  { label: 'PROCESSING', backend: 'PROCESSING', active: '#f97316', border: '#f97316' },
  { label: 'SHIPPED',    backend: 'SHIPPED',    active: '#16a34a', border: '#16a34a' },
  { label: 'DELIVERED',  backend: 'DELIVERED',  active: '#0f766e', border: '#0f766e' },
];

const STATUS_ORDER = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

function statusIndex(backend) {
  return STATUS_ORDER.indexOf(backend);
}

// Unpaid card orders can only be cancelled until the customer pays (enforced by the backend too)
function awaitingCardPayment(order) {
  return order.paymentMethod === 'CARD' && order.paymentStatus !== 'COMPLETED';
}

function PaymentBadge({ order }) {
  if (!order.paymentMethod) return null;
  const method = order.paymentMethod === 'CARD' ? 'Card' : 'COD';
  let label; let bg; let color;
  if (order.paymentStatus === 'COMPLETED') { label = 'Paid'; bg = '#dcfce7'; color = '#15803d'; }
  else if (order.paymentStatus === 'REFUNDED') { label = 'Refunded'; bg = '#ede9fe'; color = '#6d28d9'; }
  else if (order.status === 'CANCELLED') { label = 'Not charged'; bg = '#f3f4f6'; color = '#6b7280'; }
  else if (order.paymentMethod === 'CASH_ON_DELIVERY') { label = 'Collect on delivery'; bg = '#e0f2fe'; color = '#0369a1'; }
  else { label = 'Awaiting payment'; bg = '#fef3c7'; color = '#b45309'; }
  return (
    <span style={{ background: bg, color, fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {method} · {label}
    </span>
  );
}

function stepLabel(backend) {
  return STEPS.find((s) => s.backend === backend)?.label || backend;
}

function StatusBadge({ status }) {
  const map = {
    PENDING:    { bg: '#fef3c7', color: '#b45309' },
    PROCESSING: { bg: '#ffedd5', color: '#c2410c' },
    SHIPPED:    { bg: '#dcfce7', color: '#15803d' },
    DELIVERED:  { bg: '#0f766e', color: '#fff'     },
    CANCELLED:  { bg: '#fee2e2', color: '#b91c1c'  },
  };
  const label = {
    PENDING: 'PENDING', PROCESSING: 'PROCESSING',
    SHIPPED: 'SHIPPED', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED',
  };
  const s = map[status] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
      padding: '2px 8px', borderRadius: 20,
    }}>
      {label[status] || status}
    </span>
  );
}

function StepButtons({ order, onStatusChange, updating }) {
  const currentIdx = statusIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const locked = awaitingCardPayment(order);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid #f3f4f6', marginTop: '0.5rem' }}>
      {STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isPast = idx < currentIdx;
        const isFuture = idx > currentIdx;
        // Orders only move one step forward (enforced by the backend too)
        const isNext = idx === currentIdx + 1;
        const isDisabled = updating || isCancelled || isActive || locked || !isNext;

        let bg = '#fff';
        let color = step.border;
        let border = `1px solid ${step.border}`;
        let borderRadius = '0';

        if (idx === 0) borderRadius = '0 0 0 10px';
        if (idx === 3) borderRadius = '0 0 10px 0';

        if (isActive) { bg = step.active; color = '#fff'; border = `1px solid ${step.active}`; }
        else if (isPast) { bg = '#fff'; color = '#9ca3af'; border = '1px solid #e5e7eb'; }
        else if (isFuture) { bg = '#fff'; color = step.border; border = `1px solid ${step.border}`; }

        if (isCancelled) { bg = '#fff'; color = '#d1d5db'; border = '1px solid #e5e7eb'; }

        return (
          <button
            key={step.backend}
            disabled={isDisabled}
            onClick={() => !isDisabled && onStatusChange(order.orderId, step.backend)}
            title={locked && !isCancelled ? 'Waiting for the customer\u2019s card payment' : undefined}
            style={{
              padding: '0.6rem 0', fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.04em', border, background: bg, color,
              cursor: isDisabled ? 'default' : 'pointer',
              borderRadius,
              transition: 'opacity 0.15s',
            }}
          >
            {step.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const [pendingChange, setPendingChange] = useState(null); // { order, status } awaiting confirmation

  // Ignore responses for a filter that is no longer selected (fast filter changes)
  useEffect(() => {
    let current = true;
    setLoading(true);
    setPage(1);
    adminGetOrders(statusFilter ? { status: statusFilter } : {})
      .then((r) => { if (current) setOrders(r.data); })
      .catch(() => { if (current) toast.error('Failed to load orders'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [statusFilter]);

  const requestStatusChange = (orderId, status) => {
    const order = orders.find((o) => o.orderId === orderId);
    if (order) setPendingChange({ order, status });
  };

  const handleStatusChange = async () => {
    const { order, status } = pendingChange;
    setUpdatingId(order.orderId);
    try {
      const { data } = await adminUpdateOrderStatus(order.orderId, status);
      setOrders((prev) => prev.map((o) => (o.orderId === order.orderId ? data : o)));
      toast.success('Status updated!');
      setPendingChange(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const safePage = clampPage(page, orders.length, pageSize);
  const paginated = useMemo(
    () => orders.slice((safePage - 1) * pageSize, safePage * pageSize),
    [orders, safePage, pageSize]
  );

  if (loading) return <LoadingSpinner />;


  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', paddingBottom: '3rem' }}>

      {/* Centered heading */}
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>Manage Orders</h1>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.75rem', padding: '0 1rem' }}>
        {/* Show per page */}
        <div style={{ position: 'relative' }}>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={selectStyle}
          >
            {[3, 5, 10].map((n) => <option key={n} value={n}>Show: {n}</option>)}
          </select>
          <FiChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">Status: All</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <FiChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
        </div>
      </div>

      {/* Order cards */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {paginated.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>No orders found</div>
        ) : paginated.map((order) => (
          <div key={order.orderId} style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #e5e7eb', overflow: 'hidden',
          }}>
            {/* Card header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem 0.75rem',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                    {order.userName}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                  Order {formatOrderNo(order.orderId)} &bull; {formatDate(order.orderDate)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f766e', marginBottom: 4 }}>
                  {formatLKR(order.totalAmount)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                  <PaymentBadge order={order} />
                  {['PENDING', 'PROCESSING'].includes(order.status) && (
                    <button
                      onClick={() => requestStatusChange(order.orderId, 'CANCELLED')}
                      disabled={updatingId === order.orderId}
                      style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel order
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#f3f4f6', margin: '0 1.25rem' }} />

            {/* Items */}
            <div style={{ padding: '0.75rem 1.25rem' }}>
              {(order.items || []).map((item) => (
                <div key={item.orderItemId} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.5rem 0',
                }}>
                  {item.product?.imageUrl ? (
                    <img
                      src={item.product.imageUrl} alt={item.product.name}
                      style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: 56, height: 56, background: '#f3f4f6',
                      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.4rem', flexShrink: 0,
                    }}>🪵</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                      {item.product?.name}
                    </div>
                    {item.product?.material && (
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>
                        {item.product.material}
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', flexShrink: 0 }}>
                    Qty {item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {order.shippingAddress && (
              <div style={{ margin: '0 1.25rem 0.75rem', padding: '0.6rem 0.8rem', background: '#f9fafb', borderRadius: 8, fontSize: '0.8rem', color: '#4b5563', lineHeight: 1.5 }}>
                <strong style={{ color: '#111827' }}>Deliver to:</strong> {order.shippingName}, {order.shippingAddress}, {order.shippingCity}
                {order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ''} &bull; {order.shippingPhone}
                {order.notes && <div style={{ fontStyle: 'italic', marginTop: 2 }}>Note: {order.notes}</div>}
              </div>
            )}
            {awaitingCardPayment(order) && order.status !== 'CANCELLED' && (
              <div style={{ margin: '0 1.25rem 0.75rem', fontSize: '0.78rem', color: '#b45309' }}>
                Waiting for the customer&rsquo;s card payment — the order can be processed once it&rsquo;s paid.
              </div>
            )}

            {/* Status step buttons */}
            <StepButtons
              order={order}
              onStatusChange={requestStatusChange}
              updating={updatingId === order.orderId}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{ maxWidth: 960, margin: '1.5rem auto 0', padding: '0 1rem' }}>
        <Pagination
          page={safePage}
          totalItems={orders.length}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="orders"
          style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}
        />
      </div>

      {pendingChange && (() => {
        const { order, status } = pendingChange;
        const goingBack = statusIndex(status) < statusIndex(order.status);
        const isFinal = status === 'DELIVERED';
        const isCancel = status === 'CANCELLED';
        const paidByCard = order.paymentMethod === 'CARD' && order.paymentStatus === 'COMPLETED';
        return (
          <ConfirmDialog
            title={isCancel ? 'Cancel this order?' : 'Change order status?'}
            message={
              <>
                Order <strong>{formatOrderNo(order.orderId)}</strong> ({order.userName}) will move from{' '}
                <strong>{stepLabel(order.status)}</strong> to <strong>{stepLabel(status)}</strong>.
                The customer will be notified.
                {goingBack && <div style={{ marginTop: 8, color: '#b45309' }}>This moves the order back to an earlier step.</div>}
                {isFinal && <div style={{ marginTop: 8, color: '#b45309' }}>Delivered is final — the status can't be changed afterwards.</div>}
                {isFinal && order.paymentMethod === 'CASH_ON_DELIVERY' && (
                  <div style={{ marginTop: 8 }}>Only confirm once the courier has collected {formatLKR(order.totalAmount)} in cash — it will be marked as paid.</div>
                )}
                {isCancel && <div style={{ marginTop: 8 }}>The items will be returned to stock. This can&rsquo;t be undone.</div>}
                {isCancel && paidByCard && (
                  <div style={{ marginTop: 8, color: '#b91c1c' }}>
                    This order was paid by card. Refund {formatLKR(order.totalAmount)} from your Stripe Dashboard (Payments → select the payment → Refund).
                  </div>
                )}
              </>
            }
            confirmLabel={isCancel ? 'Cancel order' : `Mark as ${stepLabel(status)}`}
            cancelLabel={isCancel ? 'Keep order' : 'Cancel'}
            tone={isCancel ? 'danger' : goingBack || isFinal ? 'warning' : 'primary'}
            loading={updatingId === order.orderId}
            onConfirm={handleStatusChange}
            onCancel={() => setPendingChange(null)}
          />
        );
      })()}

    </div>
  );
}

const selectStyle = {
  appearance: 'none', WebkitAppearance: 'none',
  padding: '0.55rem 2rem 0.55rem 0.9rem',
  border: '1px solid #e5e7eb', borderRadius: 8,
  background: '#f9fafb', fontSize: '0.875rem', color: '#374151',
  cursor: 'pointer', outline: 'none', fontWeight: 500,
};
