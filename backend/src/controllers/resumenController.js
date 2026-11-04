export function resumenController(db) {
  return (_req, res) => {
    const productos = db.prepare('select count(*) as total from productos').get().total;
    const clientes = db.prepare('select count(*) as total from clientes').get().total;
    const ventas = db.prepare('select count(*) as total from ventas').get().total;
    const ingresos_centimos = db.prepare('select coalesce(sum(cantidad * precio_unitario_centimos), 0) as total from detalle_ventas').get().total;
    const recientes = db.prepare(`select v.id, v.fecha, c.nombre as cliente_nombre, m.nombre as metodo_pago_nombre, sum(d.cantidad * d.precio_unitario_centimos) as total_centimos from ventas v left join clientes c on c.id = v.cliente_id join metodos_pago m on m.id = v.metodo_pago_id join detalle_ventas d on d.venta_id = v.id group by v.id order by v.fecha desc, v.id desc limit 5`).all();
    const populares = db.prepare('select p.id, p.nombre, c.nombre as categoria_nombre, coalesce(sum(d.cantidad), 0) as unidades from productos p join categorias c on c.id = p.categoria_id left join detalle_ventas d on d.producto_id = p.id group by p.id order by unidades desc, p.id limit 5').all();
    const categorias = db.prepare('select c.id, c.nombre, count(p.id) as productos from categorias c left join productos p on p.categoria_id = c.id group by c.id order by c.id').all();
    res.json({ productos, clientes, ventas, ingresos_centimos, recientes, populares, categorias });
  };
}
