import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { getToken, saveToken, clearToken } from '../services/session.js';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');
  useEffect(() => {
    const end = () => {
      setToken(null);
      setUsuario(null);
      setLoading(false);
    };
    window.addEventListener('cafe-nube:session-ended', end);
    return () => window.removeEventListener('cafe-nube:session-ended', end);
  }, []);
  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    api
      .get('/auth/me')
      .then((user) => {
        if (active) setUsuario(user);
      })
      .catch((e) => {
        if (active) {
          setUsuario(null);
          setError(e.status === 401 ? 'Su sesión terminó. Inicie sesión nuevamente.' : e.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    let timer;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const ms = payload.exp * 1000 - Date.now();
      timer = setTimeout(() => clearToken(token), Math.max(0, Math.min(ms, 2147483647)));
    } catch {
      clearToken(token);
    }
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [token]);
  async function login(data) {
    const result = await api.create('/auth/login', data);
    saveToken(result.token);
    setUsuario(result.usuario);
    setToken(result.token);
    return result.usuario;
  }
  function logout() {
    clearToken();
  }
  return (
    <AuthContext.Provider value={{ token, usuario, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
