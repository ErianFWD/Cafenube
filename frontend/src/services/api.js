import { sessionVersion, endSession } from './session.js';
import { resolveApiBase } from './apiBase.js';
const BASE = resolveApiBase(import.meta.env.VITE_API_URL, {
  development: import.meta.env.DEV,
  pageUrl: window.location.href,
});
async function request(path, options = {}, retryCsrf = true) {
  const version = sessionVersion();
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(options.method || 'GET');
  let csrfToken;
  if (unsafe) {
    let bootstrap;
    try {
      bootstrap = await fetch(`${BASE}/auth/csrf`, { credentials: 'include' });
    } catch {
      throw new Error(
        'No se pudo conectar con el servidor. Compruebe que el backend esté iniciado.',
      );
    }
    if (!bootstrap.ok) throw new Error('No se pudo preparar la sesión. Intente nuevamente.');
    csrfToken = (await bootstrap.json()).csrfToken;
  }
  const publicAuth = ['/auth/login', '/auth/register'].includes(path);
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Compruebe que el backend esté iniciado.');
  }
  if (response.status === 401 && !publicAuth) endSession(version);
  if (response.status === 204) return null;
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('El servidor devolvió una respuesta no válida.');
  }
  if (unsafe && response.status === 403 && data.code === 'CSRF_INVALID') {
    // El servidor rechazó la solicitud antes de escribir: renovar y repetir una sola vez es seguro.
    if (retryCsrf) return request(path, options, false);
    throw Object.assign(
      new Error(
        'No se pudo validar la cookie de seguridad. Permita las cookies de esta página y vuelva a intentar.',
      ),
      { status: 403 },
    );
  }
  if (!response.ok)
    throw Object.assign(new Error(data.error || 'No fue posible completar la operación.'), {
      status: response.status,
    });
  return data;
}
export const api = {
  get: (path) => request(path),
  async all(path) {
    const rows = [];
    for (let offset = 0; offset <= 100000; offset += 200) {
      const page = await request(
        `${path}${path.includes('?') ? '&' : '?'}limit=200&offset=${offset}`,
      );
      rows.push(...page);
      if (page.length < 200) return rows;
    }
    throw new Error('La consulta es demasiado grande. Reduzca el conjunto de datos.');
  },
  create: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  update: (path, id, data) =>
    request(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (path, id) => request(`${path}/${id}`, { method: 'DELETE' }),
};
