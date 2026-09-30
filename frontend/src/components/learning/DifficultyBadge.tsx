import type React from 'react';
import { cn } from '@/lib/utils';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  className?: string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, className }) => {
  const styles: Record<DifficultyLevel, string> = {
    easy: 'text-[#00B8A3] bg-[#00B8A3]/10 border-[#00B8A3]/30',
    medium: 'text-[#FFC01E] bg-[#FFC01E]/10 border-[#FFC01E]/30',
    hard: 'text-[#FF375F] bg-[#FF375F]/10 border-[#FF375F]/30',
  };

  const labels: Record<DifficultyLevel, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-mono font-medium select-none',
        styles[difficulty],
        className
      )}
    >
      {labels[difficulty]}
    </span>
  );
};
