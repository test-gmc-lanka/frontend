import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiPackage, FiFilter, FiArrowRight, FiChevronRight } from 'react-icons/fi';
import { getMyOrders } from '../api/orders';
import { formatLKR, formatDate, formatOrderNo } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination, { clampPage } from '../components/common/Pagination';
import toast from 'react-hot-toast';

const PAGE_SIZE = 4;

/* ── Status display helpers ─────────────────────────────────────────────── */
const STATUS_LABEL = {
  PENDING: 'Pending',
  PROCESSING: 'In Progress',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE = {
  PENDING: { background: '#fef3c7', color: '#d97706' },
  PROCESSING: { background: '#dbeafe', color: '#1d4ed8' },
  SHIPPED: { background: '#ede9fe', color: '#5b21b6' },
  DELIVERED: { background: '#d1fae5', color: '#065f46' },
  CANCELLED: { background: '#fee2e2', color: '#dc2626' },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLE[status] || { background: '#f3f4f6', color: '#374151' };
  return (
    <span
      style={{
        ...style,
        display: 'inline-block',
        padding: '0.3rem 0.875rem',
        borderRadius: 999,
        fontSize: '0.8rem',
        fontWeight: 600,
      }}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

/* ── Pagination button ──────────────────────────────────────────────────── */

/* ── Component ──────────────────────────────────────────────────────────── */
export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    getMyOrders()
      .then((r) => setOrders(r.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const filtered = useMemo(
    () => (statusFilter ? orders.filter((o) => o.status === statusFilter) : orders),
    [orders, statusFilter],
  );

  const safePage = clampPage(page, filtered.length, PAGE_SIZE);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (loading)
    return (
      <div style={{ background: '#eef2f7', minHeight: '100vh' }}>
        <LoadingSpinner />
      </div>
    );

  return (
    <div style={{ background: '#eef2f7', minHeight: '100vh', color: '#111827' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* ── Breadcrumb ────────────────────────────────────────────────── */}
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: '#9ca3af',
            marginBottom: '0.75rem',
          }}
        >
          <Link to="/profile" style={{ color: 'inherit', textDecoration: 'none' }}>
            ACCOUNT
          </Link>
          <span style={{ margin: '0 0.4rem' }}>›</span>
          <span style={{ color: '#1e3a5c' }}>ORDERS</span>
        </div>

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>My Orders</h1>
          {/* Status filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FiFilter
              size={15}
              style={{ position: 'absolute', left: '0.75rem', color: '#6b7280', pointerEvents: 'none' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                appearance: 'none',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '0.5rem 2.5rem 0.5rem 2.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">In Progress</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            {/* Chevron icon */}
            <FiChevronRight
              size={14}
              style={{
                position: 'absolute',
                right: '0.75rem',
                color: '#6b7280',
                pointerEvents: 'none',
                transform: 'rotate(90deg)',
              }}
            />
          </div>
        </div>

        {/* ── Orders table card ─────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              padding: '4rem',
              textAlign: 'center',
            }}
          >
            <FiPackage size={40} style={{ color: '#9ca3af', display: 'block', margin: '0 auto 1rem' }} />
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>No orders found</div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
              {statusFilter ? 'Try a different status filter' : 'Start shopping to see your orders here'}
            </div>
            <button
              onClick={() => navigate('/')}
              style={{
                background: '#1e3a5c',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '0.65rem 1.5rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Shop Now
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {/* Table */}
            <div className="scroll-x">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                    {['ORDER ID', 'DATE', 'TOTAL', 'STATUS', 'ACTION'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.875rem 1.25rem',
                          textAlign: 'left',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          color: '#9ca3af',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((order, idx) => (
                    <tr
                      key={order.orderId}
                      style={{ borderBottom: idx < paginated.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    >
                      {/* Order ID */}
                      <td style={{ padding: '1.125rem 1.25rem' }}>
                        <span style={{ fontWeight: 700, color: '#1e3a5c', fontSize: '0.9rem' }}>
                          {formatOrderNo(order.orderId)}
                        </span>
                      </td>
                      {/* Date */}
                      <td style={{ padding: '1.125rem 1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        {formatDate(order.orderDate)}
                      </td>
                      {/* Total */}
                      <td
                        style={{ padding: '1.125rem 1.25rem', fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}
                      >
                        {formatLKR(order.totalAmount)}
                      </td>
                      {/* Status */}
                      <td style={{ padding: '1.125rem 1.25rem' }}>
                        <StatusBadge status={order.status} />
                        {order.paymentMethod === 'CARD' &&
                          order.paymentStatus !== 'COMPLETED' &&
                          order.status !== 'CANCELLED' && (
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', marginTop: 4 }}>
                              Awaiting payment
                            </div>
                          )}
                      </td>
                      {/* Action */}
                      <td style={{ padding: '1.125rem 1.25rem' }}>
                        <button
                          onClick={() => navigate(`/orders/${order.orderId}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#1e3a5c',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: 0,
                          }}
                        >
                          View Details <FiArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination row */}
            <Pagination
              page={safePage}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="orders"
              style={{ borderTop: '1px solid #f1f5f9' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
