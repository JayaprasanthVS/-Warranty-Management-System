import { useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastContext } from './toast-context';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const value = useMemo(
    () => ({
      success: (message) => {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { id, type: 'success', message }]);
        window.setTimeout(() => removeToast(id), 3600);
      },
      error: (message) => {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { id, type: 'error', message }]);
        window.setTimeout(() => removeToast(id), 3600);
      },
      info: (message) => {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { id, type: 'info', message }]);
        window.setTimeout(() => removeToast(id), 3600);
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <div key={toast.id} className={`toast toast-${toast.type} animate-fade-in`}>
              <Icon className="h-4 w-4 shrink-0" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button type="button" className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Dismiss notification">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
