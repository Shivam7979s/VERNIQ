import type React from 'react';
import { cn } from '@/lib/utils';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from '../actions/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Service Unavailable',
  message = 'An unexpected error occurred while communicating with the platform. Please verify your connection.',
  errorCode,
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded border border-error/30 bg-error/5 max-w-lg mx-auto',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-error/15 flex items-center justify-center text-error mb-3.5">
        <AlertOctagon className="w-5 h-5" aria-hidden="true" />
      </div>
      <h4 className="text-[15px] font-semibold text-text-primary mb-1">{title}</h4>
      <p className="text-[13px] text-text-secondary leading-relaxed max-w-sm mb-3">
        {message}
      </p>
      {errorCode && (
        <code className="text-[11px] font-mono bg-surface px-2 py-0.5 rounded border border-border text-text-muted mb-4">
          Error Code: {errorCode}
        </code>
      )}
      {onRetry && (
        <Button variant="secondary" size="sm" leftIcon={<RotateCcw className="w-3.5 h-3.5" />} onClick={onRetry}>
          Retry Request
        </Button>
      )}
    </div>
  );
};
