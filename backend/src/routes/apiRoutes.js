import { authRoutes } from './authRoutes.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { Router } from 'express';
import { catalogController } from '../controllers/catalogController.js';
import { ventasController } from '../controllers/ventasController.js';
import { detallesController } from '../controllers/detallesController.js';
import { resumenController } from '../controllers/resumenController.js';
function crud(controller) {
  const router = Router();
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}
export function apiRoutes(db, auth) {
  const router = Router();
  router.get('/salud', (_req, res) => res.json({ ok: true }));
  router.use('/auth', authRoutes(db, auth));
  router.use(authMiddleware(db, auth));
  router.get('/resumen', resumenController(db));
  for (const [path, entity] of [
    ['categorias', 'categorias'],
    ['productos', 'productos'],
    ['clientes', 'clientes'],
    ['metodos-pago', 'metodos_pago'],
  ])
    router.use(`/${path}`, crud(catalogController(db, entity)));
  router.use('/ventas', crud(ventasController(db)));
  router.use('/detalle-ventas', crud(detallesController(db)));
  return router;
}
