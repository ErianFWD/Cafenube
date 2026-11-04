// Los identificadores SQL proceden exclusivamente de esta lista interna cerrada.
const CONFIG = {
  categorias: { fields: ['nombre', 'descripcion'], select: 'select t.* from categorias t' },
  metodos_pago: { fields: ['nombre', 'descripcion'], select: 'select t.* from metodos_pago t' },
  clientes: { fields: ['nombre', 'telefono', 'correo'], select: 'select t.* from clientes t' },
  productos: { fields: ['nombre', 'descripcion', 'categoria_id', 'precio_centimos'], select: 'select t.*, c.nombre as categoria_nombre from productos t join categorias c on c.id = t.categoria_id' }
};
export function catalogModel(db, entity) {
  const config = CONFIG[entity];
  if (!config) throw new Error('Entidad interna no permitida');
  const { fields, select } = config;
  const get = (id) => db.prepare(`${select} where t.id = ?`).get(id) || null;
  return {
    get,
    list({ buscar, limit, offset }) { return db.prepare(`${select} where t.nombre like ? order by t.nombre collate nocase, t.id limit ? offset ?`).all(`%${buscar}%`, limit, offset); },
    create(data) { const result = db.prepare(`insert into ${entity} (${fields.join(', ')}) values (${fields.map(() => '?').join(', ')})`).run(...fields.map((field) => data[field])); return get(Number(result.lastInsertRowid)); },
    update(id, data) { db.prepare(`update ${entity} set ${fields.map((field) => `${field} = ?`).join(', ')} where id = ?`).run(...fields.map((field) => data[field]), id); return get(id); },
    remove(id) { return db.prepare(`delete from ${entity} where id = ?`).run(id).changes > 0; }
  };
}
