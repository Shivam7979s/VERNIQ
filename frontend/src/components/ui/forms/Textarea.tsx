import { forwardRef } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isInvalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, isInvalid, disabled, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-[13px] rounded border bg-surface text-text-primary placeholder:text-text-muted',
          'border-border focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none transition-colors',
          isInvalid && 'border-error focus:border-error focus:ring-error',
          disabled && 'opacity-60 bg-surface-subtle cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
