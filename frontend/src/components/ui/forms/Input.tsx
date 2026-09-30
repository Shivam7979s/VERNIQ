import { forwardRef } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftAddon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  isInvalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftAddon, leftIcon, rightAddon, isInvalid, disabled, ...props }, ref) => {
    const leadingAddon = leftAddon || leftIcon;
    return (
      <div
        className={cn(
          'relative flex items-center w-full rounded border bg-surface transition-colors',
          'border-border focus-within:border-border-focus focus-within:ring-1 focus-within:ring-border-focus',
          isInvalid && 'border-error focus-within:border-error focus-within:ring-error',
          disabled && 'opacity-60 bg-surface-subtle cursor-not-allowed'
        )}
      >
        {leadingAddon && (
          <span className="pl-3 pr-1 text-text-muted flex items-center shrink-0 pointer-events-none">
            {leadingAddon}
          </span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-9 px-3 text-[13px] bg-transparent text-text-primary placeholder:text-text-muted',
            'focus:outline-none disabled:cursor-not-allowed',
            leadingAddon && 'pl-2',
            rightAddon && 'pr-2',
            className
          )}
          {...props}
        />
        {rightAddon && (
          <span className="pr-3 pl-1 text-text-muted flex items-center shrink-0">
            {rightAddon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
