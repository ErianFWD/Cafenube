import { Op } from 'sequelize';
import { transaction, decimalFromCents } from '../database/connection.js';
import { httpError } from '../utils/validation.js';
import { detailDto, productPrice } from './ventasModel.js';
export function detallesModel(db) {
  const get = async (id) => {
    const row = await db.models.detalle_ventas.findByPk(id, {
      ...db.ormOptions(),
      include: [{ association: 'producto', attributes: ['nombre'] }],
    });
    return row ? detailDto(row) : null;
  };
  const lockSale = async (id) => {
    if (!(await db.models.ventas.findByPk(id, { ...db.ormOptions(), lock: true })))
      throw httpError(404, 'La venta seleccionada no existe.');
  };
  return {
    get,
    async list({ buscar, limit, offset, venta_id }) {
      return (
        await db.models.detalle_ventas.findAll({
          ...db.ormOptions(),
          where: venta_id ? { venta_id } : {},
          include: [
            {
              association: 'producto',
              attributes: ['nombre'],
              where: { nombre: { [Op.like]: `%${buscar}%` } },
            },
          ],
          order: [
            ['venta_id', 'DESC'],
            ['id', 'ASC'],
          ],
          limit,
          offset,
        })
      ).map(detailDto);
    },
    create(data) {
      return transaction(db, async () => {
        await lockSale(data.venta_id);
        if (
          (await db.models.detalle_ventas.count({
            ...db.ormOptions(),
            where: { venta_id: data.venta_id },
          })) >= 50
        )
          throw httpError(400, 'Cada venta admite hasta 50 productos distintos.');
        const result = await db.models.detalle_ventas.create(
          {
            venta_id: data.venta_id,
            producto_id: data.producto_id,
            cantidad: data.cantidad,
            precio_unitario: decimalFromCents(await productPrice(db, data.producto_id)),
          },
          db.ormOptions(),
        );
        return get(result.id);
      });
    },
    update(id, data) {
      return transaction(db, async () => {
        const initial = await get(id);
        if (!initial) throw httpError(404, 'Detalle no encontrado.');
        await lockSale(initial.venta_id);
        const previous = await get(id);
        if (!previous) throw httpError(404, 'Detalle no encontrado.');
        const cents =
          previous.producto_id === data.producto_id
            ? previous.precio_unitario_centimos
            : await productPrice(db, data.producto_id);
        await db.models.detalle_ventas.update(
          {
            producto_id: data.producto_id,
            cantidad: data.cantidad,
            precio_unitario: decimalFromCents(cents),
          },
          { ...db.ormOptions(), where: { id } },
        );
        return get(id);
      });
    },
    remove(id) {
      return transaction(db, async () => {
        const initial = await get(id);
        if (!initial) return false;
        await lockSale(initial.venta_id);
        const previous = await get(id);
        if (!previous) return false;
        const total = await db.models.detalle_ventas.count({
          ...db.ormOptions(),
          where: { venta_id: previous.venta_id },
        });
        if (total <= 1)
          throw httpError(
            409,
            'Una venta debe conservar al menos un producto. Puede eliminar la venta completa desde Ventas.',
          );
        await db.models.detalle_ventas.destroy({ ...db.ormOptions(), where: { id } });
        return true;
      });
    },
  };
}
