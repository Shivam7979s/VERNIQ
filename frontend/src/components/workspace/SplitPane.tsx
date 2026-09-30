import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultSplit?: number; // percentage (e.g. 50)
  minSplit?: number; // min left percentage (e.g. 25)
  maxSplit?: number; // max left percentage (e.g. 75)
  className?: string;
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  defaultSplit = 45,
  minSplit = 25,
  maxSplit = 75,
  className,
}) => {
  const [splitPercent, setSplitPercent] = useState<number>(defaultSplit);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setSplitPercent(defaultSplit);
  }, [defaultSplit]);

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentPos = clientX - rect.left;
      const totalWidth = rect.width;
      const newPercent = (currentPos / totalWidth) * 100;

      if (newPercent >= minSplit && newPercent <= maxSplit) {
        setSplitPercent(newPercent);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minSplit, maxSplit]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col lg:flex-row w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background select-none lg:select-auto',
        className
      )}
    >
      {/* Left Pane (e.g. Problem statement, notes) */}
      <div
        style={{ width: `${splitPercent}%` }}
        className="hidden lg:flex flex-col h-full overflow-hidden border-r border-border shrink-0 transition-none"
      >
        {left}
      </div>

      {/* Resize Handle Divider */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(splitPercent)}
        aria-valuemin={minSplit}
        aria-valuemax={maxSplit}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            setSplitPercent((prev) => Math.max(minSplit, prev - 2));
          } else if (e.key === 'ArrowRight') {
            setSplitPercent((prev) => Math.min(maxSplit, prev + 2));
          } else if (e.key === 'Home') {
            setSplitPercent(minSplit);
          } else if (e.key === 'End') {
            setSplitPercent(maxSplit);
          }
        }}
        title="Drag to resize panes, double click to reset"
        className={cn(
          'hidden lg:flex items-center justify-center w-2 -mr-1 -ml-1 z-20 cursor-col-resize group focus:outline-none transition-colors select-none',
          isDragging ? 'bg-primary/20' : 'hover:bg-primary/10'
        )}
      >
        <div
          className={cn(
            'w-0.5 h-12 rounded-full transition-colors',
            isDragging ? 'bg-primary' : 'bg-border-strong group-hover:bg-primary'
          )}
        >
          <GripVertical className="sr-only" />
        </div>
      </div>

      {/* Right Pane (e.g. Code editor, console) */}
      <div
        style={{ width: `${100 - splitPercent}%` }}
        className="hidden lg:flex flex-col h-full overflow-hidden shrink-0 transition-none"
      >
        {right}
      </div>

      {/* Mobile / Small Screen Stacking Fallback */}
      <div className="flex flex-col lg:hidden w-full h-full overflow-y-auto">
        <div className="w-full border-b border-border p-4 bg-surface">{left}</div>
        <div className="w-full flex-1 min-h-[500px]">{right}</div>
      </div>
    </div>
  );
};
