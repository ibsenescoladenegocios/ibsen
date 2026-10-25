import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setCsrf, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    api.get('/api/auth/me')
      .then((d) => { setCsrf(d.csrf); setUser(d.user); })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await api.post('/api/auth/login', { email, password });
    setCsrf(d.csrf);
    setUser(d.user);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout'); } catch { /* ignora */ }
    const d = await api.get('/api/auth/me').catch(() => null);
    if (d) setCsrf(d.csrf);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, setUser }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
