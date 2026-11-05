import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductGallery from './ProductGallery.jsx';
import ProductPhoto from './ProductPhoto.jsx';
import { api } from '../services/api.js';
import { centsFromInput, moneyInput } from '../utils/format.js';
import PageHeader from './PageHeader.jsx';
import DataTable from './DataTable.jsx';
import Modal from './Modal.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import Toast from './Toast.jsx';
import Icon from './Icon.jsx';

export default function ResourcePage({ config }) {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState('gallery');
  const category = config.gallery ? params.get('categoria') || '' : '';
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState('');
  async function reload() {
    setLoading(true);
    setError('');
    try {
      const paths = [
        ...new Set(config.fields.filter((field) => field.resource).map((field) => field.resource)),
      ];
      const loaded = await Promise.all([
        api.all(config.path),
        ...paths.map((path) => api.all(path)),
      ]);
      setRows(loaded[0]);
      setOptions(Object.fromEntries(paths.map((path, i) => [path, loaded[i + 1]])));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, [config.path]);
  function open(row) {
    const initial = {};
    for (const field of config.fields)
      initial[field.name] =
        field.type === 'price'
          ? moneyInput(row?.[field.name] ?? 0)
          : String(row?.[field.name] ?? field.default ?? '');
    setValues(initial);
    setFormError('');
    setEditing(row || { id: null });
  }
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = {};
      for (const field of config.fields) {
        if (field.createOnly && editing.id) continue;
        const value = values[field.name];
        data[field.name] =
          field.type === 'price'
            ? centsFromInput(value)
            : ['number', 'select'].includes(field.type)
              ? value === ''
                ? null
                : Number(value)
              : value.trim() || null;
      }
      if (editing.id) await api.update(config.path, editing.id, data);
      else await api.create(config.path, data);
      setEditing(null);
      setToast(editing.id ? 'Cambios guardados correctamente.' : 'Registro creado correctamente.');
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    setSaving(true);
    setDeleteError('');
    try {
      await api.remove(config.path, deleting.id);
      setDeleting(null);
      setToast('Registro eliminado correctamente.');
      await reload();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setSaving(false);
    }
  }
  const filtered = rows.filter(
    (row) =>
      (!category || String(row.categoria_id) === category) &&
      Object.values(row).some(
        (value) =>
          typeof value !== 'object' &&
          String(value ?? '')
            .toLocaleLowerCase('es')
            .includes(search.toLocaleLowerCase('es')),
      ),
  );
  const chooseCategory = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('categoria', value);
    else next.delete('categoria');
    setParams(next, { replace: true });
  };
  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        action={() => open(null)}
        actionLabel={config.newLabel}
      />
      {config.gallery && (
        <section className="catalog-intro">
          <div>
            <p className="eyebrow">PREPARADO PARA DISFRUTAR</p>
            <h2>
              Pequeños placeres.
              <br />
              <em>Grandes momentos.</em>
            </h2>
            <p>Café, repostería y algo más. Dale vida al menú de tu cafetería.</p>
          </div>
          <div className="catalog-intro-photo">
            <img
              src="/images/croissant.webp"
              alt="Croissant de mantequilla sobre una mesa"
              width="720"
              height="480"
            />
            <span>
              El sabor
              <br />
              <em>de cada día.</em>
            </span>
          </div>
        </section>
      )}
      <section className={`surface ${config.gallery ? 'catalog-surface' : ''}`}>
        <div className="section-toolbar">
          <div>
            <h2>{config.listTitle}</h2>
            <span className="record-count">
              {rows.length} {config.label}
            </span>
          </div>
          <div className="toolbar-actions">
            {config.gallery && (
              <div className="view-switch" role="group" aria-label="Vista del catálogo">
                <button
                  type="button"
                  className={view === 'gallery' ? 'selected' : ''}
                  onClick={() => setView('gallery')}
                  aria-label="Ver tarjetas"
                  aria-pressed={view === 'gallery'}
                >
                  <Icon name="grid" size={18} />
                </button>
                <button
                  type="button"
                  className={view === 'table' ? 'selected' : ''}
                  onClick={() => setView('table')}
                  aria-label="Ver tabla"
                  aria-pressed={view === 'table'}
                >
                  <Icon name="list" size={18} />
                </button>
              </div>
            )}
            <label className="search-box">
              <Icon name="search" size={18} />
              <input
                aria-label={`Buscar ${config.title.toLowerCase()}`}
                placeholder={config.searchPlaceholder || 'Buscar por nombre…'}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button
              className="icon-button refresh-button"
              onClick={reload}
              disabled={loading}
              aria-label="Actualizar listado"
              title="Actualizar"
            >
              <Icon name="refresh" size={18} />
            </button>
          </div>
        </div>
        {config.gallery && (
          <div className="category-tabs" role="group" aria-label="Filtrar productos por categoría">
            <button
              type="button"
              className={!category ? 'active' : ''}
              aria-pressed={!category}
              onClick={() => chooseCategory('')}
            >
              Todo el menú<span>{rows.length}</span>
            </button>
            {(options['/categorias'] || []).map((c) => (
              <button
                type="button"
                key={c.id}
                className={category === String(c.id) ? 'active' : ''}
                aria-pressed={category === String(c.id)}
                onClick={() => chooseCategory(String(c.id))}
              >
                {c.nombre}
                <span>{rows.filter((r) => r.categoria_id === c.id).length}</span>
              </button>
            ))}
            {category && !(options['/categorias'] || []).some((c) => String(c.id) === category) && (
              <button type="button" onClick={() => chooseCategory('')}>
                Quitar filtro no disponible
              </button>
            )}
          </div>
        )}
        {error ? (
          <div className="connection-error" role="alert">
            <Icon name="alert" />
            <p>{error}</p>
            <button className="button secondary small" onClick={reload}>
              Reintentar
            </button>
          </div>
        ) : config.gallery && view === 'gallery' ? (
          <ProductGallery
            rows={filtered}
            loading={loading}
            onEdit={open}
            onDelete={(row) => {
              setDeleting(row);
              setDeleteError('');
            }}
          />
        ) : (
          <DataTable
            rows={
              config.gallery
                ? rows.filter((r) => !category || String(r.categoria_id) === category)
                : rows
            }
            columns={config.columns}
            loading={loading}
            search={search}
            onEdit={open}
            onDelete={(row) => {
              setDeleting(row);
              setDeleteError('');
            }}
            label={config.label}
          />
        )}
      </section>
      {config.note && (
        <p className="page-note">
          <Icon name="check" size={16} />
          {config.note}
        </p>
      )}
      <Modal
        open={Boolean(editing)}
        title={editing?.id ? config.editTitle : config.newLabel}
        subtitle="Complete la información y guarde los cambios."
        onClose={() => setEditing(null)}
        busy={saving}
      >
        <form onSubmit={save}>
          {config.gallery && (
            <div className="product-form-preview">
              <ProductPhoto product={{ nombre: values.nombre }} />
              <div>
                <span className="eyebrow">VISTA PREVIA</span>
                <strong>{values.nombre || 'Tu próximo producto'}</strong>
                <small>Fotografía de referencia según el nombre del producto.</small>
              </div>
            </div>
          )}
          <div className="form-grid">
            {config.fields
              .filter((field) => !field.createOnly || !editing?.id)
              .map((field) => (
                <label key={field.name} className={`form-field ${field.wide ? 'span-full' : ''}`}>
                  <span>
                    {field.label}
                    {field.required && <span className="required-dot"> *</span>}
                  </span>
                  {field.type === 'select' ? (
                    <select
                      value={values[field.name] ?? ''}
                      onChange={(event) =>
                        setValues({ ...values, [field.name]: event.target.value })
                      }
                      required={field.required}
                    >
                      <option value="">Seleccione una opción</option>
                      {(options[field.resource] || []).map((row) => (
                        <option key={row.id} value={row.id}>
                          {field.optionLabel ? field.optionLabel(row) : row.nombre}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows="3"
                      maxLength={field.maxLength || 300}
                      value={values[field.name] ?? ''}
                      onChange={(event) =>
                        setValues({ ...values, [field.name]: event.target.value })
                      }
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type={field.type === 'price' ? 'number' : field.type || 'text'}
                      min={field.type === 'price' ? 0 : field.min}
                      max={field.type === 'price' ? 1000000 : field.max}
                      step={
                        field.type === 'price' ? '0.01' : field.type === 'number' ? '1' : undefined
                      }
                      required={field.required}
                      maxLength={field.maxLength}
                      minLength={field.minLength}
                      value={values[field.name] ?? ''}
                      onChange={(event) =>
                        setValues({ ...values, [field.name]: event.target.value })
                      }
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.hint && <small>{field.hint}</small>}
                </label>
              ))}
            {formError && (
              <p role="alert" className="form-error span-full">
                {formError}
              </p>
            )}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button className="button primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmModal
        item={deleting}
        busy={saving}
        error={deleteError}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}
