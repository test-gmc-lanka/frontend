import { NavLink, Outlet } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiShoppingBag, FiUsers, FiCalendar,
  FiMessageSquare, FiTool,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';

const navItems = [
  { to: '/admin', icon: <FiGrid />, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: <FiPackage />, label: 'Products' },
  { to: '/admin/orders', icon: <FiShoppingBag />, label: 'Orders' },
  { to: '/admin/users', icon: <FiUsers />, label: 'Users' },
  { to: '/admin/appointments', icon: <FiCalendar />, label: 'Appointments' },
  { to: '/admin/feedback', icon: <FiMessageSquare />, label: 'Feedback' },
  { to: '/admin/maintenance', icon: <FiTool />, label: 'Maintenance' },
];

export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ padding: '0 1.5rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Admin Panel
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Avatar src={user?.profileImageUrl} name={user?.name} size={32} />
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
          </div>
        </div>
        <nav style={{ marginTop: '0.75rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
