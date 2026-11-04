import { ventasModel } from '../models/ventasModel.js';
import { saleData, idParam, listQuery, httpError } from '../utils/validation.js';
export function ventasController(db) {
  const model = ventasModel(db);
  const existing = (id) => { const row = model.get(id); if (!row) throw httpError(404, 'Venta no encontrada.'); return row; };
  return {
    list(req, res) { res.json(model.list(listQuery(req.query))); },
    get(req, res) { res.json(existing(idParam(req.params.id))); },
    create(req, res) { const row = model.create(saleData(req.body)); res.location(`/api/ventas/${row.id}`).status(201).json(row); },
    update(req, res) { const id = idParam(req.params.id); const old = existing(id); res.json(model.update(id, saleData(req.body, { previousDate: old.fecha }))); },
    remove(req, res) { const id = idParam(req.params.id); existing(id); model.remove(id); res.status(204).end(); }
  };
}
