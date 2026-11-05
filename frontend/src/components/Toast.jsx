import { useEffect } from 'react';
import Icon from './Icon.jsx';
export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  return message ? (
    <div className="toast" role="status">
      <span className="toast-check">
        <Icon name="check" size={17} />
      </span>
      {message}
      <button className="icon-button" onClick={onClose} aria-label="Cerrar aviso">
        <Icon name="close" size={16} />
      </button>
    </div>
  ) : null;
}
