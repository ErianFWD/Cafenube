import { Op } from 'sequelize';
import { decimalFromCents } from '../database/connection.js';
import { cents } from './entities.js';
export function catalogModel(db, entity) {
  if (!['categorias', 'productos', 'clientes', 'metodos_pago'].includes(entity))
    throw new Error('Entidad interna no permitida');
  const Model = db.models[entity];
  const options = () => ({
    ...db.ormOptions(),
    ...(entity === 'productos'
      ? { include: [{ association: 'categoria', attributes: ['nombre'] }] }
      : {}),
  });
  const dto = (row) => {
    if (!row) return null;
    const data = row.get({ plain: true });
    if (entity === 'productos') {
      data.precio_centimos = cents(data.precio);
      data.categoria_nombre = data.categoria.nombre;
      delete data.precio;
      delete data.categoria;
    }
    return data;
  };
  const values = (data) => {
    const result = { ...data };
    if (entity === 'productos') {
      result.precio = decimalFromCents(data.precio_centimos);
      delete result.precio_centimos;
    }
    return result;
  };
  const get = async (id) => dto(await Model.findByPk(id, options()));
  return {
    get,
    async list({ buscar, limit, offset }) {
      return (
        await Model.findAll({
          ...options(),
          where: { nombre: { [Op.like]: `%${buscar}%` } },
          order: [
            ['nombre', 'ASC'],
            ['id', 'ASC'],
          ],
          limit,
          offset,
        })
      ).map(dto);
    },
    async create(data) {
      const row = await Model.create(values(data), db.ormOptions());
      return get(row.id);
    },
    async update(id, data) {
      await Model.update(values(data), { ...db.ormOptions(), where: { id } });
      return get(id);
    },
    async remove(id) {
      return (await Model.destroy({ ...db.ormOptions(), where: { id } })) > 0;
    },
  };
}
