export function authConfig(overrides = {}) {
  const secret = overrides.secret ?? process.env.JWT_SECRET;
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32)
    throw new Error(
      'JWT_SECRET debe contener al menos 32 bytes. Ejecute npm run setup para generar una clave local.',
    );
  const production = process.env.NODE_ENV === 'production';
  const secureValue = process.env.COOKIE_SECURE;
  if (secureValue !== undefined && !['true', 'false'].includes(secureValue))
    throw new Error('COOKIE_SECURE debe ser true o false.');
  const cookieSecure = overrides.cookieSecure ?? (production || secureValue === 'true');
  const cookieSameSite = overrides.cookieSameSite ?? process.env.COOKIE_SAME_SITE ?? 'lax';
  if (!['lax', 'strict', 'none'].includes(cookieSameSite))
    throw new Error('COOKIE_SAME_SITE debe ser lax, strict o none.');
  if ((production || cookieSameSite === 'none') && !cookieSecure)
    throw new Error('Las cookies en producción o SameSite=None requieren HTTPS y Secure.');
  return {
    secret,
    issuer: 'cafe-nube-api',
    audience: 'cafe-nube-web',
    expiresIn: 3600,
    ...overrides,
    cookieSecure,
    cookieSameSite,
  };
}
