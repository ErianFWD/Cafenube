import { getToken, clearToken } from './session.js';
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
async function request(path, options = {}) {
  const token = getToken();
  const publicAuth = ['/auth/login', '/auth/register'].includes(path);
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(!publicAuth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Compruebe que el backend esté iniciado.');
  }
  if (response.status === 401 && !publicAuth) clearToken(token);
  if (response.status === 204) return null;
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('El servidor devolvió una respuesta no válida.');
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
