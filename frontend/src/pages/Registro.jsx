import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
export default function Registro() {
  const { usuario, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (usuario && !loading) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault();
    setError('');
    const values = new FormData(event.currentTarget);
    const password = values.get('password');
    if (password !== values.get('confirmar')) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      await api.create('/auth/register', {
        nombre: values.get('nombre'),
        correo: values.get('correo'),
        password,
      });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout>
      <div className="auth-form-wrap">
        <span className="eyebrow">UN BUEN COMIENZO</span>
        <h2>Crear cuenta</h2>
        <p>Registre su acceso al espacio de trabajo.</p>
        <form onSubmit={submit}>
          <label htmlFor="registro-nombre">Nombre completo</label>
          <input
            id="registro-nombre"
            name="nombre"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
          />
          <label htmlFor="registro-correo">Correo electrónico</label>
          <input
            id="registro-correo"
            name="correo"
            type="email"
            autoComplete="username"
            required
            maxLength={120}
          />
          <label htmlFor="registro-password">Contraseña</label>
          <input
            id="registro-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-help"
          />
          <small id="password-help">Mínimo 8 caracteres y máximo 72 bytes UTF-8.</small>
          <label htmlFor="registro-confirmar">Confirmar contraseña</label>
          <input
            id="registro-confirmar"
            name="confirmar"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
        <p className="auth-switch">
          ¿Ya tiene cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
