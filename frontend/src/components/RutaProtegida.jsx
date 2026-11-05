import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
export default function RutaProtegida() {
  const { usuario, loading, error } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="auth-loading" role="status">
        Comprobando su sesión…
      </div>
    );
  if (!usuario && !error)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!usuario)
    return (
      <div className="auth-loading">
        <p role="alert">{error}</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          Reintentar conexión
        </button>
      </div>
    );
  return <Outlet />;
}
