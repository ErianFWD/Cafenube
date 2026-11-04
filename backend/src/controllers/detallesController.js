import { detallesModel } from '../models/detallesModel.js';
import { detailData, idParam, listQuery, httpError } from '../utils/validation.js';
export function detallesController(db) {
  const model = detallesModel(db);
  const existing = (id) => { const row = model.get(id); if (!row) throw httpError(404, 'Detalle no encontrado.'); return row; };
  return {
    list(req, res) { res.json(model.list(listQuery(req.query, { allowVenta: true }))); },
    get(req, res) { res.json(existing(idParam(req.params.id))); },
    create(req, res) { const row = model.create(detailData(req.body, true)); res.location(`/api/detalle-ventas/${row.id}`).status(201).json(row); },
    update(req, res) { const id = idParam(req.params.id); existing(id); res.json(model.update(id, detailData(req.body))); },
    remove(req, res) { const id = idParam(req.params.id); existing(id); model.remove(id); res.status(204).end(); }
  };
}
