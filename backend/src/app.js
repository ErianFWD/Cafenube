import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDatabase, backendRoot } from './database/connection.js';
import { apiRoutes } from './routes/apiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(options = {}) {
  const db = openDatabase(options);
  try {
    const app = express();
    const origins = options.origins || (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((origin) => origin.trim());
    if (!origins.length || origins.some((origin) => { try { return new URL(origin).origin !== origin || !/^https?:/.test(origin); } catch { return true; } })) throw new Error('CLIENT_ORIGINS debe contener orígenes HTTP válidos y exactos');
    app.disable('x-powered-by');
    app.use((_req, res, next) => { res.vary('Origin'); next(); });
    app.use(cors({ origin(origin, callback) { callback(null, origins.includes(origin) ? origin : false); }, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
    app.use(express.json({ limit: '64kb', strict: true }));
    app.use('/api', apiRoutes(db));
    app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta de la API no encontrada.' }));
    const frontend = resolve(backendRoot, '../frontend/dist');
    if (existsSync(resolve(frontend, 'index.html'))) {
      app.use(express.static(frontend));
      app.use((req, res, next) => { if (req.method === 'GET' && req.accepts('html')) return res.sendFile(resolve(frontend, 'index.html')); next(); });
    }
    app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
    app.use(errorHandler);
    return { app, db, close: () => db.close() };
  } catch (error) { db.close(); throw error; }
}
