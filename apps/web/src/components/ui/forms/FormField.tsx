import type React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  id: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
  children: (props: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
  }) => React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required,
  helperText,
  error,
  className,
  children,
}) => {
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col space-y-1.5 text-left', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-[12px] font-medium text-text-primary tracking-wide flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
      )}

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': !!error,
      })}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-[12px] text-error flex items-center gap-1.5 mt-1 font-medium"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-[12px] text-text-muted mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
