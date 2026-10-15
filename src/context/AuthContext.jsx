import { createContext, useContext, useState, useEffect } from 'react';
import { logout as apiLogout } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [cartVersion, setCartVersion] = useState(0);
  const refreshCart = () => setCartVersion((v) => v + 1);

  const login = (data) => {
    localStorage.setItem('accessToken', data.accessToken);
    const u = { userId: data.userId, name: data.name, email: data.email, role: data.role };
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const logout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isTechnician, isCustomer, cartVersion, refreshCart }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
