import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getCart } from '../../api/cart';
import Avatar from '../common/Avatar';
import NotificationBell from './NotificationBell';
import logo from '../../assets/gmc-logo.png';

// Shop pages for customers and visitors
const SHOP_LINKS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/products', label: 'Products' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];
const CUSTOMER_LINKS = [
  { to: '/orders', label: 'My Orders' },
  { to: '/appointments', label: 'Appointments' },
];
const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/appointments', label: 'Appointments' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/feedback', label: 'Feedback' },
  { to: '/admin/maintenance', label: 'Maintenance' },
];
const TECHNICIAN_LINKS = [{ to: '/technician/tasks', label: 'My Tasks' }];

export default function Navbar({ onLoginClick, onRegisterClick }) {
  const { user, logout, isAdmin, isTechnician, cartVersion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isStaff = isAdmin || isTechnician;

  useEffect(() => {
    if (user && !isStaff) {
      getCart()
        .then((r) => setCartCount(r.data.items?.length || 0))
        .catch(() => {});
    } else {
      setCartCount(0);
    }
  }, [user, isStaff, cartVersion]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = ({ to, exact }) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);

  const links = isAdmin
    ? ADMIN_LINKS
    : isTechnician
      ? TECHNICIAN_LINKS
      : [...SHOP_LINKS, ...(user ? CUSTOMER_LINKS : [])];

  const renderLinks = () =>
    links.map((l) => (
      <Link
        key={l.to}
        to={l.to}
        className={`nav-link${isActive(l) ? ' active' : ''}`}
        aria-current={isActive(l) ? 'page' : undefined}
      >
        {l.label}
      </Link>
    ));

  return (
    // Wood for the shop, brushed steel for admins and technicians
    <nav className={`site-nav${isStaff ? ' site-nav--metal' : ''}`} aria-label="Main">
      <div className="container flex items-center justify-between" style={{ height: '100%', gap: '1rem' }}>
        <Link to={isAdmin ? '/admin' : isTechnician ? '/technician/tasks' : '/'} className="nav-brand">
          <span className="nav-logo-plate">
            <img src={logo} alt="GMC Lanka" className="nav-logo" />
          </span>
          {isAdmin && <span className="nav-role">ADMIN</span>}
          {isTechnician && <span className="nav-role">TECHNICIAN</span>}
        </Link>

        {/* Desktop links (moved into the menu panel on narrow screens) */}
        <div className="flex items-center navbar-links" style={{ gap: isAdmin ? '1.25rem' : '1.75rem' }}>
          {renderLinks()}
        </div>

        <div className="flex items-center" style={{ gap: '1.1rem' }}>
          {user && !isStaff && (
            <Link
              to="/cart"
              style={{ position: 'relative', color: 'var(--nav-fg)', display: 'flex' }}
              title="Cart"
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            >
              <FiShoppingCart size={21} />
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -7,
                    right: -8,
                    background: 'linear-gradient(180deg, #f3f5f7, #b9c1c8)',
                    color: 'var(--wood-900)',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  {cartCount}
                </span>
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    padding: 0,
                    overflow: 'hidden',
                    background: 'transparent',
                    border: '1.5px solid var(--border-light)',
                    cursor: 'pointer',
                    color: 'var(--nav-fg)',
                  }}
                  title={user.name}
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                >
                  {user.profileImageUrl ? (
                    <Avatar src={user.profileImageUrl} name={user.name} size={31} />
                  ) : (
                    <FiUser size={18} />
                  )}
                </button>

                {dropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 12px)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      minWidth: 200,
                      boxShadow: 'var(--shadow)',
                      overflow: 'hidden',
                      zIndex: 200,
                    }}
                  >
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} style={dropdownItemStyle}>
                      Profile
                    </Link>
                    {!isStaff && (
                      <>
                        <Link to="/orders" onClick={() => setDropdownOpen(false)} style={dropdownItemStyle}>
                          My Orders
                        </Link>
                        <Link to="/appointments" onClick={() => setDropdownOpen(false)} style={dropdownItemStyle}>
                          Appointments
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      style={{ ...dropdownItemStyle, borderTop: '1px solid var(--border)', color: '#b91c1c' }}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="nav-text-btn nav-hide-xs">
                Logout
              </button>
            </>
          ) : (
            <div className="flex" style={{ gap: '0.5rem' }}>
              <button className="nav-btn nav-btn--ghost" onClick={onLoginClick}>
                Login
              </button>
              <button className="nav-btn nav-btn--solid nav-hide-xs" onClick={onRegisterClick}>
                Sign Up
              </button>
            </div>
          )}

          <button
            type="button"
            className="nav-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="nav-panel"
          >
            {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="nav-panel" className="nav-panel">
          {renderLinks()}
          {!user && (
            <button
              className="nav-btn nav-btn--solid"
              style={{ marginTop: '0.9rem', alignSelf: 'flex-start' }}
              onClick={() => {
                setMenuOpen(false);
                onRegisterClick();
              }}
            >
              Sign Up
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

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
  textDecoration: 'none',
  font: 'inherit',
};
