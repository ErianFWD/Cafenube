export function resumenController(db) {
  return async (_req, res) => {
    const productos = (await db.get('select count(*) as total from productos')).total;
    const clientes = (await db.get('select count(*) as total from clientes')).total;
    const ventas = (await db.get('select count(*) as total from ventas')).total;
    const ingresos_centimos = (
      await db.get(
        'select cast(coalesce(sum(cantidad * precio_unitario), 0) * 100 as signed) as total from detalle_ventas',
      )
    ).total;
    const recientes = await db.all(
      `select v.id, v.fecha, c.nombre as cliente_nombre, m.nombre as metodo_pago_nombre, cast(sum(d.cantidad * d.precio_unitario) * 100 as signed) as total_centimos from ventas v left join clientes c on c.id = v.cliente_id join metodos_pago m on m.id = v.metodo_pago_id join detalle_ventas d on d.venta_id = v.id group by v.id, v.fecha, c.nombre, m.nombre order by v.fecha desc, v.id desc limit 5`,
    );
    const populares = await db.all(
      'select p.id, p.nombre, c.nombre as categoria_nombre, coalesce(sum(d.cantidad), 0) as unidades from productos p join categorias c on c.id = p.categoria_id left join detalle_ventas d on d.producto_id = p.id group by p.id, p.nombre, c.nombre order by unidades desc, p.id limit 5',
    );
    const categorias = await db.all(
      'select c.id, c.nombre, count(p.id) as productos from categorias c left join productos p on p.categoria_id = c.id group by c.id, c.nombre order by c.id',
    );
    res.json({ productos, clientes, ventas, ingresos_centimos, recientes, populares, categorias });
  };
}
