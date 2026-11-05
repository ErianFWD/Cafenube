export function errorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'El JSON enviado no es válido.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'La solicitud supera el tamaño permitido.' });
  if ([400, 404, 409, 422].includes(error.status)) return res.status(error.status).json({ error: error.message });
  if (error.name === 'SequelizeValidationError') return res.status(400).json({error:'Los valores no cumplen las reglas del modelo.'});
  const code = error.original?.code || error.parent?.code || error.code;
  if (code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un registro con ese nombre, correo o combinación de venta y producto.' });
  if (['ER_ROW_IS_REFERENCED_2','ER_NO_REFERENCED_ROW_2'].includes(code)) return res.status(409).json({ error: 'La operación tiene relaciones asociadas. Compruebe que los registros seleccionados existan o quite sus dependencias antes de eliminar.' });
  if (['ER_CHECK_CONSTRAINT_VIOLATED','ER_BAD_NULL_ERROR','ER_DATA_TOO_LONG','ER_WARN_DATA_OUT_OF_RANGE','ER_TRUNCATED_WRONG_VALUE'].includes(code)) return res.status(400).json({ error: 'Los valores no cumplen las reglas de la base de datos.' });
  console.error(JSON.stringify({ event: 'api_error', code: error.code || 'INTERNAL', mysql: error.errno || null }));
  res.status(500).json({ error: 'Ocurrió un error interno. Intente nuevamente.' });
}
