import { csrfMiddleware } from '../middleware/csrfMiddleware.js';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
export function authRoutes(db, config) {
  const router = Router();
  const controller = authController(db, config);
  const limit = () =>
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'Demasiados intentos. Intente de nuevo más tarde.' },
      skipSuccessfulRequests: true,
    });
  router.get('/csrf', controller.csrf);
  router.use(csrfMiddleware(config));
  router.post('/logout', controller.logout);
  router.post('/register', limit(), controller.register);
  router.post('/login', limit(), controller.login);
  router.get('/me', authMiddleware(db, config), controller.me);
  return router;
}
