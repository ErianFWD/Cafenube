export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
export function objectBody(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw httpError(400, 'Envíe un objeto JSON válido.');
  const extra = Object.keys(body).find((key) => !allowed.includes(key));
  if (extra) throw httpError(400, `El campo ${extra} no está permitido.`);
  return body;
}
export function integer(value, label, { min = 1, max = 2147483647, optional = false } = {}) {
  if (optional && (value === null || value === undefined)) return null;
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw httpError(400, `${label} debe ser un entero entre ${min} y ${max}.`);
  return value;
}
export function idParam(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value))
    throw httpError(400, 'El identificador no es válido.');
  return integer(Number(value), 'El identificador');
}
export function text(value, label, { min = 2, max = 100, optional = false } = {}) {
  if (optional && (value === null || value === undefined || value === '')) return null;
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    throw httpError(400, `${label} debe tener entre ${min} y ${max} caracteres.`);
  return value.trim();
}
export function catalogData(entity, body) {
  const fields = {
    categorias: ['nombre', 'descripcion'],
    metodos_pago: ['nombre', 'descripcion'],
    productos: ['nombre', 'descripcion', 'categoria_id', 'precio_centimos'],
    clientes: ['nombre', 'telefono', 'correo'],
  };
  objectBody(body, fields[entity]);
  const result = {
    nombre: text(body.nombre, 'El nombre', {
      max: ['categorias', 'metodos_pago'].includes(entity) ? 80 : 100,
    }),
  };
  if (entity === 'clientes') {
    result.telefono = text(body.telefono, 'El teléfono', { optional: true, min: 7, max: 30 });
    if (result.telefono && !/^[\d+()\s-]+$/.test(result.telefono))
      throw httpError(400, 'El teléfono contiene caracteres no válidos.');
    result.correo = text(body.correo, 'El correo', { optional: true, min: 3, max: 120 });
    if (result.correo) {
      result.correo = result.correo.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.correo))
        throw httpError(400, 'El correo no tiene un formato válido.');
    }
  } else {
    result.descripcion = text(body.descripcion, 'La descripción', {
      optional: true,
      min: 1,
      max: 300,
    });
    if (entity === 'productos') {
      result.categoria_id = integer(body.categoria_id, 'La categoría');
      result.precio_centimos = integer(body.precio_centimos, 'El precio en céntimos', {
        min: 0,
        max: 100000000,
      });
    }
  }
  return result;
}
export function listQuery(query, { allowVenta = false } = {}) {
  const allowed = ['buscar', 'limit', 'offset', ...(allowVenta ? ['venta_id'] : [])];
  if (Object.keys(query).some((key) => !allowed.includes(key)))
    throw httpError(400, 'Hay filtros no admitidos.');
  const number = (value, fallback, min, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value))
      throw httpError(400, 'La paginación no es válida.');
    return integer(Number(value), 'La paginación', { min, max });
  };
  const buscar =
    query.buscar === undefined ? '' : text(query.buscar, 'La búsqueda', { min: 1, max: 100 });
  return {
    buscar,
    limit: number(query.limit, 100, 1, 200),
    offset: number(query.offset, 0, 0, 100000),
    ...(allowVenta && query.venta_id !== undefined ? { venta_id: idParam(query.venta_id) } : {}),
  };
}
export function saleData(body, { previousDate } = {}) {
  objectBody(body, ['cliente_id', 'metodo_pago_id', 'fecha', 'observaciones', 'detalles']);
  const cliente_id = integer(body.cliente_id, 'El cliente', { optional: true });
  const metodo_pago_id = integer(body.metodo_pago_id, 'El método de pago');
  let fecha = body.fecha ?? previousDate ?? new Date().toISOString();
  if (
    typeof fecha !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(fecha) ||
    !Number.isFinite(Date.parse(fecha))
  )
    throw httpError(400, 'La fecha debe ser ISO con zona horaria.');
  fecha = new Date(fecha).toISOString();
  const observaciones = text(body.observaciones, 'Las observaciones', {
    optional: true,
    min: 1,
    max: 300,
  });
  if (!Array.isArray(body.detalles) || body.detalles.length < 1 || body.detalles.length > 50)
    throw httpError(400, 'La venta debe contener entre 1 y 50 productos.');
  const seen = new Set();
  const detalles = body.detalles.map((item) => {
    objectBody(item, ['producto_id', 'cantidad']);
    const producto_id = integer(item.producto_id, 'El producto');
    const cantidad = integer(item.cantidad, 'La cantidad', { max: 999 });
    if (seen.has(producto_id))
      throw httpError(400, 'Cada producto puede aparecer una sola vez en la venta.');
    seen.add(producto_id);
    return { producto_id, cantidad };
  });
  return { cliente_id, metodo_pago_id, fecha, observaciones, detalles };
}
export function detailData(body, creating = false) {
  objectBody(
    body,
    creating ? ['venta_id', 'producto_id', 'cantidad'] : ['producto_id', 'cantidad'],
  );
  return {
    ...(creating ? { venta_id: integer(body.venta_id, 'La venta') } : {}),
    producto_id: integer(body.producto_id, 'El producto'),
    cantidad: integer(body.cantidad, 'La cantidad', { max: 999 }),
  };
}
