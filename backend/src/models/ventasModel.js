import { transaction, decimalFromCents, sqlDate } from '../database/connection.js';
import { httpError } from '../utils/validation.js';
const SUMMARY = `select v.*, c.nombre as cliente_nombre, m.nombre as metodo_pago_nombre,
 coalesce(s.cantidad_productos,0) as cantidad_productos, coalesce(s.unidades,0) as unidades, coalesce(s.total_centimos,0) as total_centimos
 from ventas v left join clientes c on c.id = v.cliente_id join metodos_pago m on m.id = v.metodo_pago_id
 left join (select venta_id, count(*) as cantidad_productos, sum(cantidad) as unidades, cast(sum(cantidad * precio_unitario) * 100 as signed) as total_centimos from detalle_ventas group by venta_id) s on s.venta_id = v.id`;
export const DETAIL = `select d.id,d.venta_id,d.producto_id,d.cantidad,cast(d.precio_unitario * 100 as signed) as precio_unitario_centimos,p.nombre as producto_nombre,cast(d.cantidad * d.precio_unitario * 100 as signed) as subtotal_centimos from detalle_ventas d join productos p on p.id = d.producto_id`;
export async function productPrice(db,id) { const row = await db.get('select cast(precio * 100 as signed) as precio_centimos from productos where id = ?',id); if (!row) throw httpError(400,'El producto no existe.'); return row.precio_centimos; }
export function ventasModel(db) {
 const get = async id => { const row = await db.get(`${SUMMARY} where v.id = ?`,id); if (!row) return null; row.detalles = await db.all(`${DETAIL} where d.venta_id = ? order by d.id`,id); return row; };
 const insert = async (id,d) => db.run('insert into detalle_ventas(venta_id,producto_id,cantidad,precio_unitario) values(?,?,?,?)',id,d.producto_id,d.cantidad,decimalFromCents(await productPrice(db,d.producto_id)));
 return {
  get,
  list({buscar,limit,offset}) { return db.all(`${SUMMARY} where cast(v.id as char) like ? or coalesce(c.nombre,'Cliente de mostrador') like ? order by v.fecha desc,v.id desc limit ? offset ?`, `%${buscar}%`,`%${buscar}%`,limit,offset); },
  create(data) { return transaction(db,async () => { const result = await db.run('insert into ventas(cliente_id,metodo_pago_id,fecha,observaciones) values(?,?,?,?)',data.cliente_id,data.metodo_pago_id,sqlDate(data.fecha),data.observaciones); for (const d of data.detalles) await insert(result.insertId,d); return get(result.insertId); }); },
  update(id,data) { return transaction(db,async () => {
   if (!await db.get('select id from ventas where id = ? for update',id)) throw httpError(404,'Venta no encontrada.');
   const existing = await get(id);
   await db.run('update ventas set cliente_id = ?,metodo_pago_id = ?,fecha = ?,observaciones = ? where id = ?',data.cliente_id,data.metodo_pago_id,sqlDate(data.fecha),data.observaciones,id);
   const old = new Map(existing.detalles.map(d=>[d.producto_id,d])); const desired = new Set(data.detalles.map(d=>d.producto_id));
   for (const d of existing.detalles) if (!desired.has(d.producto_id)) await db.run('delete from detalle_ventas where id = ?',d.id);
   for (const d of data.detalles) { const previous = old.get(d.producto_id); if (previous) await db.run('update detalle_ventas set cantidad = ? where id = ?',d.cantidad,previous.id); else await insert(id,d); }
   return get(id);
  }); },
  remove(id) { return transaction(db,async()=>{ await db.get('select id from ventas where id = ? for update',id); return (await db.run('delete from ventas where id = ?',id)).affectedRows > 0; }); }
 };
}
