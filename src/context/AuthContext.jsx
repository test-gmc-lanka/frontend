import { createContext, useContext, useState, useEffect } from 'react';
import { logout as apiLogout } from '../api/auth';
import { getProfile } from '../api/users';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [cartVersion, setCartVersion] = useState(0);
  const refreshCart = () => setCartVersion((v) => v + 1);

  const saveUser = (u) => {
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const login = (data) => {
    localStorage.setItem('accessToken', data.accessToken);
    saveUser({
      userId: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      profileImageUrl: data.profileImageUrl || null,
    });
  };

  // Merge profile changes (name, photo) so the navbar and sidebar update immediately
  const updateUser = (patch) =>
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });

  // Sessions saved before profile photos existed lack profileImageUrl/email; sync once on load
  const userId = user?.userId;
  useEffect(() => {
    if (!userId) return;
    getProfile()
      .then(({ data }) =>
        updateUser({ name: data.name, email: data.email, profileImageUrl: data.profileImageUrl || null }),
      )
      .catch(() => {
        /* the axios interceptor handles expired sessions */
      });
  }, [userId]);

  // Session ended elsewhere: refresh token expired (axios interceptor) or logout in another tab
  useEffect(() => {
    const clear = () => setUser(null);
    const onStorage = (e) => {
      if (e.key === 'user' && !e.newValue) clear();
      if (e.key === 'user' && e.newValue) setUser(JSON.parse(e.newValue));
    };
    window.addEventListener('auth:logout', clear);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth:logout', clear);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateUser, isAdmin, isTechnician, isCustomer, cartVersion, refreshCart }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
