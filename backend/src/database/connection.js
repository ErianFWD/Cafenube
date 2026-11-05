import { Sequelize, QueryTypes, Transaction } from 'sequelize';
import { defineEntities } from '../models/entities.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export function databaseConfig(overrides = {}) {
  return { host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'cafeteria', charset: 'utf8mb4_unicode_ci', timezone: 'Z', dateStrings: true, ...overrides };
}
function normalize(rows) {
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key,value]) => {
    if (key === 'fecha' && typeof value === 'string') value = new Date(value.replace(' ', 'T') + 'Z').toISOString();
    if (value !== null && (key.endsWith('_centimos') || ['total','unidades','productos','cantidad_productos'].includes(key))) {
      const n = Number(value); if (!Number.isSafeInteger(n)) throw new Error('Importe fuera de rango seguro'); value = n;
    }
    return [key,value];
  })));
}
export async function openDatabase(options = {}) {
  const config = databaseConfig(options.config);
  const sequelize = new Sequelize(config.database,config.user,config.password,{
    dialect:'mysql',host:config.host,port:config.port,logging:false,timezone:'+00:00',
    dialectOptions:{charset:config.charset},pool:{max:10,min:0,idle:10000}
  });
  const context = new AsyncLocalStorage();
  const db = {
    sequelize, models:defineEntities(sequelize),
    ormOptions: () => ({transaction:context.getStore()}),
    // SQL parametrizado reservado para informes, inspección y preparación inicial.
    async all(sql,...params) { return normalize(await sequelize.query(sql,{replacements:params,type:QueryTypes.SELECT,...db.ormOptions()})); },
    async get(sql,...params) { return (await db.all(sql,...params))[0] || null; },
    async run(sql,...params) { const [result,metadata] = await sequelize.query(sql,{replacements:params,...db.ormOptions()}); return {insertId:typeof result==='number'?result:result?.insertId,affectedRows:metadata?.affectedRows??metadata}; },
    transaction(operation) { return sequelize.transaction({isolationLevel:Transaction.ISOLATION_LEVELS.READ_COMMITTED}, t => context.run(t,()=>operation(t))); },
    close: () => sequelize.close()
  };
  try {
    const {version} = await db.get('select version() as version');
    const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
    if (!match || /mariadb/i.test(version) || Number(match[1]) < 8 || (Number(match[1]) === 8 && Number(match[2]) === 0 && Number(match[3]) < 16)) throw new Error('Se requiere MySQL 8.0.16 o posterior');
    const tables = await db.all('select table_name as nombre from information_schema.tables where table_schema = database() and table_type = \'BASE TABLE\'');
    const expected = ['categorias','productos','clientes','metodos_pago','ventas','detalle_ventas'];
    if (tables.length !== 6 || expected.some(name => !tables.some(t => t.nombre === name))) throw new Error('Ejecute npm run db:setup para preparar las seis tablas MySQL');
    const columns = await db.all('select table_name as tabla,column_name as campo,data_type as tipo from information_schema.columns where table_schema = database()');
    const fields = {categorias:['id','nombre','descripcion'],productos:['id','categoria_id','nombre','descripcion','precio'],clientes:['id','nombre','telefono','correo'],metodos_pago:['id','nombre','descripcion'],ventas:['id','cliente_id','metodo_pago_id','fecha','observaciones'],detalle_ventas:['id','venta_id','producto_id','cantidad','precio_unitario']};
    for (const [table,names] of Object.entries(fields)) {
      const actual = columns.filter(c=>c.tabla===table);
      if (actual.length !== names.length || names.some(name=>!actual.some(c=>c.campo===name))) throw new Error('La estructura MySQL existente no coincide con Café Nube; revise el esquema sin borrar datos');
    }
    if (columns.some(c=>['precio','precio_unitario'].includes(c.campo) && c.tipo!=='decimal')) throw new Error('Los importes MySQL deben ser DECIMAL');
    return db;
  } catch (error) { await sequelize.close(); throw error; }
}
export const transaction = (db, operation) => db.transaction(operation);
export const decimalFromCents = value => `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;
export const sqlDate = iso => iso.replace('T', ' ').replace('Z', '');
