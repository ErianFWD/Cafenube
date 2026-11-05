import { decimalFromCents } from './connection.js';
export async function seedDatabase(db) {
  return db.transaction(async () => {
    const categoria = (...params) => db.models.categorias.create(Object.fromEntries(['id', 'nombre', 'descripcion'].map((key,i)=>[key,params[i]])),db.ormOptions());
    for (const row of [[1, 'Café de especialidad', 'Bebidas preparadas con café costarricense.'], [2, 'Bebidas frías', 'Opciones frescas para cualquier momento.'], [3, 'Repostería', 'Horneados para acompañar el café.'], [4, 'Desayunos', 'Platos sencillos para comenzar el día.']]) await categoria(...row);
    const producto = (...params) => db.models.productos.create(Object.fromEntries(['id', 'categoria_id', 'nombre', 'descripcion', 'precio'].map((key,i)=>[key,params[i]])),db.ormOptions());
    for (const row of [[1, 1, 'Cappuccino', 'Espresso doble, leche y una capa suave de espuma.', 220000], [2, 1, 'Americano', 'Café de sabor limpio y notas tostadas.', 150000], [3, 1, 'Latte de vainilla', 'Espresso, leche cremosa y un toque de vainilla.', 250000], [4, 2, 'Cold brew', 'Extracción en frío y hielo.', 260000], [5, 2, 'Té frío de frutos rojos', 'Infusión frutal con hielo.', 180000], [6, 3, 'Croissant de mantequilla', 'Hojaldre ligero y recién horneado.', 190000], [7, 3, 'Queque de zanahoria', 'Porción con cobertura cremosa.', 230000], [8, 4, 'Tostada de aguacate', 'Pan artesanal, aguacate y semillas.', 350000]]) await producto(...(row.map((v,i)=>i === 4 ? decimalFromCents(v) : v)));
    const cliente = (...params) => db.models.clientes.create(Object.fromEntries(['id', 'nombre', 'telefono', 'correo'].map((key,i)=>[key,params[i]])),db.ormOptions());
    for (const row of [[1, 'Ana Mora', '8888-1001', 'ana@example.test'], [2, 'Daniel Solís', '8888-1002', 'daniel@example.test'], [3, 'Lucía Vargas', '8888-1003', 'lucia@example.test'], [4, 'Carlos Jiménez', null, null]]) await cliente(...row);
    const metodo = (...params) => db.models.metodos_pago.create(Object.fromEntries(['id', 'nombre', 'descripcion'].map((key,i)=>[key,params[i]])),db.ormOptions());
    for (const row of [[1, 'Efectivo', 'Pago en caja.'], [2, 'Tarjeta', 'Tarjeta de débito o crédito.'], [3, 'SINPE Móvil', 'Registro de un pago recibido por transferencia.']]) await metodo(...row);
    const venta = (...params) => db.models.ventas.create(Object.fromEntries(['id', 'cliente_id', 'metodo_pago_id', 'fecha', 'observaciones'].map((key,i)=>[key,params[i]])),db.ormOptions());
    const detalle = (...params) => db.models.detalle_ventas.create(Object.fromEntries(['venta_id', 'producto_id', 'cantidad', 'precio_unitario'].map((key,i)=>[key,params[i]])),db.ormOptions());
    for (let i = 0; i < 10; i += 1) {
      const fecha = new Date(); fecha.setUTCDate(fecha.getUTCDate() - Math.floor(i / 2)); fecha.setUTCHours(15 + (i % 5), 10 + i, 0, 0);
      await venta(i + 1, i % 3 === 0 ? null : (i % 4) + 1, (i % 3) + 1, fecha, i === 0 ? 'Pedido para llevar' : null);
      const productId = (i % 5) + 1;
      await detalle(i + 1, productId, (i % 2) + 1, (await db.models.productos.findByPk(productId,db.ormOptions())).precio);
      await detalle(i + 1, 6 + (i % 3), 1, (await db.models.productos.findByPk(6 + (i % 3),db.ormOptions())).precio);
    }
  });
}
