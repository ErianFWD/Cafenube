import { catalogModel } from '../models/catalogModel.js';
import { catalogData, idParam, listQuery, httpError } from '../utils/validation.js';
export function catalogController(db, entity) {
  const model = catalogModel(db, entity);
  const existing = async (id) => { const row = await model.get(id); if (!row) throw httpError(404, 'Registro no encontrado.'); return row; };
  return {
    async list(req, res) { res.json(await model.list(listQuery(req.query))); },
    async get(req, res) { res.json(await existing(idParam(req.params.id))); },
    async create(req, res) { const row = await model.create(catalogData(entity, req.body)); res.location(`${req.baseUrl}/${row.id}`).status(201).json(row); },
    async update(req, res) { const id = idParam(req.params.id); await existing(id); res.json(await model.update(id, catalogData(entity, req.body))); },
    async remove(req, res) { const id = idParam(req.params.id); await existing(id); await model.remove(id); res.status(204).end(); }
  };
}
