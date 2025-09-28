// src/components/Toast.jsx
import React, { useEffect } from 'react';
import './Toast.css';

/**
 * Simple toast:
 * <Toast id={toastId} message="Saved" type="success" onClose={() => removeToast(id)} />
 *
 * We use it as ephemeral notification controlled by parent.
 */
const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className={`toast ${type}`}>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={() => onClose && onClose()}>
        ✕
      </button>
    </div>
  );
};

export default Toast;
