import Modal from './Modal.jsx';
import Icon from './Icon.jsx';
export default function ConfirmModal({
  item,
  title = 'Eliminar registro',
  description,
  busy,
  error,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={Boolean(item)}
      title={title}
      subtitle="Revise esta acción antes de continuar."
      busy={busy}
      onClose={onClose}
    >
      <div className="confirm-content">
        <div className="danger-icon">
          <Icon name="trash" size={27} />
        </div>
        <p>
          {description || (
            <>
              Se eliminará <strong>{item?.nombre || `el registro #${item?.id}`}</strong>. Esta
              acción no se puede deshacer.
            </>
          )}
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
      </div>
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={onClose} disabled={busy}>
          Cancelar
        </button>
        <button type="button" className="button danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Eliminando…' : 'Aceptar y eliminar'}
        </button>
      </div>
    </Modal>
  );
}
