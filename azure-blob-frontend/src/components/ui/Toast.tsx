import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { ToastItem } from '../../types';
import './Toast.css';

export interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="depot-toast-container" aria-live="polite">
      {toasts.map((toast) => {
        const isAlert = toast.type === 'error';
        return (
          <div
            key={toast.id}
            className={`depot-toast depot-toast-${toast.type}`}
            role={isAlert ? 'alert' : 'status'}
          >
            <div className="depot-toast-icon">
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'warning' && <AlertTriangle size={16} />}
              {toast.type === 'info' && <Info size={16} />}
            </div>
            <div className="depot-toast-content">
              <p className="depot-toast-title">{toast.title}</p>
              {toast.message && <p className="depot-toast-message">{toast.message}</p>}
            </div>
            <button
              type="button"
              className="depot-toast-close"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
