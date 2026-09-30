import type React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatProps {
  label: string;
  value: string | number;
  delta?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export const Stat: React.FC<StatProps> = ({
  label,
  value,
  delta,
  icon,
  subtitle,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-5 rounded border border-border bg-surface shadow-elevation-1 flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-2xl font-bold font-mono tracking-tight text-text-primary tabular-nums">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              'inline-flex items-center text-[12px] font-medium font-mono',
              delta.isPositive ? 'text-success' : 'text-error'
            )}
          >
            {delta.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
            )}
            {delta.value}
          </span>
        )}
      </div>

      {subtitle && (
        <span className="text-[12px] text-text-muted mt-1 leading-normal">
          {subtitle}
        </span>
      )}
    </div>
  );
};
