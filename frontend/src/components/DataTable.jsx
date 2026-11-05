import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
export default function DataTable({
  rows,
  columns,
  loading,
  search = '',
  empty = 'Todavía no hay registros.',
  onEdit,
  onDelete,
  onView,
  label = 'registros',
}) {
  const [page, setPage] = useState(0);
  const size = 7;
  useEffect(() => setPage(0), [search, rows.length]);
  const filtered = rows.filter((row) =>
    Object.values(row).some(
      (value) =>
        typeof value !== 'object' &&
        String(value ?? '')
          .toLocaleLowerCase('es')
          .includes(search.toLocaleLowerCase('es')),
    ),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * size, (current + 1) * size);
  return (
    <>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.align || ''}>
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete || onView) && <th className="align-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1}>
                  <div className="empty-state">
                    <span className="loading-dot" /> Cargando información…
                  </div>
                </td>
              </tr>
            ) : visible.length ? (
              visible.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key} className={column.align || ''}>
                      {column.render ? column.render(row) : row[column.key] || '—'}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td>
                      <div className="row-actions">
                        {onView && (
                          <button
                            className="icon-button"
                            onClick={() => onView(row)}
                            aria-label={`Ver registro ${row.id}`}
                            title="Ver detalle"
                          >
                            <Icon name="eye" size={18} />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            className="icon-button"
                            onClick={() => onEdit(row)}
                            aria-label={`Editar registro ${row.id}`}
                            title="Editar"
                          >
                            <Icon name="edit" size={18} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className="icon-button delete-button"
                            onClick={() => onDelete(row)}
                            aria-label={`Eliminar registro ${row.id}`}
                            title="Eliminar"
                          >
                            <Icon name="trash" size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1}>
                  <div className="empty-state">
                    <Icon name="coffee" size={30} />
                    <strong>{search ? 'No se encontraron coincidencias' : empty}</strong>
                    <span>
                      {search
                        ? 'Pruebe con otro nombre o identificador.'
                        : 'Agregue el primer registro para comenzar.'}
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          {filtered.length
            ? `${current * size + 1}–${Math.min((current + 1) * size, filtered.length)} de ${filtered.length} ${label}`
            : `0 ${label}`}
        </span>
        <div className="pagination">
          <button
            className="icon-button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            aria-label="Página anterior"
          >
            <Icon name="left" size={18} />
          </button>
          <span>
            {current + 1} / {pages}
          </span>
          <button
            className="icon-button"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
            aria-label="Página siguiente"
          >
            <Icon name="right" size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
