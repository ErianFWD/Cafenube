import { catalogModel } from '../models/catalogModel.js';
import { catalogData, idParam, listQuery, httpError } from '../utils/validation.js';
export function catalogController(db, entity) {
  const model = catalogModel(db, entity);
  const existing = (id) => { const row = model.get(id); if (!row) throw httpError(404, 'Registro no encontrado.'); return row; };
  return {
    list(req, res) { res.json(model.list(listQuery(req.query))); },
    get(req, res) { res.json(existing(idParam(req.params.id))); },
    create(req, res) { const row = model.create(catalogData(entity, req.body)); res.location(`${req.baseUrl}/${row.id}`).status(201).json(row); },
    update(req, res) { const id = idParam(req.params.id); existing(id); res.json(model.update(id, catalogData(entity, req.body))); },
    remove(req, res) { const id = idParam(req.params.id); existing(id); model.remove(id); res.status(204).end(); }
  };
}
