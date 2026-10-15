import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
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

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const [modal, setModal] = useState(null);
  const { user, isAdmin, isTechnician } = useAuth();

  const openLogin = () => setModal('login');
  const openRegister = () => setModal('register');
  const closeModal = () => setModal(null);

  return (
    <>
      <Navbar onLoginClick={openLogin} onRegisterClick={openRegister} />

      {modal === 'login' && (
        <LoginModal onClose={closeModal} onSwitchToRegister={() => setModal('register')} />
      )}
      {modal === 'register' && (
        <RegisterModal onClose={closeModal} onSwitchToLogin={() => setModal('login')} />
      )}

      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage onLoginClick={openLogin} />} />
        <Route path="/products/:id" element={<ProductDetailPage onLoginClick={openLogin} />} />

        {/* Customer routes */}
        <Route path="/cart" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CartPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><AppointmentPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="maintenance" element={<AdminMaintenance />} />
        </Route>

        {/* Technician routes */}
        <Route path="/technician/tasks" element={<ProtectedRoute allowedRoles={['TECHNICIAN']}><TechnicianTasks /></ProtectedRoute>} />

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
