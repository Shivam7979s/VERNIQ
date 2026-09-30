import type React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  className,
  value,
  max = 100,
  variant = 'primary',
  showLabel = false,
  ...props
}) => {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  const barColors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center text-[12px] text-text-secondary">
          <span className="font-medium">Progress</span>
          <span className="tabular-nums font-mono">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden border border-border/50"
      >
        <div
          className={cn('h-full transition-all duration-base rounded-full', barColors[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
