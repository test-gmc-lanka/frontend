import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPackage, FiFilter, FiArrowRight,
  FiChevronLeft, FiChevronRight,
  FiMail, FiPhone, FiMapPin,
} from 'react-icons/fi';
import { getMyOrders } from '../api/orders';
import { formatLKR, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
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
  PENDING:    { background: '#fef3c7', color: '#d97706' },
  PROCESSING: { background: '#dbeafe', color: '#1d4ed8' },
  SHIPPED:    { background: '#ede9fe', color: '#5b21b6' },
  DELIVERED:  { background: '#d1fae5', color: '#065f46' },
  CANCELLED:  { background: '#fee2e2', color: '#dc2626' },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLE[status] || { background: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      ...style,
      display: 'inline-block',
      padding: '0.3rem 0.875rem',
      borderRadius: 999,
      fontSize: '0.8rem',
      fontWeight: 600,
    }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

/* ── Pagination button ──────────────────────────────────────────────────── */
function PagBtn({ active, disabled, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${active ? '#1e3a5c' : '#d1d5db'}`,
        borderRadius: 6,
        background: active ? '#1e3a5c' : '#fff',
        color: active ? '#fff' : '#374151',
        fontSize: '0.875rem', fontWeight: active ? 700 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

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

  useEffect(() => { setPage(1); }, [statusFilter]);

  const filtered = useMemo(
    () => (statusFilter ? orders.filter((o) => o.status === statusFilter) : orders),
    [orders, statusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, filtered.length);

  if (loading) return <div style={{ background: '#eef2f7', minHeight: '100vh' }}><LoadingSpinner /></div>;

  return (
    <div style={{ background: '#eef2f7', minHeight: '100vh', color: '#111827' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* ── Breadcrumb ────────────────────────────────────────────────── */}
        <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', color: '#9ca3af', marginBottom: '0.75rem' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>ACCOUNT</span>
          <span style={{ margin: '0 0.4rem' }}>›</span>
          <span style={{ color: '#1e3a5c' }}>ORDERS</span>
        </div>

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>My Orders</h1>
          {/* Status filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FiFilter size={15} style={{ position: 'absolute', left: '0.75rem', color: '#6b7280', pointerEvents: 'none' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                appearance: 'none', border: '1px solid #d1d5db', borderRadius: 8,
                padding: '0.5rem 2.5rem 0.5rem 2.25rem',
                fontSize: '0.875rem', fontWeight: 600, color: '#374151',
                background: '#fff', cursor: 'pointer',
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
            <FiChevronRight size={14} style={{ position: 'absolute', right: '0.75rem', color: '#6b7280', pointerEvents: 'none', transform: 'rotate(90deg)' }} />
          </div>
        </div>

        {/* ── Orders table card ─────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '4rem', textAlign: 'center' }}>
            <FiPackage size={40} style={{ color: '#9ca3af', display: 'block', margin: '0 auto 1rem' }} />
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>No orders found</div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
              {statusFilter ? 'Try a different status filter' : 'Start shopping to see your orders here'}
            </div>
            <button
              onClick={() => navigate('/')}
              style={{ background: '#1e3a5c', color: '#fff', border: 'none', borderRadius: 6, padding: '0.65rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Shop Now
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>

            {/* Table */}
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
                        #GMC-{1000 + order.orderId}
                      </span>
                    </td>
                    {/* Date */}
                    <td style={{ padding: '1.125rem 1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {formatDate(order.orderDate)}
                    </td>
                    {/* Total */}
                    <td style={{ padding: '1.125rem 1.25rem', fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                      {formatLKR(order.totalAmount)}
                    </td>
                    {/* Status */}
                    <td style={{ padding: '1.125rem 1.25rem' }}>
                      <StatusBadge status={order.status} />
                    </td>
                    {/* Action */}
                    <td style={{ padding: '1.125rem 1.25rem' }}>
                      <button
                        onClick={() => navigate(`/orders/${order.orderId}`)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#1e3a5c', fontWeight: 600, fontSize: '0.875rem',
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
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

            {/* Pagination row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                Showing {startIdx} to {endIdx} of {filtered.length} order{filtered.length !== 1 ? 's' : ''}
              </span>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <PagBtn disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <FiChevronLeft size={14} />
                  </PagBtn>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                    <PagBtn key={n} active={page === n} onClick={() => setPage(n)}>{n}</PagBtn>
                  ))}
                  <PagBtn disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    <FiChevronRight size={14} />
                  </PagBtn>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #d1d5db', background: '#eef2f7', marginTop: '2rem' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.5rem' }}>
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
        <div style={{ borderTop: '1px solid #d1d5db', padding: '1rem 1.5rem', maxWidth: 1120, margin: '0 auto' }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>© 2024 GMC Lanka. Engineered for Excellence.</span>
        </div>
      </div>
    </div>
  );
}
