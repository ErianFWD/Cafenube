const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function resolveApiBase(configured, { development, pageUrl }) {
  const value = (configured || '/api').replace(/\/$/, '');
  if (value.startsWith('/')) return value;
  const api = new URL(value);
  const page = new URL(pageUrl);
  if (LOOPBACK_HOSTS.has(api.hostname) && LOOPBACK_HOSTS.has(page.hostname)) {
    // Vite reenvía /api al backend: el navegador conserva un único origen para las cookies.
    if (development && api.pathname === '/api') return '/api';
    api.hostname = page.hostname;
  }
  return api.href.replace(/\/$/, '');
}
