import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { newSession, endSession, sessionVersion } from '../services/session.js';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  useEffect(() => {
    const end = () => {
      setUsuario(null);
      setExpiresAt(null);
      setError('');
      setLoading(false);
    };
    window.addEventListener('cafe-nube:session-ended', end);
    return () => window.removeEventListener('cafe-nube:session-ended', end);
  }, []);
  useEffect(() => {
    let active = true;
    const version = sessionVersion();
    api
      .get('/auth/me')
      .then((user) => {
        if (active && version === sessionVersion()) {
          setUsuario(user);
          setExpiresAt(user.expiresAt);
        }
      })
      .catch((e) => {
        if (active && e.status !== 401) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!expiresAt) return;
    const version = sessionVersion();
    const timer = setTimeout(
      () => endSession(version),
      Math.max(0, Math.min(Date.parse(expiresAt) - Date.now(), 2147483647)),
    );
    return () => clearTimeout(timer);
  }, [expiresAt]);
  async function login(data) {
    const result = await api.create('/auth/login', data);
    newSession();
    setUsuario(result.usuario);
    setExpiresAt(result.expiresAt);
    setError('');
    setLoading(false);
    return result.usuario;
  }
  async function logout() {
    await api.create('/auth/logout', {});
    endSession();
  }
  return (
    <AuthContext.Provider value={{ usuario, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
