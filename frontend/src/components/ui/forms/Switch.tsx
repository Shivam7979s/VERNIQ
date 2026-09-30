import { forwardRef } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, disabled, checked, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn(
          'flex items-center justify-between gap-3 cursor-pointer select-none',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {(label || description) && (
          <div className="flex flex-col text-left">
            {label && <span className="text-[13px] font-medium text-text-primary">{label}</span>}
            {description && <span className="text-[12px] text-text-muted">{description}</span>}
          </div>
        )}
        <div className="relative inline-flex items-center shrink-0">
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
              'w-9 h-5 bg-surface-subtle peer-checked:bg-primary rounded-full transition-colors',
              'border border-border peer-focus-visible:ring-2 peer-focus-visible:ring-border-focus peer-focus-visible:ring-offset-1',
              className
            )}
          />
          <div
            className={cn(
              'absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform',
              'peer-checked:translate-x-4'
            )}
          />
        </div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';
