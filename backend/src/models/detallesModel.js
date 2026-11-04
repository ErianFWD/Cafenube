import { transaction } from '../database/connection.js';
import { httpError } from '../utils/validation.js';
const SELECT = 'select d.*, p.nombre as producto_nombre, d.cantidad * d.precio_unitario_centimos as subtotal_centimos from detalle_ventas d join productos p on p.id = d.producto_id';
export function detallesModel(db) {
  const get = (id) => db.prepare(`${SELECT} where d.id = ?`).get(id) || null;
  const price = (id) => { const p = db.prepare('select precio_centimos from productos where id = ?').get(id); if (!p) throw httpError(400, 'El producto no existe.'); return p.precio_centimos; };
  return {
    get,
    list({ buscar, limit, offset, venta_id }) {
      const condition = venta_id ? ' and d.venta_id = ?' : '';
      return db.prepare(`${SELECT} where p.nombre like ?${condition} order by d.venta_id desc, d.id limit ? offset ?`).all(`%${buscar}%`, ...(venta_id ? [venta_id] : []), limit, offset);
    },
    create(data) { return transaction(db, () => { if (db.prepare('select count(*) as total from detalle_ventas where venta_id = ?').get(data.venta_id).total >= 50) throw httpError(400, 'Cada venta admite hasta 50 productos distintos.'); const result = db.prepare('insert into detalle_ventas(venta_id, producto_id, cantidad, precio_unitario_centimos) values(?, ?, ?, ?)').run(data.venta_id, data.producto_id, data.cantidad, price(data.producto_id)); return get(Number(result.lastInsertRowid)); }); },
    update(id, data) { return transaction(db, () => { const previous = get(id); if (!previous) throw httpError(404, 'Detalle no encontrado.'); const importe = previous.producto_id === data.producto_id ? previous.precio_unitario_centimos : price(data.producto_id); db.prepare('update detalle_ventas set producto_id = ?, cantidad = ?, precio_unitario_centimos = ? where id = ?').run(data.producto_id, data.cantidad, importe, id); return get(id); }); },
    remove(id) { return transaction(db, () => { const detail = get(id); if (!detail) return false; const count = db.prepare('select count(*) as total from detalle_ventas where venta_id = ?').get(detail.venta_id).total; if (count <= 1) throw httpError(409, 'Una venta debe conservar al menos un producto. Puede eliminar la venta completa desde Ventas.'); db.prepare('delete from detalle_ventas where id = ?').run(id); return true; }); }
  };
}
