import { decimalFromCents } from '../database/connection.js';
const CONFIG = {
 categorias: { fields: ['nombre','descripcion'], select: 'select t.* from categorias t' },
 metodos_pago: { fields: ['nombre','descripcion'], select: 'select t.* from metodos_pago t' },
 clientes: { fields: ['nombre','telefono','correo'], select: 'select t.* from clientes t' },
 productos: { fields: ['nombre','descripcion','categoria_id','precio'], select: 'select t.id, t.nombre, t.descripcion, t.categoria_id, cast(t.precio * 100 as signed) as precio_centimos, c.nombre as categoria_nombre from productos t join categorias c on c.id = t.categoria_id' }
};
export function catalogModel(db, entity) {
 const config = CONFIG[entity]; if (!config) throw new Error('Entidad interna no permitida');
 const {fields,select} = config;
 const get = id => db.get(`${select} where t.id = ?`, id);
 const values = data => fields.map(field => field === 'precio' ? decimalFromCents(data.precio_centimos) : data[field]);
 return {
  get,
  list({buscar,limit,offset}) { return db.all(`${select} where t.nombre like ? order by t.nombre, t.id limit ? offset ?`, `%${buscar}%`, limit, offset); },
  async create(data) { const result = await db.run(`insert into ${entity} (${fields.join(',')}) values (${fields.map(()=>'?').join(',')})`, ...values(data)); return get(result.insertId); },
  async update(id,data) { await db.run(`update ${entity} set ${fields.map(field=>`${field} = ?`).join(',')} where id = ?`, ...values(data), id); return get(id); },
  async remove(id) { return (await db.run(`delete from ${entity} where id = ?`,id)).affectedRows > 0; }
 };
}
