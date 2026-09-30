import type React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

export type CompletionStatus = 'completed' | 'in_progress' | 'pending';

export interface CompletionIndicatorProps {
  status: CompletionStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CompletionIndicator: React.FC<CompletionIndicatorProps> = ({
  status,
  size = 'md',
  className,
}) => {
  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (status === 'completed') {
    return (
      <CheckCircle2
        aria-label="Completed"
        className={cn(sizeMap[size], 'text-success shrink-0', className)}
      />
    );
  }

  if (status === 'in_progress') {
    return (
      <Clock
        aria-label="In Progress"
        className={cn(sizeMap[size], 'text-primary shrink-0 animate-pulse', className)}
      />
    );
  }

  return (
    <Circle
      aria-label="Not Started"
      className={cn(sizeMap[size], 'text-text-muted shrink-0', className)}
    />
  );
};
