import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(api.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (api.getToken()) {
      api.getMe().then(d => { setUser(d.user); api.setAuth(api.getToken(), d.user); })
        .catch(() => { api.clearAuth(); setUser(null); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (email, password) => {
    const d = await api.login(email, password);
    api.setAuth(d.token, d.user); setUser(d.user); return d;
  };
  const signup = async (name, email, password, role) => {
    const d = await api.signup(name, email, password, role);
    api.setAuth(d.token, d.user); setUser(d.user); return d;
  };
  const logout = () => { api.clearAuth(); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
