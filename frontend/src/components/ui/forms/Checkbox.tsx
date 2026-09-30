import { forwardRef } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, disabled, checked, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn(
          'flex items-start gap-2.5 cursor-pointer select-none',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={id}
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded border border-border bg-surface transition-colors',
              'peer-checked:bg-primary peer-checked:border-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-border-focus peer-focus-visible:ring-offset-1',
              className
            )}
          />
          <Check
            className="w-3 h-3 text-text-inverse absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
            strokeWidth={3}
            aria-hidden="true"
          />
        </div>
        {(label || description) && (
          <div className="flex flex-col text-left">
            {label && <span className="text-[13px] font-medium text-text-primary">{label}</span>}
            {description && <span className="text-[12px] text-text-muted">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
