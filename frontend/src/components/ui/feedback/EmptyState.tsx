import type React from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen } from 'lucide-react';
import { Button } from '../actions/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded border border-dashed border-border bg-surface/50 max-w-lg mx-auto',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-surface-subtle flex items-center justify-center text-text-muted mb-3.5">
        {icon || <FolderOpen className="w-5 h-5" aria-hidden="true" />}
      </div>
      <h4 className="text-[15px] font-semibold text-text-primary mb-1">{title}</h4>
      <p className="text-[13px] text-text-secondary leading-relaxed max-w-sm mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
