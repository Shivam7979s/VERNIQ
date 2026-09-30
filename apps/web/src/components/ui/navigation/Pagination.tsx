import type React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../actions/Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-4 py-3', className)}
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        leftIcon={<ChevronLeft className="w-4 h-4" />}
      >
        Previous
      </Button>

      <span className="text-[13px] text-text-secondary">
        Page <span className="font-semibold text-text-primary tabular-nums">{currentPage}</span> of{' '}
        <span className="font-semibold text-text-primary tabular-nums">{totalPages}</span>
      </span>

      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        rightIcon={<ChevronRight className="w-4 h-4" />}
      >
        Next
      </Button>
    </nav>
  );
};
