import type React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const iconMap = {
    info: <Info className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />,
    success: <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-4 h-4 text-error shrink-0" aria-hidden="true" />,
  };

  const variantStyles = {
    info: 'border-primary/30 bg-primary/5 text-text-primary',
    success: 'border-success/30 bg-success/5 text-text-primary',
    warning: 'border-warning/30 bg-warning/5 text-text-primary',
    error: 'border-error/30 bg-error/5 text-text-primary',
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3 p-3.5 rounded border text-[13px] leading-relaxed',
        variantStyles[variant],
        className
      )}
    >
      <div className="mt-0.5">{iconMap[variant]}</div>
      <div className="flex-1 text-left">
        {title && <h5 className="font-semibold text-text-primary mb-0.5">{title}</h5>}
        <div className="text-text-secondary">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors -mr-1"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
