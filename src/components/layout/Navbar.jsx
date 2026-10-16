import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiUser } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getCart } from '../../api/cart';
import Avatar from '../common/Avatar';
import NotificationBell from './NotificationBell';

export default function Navbar({ onLoginClick, onRegisterClick }) {
  const { user, logout, isAdmin, isTechnician, cartVersion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user && !isAdmin && !isTechnician) {
      getCart()
        .then((r) => setCartCount(r.data.items?.length || 0))
        .catch(() => {});
    } else {
      setCartCount(0);
    }
  }, [user, isAdmin, isTechnician, cartVersion]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const link = (to, label, exact = false) => (
    <Link to={to} style={isActive(to, exact) ? navLinkActive : navLinkStyle}>
      {label}
    </Link>
  );

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
      height: '66px',
    }}>
      <div className="container flex items-center justify-between" style={{ height: '100%' }}>
        {/* Logo */}
        <Link to={isAdmin ? '/admin' : '/'} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span style={{
            fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem',
            letterSpacing: '0.02em',
            color: isAdmin ? 'var(--color-primary)' : 'var(--text-primary)',
          }}>
            {isAdmin ? 'ADMINPANEL' : 'GMC LANKA'}
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="flex items-center navbar-links" style={{ gap: '2rem' }}>
          {!isAdmin && !isTechnician && (
            <>
              {link('/', 'Products', true)}
              {user && (
                <>
                  {link('/orders', 'My Orders')}
                  {link('/appointments', 'Appointments')}
                </>
              )}
            </>
          )}
          {isAdmin && (
            <>
              {link('/admin', 'Dashboard', true)}
              {link('/admin/products', 'Products')}
              {link('/admin/orders', 'Orders')}
              {link('/admin/appointments', 'Appointments')}
              {link('/admin/users', 'Users')}
            </>
          )}
          {isTechnician && link('/technician/tasks', 'My Tasks')}
        </div>

        {/* Right actions */}
        <div className="flex items-center" style={{ gap: '1.5rem' }}>
          {user && !isAdmin && !isTechnician && (
            <Link to="/cart" style={{ position: 'relative', color: 'var(--text-secondary)', display: 'flex' }} title="Cart">
              <FiShoppingCart size={21} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -7, right: -8,
                  background: 'var(--color-primary)', color: '#fff',
                  borderRadius: '50%', width: 18, height: 18,
                  fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700,
                }}>{cartCount}</span>
              )}
            </Link>
          )}

          {user ? (
            <>
              <NotificationBell key={user.userId} />
              <div ref={dropdownRef} style={{ position: 'relative', display: 'flex' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: '50%', padding: 0, overflow: 'hidden',
                    background: 'transparent', border: '1.5px solid var(--border-light)',
                    cursor: 'pointer', color: 'var(--text-secondary)',
                  }}
                  title={user.name}
                  aria-label="Account menu"
                >
                  {user.profileImageUrl
                    ? <Avatar src={user.profileImageUrl} name={user.name} size={31} />
                    : <FiUser size={18} />}
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', minWidth: 190, boxShadow: 'var(--shadow)',
                    overflow: 'hidden', zIndex: 200,
                  }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} style={dropdownItemStyle}>Profile</Link>
                    {!isAdmin && !isTechnician && (
                      <>
                        <Link to="/orders" onClick={() => setDropdownOpen(false)} style={dropdownItemStyle}>My Orders</Link>
                        <Link to="/appointments" onClick={() => setDropdownOpen(false)} style={dropdownItemStyle}>Appointments</Link>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button onClick={handleLogout} style={logoutStyle}>Logout</button>
            </>
          ) : (
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm" onClick={onLoginClick}>Login</button>
              <button className="btn btn-primary btn-sm" onClick={onRegisterClick}>Sign Up</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const navLinkStyle = {
  color: 'var(--text-secondary)',
  fontSize: '0.92rem',
  fontWeight: 500,
  transition: 'color 0.2s',
  padding: '0.25rem 0',
  borderBottom: '2px solid transparent',
};

const navLinkActive = {
  ...navLinkStyle,
  color: 'var(--color-primary)',
  fontWeight: 600,
  borderBottom: '2px solid var(--color-primary)',
};

const logoutStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  fontSize: '0.92rem',
  fontWeight: 500,
  cursor: 'pointer',
};

const dropdownItemStyle = {
  display: 'block',
  padding: '0.65rem 1rem',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left',
  transition: 'background 0.15s',
};
