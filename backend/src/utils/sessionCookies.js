import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
export const SESSION_COOKIE = 'cafe_nube_session';
export const CSRF_COOKIE = 'cafe_nube_csrf';
export function cookieOptions(config) {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: '/api',
  };
}
export function csrfFor(value, config) {
  return createHmac('sha256', config.secret).update('cafe-nube-csrf\0').update(value).digest('hex');
}
export function csrfValue(req, res, config) {
  let value = req.cookies?.[SESSION_COOKIE] || req.cookies?.[CSRF_COOKIE];
  if (typeof value !== 'string' || !value) {
    if (req.cookies?.[SESSION_COOKIE]) res.clearCookie(SESSION_COOKIE, cookieOptions(config));
    value = randomBytes(32).toString('base64url');
    res.cookie(CSRF_COOKIE, value, { ...cookieOptions(config), maxAge: config.expiresIn * 1000 });
  }
  return csrfFor(value, config);
}
export function validCsrf(req, config) {
  const value = req.cookies?.[SESSION_COOKIE] || req.cookies?.[CSRF_COOKIE];
  const actual = req.get('X-CSRF-Token');
  if (
    typeof value !== 'string' ||
    !value ||
    typeof actual !== 'string' ||
    !/^[a-f0-9]{64}$/.test(actual)
  )
    return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(csrfFor(value, config)));
}
export function clearSessionCookies(res, config) {
  for (const name of [SESSION_COOKIE, CSRF_COOKIE]) res.clearCookie(name, cookieOptions(config));
}
