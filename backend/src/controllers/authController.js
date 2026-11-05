import { randomUUID } from 'node:crypto';
import {
  SESSION_COOKIE,
  cookieOptions,
  csrfFor,
  csrfValue,
  clearSessionCookies,
} from '../utils/sessionCookies.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { objectBody, text, httpError } from '../utils/validation.js';
import { publicUser } from '../models/usuario.js';
function credentials(body, register = false) {
  objectBody(body, register ? ['nombre', 'correo', 'password'] : ['correo', 'password']);
  const correo = text(body.correo, 'El correo', { min: 3, max: 120 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
    throw httpError(400, 'El correo no tiene un formato válido.');
  const password = body.password;
  if (
    typeof password !== 'string' ||
    password.length < (register ? 8 : 1) ||
    Buffer.byteLength(password, 'utf8') > 72 ||
    password.includes('\0')
  )
    throw httpError(
      400,
      'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes UTF-8.',
    );
  return {
    correo,
    password,
    ...(register ? { nombre: text(body.nombre, 'El nombre', { max: 100 }) } : {}),
  };
}
export function authController(db, config) {
  return {
    async register(req, res) {
      const data = credentials(req.body, true);
      const password = await bcrypt.hash(data.password, 12);
      try {
        const user = await db.models.usuarios.create({ ...data, password });
        res.status(201).json(publicUser(user));
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError')
          throw httpError(400, 'Ya existe un usuario con ese correo.');
        throw error;
      }
    },
    async login(req, res) {
      const { correo, password } = credentials(req.body);
      const user = await db.models.usuarios.scope('conPassword').findOne({ where: { correo } });
      const fallback = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.5uN4qsYQf4TQ9tM5gfJVQl.JLvTfe1G';
      const matches = await bcrypt.compare(password, user?.password ?? fallback);
      if (!user || !matches) throw httpError(401, 'Correo o contraseña incorrectos.');
      const token = jwt.sign({}, config.secret, {
        algorithm: 'HS256',
        subject: String(user.id),
        issuer: config.issuer,
        audience: config.audience,
        expiresIn: config.expiresIn,
        jwtid: randomUUID(),
      });
      res.cookie(SESSION_COOKIE, token, {
        ...cookieOptions(config),
        maxAge: config.expiresIn * 1000,
      });
      const expiresAt = new Date(jwt.decode(token).exp * 1000).toISOString();
      res
        .set('Cache-Control', 'no-store')
        .json({ usuario: publicUser(user), expiresAt, csrfToken: csrfFor(token, config) });
    },
    csrf(req, res) {
      res.set('Cache-Control', 'no-store').json({ csrfToken: csrfValue(req, res, config) });
    },
    logout(_req, res) {
      clearSessionCookies(res, config);
      res.set('Cache-Control', 'no-store').status(204).end();
    },
    me(req, res) {
      res.set('Cache-Control', 'no-store').json({
        ...publicUser(req.usuario),
        expiresAt: new Date(req.sessionClaims.exp * 1000).toISOString(),
      });
    },
  };
}
