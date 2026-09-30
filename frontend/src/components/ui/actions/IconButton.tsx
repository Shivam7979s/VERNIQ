import { forwardRef } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonVariant, type ButtonSize } from './Button';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  'aria-label': string; // Mandatory for accessibility
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, size = 'md', variant = 'ghost', 'aria-label': ariaLabel, ...props }, ref) => {
    const sizeMap: Record<ButtonSize, string> = {
      sm: 'w-8 h-8 p-0',
      md: 'w-9 h-9 p-0',
      lg: 'w-11 h-11 p-0',
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        aria-label={ariaLabel}
        className={cn(sizeMap[size], className)}
        {...props}
      >
        <span className="flex items-center justify-center">{icon}</span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
