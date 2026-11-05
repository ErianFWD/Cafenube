import { cents } from './entities.js';
import { transaction, decimalFromCents } from '../database/connection.js';
import { httpError } from '../utils/validation.js';
import { Op, where, cast, col } from 'sequelize';
export function detailDto(row) {
  const d = row.get ? row.get({ plain: true }) : row;
  const precio_unitario_centimos = cents(d.precio_unitario);
  return {
    id: d.id,
    venta_id: d.venta_id,
    producto_id: d.producto_id,
    cantidad: d.cantidad,
    precio_unitario_centimos,
    producto_nombre: d.producto.nombre,
    subtotal_centimos: precio_unitario_centimos * d.cantidad,
  };
}
const saleInclude = [
  { association: 'cliente', attributes: ['nombre'] },
  { association: 'metodo_pago', attributes: ['nombre'] },
  { association: 'detalles', include: [{ association: 'producto', attributes: ['nombre'] }] },
];
function saleDto(row, details = false) {
  if (!row) return null;
  const v = row.get({ plain: true });
  const lineas = v.detalles.map(detailDto).sort((a, b) => a.id - b.id);
  const result = {
    id: v.id,
    cliente_id: v.cliente_id,
    metodo_pago_id: v.metodo_pago_id,
    fecha: new Date(v.fecha).toISOString(),
    observaciones: v.observaciones,
    cliente_nombre: v.cliente?.nombre ?? null,
    metodo_pago_nombre: v.metodo_pago.nombre,
    cantidad_productos: lineas.length,
    unidades: lineas.reduce((n, d) => n + d.cantidad, 0),
    total_centimos: lineas.reduce((n, d) => n + d.subtotal_centimos, 0),
  };
  if (details) result.detalles = lineas;
  return result;
}
export async function productPrice(db, id) {
  const product = await db.models.productos.findByPk(id, db.ormOptions());
  const row = product ? { precio_centimos: cents(product.precio) } : null;
  if (!row) throw httpError(400, 'El producto no existe.');
  return row.precio_centimos;
}
export function ventasModel(db) {
  const get = async (id) =>
    saleDto(
      await db.models.ventas.findByPk(id, { ...db.ormOptions(), include: saleInclude }),
      true,
    );
  const insert = async (id, d) =>
    db.models.detalle_ventas.create(
      {
        venta_id: id,
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        precio_unitario: decimalFromCents(await productPrice(db, d.producto_id)),
      },
      db.ormOptions(),
    );
  return {
    get,
    async list({ buscar, limit, offset }) {
      // La colección de detalles se carga aparte para paginar ventas sin duplicarlas.
      const include = saleInclude.map((i) =>
        i.association === 'detalles' ? { ...i, separate: true } : i,
      );
      const rows = await db.models.ventas.findAll({
        ...db.ormOptions(),
        include,
        subQuery: false,
        where: {
          [Op.or]: [
            where(cast(col('ventas.id'), 'CHAR'), { [Op.like]: `%${buscar}%` }),
            where(col('cliente.nombre'), { [Op.like]: `%${buscar}%` }),
            ...('Cliente de mostrador'.toLowerCase().includes(buscar.toLowerCase())
              ? [{ cliente_id: null }]
              : []),
          ],
        },
        order: [
          ['fecha', 'DESC'],
          ['id', 'DESC'],
        ],
        limit,
        offset,
      });
      return rows.map((row) => saleDto(row));
    },
    create(data) {
      return transaction(db, async () => {
        const result = await db.models.ventas.create(
          {
            cliente_id: data.cliente_id,
            metodo_pago_id: data.metodo_pago_id,
            fecha: new Date(data.fecha),
            observaciones: data.observaciones,
          },
          db.ormOptions(),
        );
        for (const d of data.detalles) await insert(result.id, d);
        return get(result.id);
      });
    },
    update(id, data) {
      return transaction(db, async () => {
        if (!(await db.models.ventas.findByPk(id, { ...db.ormOptions(), lock: true })))
          throw httpError(404, 'Venta no encontrada.');
        const existing = await get(id);
        await db.models.ventas.update(
          {
            cliente_id: data.cliente_id,
            metodo_pago_id: data.metodo_pago_id,
            fecha: new Date(data.fecha),
            observaciones: data.observaciones,
          },
          { ...db.ormOptions(), where: { id } },
        );
        const old = new Map(existing.detalles.map((d) => [d.producto_id, d]));
        const desired = new Set(data.detalles.map((d) => d.producto_id));
        for (const d of existing.detalles)
          if (!desired.has(d.producto_id))
            await db.models.detalle_ventas.destroy({ ...db.ormOptions(), where: { id: d.id } });
        for (const d of data.detalles) {
          const previous = old.get(d.producto_id);
          if (previous)
            await db.models.detalle_ventas.update(
              { cantidad: d.cantidad },
              { ...db.ormOptions(), where: { id: previous.id } },
            );
          else await insert(id, d);
        }
        return get(id);
      });
    },
    remove(id) {
      return transaction(db, async () => {
        await db.models.ventas.findByPk(id, { ...db.ormOptions(), lock: true });
        return (await db.models.ventas.destroy({ ...db.ormOptions(), where: { id } })) > 0;
      });
    },
  };
}
