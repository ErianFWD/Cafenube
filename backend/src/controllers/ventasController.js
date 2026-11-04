import { ventasModel } from '../models/ventasModel.js';
import { saleData, idParam, listQuery, httpError } from '../utils/validation.js';
export function ventasController(db) {
  const model = ventasModel(db);
  const existing = async (id) => { const row = await model.get(id); if (!row) throw httpError(404, 'Venta no encontrada.'); return row; };
  return {
    async list(req, res) { res.json(await model.list(listQuery(req.query))); },
    async get(req, res) { res.json(await existing(idParam(req.params.id))); },
    async create(req, res) { const row = await model.create(saleData(req.body)); res.location(`/api/ventas/${row.id}`).status(201).json(row); },
    async update(req, res) { const id = idParam(req.params.id); const old = await existing(id); res.json(await model.update(id, saleData(req.body, { previousDate: old.fecha }))); },
    async remove(req, res) { const id = idParam(req.params.id); await existing(id); await model.remove(id); res.status(204).end(); }
  };
}
