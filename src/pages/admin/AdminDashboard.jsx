import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiDollarSign, FiClock, FiCalendar, FiUsers, FiPackage, FiAlertTriangle } from 'react-icons/fi';
import { getDashboard } from '../../api/admin';
import { formatLKR } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

// Most urgent first; the full list is on the Products page
const LOW_STOCK_LIMIT = 10;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((r) => setStats(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const statCards = [
    { icon: <FiShoppingBag />, label: 'Total Orders', value: stats?.totalOrders ?? 0, cls: 'stat-icon-teal' },
    { icon: <FiDollarSign />, label: 'Total Revenue', value: formatLKR(stats?.totalRevenue), cls: 'stat-icon-green' },
    { icon: <FiClock />, label: 'Pending Orders', value: stats?.pendingOrders ?? 0, cls: 'stat-icon-orange' },
    { icon: <FiCalendar />, label: 'Appointments Today', value: stats?.appointmentsToday ?? 0, cls: 'stat-icon-blue' },
    { icon: <FiUsers />, label: 'Total Users', value: stats?.totalUsers ?? 0, cls: 'stat-icon-teal' },
    { icon: <FiPackage />, label: 'Total Products', value: stats?.totalProducts ?? 0, cls: 'stat-icon-blue' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Overview of GMC Lanka Creations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        {statCards.map((s, i) => (
          <div key={i} className="card">
            <div className="stat-card">
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {stats?.lowStockProducts?.length > 0 && (
        <div className="card">
          <div className="section-header">
            <h3 className="section-title flex items-center gap-2">
              <FiAlertTriangle color="var(--warning)" /> Low Stock Alert
            </h3>
            <span className="badge badge-pending">{stats.lowStockProducts.length} products</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Material</th>
                  <th>Stock</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {[...stats.lowStockProducts]
                  .sort((a, b) => a.stockQuantity - b.stockQuantity)
                  .slice(0, LOW_STOCK_LIMIT)
                  .map((p) => (
                    <tr key={p.productId}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td>{p.category?.name || '-'}</td>
                      <td>{p.material || '-'}</td>
                      <td>
                        <span
                          style={{ color: p.stockQuantity === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}
                        >
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td>{formatLKR(p.price)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {stats.lowStockProducts.length > LOW_STOCK_LIMIT && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  borderTop: '1px solid var(--border)',
                }}
              >
                Showing the {LOW_STOCK_LIMIT} lowest of {stats.lowStockProducts.length}.{' '}
                <Link to="/admin/products" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  View all products
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
