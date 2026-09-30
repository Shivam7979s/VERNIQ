import type React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DifficultyBadge, type DifficultyLevel } from './DifficultyBadge';
import { CompletionIndicator, type CompletionStatus } from './CompletionIndicator';
import { ChevronRight } from 'lucide-react';

export interface ProblemCardProps {
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  acceptanceRate?: number;
  tags?: string[];
  status?: CompletionStatus;
  className?: string;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({
  title,
  slug,
  difficulty,
  acceptanceRate,
  tags = [],
  status = 'pending',
  className,
}) => {
  return (
    <Link
      to={`/problems/${slug}`}
      className={cn(
        'group flex items-center justify-between p-4 rounded border border-border bg-surface hover:bg-surface-subtle transition-colors shadow-elevation-1',
        className
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <CompletionIndicator status={status} size="md" />
        <div className="min-w-0 text-left">
          <h4 className="text-[14px] font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
            {title}
          </h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {acceptanceRate !== undefined && (
              <span className="text-[12px] text-text-secondary font-mono tabular-nums">
                {acceptanceRate.toFixed(1)}% acceptance
              </span>
            )}
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-1.5 py-0.2 rounded bg-surface-subtle border border-border text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <DifficultyBadge difficulty={difficulty} />
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
};
