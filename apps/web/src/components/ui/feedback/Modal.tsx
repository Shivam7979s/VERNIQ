import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { IconButton } from '../actions/IconButton';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-modal flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full rounded border bg-surface-elevated border-border shadow-elevation-3 z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-base',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 id="modal-title" className="text-[16px] font-semibold text-text-primary leading-tight">
              {title}
            </h3>
            {description && (
              <p id="modal-description" className="text-[13px] text-text-secondary mt-1">
                {description}
              </p>
            )}
          </div>
          <IconButton
            size="sm"
            variant="ghost"
            aria-label="Close dialog"
            icon={<X className="w-4 h-4" />}
            onClick={onClose}
          />
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto text-[13px] text-text-primary leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-border bg-surface flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
