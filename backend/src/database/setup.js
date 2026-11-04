import mysql from 'mysql2/promise';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { databaseConfig, openDatabase } from './connection.js';
import { seedDatabase } from './seed.js';
export async function setupDatabase(config = {}, seed = true) {
 const options = databaseConfig(config); const name = options.database;
 if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(name)) throw new Error('DB_NAME no es válido');
 const connection = await mysql.createConnection({...options,database:undefined,multipleStatements:true});
 try {
  await connection.query(`create database if not exists \`${name}\` character set utf8mb4 collate utf8mb4_unicode_ci`);
  await connection.query(`use \`${name}\``);
  const [tables] = await connection.query('show tables');
  if (tables.length) { console.log('La base contiene tablas; se conserva sin resembrar ni modificar.'); }
  else { await connection.query(readFileSync(new URL('./schema.sql',import.meta.url),'utf8')); const db = await openDatabase({config}); try { if (seed) await seedDatabase(db); } finally { await db.close(); } }
 } finally { await connection.end(); }
 const db = await openDatabase({config}); await db.close();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 await setupDatabase({},process.env.SEED_DEMO !== 'false'); console.log('MySQL listo. Inicie con npm run dev.');
}
