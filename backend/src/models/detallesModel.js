import { transaction, decimalFromCents } from '../database/connection.js';
import { httpError } from '../utils/validation.js';
import { DETAIL, productPrice } from './ventasModel.js';
export function detallesModel(db) {
 const get = id => db.get(`${DETAIL} where d.id = ?`,id);
 const lockSale = async id => { if (!await db.get('select id from ventas where id = ? for update',id)) throw httpError(409,'La venta seleccionada no existe.'); };
 return {
  get,
  list({buscar,limit,offset,venta_id}) { return db.all(`${DETAIL} where p.nombre like ?${venta_id ? ' and d.venta_id = ?' : ''} order by d.venta_id desc,d.id limit ? offset ?`,`%${buscar}%`,...(venta_id ? [venta_id] : []),limit,offset); },
  create(data) { return transaction(db,async()=>{ await lockSale(data.venta_id); if ((await db.get('select count(*) as total from detalle_ventas where venta_id = ?',data.venta_id)).total >= 50) throw httpError(400,'Cada venta admite hasta 50 productos distintos.'); const result = await db.run('insert into detalle_ventas(venta_id,producto_id,cantidad,precio_unitario) values(?,?,?,?)',data.venta_id,data.producto_id,data.cantidad,decimalFromCents(await productPrice(db,data.producto_id))); return get(result.insertId); }); },
  update(id,data) { return transaction(db,async()=>{ const initial = await get(id); if (!initial) throw httpError(404,'Detalle no encontrado.'); await lockSale(initial.venta_id); const previous = await get(id); if (!previous) throw httpError(404,'Detalle no encontrado.'); const cents = previous.producto_id === data.producto_id ? previous.precio_unitario_centimos : await productPrice(db,data.producto_id); await db.run('update detalle_ventas set producto_id = ?,cantidad = ?,precio_unitario = ? where id = ?',data.producto_id,data.cantidad,decimalFromCents(cents),id); return get(id); }); },
  remove(id) { return transaction(db,async()=>{ const initial = await get(id); if (!initial) return false; await lockSale(initial.venta_id); const previous = await get(id); if (!previous) return false; const {total} = await db.get('select count(*) as total from detalle_ventas where venta_id = ?',previous.venta_id); if (total <= 1) throw httpError(409,'Una venta debe conservar al menos un producto. Puede eliminar la venta completa desde Ventas.'); await db.run('delete from detalle_ventas where id = ?',id); return true; }); }
 };
}
