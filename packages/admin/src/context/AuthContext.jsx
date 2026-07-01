import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthCtx = createContext();

export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      API.get('/auth/me')
        .then((r) => {
          const u = r.data.data || r.data.user;
          if (r.data.success && u?.role === 'admin') setUser(u);
          else logout();
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    const user = data.data || data.user;
    if (data.success && user?.role === 'admin') {
      localStorage.setItem('admin_token', data.token);
      setUser(user);
      return true;
    }
    throw new Error('Admin access required');
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
