export function errorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'El JSON enviado no es válido.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'La solicitud supera el tamaño permitido.' });
  if ([400, 404, 409, 422].includes(error.status)) return res.status(error.status).json({ error: error.message });
  if ([2067, 1555].includes(error.errcode)) return res.status(409).json({ error: 'Ya existe un registro con ese nombre, correo o combinación de venta y producto.' });
  if ([787, 1811].includes(error.errcode)) return res.status(409).json({ error: 'La operación tiene relaciones asociadas. Compruebe que los registros seleccionados existan o quite sus dependencias antes de eliminar.' });
  if ([275, 1299, 3091].includes(error.errcode)) return res.status(400).json({ error: 'Los valores no cumplen las reglas de la base de datos.' });
  console.error(JSON.stringify({ event: 'api_error', code: error.code || 'INTERNAL', sqlite: error.errcode || null }));
  res.status(500).json({ error: 'Ocurrió un error interno. Intente nuevamente.' });
}
