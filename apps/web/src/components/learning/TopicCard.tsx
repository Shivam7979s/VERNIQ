import type React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/data/Progress';
import { ChevronRight } from 'lucide-react';

export interface TopicCardProps {
  title: string;
  description: string;
  totalProblems: number;
  completedProblems?: number;
  slug: string;
  icon?: React.ReactNode;
  className?: string;
}

export const TopicCard: React.FC<TopicCardProps> = ({
  title,
  description,
  totalProblems,
  completedProblems = 0,
  slug,
  icon,
  className,
}) => {
  const percentage = Math.round((completedProblems / Math.max(totalProblems, 1)) * 100);

  return (
    <Link
      to={`/roadmaps/${slug}`}
      className={cn(
        'group p-5 rounded border border-border bg-surface hover:bg-surface-subtle transition-colors shadow-elevation-1 flex flex-col justify-between text-left',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
            {icon || <span className="font-mono text-xs font-bold">#</span>}
          </div>
          <span className="text-[12px] font-mono text-text-muted tabular-nums">
            {completedProblems}/{totalProblems} solved
          </span>
        </div>

        <h4 className="text-[15px] font-semibold text-text-primary group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-[12px] text-text-secondary mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-border/40">
        <Progress value={percentage} variant={percentage === 100 ? 'success' : 'primary'} />
        <div className="flex items-center justify-between mt-2 text-[11px] text-text-muted">
          <span>{percentage}% completed</span>
          <span className="inline-flex items-center gap-0.5 group-hover:text-text-primary transition-colors">
            View Topic <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
};
