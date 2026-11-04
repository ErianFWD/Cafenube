import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedDatabase } from './seed.js';

export const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export function openDatabase({ filename = process.env.DATABASE_PATH || 'data/cafeteria.sqlite', seed = true } = {}) {
  const path = filename === ':memory:' ? filename : resolve(backendRoot, filename);
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  try {
    db.exec('pragma foreign_keys = on; pragma busy_timeout = 5000;');
    if (path !== ':memory:') db.exec('pragma journal_mode = wal;');
    const version = db.prepare('pragma user_version').get().user_version;
    const tables = db.prepare("select name from sqlite_master where type = 'table' and name not like 'sqlite_%'").all();
    if (version === 0 && tables.length === 0) {
      db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
      if (seed) seedDatabase(db);
    } else if (version !== 1 || tables.length !== 6) {
      throw new Error('La base existente no corresponde al esquema de Cafetería versión 1');
    }
    return db;
  } catch (error) { db.close(); throw error; }
}

export function transaction(db, operation) {
  db.exec('begin immediate');
  try { const result = operation(); db.exec('commit'); return result; }
  catch (error) { db.exec('rollback'); throw error; }
}
