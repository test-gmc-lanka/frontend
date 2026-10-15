import { useState, useEffect, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { adminGetOrders, adminUpdateOrderStatus } from '../../api/orders';
import { formatLKR, formatDate, getErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

/* Map backend statuses to the 4-step display */
const STEPS = [
  { label: 'PENDING',     backend: 'PENDING',     active: '#f59e0b', border: '#f59e0b' },
  { label: 'IN PROGRESS', backend: 'PROCESSING',  active: '#f97316', border: '#f97316' },
  { label: 'COMPLETED',   backend: 'SHIPPED',      active: '#16a34a', border: '#16a34a' },
  { label: 'DELIVERED',   backend: 'DELIVERED',    active: '#0f766e', border: '#0f766e' },
];

const STATUS_ORDER = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

function statusIndex(backend) {
  return STATUS_ORDER.indexOf(backend);
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
    PENDING: 'PENDING', PROCESSING: 'IN PROGRESS',
    SHIPPED: 'COMPLETED', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED',
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid #f3f4f6', marginTop: '0.5rem' }}>
      {STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isPast = idx < currentIdx;
        const isFuture = idx > currentIdx;
        const isDisabled = updating || isCancelled || (isActive);

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

  const fetchOrders = (sf) =>
    adminGetOrders(sf ? { status: sf } : {})
      .then((r) => setOrders(r.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));

  useEffect(() => { setLoading(true); setPage(1); fetchOrders(statusFilter); }, [statusFilter]);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const { data } = await adminUpdateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? data : o)));
      toast.success('Status updated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => orders.slice((safePage - 1) * pageSize, safePage * pageSize),
    [orders, safePage, pageSize]
  );

  if (loading) return <LoadingSpinner />;

  /* page number buttons — show at most 5 around current */
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1);

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
            <option value="PROCESSING">In Progress</option>
            <option value="SHIPPED">Completed</option>
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
                  Order #GMC-{1000 + order.orderId} &bull; {formatDate(order.orderDate)}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f766e' }}>
                Rs. {order.totalAmount?.toLocaleString()}
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

            {/* Status step buttons */}
            <StepButtons
              order={order}
              onStatusChange={handleStatusChange}
              updating={updatingId === order.orderId}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: '2rem' }}>
          <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
            <FiChevronLeft size={15} />
          </PagBtn>
          {pageNums.map((n) => (
            <PagBtn key={n} active={n === safePage} onClick={() => setPage(n)}>
              {n}
            </PagBtn>
          ))}
          <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
            <FiChevronRight size={15} />
          </PagBtn>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: '4rem', borderTop: '1px solid #e5e7eb',
        padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>GMC Lanka Admin</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
            &copy; 2024 Industrial Modernism Corp. All rights reserved.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Privacy Policy', 'Terms of Service', 'System Status', 'Technical Support'].map((t) => (
            <a key={t} href="#" style={{ fontSize: '0.8rem', color: '#9ca3af', textDecoration: 'none' }}>{t}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36, height: 36, borderRadius: 8,
        border: active ? 'none' : '1px solid #e5e7eb',
        background: active ? '#0f766e' : '#fff',
        color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
        fontWeight: active ? 700 : 500, fontSize: '0.875rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

const selectStyle = {
  appearance: 'none', WebkitAppearance: 'none',
  padding: '0.55rem 2rem 0.55rem 0.9rem',
  border: '1px solid #e5e7eb', borderRadius: 8,
  background: '#f9fafb', fontSize: '0.875rem', color: '#374151',
  cursor: 'pointer', outline: 'none', fontWeight: 500,
};
