import { detallesModel } from '../models/detallesModel.js';
import { detailData, idParam, listQuery, httpError } from '../utils/validation.js';
export function detallesController(db) {
  const model = detallesModel(db);
  const existing = async (id) => {
    const row = await model.get(id);
    if (!row) throw httpError(404, 'Detalle no encontrado.');
    return row;
  };
  return {
    async list(req, res) {
      res.json(await model.list(listQuery(req.query, { allowVenta: true })));
    },
    async get(req, res) {
      res.json(await existing(idParam(req.params.id)));
    },
    async create(req, res) {
      const row = await model.create(detailData(req.body, true));
      res.location(`/api/detalle-ventas/${row.id}`).status(201).json(row);
    },
    async update(req, res) {
      const id = idParam(req.params.id);
      await existing(id);
      res.json(await model.update(id, detailData(req.body)));
    },
    async remove(req, res) {
      const id = idParam(req.params.id);
      await existing(id);
      await model.remove(id);
      res.status(204).end();
    },
  };
}
