import type React from 'react';
import { cn } from '@/lib/utils';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  className?: string;
  showPip?: boolean;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  difficulty,
  className,
  showPip = true,
}) => {
  const styles: Record<
    DifficultyLevel,
    { text: string; bg: string; border: string; pip: string }
  > = {
    easy: {
      text: 'text-[#00B8A3]',
      bg: 'bg-[#00B8A3]/[0.12]',
      border: 'border-[#00B8A3]/30',
      pip: 'bg-[#00B8A3]',
    },
    medium: {
      text: 'text-[#FFC01E]',
      bg: 'bg-[#FFC01E]/[0.12]',
      border: 'border-[#FFC01E]/30',
      pip: 'bg-[#FFC01E]',
    },
    hard: {
      text: 'text-[#FF375F]',
      bg: 'bg-[#FF375F]/[0.12]',
      border: 'border-[#FF375F]/30',
      pip: 'bg-[#FF375F]',
    },
  };

  const labels: Record<DifficultyLevel, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  };

  const current = styles[difficulty] || styles.easy;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-mono font-medium select-none',
        current.text,
        current.bg,
        current.border,
        className
      )}
    >
      {showPip && (
        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 shrink-0', current.pip)} />
      )}
      {labels[difficulty] || difficulty}
    </span>
  );
};
