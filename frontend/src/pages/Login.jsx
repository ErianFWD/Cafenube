import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
export default function Login() {
  const { usuario, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (usuario && !loading) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const values = new FormData(event.currentTarget);
    try {
      await login({ correo: values.get('correo'), password: values.get('password') });
      const from = location.state?.from;
      navigate(
        typeof from === 'string' &&
          from.startsWith('/') &&
          !from.startsWith('//') &&
          !['/login', '/registro'].includes(from)
          ? from
          : '/',
        { replace: true },
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout>
      <div className="auth-form-wrap">
        <span className="eyebrow">BIENVENIDO A TU ESPACIO</span>
        <h2>Iniciar sesión</h2>
        <p>Todo listo para un nuevo día en Café Nube.</p>
        {location.state?.registered && (
          <p className="auth-success" role="status">
            Cuenta creada. Ya puede iniciar sesión.
          </p>
        )}
        <form onSubmit={submit}>
          <label htmlFor="login-correo">Correo electrónico</label>
          <input
            id="login-correo"
            name="correo"
            type="email"
            autoComplete="username"
            required
            maxLength={120}
          />
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>
        <p className="auth-switch">
          ¿Primera vez aquí? <Link to="/registro">Crear una cuenta</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
