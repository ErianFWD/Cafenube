import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { money, dateTime, initials } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import SaleForm from '../components/SaleForm.jsx';
import Toast from '../components/Toast.jsx';

export default function VentasPage() {
  const [rows, setRows] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [params, setParams] = useSearchParams();
  async function reload() {
    setLoading(true);
    setError('');
    try {
      const [v, p, c, m] = await Promise.all([
        api.all('/ventas'),
        api.all('/productos'),
        api.all('/clientes'),
        api.all('/metodos-pago'),
      ]);
      setRows(v);
      setProductos(p);
      setClientes(c);
      setMetodos(m);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  useEffect(() => {
    if (!loading && params.get('nueva') === '1') {
      setEditing({ id: null });
      setParams({}, { replace: true });
    }
  }, [loading]);
  async function open(row, view = false) {
    setError('');
    try {
      const sale = await api.get(`/ventas/${row.id}`);
      if (view) setViewing(sale);
      else setEditing(sale);
    } catch (err) {
      setError(err.message);
    }
  }
  async function remove() {
    setBusy(true);
    setDeleteError('');
    try {
      await api.remove('/ventas', deleting.id);
      setDeleting(null);
      setToast('Venta eliminada correctamente.');
      await reload();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const columns = [
    {
      key: 'id',
      label: 'Venta',
      render: (row) => <span className="sale-code">#{String(row.id).padStart(4, '0')}</span>,
    },
    {
      key: 'cliente_nombre',
      label: 'Cliente',
      render: (row) => (
        <div className="person-cell">
          <span className="person-avatar">
            {row.cliente_nombre ? initials(row.cliente_nombre) : <Icon name="users" size={16} />}
          </span>
          <span>{row.cliente_nombre || 'Cliente de mostrador'}</span>
        </div>
      ),
    },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (row) => <span className="muted">{dateTime(row.fecha)}</span>,
    },
    {
      key: 'metodo_pago_nombre',
      label: 'Pago',
      render: (row) => <span className="tag">{row.metodo_pago_nombre}</span>,
    },
    {
      key: 'total_centimos',
      label: 'Total',
      align: 'align-right',
      render: (row) => <strong className="amount">{money(row.total_centimos)}</strong>,
    },
  ];
  return (
    <>
      <PageHeader
        title="Ventas"
        description="Registra cada pedido y consulta su información en un solo lugar."
        action={() => setEditing({ id: null })}
        actionLabel="Registrar venta"
      />
      <section className="surface">
        <div className="section-toolbar">
          <div>
            <h2>Historial de ventas</h2>
            <span className="record-count">{rows.length} ventas registradas</span>
          </div>
          <div className="toolbar-actions">
            <label className="search-box">
              <Icon name="search" size={18} />
              <input
                aria-label="Buscar ventas"
                placeholder="Buscar cliente o venta…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button
              className="icon-button refresh-button"
              onClick={reload}
              disabled={loading}
              aria-label="Actualizar listado"
            >
              <Icon name="refresh" size={18} />
            </button>
          </div>
        </div>
        {error ? (
          <div className="connection-error" role="alert">
            <Icon name="alert" />
            <p>{error}</p>
            <button className="button secondary small" onClick={reload}>
              Reintentar
            </button>
          </div>
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            loading={loading}
            search={search}
            onView={(row) => open(row, true)}
            onEdit={(row) => open(row)}
            onDelete={(row) => {
              setDeleting(row);
              setDeleteError('');
            }}
            label="ventas"
          />
        )}
      </section>
      <Modal
        open={Boolean(editing)}
        title={editing?.id ? `Editar venta #${editing.id}` : 'Registrar venta'}
        subtitle="Selecciona los productos y el método de pago."
        onClose={() => setEditing(null)}
        busy={busy}
        wide
      >
        {editing && (!productos.length || !metodos.length) ? (
          <div className="empty-state">
            <Icon name="coffee" size={30} />
            <strong>Primero agrega productos y métodos de pago.</strong>
            <button className="button secondary" onClick={() => setEditing(null)}>
              Entendido
            </button>
          </div>
        ) : (
          editing && (
            <SaleForm
              key={editing.id || 'nueva'}
              sale={editing.id ? editing : null}
              productos={productos}
              clientes={clientes}
              metodos={metodos}
              onClose={() => setEditing(null)}
              onBusy={setBusy}
              onSaved={async () => {
                setEditing(null);
                setToast('Venta guardada correctamente.');
                await reload();
              }}
            />
          )
        )}
      </Modal>
      <Modal
        open={Boolean(viewing)}
        title={`Venta #${String(viewing?.id || '').padStart(4, '0')}`}
        subtitle={viewing ? dateTime(viewing.fecha) : ''}
        onClose={() => setViewing(null)}
        wide
      >
        {viewing && (
          <>
            <div className="receipt-meta">
              <div>
                <span>Cliente</span>
                <strong>{viewing.cliente_nombre || 'Cliente de mostrador'}</strong>
              </div>
              <div>
                <span>Método de pago</span>
                <strong>{viewing.metodo_pago_nombre}</strong>
              </div>
            </div>
            <div className="table-scroll receipt-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th className="align-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewing.detalles.map((d) => (
                    <tr key={d.id}>
                      <td>{d.producto_nombre}</td>
                      <td>{d.cantidad}</td>
                      <td>{money(d.precio_unitario_centimos)}</td>
                      <td className="align-right amount">{money(d.subtotal_centimos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="receipt-total">
              <span>Total registrado</span>
              <strong>{money(viewing.total_centimos)}</strong>
            </div>
            {viewing.observaciones && <p className="receipt-note">{viewing.observaciones}</p>}
            <div className="modal-actions">
              <button className="button primary" onClick={() => setViewing(null)}>
                Cerrar detalle
              </button>
            </div>
          </>
        )}
      </Modal>
      <ConfirmModal
        item={deleting}
        title="Eliminar venta"
        description={
          <>
            Se eliminará la venta <strong>#{deleting?.id}</strong> junto con sus productos
            registrados. Esta acción no se puede deshacer.
          </>
        }
        busy={busy}
        error={deleteError}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}
