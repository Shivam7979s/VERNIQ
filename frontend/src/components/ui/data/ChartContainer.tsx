import type React from 'react';
import { cn } from '@/lib/utils';

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  className,
  title,
  description,
  action,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'p-5 rounded border border-border bg-surface shadow-elevation-1 flex flex-col',
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between mb-4 border-b border-border/40 pb-3">
          <div>
            {title && (
              <h4 className="text-[15px] font-semibold text-text-primary tracking-tight">
                {title}
              </h4>
            )}
            {description && (
              <p className="text-[12px] text-text-secondary mt-0.5">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="w-full flex-1 min-h-[220px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
