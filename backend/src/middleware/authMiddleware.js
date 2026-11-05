import jwt from 'jsonwebtoken';
import { httpError } from '../utils/validation.js';
export function authMiddleware(db, config) {
  return async (req, _res, next) => {
    const header = req.get('Authorization');
    const match = typeof header === 'string' && /^Bearer ([A-Za-z0-9_.-]+)$/i.exec(header);
    if (!match) throw httpError(401, 'No autorizado');
    let payload;
    try {
      payload = jwt.verify(match[1], config.secret, {
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
    next();
  };
}
