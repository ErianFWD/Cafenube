import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { setupDatabase } from '../src/database/setup.js';
import { databaseConfig, openDatabase } from '../src/database/connection.js';
import { createApp } from '../src/app.js';

async function fixture(run, options = {}) {
  const database = `cafetest_${randomUUID().replaceAll('-','')}`;
  const config = {database};
  await setupDatabase(config, options.seed !== false);
  const instance = await createApp({ config });
  const server = instance.app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(method,path,body,extraHeaders={}) {
    const response = await fetch(base+path,{method,headers:{Origin:'http://localhost:5173',...(body===undefined?{}:{'Content-Type':'application/json'}),...extraHeaders},...(body===undefined?{}:{body:typeof body === 'string'?body:JSON.stringify(body)})});
    const raw=await response.text(); return {status:response.status,body:raw?JSON.parse(raw):null,headers:response.headers};
  }
  try { return await run(request,instance.db); }
  finally { server.closeAllConnections(); await new Promise(r=>server.close(r)); await instance.close(); const admin=await mysql.createConnection({...databaseConfig(),database:undefined}); try { await admin.query(`drop database \`${database}\``); } finally { await admin.end(); } }
}
const venta = (overrides = {}) => ({ cliente_id: null, metodo_pago_id: 1, detalles: [{ producto_id: 1, cantidad: 2 }], ...overrides });

test('el esquema implementa seis tablas con FK y datos de ejemplo íntegros', () => fixture(async (request, db) => {
  const tables = await db.all('select table_name from information_schema.tables where table_schema = database()');
  assert.equal(tables.length,6);
  const {total} = await db.get("select count(*) as total from information_schema.referential_constraints where constraint_schema = database()"); assert.equal(total,5);
  const {version} = await db.get('select version() as version'); assert.match(version,/^8\./);
  assert.equal((await request('GET', '/salud')).status, 200);
  const summary = (await request('GET', '/resumen')).body; assert.equal(summary.productos, 8); assert.equal(summary.ventas, 10); assert.ok(summary.ingresos_centimos > 0);
}));

test('CRUD completo por HTTP de categorías, productos, clientes y métodos de pago', () => fixture(async (request) => {
  const resources = [
    ['/categorias', { nombre: 'Categoría prueba', descripcion: 'Práctica' }, { nombre: 'Categoría editada', descripcion: null }],
    ['/productos', { nombre: 'Producto prueba', categoria_id: 1, precio_centimos: 155050 }, { nombre: 'Producto editado', categoria_id: 1, precio_centimos: 160075, descripcion: 'Nuevo texto' }],
    ['/clientes', { nombre: 'Cliente prueba', telefono: '8888-9999', correo: 'prueba@example.test' }, { nombre: 'Cliente editado', telefono: null, correo: null }],
    ['/metodos-pago', { nombre: 'Método prueba' }, { nombre: 'Método editado', descripcion: 'Actualizado' }]
  ];
  for (const [path, data, update] of resources) {
    const created = await request('POST', path, data); assert.equal(created.status, 201, path); const id = created.body.id;
    assert.equal(created.headers.get('location'), `/api${path}/${id}`);
    assert.equal((await request('GET', `${path}/${id}`)).body.nombre, data.nombre);
    assert.ok((await request('GET', path)).body.some((row) => row.id === id));
    assert.equal((await request('PUT', `${path}/${id}`, update)).body.nombre, update.nombre);
    const removed = await request('DELETE', `${path}/${id}`); assert.equal(removed.status, 204); assert.equal(removed.body, null);
    assert.equal((await request('GET', `${path}/${id}`)).status, 404);
  }
}));

test('ventas y detalles tienen CRUD, totales calculados y borrado conjunto', () => fixture(async (request, db) => {
  const sale = await request('POST', '/ventas', venta()); assert.equal(sale.status, 201); const id = sale.body.id;
  assert.equal(sale.body.total_centimos, 440000); assert.equal(sale.body.detalles.length, 1);
  assert.ok((await request('GET', '/ventas')).body.some((v) => v.id === id)); assert.equal((await request('GET', `/ventas/${id}`)).body.id, id);
  const added = await request('POST', '/detalle-ventas', { venta_id: id, producto_id: 2, cantidad: 1 }); assert.equal(added.status, 201);
  const detailId = added.body.id; assert.equal((await request('GET', `/detalle-ventas/${detailId}`)).body.producto_nombre, 'Americano');
  assert.ok((await request('GET', `/detalle-ventas?venta_id=${id}`)).body.some((row) => row.id === detailId));
  const updated = await request('PUT', `/detalle-ventas/${detailId}`, { producto_id: 2, cantidad: 3 }); assert.equal(updated.status, 200); assert.equal(updated.body.subtotal_centimos, 450000);
  assert.equal((await request('GET', `/ventas/${id}`)).body.total_centimos, 890000);
  const replaced = await request('PUT', `/ventas/${id}`, venta({ cliente_id: 1, observaciones: 'Editada', detalles: [{ producto_id: 1, cantidad: 1 }, { producto_id: 2, cantidad: 3 }] })); assert.equal(replaced.status, 200); assert.equal(replaced.body.total_centimos, 670000);
  assert.equal((await request('DELETE', `/detalle-ventas/${detailId}`)).status, 204);
  const last = (await request('GET', `/ventas/${id}`)).body.detalles[0].id;
  assert.equal((await request('DELETE', `/detalle-ventas/${last}`)).status, 409);
  assert.equal((await request('DELETE', `/ventas/${id}`)).status, 204); assert.equal((await request('GET', `/ventas/${id}`)).status, 404);
  assert.equal((await db.get('select count(*) as total from detalle_ventas where venta_id = ?', id)).total, 0);
}));

test('los seis recursos conservan 404 para GET, PUT y DELETE de un ID inexistente', () => fixture(async (request) => {
  for (const path of ['/categorias', '/productos', '/clientes', '/metodos-pago', '/ventas', '/detalle-ventas']) {
    for (const method of ['GET', 'PUT', 'DELETE']) assert.equal((await request(method, `${path}/999999`, method === 'PUT' ? {} : undefined)).status, 404, `${method} ${path}`);
  }
}));

test('validaciones rechazan tipos, nulos obligatorios, IDs, campos extra y precios inválidos', () => fixture(async (request) => {
  for (const data of [{}, [], null, { nombre: ' ' }, { nombre: 15 }, { nombre: 'Válido', admin: true }]) assert.equal((await request('POST', '/categorias', data)).status, 400);
  for (const precio_centimos of [-1, 1.5, '100', null, 100000001]) assert.equal((await request('POST', '/productos', { nombre: 'Precio inválido', categoria_id: 1, precio_centimos })).status, 400);
  assert.equal((await request('POST', '/clientes', { nombre: 'Correo', correo: 'sin-arroba' })).status, 400);
  assert.equal((await request('POST', '/clientes', { nombre: 'Teléfono', telefono: 'abcdefghi' })).status, 400);
  for (const id of ['0', '-1', '1abc', '1%20or%201=1', '2147483648']) assert.equal((await request('GET', `/productos/${id}`)).status, 400);
}));

test('UNICIDAD y FK rechazan duplicados o relaciones inválidas', () => fixture(async (request) => {
  assert.equal((await request('POST', '/categorias', { nombre: 'café de especialidad' })).status, 409);
  assert.equal((await request('POST', '/clientes', { nombre: 'Otra Ana', correo: 'ANA@EXAMPLE.TEST' })).status, 409);
  assert.equal((await request('POST', '/productos', { nombre: 'Sin categoría', categoria_id: 999999, precio_centimos: 10000 })).status, 409);
  assert.equal((await request('DELETE', '/categorias/1')).status, 409);
  assert.equal((await request('DELETE', '/productos/1')).status, 409);
  assert.equal((await request('DELETE', '/metodos-pago/1')).status, 409);
}));

test('una venta inválida revierte cabecera y detalles en la misma transacción', () => fixture(async (request, db) => {
  const before = (await db.get('select count(*) as total from ventas')).total;
  const detailsBefore = (await db.get('select count(*) as total from detalle_ventas')).total;
  const result = await request('POST', '/ventas', venta({ detalles: [{ producto_id: 1, cantidad: 1 }, { producto_id: 999999, cantidad: 1 }] }));
  assert.equal(result.status, 400); assert.equal((await db.get('select count(*) as total from ventas')).total, before); assert.equal((await db.get('select count(*) as total from detalle_ventas')).total, detailsBefore);
}));

test('ventas vacías, cantidades inválidas y productos repetidos no se aceptan', () => fixture(async (request) => {
  for (const detalles of [[], [{ producto_id: 1, cantidad: 0 }], [{ producto_id: 1, cantidad: 1.2 }], [{ producto_id: 1, cantidad: 1 }, { producto_id: 1, cantidad: 2 }]]) assert.equal((await request('POST', '/ventas', venta({ detalles }))).status, 400);
  assert.equal((await request('POST', '/ventas', venta({ fecha: '2026-11-04' }))).status, 400);
}));

test('precios históricos y edición atómica de ventas conservan los registros previos', () => fixture(async (request) => {
  const created = (await request('POST', '/ventas', venta())).body; const oldPrice = created.detalles[0].precio_unitario_centimos;
  await request('PUT', '/productos/1', { nombre: 'Cappuccino', categoria_id: 1, precio_centimos: 990000 });
  const edited = (await request('PUT', `/ventas/${created.id}`, venta({ detalles: [{ producto_id: 1, cantidad: 3 }] }))).body;
  assert.equal(edited.detalles[0].precio_unitario_centimos, oldPrice); assert.equal(edited.total_centimos, oldPrice * 3);
  const fail = await request('PUT', `/ventas/${created.id}`, venta({ observaciones: 'No debe persistir', detalles: [{ producto_id: 999999, cantidad: 1 }] })); assert.equal(fail.status, 400);
  const retained = (await request('GET', `/ventas/${created.id}`)).body; assert.equal(retained.total_centimos, oldPrice * 3); assert.equal(retained.observaciones, null);
  const newSale = (await request('POST', '/ventas', venta())).body; assert.equal(newSale.detalles[0].precio_unitario_centimos, 990000);
}));

test('CORS permite los orígenes declarados y responde preflight sin autenticación', () => fixture(async (request) => {
  const ok = await request('GET', '/productos'); assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173'); assert.match(ok.headers.get('vary'), /Origin/);
  const denied = await request('GET', '/productos', undefined, { Origin: 'https://no-permitido.example' }); assert.equal(denied.status, 200); assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const preflight = await request('OPTIONS', '/productos', undefined, { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' }); assert.equal(preflight.status, 204); assert.match(preflight.headers.get('access-control-allow-methods'), /POST/);
}));

test('JSON inválido, cuerpo excesivo y ruta desconocida dan respuestas controladas', () => fixture(async (request) => {
  assert.equal((await request('POST', '/clientes', '{')).status, 400);
  assert.equal((await request('POST', '/clientes', { nombre: 'x'.repeat(70000) })).status, 413);
  assert.equal((await request('GET', '/ruta-inexistente')).status, 404);
}));

test('las consultas parametrizadas conservan una entrada de texto sin ejecutarla como SQL', () => fixture(async (request, db) => {
  const name = "Café'); drop table productos; --";
  const row = await request('POST', '/categorias', { nombre: name }); assert.equal(row.status, 201); assert.equal(row.body.nombre, name);
  assert.equal((await db.get('select count(*) as total from productos')).total, 8);
}));

test('la persistencia MySQL sobrevive al cierre del pool y setup no resembra', () => fixture(async(request,db) => {
 const created = (await request('POST','/categorias',{nombre:'Persistente'})).body;
 const config = {database:(await db.get('select database() as nombre')).nombre};
 const second = await openDatabase({config});
 try { assert.equal((await second.get('select nombre from categorias where id = ?',created.id)).nombre,'Persistente'); } finally { await second.close(); }
 await request('DELETE',`/categorias/${created.id}`);
 await setupDatabase(config,true);
 assert.equal(await db.get('select id from categorias where id = ?',created.id),null);
}));

test('búsqueda y paginación tienen límites y orden determinista', () => fixture(async (request) => {
  const rows = (await request('GET', '/productos?buscar=capp&limit=1&offset=0')).body; assert.equal(rows.length, 1); assert.equal(rows[0].nombre, 'Cappuccino');
  for (const query of ['limit=0', 'limit=201', 'offset=-1', 'limit[]=1', 'inexistente=1']) assert.equal((await request('GET', `/productos?${query}`)).status, 400);
}));

test('DECIMAL guarda colones exactos y la API conserva céntimos y fechas ISO UTC', () => fixture(async(request,db)=>{
 const p=await request('POST','/productos',{nombre:'Decimal exacto',categoria_id:1,precio_centimos:255075}); assert.equal(p.status,201); assert.equal(p.body.precio_centimos,255075);
 const raw=await db.get('select precio from productos where id = ?',p.body.id); assert.equal(raw.precio,'2550.75');
 const v=await request('POST','/ventas',venta({fecha:'2026-11-04T18:25:30.123Z',detalles:[{producto_id:p.body.id,cantidad:3}]})); assert.equal(v.status,201); assert.equal(v.body.total_centimos,765225); assert.equal(v.body.fecha,'2026-11-04T18:25:30.123Z');
}));
test('el borrado concurrente de detalles mantiene al menos una línea',()=>fixture(async(request)=>{
 const v=(await request('POST','/ventas',venta({detalles:[{producto_id:1,cantidad:1},{producto_id:2,cantidad:1}]}))).body;
 const results=await Promise.all(v.detalles.map(d=>request('DELETE',`/detalle-ventas/${d.id}`)));
 assert.deepEqual(results.map(r=>r.status).sort(),[204,409]); assert.equal((await request('GET',`/ventas/${v.id}`)).body.detalles.length,1);
}));
