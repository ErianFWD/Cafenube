import test from 'node:test';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { setupDatabase } from '../src/database/setup.js';
import { databaseConfig, openDatabase } from '../src/database/connection.js';
import { createApp } from '../src/app.js';

async function fixture(run, options = {}) {
  const database = `cafetest_${randomUUID().replaceAll('-', '')}`;
  const config = { database };
  await setupDatabase(config, options.seed !== false);
  const instance = await createApp({ config });
  const server = instance.app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const jar = new Map();
  const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  async function rawRequest(method, path, body, extraHeaders = {}) {
    const response = await fetch(base + path, {
      method,
      headers: {
        Origin: 'http://localhost:5173',
        Cookie: cookieHeader(),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...extraHeaders,
      },
      ...(body === undefined
        ? {}
        : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    });
    for (const value of response.headers.getSetCookie()) {
      const [pair] = value.split(';');
      const i = pair.indexOf('=');
      const name = pair.slice(0, i),
        content = pair.slice(i + 1);
      if (content) jar.set(name, content);
      else jar.delete(name);
    }
    const raw = await response.text();
    return {
      status: response.status,
      body: raw ? JSON.parse(raw) : null,
      headers: response.headers,
    };
  }
  async function request(method, path, body, extraHeaders = {}) {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(method) &&
      !Object.hasOwn(extraHeaders, 'X-CSRF-Token')
    ) {
      const csrf = await rawRequest(
        'GET',
        '/auth/csrf',
        undefined,
        Object.hasOwn(extraHeaders, 'Cookie') ? { Cookie: extraHeaders.Cookie } : {},
      );
      extraHeaders = { 'X-CSRF-Token': csrf.body.csrfToken, ...extraHeaders };
    }
    return rawRequest(method, path, body, extraHeaders);
  }
  request.cookie = (name) => jar.get(name);
  request.raw = rawRequest;
  try {
    await request('POST', '/auth/register', {
      nombre: 'Usuario prueba',
      correo: 'tester@example.test',
      password: 'Prueba_Cafe_2026',
    });
    const login = await request('POST', '/auth/login', {
      correo: 'tester@example.test',
      password: 'Prueba_Cafe_2026',
    });
    assert.equal(login.status, 200);
    assert.ok(jar.get('cafe_nube_session'));
    return await run(request, instance.db);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    await instance.close();
    const admin = await mysql.createConnection({ ...databaseConfig(), database: undefined });
    try {
      await admin.query(`drop database \`${database}\``);
    } finally {
      await admin.end();
    }
  }
}
const venta = (overrides = {}) => ({
  cliente_id: null,
  metodo_pago_id: 1,
  detalles: [{ producto_id: 1, cantidad: 2 }],
  ...overrides,
});

test('el esquema implementa siete entidades y metadatos con FK y datos de ejemplo íntegros', () =>
  fixture(async (request, db) => {
    const tables = await db.all(
      'select table_name from information_schema.tables where table_schema = database()',
    );
    assert.equal(tables.length, 8);
    const { total } = await db.get(
      'select count(*) as total from information_schema.referential_constraints where constraint_schema = database()',
    );
    assert.equal(total, 5);
    const { version } = await db.get('select version() as version');
    assert.match(version, /^8\./);
    assert.equal((await request('GET', '/salud')).status, 200);
    const summary = (await request('GET', '/resumen')).body;
    assert.equal(summary.productos, 8);
    assert.equal(summary.ventas, 10);
    assert.ok(summary.ingresos_centimos > 0);
  }));

test('CRUD completo por HTTP de categorías, productos, clientes y métodos de pago', () =>
  fixture(async (request) => {
    const resources = [
      [
        '/categorias',
        { nombre: 'Categoría prueba', descripcion: 'Práctica' },
        { nombre: 'Categoría editada', descripcion: null },
      ],
      [
        '/productos',
        { nombre: 'Producto prueba', categoria_id: 1, precio_centimos: 155050 },
        {
          nombre: 'Producto editado',
          categoria_id: 1,
          precio_centimos: 160075,
          descripcion: 'Nuevo texto',
        },
      ],
      [
        '/clientes',
        { nombre: 'Cliente prueba', telefono: '8888-9999', correo: 'prueba@example.test' },
        { nombre: 'Cliente editado', telefono: null, correo: null },
      ],
      [
        '/metodos-pago',
        { nombre: 'Método prueba' },
        { nombre: 'Método editado', descripcion: 'Actualizado' },
      ],
    ];
    for (const [path, data, update] of resources) {
      const created = await request('POST', path, data);
      assert.equal(created.status, 201, path);
      const id = created.body.id;
      assert.equal(created.headers.get('location'), `/api${path}/${id}`);
      assert.equal((await request('GET', `${path}/${id}`)).body.nombre, data.nombre);
      assert.ok((await request('GET', path)).body.some((row) => row.id === id));
      assert.equal((await request('PUT', `${path}/${id}`, update)).body.nombre, update.nombre);
      const removed = await request('DELETE', `${path}/${id}`);
      assert.equal(removed.status, 204);
      assert.equal(removed.body, null);
      assert.equal((await request('GET', `${path}/${id}`)).status, 404);
    }
  }));

test('ventas y detalles tienen CRUD, totales calculados y borrado conjunto', () =>
  fixture(async (request, db) => {
    const sale = await request('POST', '/ventas', venta());
    assert.equal(sale.status, 201);
    const id = sale.body.id;
    assert.equal(sale.body.total_centimos, 440000);
    assert.equal(sale.body.detalles.length, 1);
    assert.ok((await request('GET', '/ventas')).body.some((v) => v.id === id));
    assert.equal((await request('GET', `/ventas/${id}`)).body.id, id);
    const added = await request('POST', '/detalle-ventas', {
      venta_id: id,
      producto_id: 2,
      cantidad: 1,
    });
    assert.equal(added.status, 201);
    const detailId = added.body.id;
    assert.equal(
      (await request('GET', `/detalle-ventas/${detailId}`)).body.producto_nombre,
      'Americano',
    );
    assert.ok(
      (await request('GET', `/detalle-ventas?venta_id=${id}`)).body.some(
        (row) => row.id === detailId,
      ),
    );
    const updated = await request('PUT', `/detalle-ventas/${detailId}`, {
      producto_id: 2,
      cantidad: 3,
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.subtotal_centimos, 450000);
    assert.equal((await request('GET', `/ventas/${id}`)).body.total_centimos, 890000);
    const replaced = await request(
      'PUT',
      `/ventas/${id}`,
      venta({
        cliente_id: 1,
        observaciones: 'Editada',
        detalles: [
          { producto_id: 1, cantidad: 1 },
          { producto_id: 2, cantidad: 3 },
        ],
      }),
    );
    assert.equal(replaced.status, 200);
    assert.equal(replaced.body.total_centimos, 670000);
    assert.equal((await request('DELETE', `/detalle-ventas/${detailId}`)).status, 204);
    const last = (await request('GET', `/ventas/${id}`)).body.detalles[0].id;
    assert.equal((await request('DELETE', `/detalle-ventas/${last}`)).status, 409);
    assert.equal((await request('DELETE', `/ventas/${id}`)).status, 204);
    assert.equal((await request('GET', `/ventas/${id}`)).status, 404);
    assert.equal(
      (await db.get('select count(*) as total from detalle_ventas where venta_id = ?', id)).total,
      0,
    );
  }));

test('los seis recursos conservan 404 para GET, PUT y DELETE de un ID inexistente', () =>
  fixture(async (request) => {
    for (const path of [
      '/categorias',
      '/productos',
      '/clientes',
      '/metodos-pago',
      '/ventas',
      '/detalle-ventas',
    ]) {
      for (const method of ['GET', 'PUT', 'DELETE'])
        assert.equal(
          (await request(method, `${path}/999999`, method === 'PUT' ? {} : undefined)).status,
          404,
          `${method} ${path}`,
        );
    }
  }));

test('validaciones rechazan tipos, nulos obligatorios, IDs, campos extra y precios inválidos', () =>
  fixture(async (request) => {
    for (const data of [
      {},
      [],
      null,
      { nombre: ' ' },
      { nombre: 15 },
      { nombre: 'Válido', admin: true },
    ])
      assert.equal((await request('POST', '/categorias', data)).status, 400);
    for (const precio_centimos of [-1, 1.5, '100', null, 100000001])
      assert.equal(
        (
          await request('POST', '/productos', {
            nombre: 'Precio inválido',
            categoria_id: 1,
            precio_centimos,
          })
        ).status,
        400,
      );
    assert.equal(
      (await request('POST', '/clientes', { nombre: 'Correo', correo: 'sin-arroba' })).status,
      400,
    );
    assert.equal(
      (await request('POST', '/clientes', { nombre: 'Teléfono', telefono: 'abcdefghi' })).status,
      400,
    );
    for (const id of ['0', '-1', '1abc', '1%20or%201=1', '2147483648'])
      assert.equal((await request('GET', `/productos/${id}`)).status, 400);
  }));

test('UNICIDAD y FK rechazan duplicados o relaciones inválidas', () =>
  fixture(async (request) => {
    assert.equal(
      (await request('POST', '/categorias', { nombre: 'café de especialidad' })).status,
      409,
    );
    assert.equal(
      (await request('POST', '/clientes', { nombre: 'Otra Ana', correo: 'ANA@EXAMPLE.TEST' }))
        .status,
      409,
    );
    assert.equal(
      (
        await request('POST', '/productos', {
          nombre: 'Sin categoría',
          categoria_id: 999999,
          precio_centimos: 10000,
        })
      ).status,
      400,
    );
    assert.equal((await request('DELETE', '/categorias/1')).status, 409);
    assert.equal((await request('DELETE', '/productos/1')).status, 409);
    assert.equal((await request('DELETE', '/metodos-pago/1')).status, 409);
  }));

test('una venta inválida revierte cabecera y detalles en la misma transacción', () =>
  fixture(async (request, db) => {
    const before = (await db.get('select count(*) as total from ventas')).total;
    const detailsBefore = (await db.get('select count(*) as total from detalle_ventas')).total;
    const result = await request(
      'POST',
      '/ventas',
      venta({
        detalles: [
          { producto_id: 1, cantidad: 1 },
          { producto_id: 999999, cantidad: 1 },
        ],
      }),
    );
    assert.equal(result.status, 400);
    assert.equal((await db.get('select count(*) as total from ventas')).total, before);
    assert.equal(
      (await db.get('select count(*) as total from detalle_ventas')).total,
      detailsBefore,
    );
  }));

test('ventas vacías, cantidades inválidas y productos repetidos no se aceptan', () =>
  fixture(async (request) => {
    for (const detalles of [
      [],
      [{ producto_id: 1, cantidad: 0 }],
      [{ producto_id: 1, cantidad: 1.2 }],
      [
        { producto_id: 1, cantidad: 1 },
        { producto_id: 1, cantidad: 2 },
      ],
    ])
      assert.equal((await request('POST', '/ventas', venta({ detalles }))).status, 400);
    assert.equal((await request('POST', '/ventas', venta({ fecha: '2026-11-04' }))).status, 400);
  }));

test('precios históricos y edición atómica de ventas conservan los registros previos', () =>
  fixture(async (request) => {
    const created = (await request('POST', '/ventas', venta())).body;
    const oldPrice = created.detalles[0].precio_unitario_centimos;
    await request('PUT', '/productos/1', {
      nombre: 'Cappuccino',
      categoria_id: 1,
      precio_centimos: 990000,
    });
    const edited = (
      await request(
        'PUT',
        `/ventas/${created.id}`,
        venta({ detalles: [{ producto_id: 1, cantidad: 3 }] }),
      )
    ).body;
    assert.equal(edited.detalles[0].precio_unitario_centimos, oldPrice);
    assert.equal(edited.total_centimos, oldPrice * 3);
    const fail = await request(
      'PUT',
      `/ventas/${created.id}`,
      venta({
        observaciones: 'No debe persistir',
        detalles: [{ producto_id: 999999, cantidad: 1 }],
      }),
    );
    assert.equal(fail.status, 400);
    const retained = (await request('GET', `/ventas/${created.id}`)).body;
    assert.equal(retained.total_centimos, oldPrice * 3);
    assert.equal(retained.observaciones, null);
    const newSale = (await request('POST', '/ventas', venta())).body;
    assert.equal(newSale.detalles[0].precio_unitario_centimos, 990000);
  }));

test('CORS permite los orígenes declarados y responde preflight sin autenticación', () =>
  fixture(async (request) => {
    const ok = await request('GET', '/productos');
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.equal(ok.headers.get('access-control-allow-credentials'), 'true');
    assert.match(ok.headers.get('vary'), /Origin/);
    const denied = await request('GET', '/productos', undefined, {
      Origin: 'https://no-permitido.example',
    });
    assert.equal(denied.status, 200);
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
    const preflight = await request('OPTIONS', '/productos', undefined, {
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,x-csrf-token',
    });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get('access-control-allow-methods'), /POST/);
    assert.match(preflight.headers.get('access-control-allow-headers'), /X-CSRF-Token/i);
  }));

test('JSON inválido, cuerpo excesivo y ruta desconocida dan respuestas controladas', () =>
  fixture(async (request) => {
    assert.equal((await request('POST', '/clientes', '{')).status, 400);
    assert.equal((await request('POST', '/clientes', { nombre: 'x'.repeat(70000) })).status, 413);
    assert.equal((await request('GET', '/ruta-inexistente')).status, 404);
  }));

test('las consultas parametrizadas conservan una entrada de texto sin ejecutarla como SQL', () =>
  fixture(async (request, db) => {
    const name = "Café'); drop table productos; --";
    const row = await request('POST', '/categorias', { nombre: name });
    assert.equal(row.status, 201);
    assert.equal(row.body.nombre, name);
    assert.equal((await db.get('select count(*) as total from productos')).total, 8);
  }));

test('la persistencia MySQL sobrevive al cierre del pool y setup no resembra', () =>
  fixture(async (request, db) => {
    const created = (await request('POST', '/categorias', { nombre: 'Persistente' })).body;
    const config = { database: (await db.get('select database() as nombre')).nombre };
    const second = await openDatabase({ config });
    try {
      assert.equal(
        (await second.get('select nombre from categorias where id = ?', created.id)).nombre,
        'Persistente',
      );
    } finally {
      await second.close();
    }
    await request('DELETE', `/categorias/${created.id}`);
    await setupDatabase(config, true);
    assert.equal(await db.get('select id from categorias where id = ?', created.id), null);
  }));

test('búsqueda y paginación tienen límites y orden determinista', () =>
  fixture(async (request) => {
    const rows = (await request('GET', '/productos?buscar=capp&limit=1&offset=0')).body;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].nombre, 'Cappuccino');
    for (const query of ['limit=0', 'limit=201', 'offset=-1', 'limit[]=1', 'inexistente=1'])
      assert.equal((await request('GET', `/productos?${query}`)).status, 400);
  }));

test('DECIMAL guarda colones exactos y la API conserva céntimos y fechas ISO UTC', () =>
  fixture(async (request, db) => {
    const p = await request('POST', '/productos', {
      nombre: 'Decimal exacto',
      categoria_id: 1,
      precio_centimos: 255075,
    });
    assert.equal(p.status, 201);
    assert.equal(p.body.precio_centimos, 255075);
    const raw = await db.get('select precio from productos where id = ?', p.body.id);
    assert.equal(raw.precio, '2550.75');
    const v = await request(
      'POST',
      '/ventas',
      venta({
        fecha: '2026-11-04T18:25:30.123Z',
        detalles: [{ producto_id: p.body.id, cantidad: 3 }],
      }),
    );
    assert.equal(v.status, 201);
    assert.equal(v.body.total_centimos, 765225);
    assert.equal(v.body.fecha, '2026-11-04T18:25:30.123Z');
  }));
test('el borrado concurrente de detalles mantiene al menos una línea', () =>
  fixture(async (request) => {
    const v = (
      await request(
        'POST',
        '/ventas',
        venta({
          detalles: [
            { producto_id: 1, cantidad: 1 },
            { producto_id: 2, cantidad: 1 },
          ],
        }),
      )
    ).body;
    const results = await Promise.all(
      v.detalles.map((d) => request('DELETE', `/detalle-ventas/${d.id}`)),
    );
    assert.deepEqual(results.map((r) => r.status).sort(), [204, 409]);
    assert.equal((await request('GET', `/ventas/${v.id}`)).body.detalles.length, 1);
  }));

test('Sequelize mapea siete modelos y conserva datos previos al preparar la base', () =>
  fixture(async (request, db) => {
    assert.equal(db.sequelize.getDialect(), 'mysql');
    assert.equal(Object.keys(db.models).length, 7);
    assert.equal(db.models.productos.rawAttributes.precio.type.toSql(), 'DECIMAL(10,2)');
    assert.equal(db.models.ventas.options.timestamps, false);
    const producto = await db.models.productos.findByPk(1, {
      include: [{ association: 'categoria' }],
    });
    assert.equal(producto.categoria.nombre, 'Café de especialidad');
    const created = (
      await request('POST', '/clientes', {
        nombre: 'Conservar datos Sequelize',
        correo: 'previo@example.test',
      })
    ).body;
    const config = { database: (await db.get('select database() as nombre')).nombre };
    await setupDatabase(config, true);
    const after = await db.models.clientes.findByPk(created.id);
    assert.equal(after.correo, 'previo@example.test');
    assert.equal(await db.models.ventas.count(), 10);
  }));

test('registro, login y perfil usan hash bcrypt sin exponer contraseña', () =>
  fixture(async (request, db) => {
    const data = {
      nombre: 'Nueva persona',
      correo: 'NUEVO@EXAMPLE.TEST',
      password: 'Mi_clave_2026',
    };
    const created = await request('POST', '/auth/register', data);
    assert.equal(created.status, 201);
    assert.equal(created.body.correo, 'nuevo@example.test');
    assert.ok(created.body.fechaCreacion);
    assert.equal(created.body.password, undefined);
    const stored = await db.models.usuarios.scope('conPassword').findByPk(created.body.id);
    assert.match(stored.password, /^\$2[ab]\$12\$/);
    assert.notEqual(stored.password, data.password);
    assert.ok(await bcrypt.compare(data.password, stored.password));
    assert.equal((await db.models.usuarios.findByPk(created.body.id)).password, undefined);
    assert.equal((await request('POST', '/auth/register', data)).status, 400);
    const login = await request('POST', '/auth/login', {
      correo: data.correo,
      password: data.password,
    });
    assert.equal(login.status, 200);
    assert.equal(login.body.usuario.password, undefined);
    assert.equal(login.body.token, undefined);
    assert.ok(login.body.csrfToken);
    const cookie = login.headers.getSetCookie().find((v) => v.startsWith('cafe_nube_session='));
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.match(cookie, /Path=\/api/);
    assert.match(cookie, /Max-Age=3600/);
    const decoded = jwt.verify(request.cookie('cafe_nube_session'), process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'cafe-nube-api',
      audience: 'cafe-nube-web',
    });
    assert.equal(decoded.exp - decoded.iat, 3600);
    assert.equal(decoded.password, undefined);
    assert.equal(decoded.sub, String(created.body.id));
    const me = await request('GET', '/auth/me', undefined, {
      Cookie: 'cafe_nube_session=' + request.cookie('cafe_nube_session'),
    });
    assert.equal(me.status, 200);
    assert.equal(me.body.id, created.body.id);
    assert.equal(me.body.password, undefined);
  }));
test('sin token se rechazan resumen, perfil y los cinco métodos de los seis CRUD', () =>
  fixture(async (request) => {
    for (const path of [
      '/categorias',
      '/productos',
      '/clientes',
      '/metodos-pago',
      '/ventas',
      '/detalle-ventas',
    ])
      for (const [method, url, body] of [
        ['GET', path],
        ['GET', path + '/1'],
        ['POST', path, {}],
        ['PUT', path + '/1', {}],
        ['DELETE', path + '/1'],
      ]) {
        const result = await request(method, url, body, { Cookie: '' });
        assert.equal(result.status, 401, method + url);
        assert.deepEqual(result.body, { error: 'No autorizado' });
      }
    for (const path of ['/auth/me', '/resumen'])
      assert.equal((await request('GET', path, undefined, { Cookie: '' })).status, 401);
  }));
test('tokens vencidos, adulterados, con algoritmo o destinatario incorrecto dan 401', () =>
  fixture(async (request, db) => {
    const claims = { subject: '1', issuer: 'cafe-nube-api', audience: 'cafe-nube-web' };
    const invalid = [
      jwt.sign({}, process.env.JWT_SECRET, { ...claims, expiresIn: -1 }),
      jwt.sign({}, 'otra-clave', { ...claims, expiresIn: 60 }),
      jwt.sign({}, process.env.JWT_SECRET, { ...claims, algorithm: 'HS384', expiresIn: 60 }),
      jwt.sign({}, process.env.JWT_SECRET, { ...claims, audience: 'otro', expiresIn: 60 }),
      jwt.sign({}, process.env.JWT_SECRET, { ...claims }),
      jwt.sign({}, process.env.JWT_SECRET, { ...claims, subject: '999999', expiresIn: 60 }),
    ];
    for (const token of invalid)
      assert.equal(
        (await request('GET', '/productos', undefined, { Cookie: 'cafe_nube_session=' + token }))
          .status,
        401,
      );
    assert.equal(
      (await request('GET', '/productos', undefined, { Cookie: '', Authorization: 'Bearer abc' }))
        .status,
      401,
    );
  }));
test('validación de registro rechaza contraseñas cortas, tipos y exceso de bytes UTF-8', () =>
  fixture(async (request) => {
    const valid = {
      nombre: 'Usuario válido',
      correo: 'validar@example.test',
      password: 'abcde12345',
    };
    for (const changes of [
      { password: '1234567' },
      { password: 44 },
      { password: 'á'.repeat(37) },
      { password: 'a'.repeat(73) },
      { correo: 'sin-arroba' },
      { nombre: ' ' },
      { rol: 'admin' },
    ])
      assert.equal((await request('POST', '/auth/register', { ...valid, ...changes })).status, 400);
    assert.equal(
      (
        await request('POST', '/auth/login', {
          correo: 'tester@example.test',
          password: 'incorrecta',
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request('POST', '/auth/login', {
          correo: 'nadie@example.test',
          password: 'incorrecta',
        })
      ).status,
      401,
    );
  }));
test('relaciones inexistentes dan 400 o 404 y las eliminaciones dependientes conservan 409', () =>
  fixture(async (request) => {
    for (const data of [{ cliente_id: 999999 }, { metodo_pago_id: 999999 }])
      assert.equal((await request('POST', '/ventas', venta(data))).status, 400);
    assert.equal(
      (
        await request('PUT', '/productos/1', {
          nombre: 'Cappuccino',
          categoria_id: 999999,
          precio_centimos: 220000,
        })
      ).status,
      400,
    );
    assert.equal(
      (await request('POST', '/detalle-ventas', { venta_id: 999999, producto_id: 1, cantidad: 1 }))
        .status,
      404,
    );
  }));
test('migración actualiza el Día 1 y conserva IDs, importes y filas al repetirse', () =>
  fixture(async (request, db) => {
    const config = { database: (await db.get('select database() as nombre')).nombre };
    const before = await db.all('select * from productos order by id');
    // Solo esta base temporal elimina tablas de autenticación para reproducir el Día 1.
    await db.sequelize.getQueryInterface().dropTable('usuarios');
    await db.sequelize.getQueryInterface().dropTable('SequelizeMeta');
    await setupDatabase(config, true);
    await setupDatabase(config, true);
    assert.deepEqual(await db.all('select * from productos order by id'), before);
    assert.equal(await db.models.ventas.count(), 10);
    assert.equal(await db.models.usuarios.count(), 0);
    const versions = await db.all('select name from `SequelizeMeta`');
    assert.equal(versions.length, 1);
  }));

test('una base con tablas ajenas se rechaza antes de modificar su esquema', () =>
  fixture(async (_request, db) => {
    const config = { database: (await db.get('select database() as nombre')).nombre };
    await db.sequelize.query('create table tabla_ajena(id int primary key)');
    const before = await db.all(
      'select table_name as nombre from information_schema.tables where table_schema = database() order by table_name',
    );
    await assert.rejects(setupDatabase(config, true), /siete entidades/);
    assert.deepEqual(
      await db.all(
        'select table_name as nombre from information_schema.tables where table_schema = database() order by table_name',
      ),
      before,
    );
  }));

test('CSRF rechaza escritura sin token, alterada o con origen ajeno y acepta la sesión correcta', () =>
  fixture(async (request, db) => {
    const before = await db.models.categorias.count();
    for (const header of ['', 'a'.repeat(64)]) {
      const result = await request.raw(
        'POST',
        '/categorias',
        { nombre: 'No debe crearse' },
        { 'X-CSRF-Token': header },
      );
      assert.equal(result.status, 403);
    }
    assert.equal(
      (
        await request(
          'POST',
          '/categorias',
          { nombre: 'Origen ajeno' },
          { Origin: 'https://malicioso.example' },
        )
      ).status,
      403,
    );
    assert.equal(await db.models.categorias.count(), before);
    const csrf = (await request('GET', '/auth/csrf')).body.csrfToken;
    await request('POST', '/auth/login', {
      correo: 'tester@example.test',
      password: 'Prueba_Cafe_2026',
    });
    assert.equal(
      (
        await request.raw(
          'POST',
          '/categorias',
          { nombre: 'Token de otra sesión' },
          { 'X-CSRF-Token': csrf },
        )
      ).status,
      403,
    );
    assert.equal(
      (await request('POST', '/categorias', { nombre: 'Cookie y CSRF válidos' })).status,
      201,
    );
  }));
test('logout elimina cookies con el mismo alcance y deja el perfil sin autorización', () =>
  fixture(async (request) => {
    const result = await request('POST', '/auth/logout', {});
    assert.equal(result.status, 204);
    const cookies = result.headers.getSetCookie();
    assert.equal(cookies.length, 2);
    for (const cookie of cookies) {
      assert.match(cookie, /Path=\/api/);
      assert.match(cookie, /HttpOnly/);
      assert.match(cookie, /Expires=Thu, 01 Jan 1970/);
    }
    assert.equal(request.cookie('cafe_nube_session'), undefined);
    assert.equal((await request('GET', '/auth/me')).status, 401);
  }));
test('registro y login también requieren comprobación CSRF', () =>
  fixture(async (request) => {
    assert.equal(
      (
        await request.raw('POST', '/auth/login', {
          correo: 'tester@example.test',
          password: 'Prueba_Cafe_2026',
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request.raw('POST', '/auth/register', {
          nombre: 'Ajeno',
          correo: 'ajeno@example.test',
          password: 'Clave_segura_2026',
        })
      ).status,
      403,
    );
  }));

test('cookies con formato JSON inválido se rechazan sin provocar errores internos', () =>
  fixture(async (request) => {
    assert.equal(
      (await request('GET', '/auth/me', undefined, { Cookie: 'cafe_nube_session=j:%7B%7D' }))
        .status,
      401,
    );
    const csrf = await request('GET', '/auth/csrf', undefined, {
      Cookie: 'cafe_nube_session=j:%7B%7D',
    });
    assert.equal(csrf.status, 200);
    assert.match(csrf.body.csrfToken, /^[a-f0-9]{64}$/);
  }));
