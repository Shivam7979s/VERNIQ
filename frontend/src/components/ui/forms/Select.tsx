import { forwardRef } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  isInvalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, isInvalid, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-9 pl-3 pr-8 text-[13px] rounded border bg-surface text-text-primary appearance-none cursor-pointer',
            'border-border focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none transition-colors',
            isInvalid && 'border-error focus:border-error focus:ring-error',
            disabled && 'opacity-60 bg-surface-subtle cursor-not-allowed',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="w-4 h-4 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    );
  }
);

Select.displayName = 'Select';
