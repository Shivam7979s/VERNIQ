import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  badge?: string;
  badgeIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  badgeIcon,
  title,
  subtitle,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-6 sm:p-8 rounded-lg border border-white/[0.08] bg-[#12151E] shadow-elevation-1 mb-8 text-left',
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          {badge && (
            <div>
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 select-none font-medium">
                {badgeIcon}
                <span>{badge}</span>
              </span>
            </div>
          )}
          <h1 className="font-bold tracking-[-0.025em] text-white text-2xl sm:text-3xl font-sans">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed font-sans mt-1.5">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
