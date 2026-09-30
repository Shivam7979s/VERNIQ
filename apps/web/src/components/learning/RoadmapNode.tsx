import type React from 'react';
import { cn } from '@/lib/utils';
import { CompletionIndicator, type CompletionStatus } from './CompletionIndicator';

export interface RoadmapNodeProps {
  stepNumber: number;
  title: string;
  description?: string;
  status: CompletionStatus;
  duration?: string;
  isLast?: boolean;
  onClick?: () => void;
  className?: string;
}

export const RoadmapNode: React.FC<RoadmapNodeProps> = ({
  stepNumber,
  title,
  description,
  status,
  duration,
  isLast = false,
  onClick,
  className,
}) => {
  return (
    <div className={cn('relative flex items-start gap-4 text-left group', className)}>
      {/* Vertical Milestone Line */}
      {!isLast && (
        <div
          className="absolute left-4 top-8 -bottom-3 w-[2px] bg-border group-hover:bg-primary/40 transition-colors"
          aria-hidden="true"
        />
      )}

      {/* Node Indicator */}
      <div
        className={cn(
          'w-8 h-8 rounded-full border flex items-center justify-center font-mono text-[12px] font-bold shrink-0 z-10 transition-colors',
          status === 'completed' && 'bg-emerald-500/10 border-emerald-500 text-success',
          status === 'in_progress' && 'bg-primary/10 border-primary text-primary',
          status === 'pending' && 'bg-surface border-border text-text-muted'
        )}
      >
        {status === 'completed' ? (
          <CompletionIndicator status="completed" size="sm" />
        ) : (
          <span>{stepNumber}</span>
        )}
      </div>

      {/* Content */}
      <div
        onClick={onClick}
        className={cn(
          'flex-1 p-4 mb-4 rounded border border-border bg-surface transition-colors shadow-elevation-1',
          onClick && 'cursor-pointer hover:bg-surface-subtle hover:border-border-strong'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-[14px] font-semibold text-text-primary group-hover:text-primary transition-colors">
            {title}
          </h5>
          {duration && (
            <span className="text-[11px] font-mono text-text-muted shrink-0">
              ~{duration}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
