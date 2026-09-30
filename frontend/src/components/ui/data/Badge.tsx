import type React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral: 'bg-surface-subtle text-text-secondary border-border',
    primary: 'bg-primary-subtle text-primary border-primary/20',
    success: 'bg-emerald-500/10 text-success border-emerald-500/30',
    warning: 'bg-amber-500/10 text-warning border-amber-500/30',
    error: 'bg-red-500/10 text-error border-red-500/30',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium',
    md: 'text-[11px] px-2 py-0.5 font-medium tracking-wide',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border uppercase font-mono select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
