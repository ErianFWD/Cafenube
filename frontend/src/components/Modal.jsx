import { useEffect, useRef, useId } from 'react';
import Icon from './Icon.jsx';
export default function Modal({ open, title, subtitle, onClose, busy = false, children, wide = false }) {
  const ref = useRef(null); const titleId = useId();
  useEffect(() => { const dialog = ref.current; if (open && !dialog.open) dialog.showModal(); if (!open && dialog.open) dialog.close(); }, [open]);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} onClick={(event) => { if (event.target === ref.current && !busy) onClose(); }} aria-labelledby={titleId}>
    <div className="modal-header"><div><p className="eyebrow">CAFÉ NUBE</p><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="Cerrar formulario"><Icon name="close" /></button></div>
    {children}
  </dialog>;
}
