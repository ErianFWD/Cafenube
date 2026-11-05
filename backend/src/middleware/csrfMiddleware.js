import { validCsrf } from '../utils/sessionCookies.js';
export function csrfMiddleware(config) {
  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (!validCsrf(req, config))
      return res.status(403).json({
        error: 'La comprobación de seguridad venció. Intente nuevamente.',
        code: 'CSRF_INVALID',
      });
    next();
  };
}
export function originMiddleware(origins) {
  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('Origin');
    // Sin Origin se admiten clientes HTTP como Postman; CSRF sigue siendo obligatorio.
    if (
      (origin && !origins.includes(origin) && origin !== `${req.protocol}://${req.get('host')}`) ||
      (!origin && req.get('Sec-Fetch-Site') === 'cross-site')
    )
      return res.status(403).json({ error: 'Origen no permitido.' });
    next();
  };
}
