import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
export default function RutaProtegida() {
  const { token, usuario, loading, error, logout } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="auth-loading" role="status">
        Comprobando su sesión…
      </div>
    );
  if (!token) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!usuario)
    return (
      <div className="auth-loading">
        <p role="alert">{error || 'No fue posible comprobar la sesión.'}</p>
        <button className="button primary" onClick={logout}>
          Volver al login
        </button>
      </div>
    );
  return <Outlet />;
}
