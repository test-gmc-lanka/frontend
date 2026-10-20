import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import ForgotPasswordModal from './components/auth/ForgotPasswordModal';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AppointmentPage from './pages/AppointmentPage';
import ProfilePage from './pages/ProfilePage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminMaintenance from './pages/admin/AdminMaintenance';
import TechnicianTasks from './pages/technician/TechnicianTasks';

// Where each role lands after login (and when opening a page meant for another role)
export function homeFor(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'TECHNICIAN') return '/technician/tasks';
  return '/';
}

function ProtectedRoute({ children, allowedRoles, onLoginRequired }) {
  const { user } = useAuth();
  const location = useLocation();
  const loggedOut = !user;
  useEffect(() => {
    // e.g. a link from an email: ask them to log in, then bring them back here
    if (loggedOut) onLoginRequired?.(location.pathname + location.search);
  }, [loggedOut]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loggedOut) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

// Remount the page when the order id changes so no state (e.g. a card form) leaks between orders
function OrderDetailRoute() {
  const { id } = useParams();
  return <OrderDetailPage key={id} />;
}

function AppRoutes() {
  const [modal, setModal] = useState(null);
  const { isAdmin, isTechnician } = useAuth();

  // Wood colours for the shop; admins and technicians keep the original palette
  useEffect(() => {
    document.body.classList.toggle('shop-theme', !isAdmin && !isTechnician);
  }, [isAdmin, isTechnician]);

  const navigate = useNavigate();
  const [returnTo, setReturnTo] = useState(null);
  const openLogin = () => setModal('login');
  const requireLogin = (path) => {
    setReturnTo(path);
    setModal('login');
  };

  // After login/registration: back to the page they wanted, or their role's home
  const handleLoggedIn = (data) => {
    setModal(null);
    const target = returnTo;
    setReturnTo(null);
    if (target) navigate(target);
    else if (data.role !== 'CUSTOMER') navigate(homeFor(data.role));
  };
  const openRegister = () => setModal('register');
  const closeModal = () => setModal(null);

  return (
    <>
      <Navbar onLoginClick={openLogin} onRegisterClick={openRegister} />

      {modal === 'login' && (
        <LoginModal
          onClose={() => {
            setReturnTo(null);
            closeModal();
          }}
          onLoggedIn={handleLoggedIn}
          onSwitchToRegister={() => setModal('register')}
          onForgotPassword={() => setModal('forgot')}
        />
      )}
      {modal === 'forgot' && <ForgotPasswordModal onClose={closeModal} onBackToLogin={() => setModal('login')} />}
      {modal === 'register' && (
        <RegisterModal
          onClose={() => {
            setReturnTo(null);
            closeModal();
          }}
          onRegistered={handleLoggedIn}
          onSwitchToLogin={() => setModal('login')}
        />
      )}

      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage onLoginClick={openLogin} />} />
        <Route path="/products" element={<ProductsPage onLoginClick={openLogin} />} />
        <Route path="/about" element={<AboutPage onLoginClick={openLogin} />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/products/:id" element={<ProductDetailPage onLoginClick={openLogin} />} />
        <Route
          path="/reset-password"
          element={<ResetPasswordPage onLoginClick={openLogin} onForgotPassword={() => setModal('forgot')} />}
        />

        {/* Customer routes */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute onLoginRequired={requireLogin} allowedRoles={['CUSTOMER']}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute onLoginRequired={requireLogin} allowedRoles={['CUSTOMER']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute onLoginRequired={requireLogin} allowedRoles={['CUSTOMER']}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute onLoginRequired={requireLogin} allowedRoles={['CUSTOMER']}>
              <OrderDetailRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute onLoginRequired={requireLogin} allowedRoles={['CUSTOMER']}>
              <AppointmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute onLoginRequired={requireLogin}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute onLoginRequired={requireLogin} allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="maintenance" element={<AdminMaintenance />} />
        </Route>

        {/* Technician routes */}
        <Route
          path="/technician/tasks"
          element={
            <ProtectedRoute onLoginRequired={requireLogin} allowedRoles={['TECHNICIAN']}>
              <TechnicianTasks />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isAdmin && !isTechnician && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#15232e',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              boxShadow: '0 10px 30px rgba(15, 42, 63, 0.12)',
            },
            success: { iconTheme: { primary: '#15935a', secondary: '#fff' } },
            error: { iconTheme: { primary: '#e23b3b', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
