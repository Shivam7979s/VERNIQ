import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const iconMap = {
    info: <Info className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />,
    success: <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-4 h-4 text-error shrink-0" aria-hidden="true" />,
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Toast Viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 rounded border shadow-elevation-3',
              'bg-surface-elevated border-border text-text-primary transition-all animate-in slide-in-from-bottom-2'
            )}
          >
            <div className="mt-0.5">{iconMap[t.type]}</div>
            <div className="flex-1 text-left">
              <h6 className="text-[13px] font-semibold text-text-primary leading-tight">{t.title}</h6>
              {t.message && (
                <p className="text-[12px] text-text-secondary mt-0.5 leading-snug">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Close notification"
              className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors -mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
