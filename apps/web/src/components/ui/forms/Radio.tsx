import { forwardRef } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, disabled, ...props }, ref) => {
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
            type="radio"
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded-full border border-border bg-surface transition-colors',
              'peer-checked:border-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-border-focus peer-focus-visible:ring-offset-1',
              className
            )}
          />
          <div className="w-2 h-2 rounded-full bg-primary absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
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

Radio.displayName = 'Radio';
