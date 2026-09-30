import type React from 'react';
import { cn } from '@/lib/utils';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  className?: string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, className }) => {
  const styles: Record<DifficultyLevel, string> = {
    easy: 'text-difficulty-easy bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-400 dark:border-emerald-500/40',
    medium: 'text-difficulty-medium bg-amber-500/10 border-amber-500/30 dark:text-amber-400 dark:border-amber-500/40',
    hard: 'text-difficulty-hard bg-red-500/10 border-red-500/30 dark:text-red-400 dark:border-red-500/40',
  };

  const labels: Record<DifficultyLevel, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm border text-[11px] font-mono font-semibold uppercase tracking-wider select-none',
        styles[difficulty],
        className
      )}
    >
      {labels[difficulty]}
    </span>
  );
};
