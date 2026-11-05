export function authConfig(overrides = {}) {
  const secret = overrides.secret ?? process.env.JWT_SECRET;
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32)
    throw new Error(
      'JWT_SECRET debe contener al menos 32 bytes. Ejecute npm run setup para generar una clave local.',
    );
  return {
    secret,
    issuer: 'cafe-nube-api',
    audience: 'cafe-nube-web',
    expiresIn: 3600,
    ...overrides,
  };
}
