import { transaction } from '../database/connection.js';
import { httpError } from '../utils/validation.js';

const SUMMARY = `select v.*, c.nombre as cliente_nombre, m.nombre as metodo_pago_nombre,
  count(d.id) as cantidad_productos, coalesce(sum(d.cantidad), 0) as unidades,
  coalesce(sum(d.cantidad * d.precio_unitario_centimos), 0) as total_centimos
  from ventas v left join clientes c on c.id = v.cliente_id
  join metodos_pago m on m.id = v.metodo_pago_id
  left join detalle_ventas d on d.venta_id = v.id`;
export function ventasModel(db) {
  const get = (id) => {
    const row = db.prepare(`${SUMMARY} where v.id = ? group by v.id`).get(id);
    if (!row) return null;
    row.detalles = db.prepare('select d.*, p.nombre as producto_nombre, d.cantidad * d.precio_unitario_centimos as subtotal_centimos from detalle_ventas d join productos p on p.id = d.producto_id where d.venta_id = ? order by d.id').all(id);
    return row;
  };
  const price = (producto_id) => {
    const row = db.prepare('select precio_centimos from productos where id = ?').get(producto_id);
    if (!row) throw httpError(400, 'Uno de los productos seleccionados no existe.');
    return row.precio_centimos;
  };
  const insert = db.prepare('insert into detalle_ventas(venta_id, producto_id, cantidad, precio_unitario_centimos) values(?, ?, ?, ?)');
  return {
    get,
    list({ buscar, limit, offset }) {
      return db.prepare(`${SUMMARY} where cast(v.id as text) like ? or coalesce(c.nombre, 'Cliente de mostrador') like ? group by v.id order by v.fecha desc, v.id desc limit ? offset ?`).all(`%${buscar}%`, `%${buscar}%`, limit, offset);
    },
    create(data) {
      return transaction(db, () => {
        const result = db.prepare('insert into ventas(cliente_id, metodo_pago_id, fecha, observaciones) values(?, ?, ?, ?)').run(data.cliente_id, data.metodo_pago_id, data.fecha, data.observaciones);
        const id = Number(result.lastInsertRowid);
        data.detalles.forEach((d) => insert.run(id, d.producto_id, d.cantidad, price(d.producto_id)));
        return get(id);
      });
    },
    update(id, data) {
      return transaction(db, () => {
        const existing = get(id);
        if (!existing) throw httpError(404, 'Venta no encontrada.');
        db.prepare('update ventas set cliente_id = ?, metodo_pago_id = ?, fecha = ?, observaciones = ? where id = ?').run(data.cliente_id, data.metodo_pago_id, data.fecha, data.observaciones, id);
        const old = new Map(existing.detalles.map((d) => [d.producto_id, d]));
        const desired = new Set(data.detalles.map((d) => d.producto_id));
        existing.detalles.filter((d) => !desired.has(d.producto_id)).forEach((d) => db.prepare('delete from detalle_ventas where id = ?').run(d.id));
        data.detalles.forEach((d) => {
          const previous = old.get(d.producto_id);
          if (previous) db.prepare('update detalle_ventas set cantidad = ? where id = ?').run(d.cantidad, previous.id);
          else insert.run(id, d.producto_id, d.cantidad, price(d.producto_id));
        });
        return get(id);
      });
    },
    remove(id) { return db.prepare('delete from ventas where id = ?').run(id).changes > 0; }
  };
}
