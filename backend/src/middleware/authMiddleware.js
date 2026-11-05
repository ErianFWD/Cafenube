import { SESSION_COOKIE } from '../utils/sessionCookies.js';
import jwt from 'jsonwebtoken';
import { httpError } from '../utils/validation.js';
export function authMiddleware(db, config) {
  return async (req, _res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token !== 'string' || !token) throw httpError(401, 'No autorizado');
    let payload;
    try {
      payload = jwt.verify(token, config.secret, {
        algorithms: ['HS256'],
        issuer: config.issuer,
        audience: config.audience,
      });
    } catch {
      throw httpError(401, 'No autorizado');
    }
    if (
      typeof payload !== 'object' ||
      !Number.isInteger(payload.exp) ||
      typeof payload.sub !== 'string' ||
      !/^[1-9]\d*$/.test(payload.sub) ||
      !Number.isSafeInteger(Number(payload.sub))
    )
      throw httpError(401, 'No autorizado');
    const user = await db.models.usuarios.findByPk(Number(payload.sub));
    if (!user) throw httpError(401, 'No autorizado');
    req.usuario = user;
    req.sessionClaims = payload;
    next();
  };
}
