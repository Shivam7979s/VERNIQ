import React, { useState } from 'react';
import { DayTimeline } from './DayTimeline';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  Lock,
  CircleDot,
} from 'lucide-react';
import type { RoadmapSprint } from '../types';

interface SprintAccordionProps {
  sprint: RoadmapSprint;
  isDefaultExpanded?: boolean;
  onToggleComplete: (itemId: string) => void;
}

export const SprintAccordion: React.FC<SprintAccordionProps> = ({
  sprint,
  isDefaultExpanded = true,
  onToggleComplete,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(isDefaultExpanded);
  const status = sprint.status || 'AVAILABLE';
  const isLocked = status === 'LOCKED';
  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'IN_PROGRESS';

  const completedDays = sprint.days.filter((d) => d.status === 'COMPLETED').length;
  const totalDays = sprint.days.length;
  const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const renderSprintBadge = () => {
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#00B8A3]/10 text-[#00B8A3] border border-[#00B8A3]/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Sprint Completed
        </span>
      );
    }
    if (isLocked) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-white/[0.04] text-text-muted border border-border">
          <Lock className="w-3.5 h-3.5" />
          Locked
        </span>
      );
    }
    if (isInProgress) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-primary/10 text-primary border border-primary/30">
          <CircleDot className="w-3.5 h-3.5" />
          Active Sprint
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-subtle text-text-secondary border border-border">
        Upcoming
      </span>
    );
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isCompleted
          ? 'bg-surface/40 border-border/80'
          : isLocked
          ? 'bg-surface/20 border-border/40 opacity-75'
          : 'bg-surface border-border shadow-elevation-1'
      }`}
    >
      {/* Sprint Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 bg-surface-elevated/70 hover:bg-surface-elevated cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
      >
        <div className="flex items-start sm:items-center gap-3">
          <button
            type="button"
            aria-label={isExpanded ? 'Collapse Sprint' : 'Expand Sprint'}
            className="text-text-muted hover:text-text-primary transition-colors mt-0.5 sm:mt-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-primary" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold text-text-primary tracking-[-0.01em]">
                {sprint.title}
              </h2>
              {renderSprintBadge()}
            </div>
            {sprint.description && (
              <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
                {sprint.description}
              </p>
            )}
          </div>
        </div>

        {/* Sprint Stats */}
        <div className="flex items-center gap-4 shrink-0 pl-8 sm:pl-0">
          <div className="flex items-center gap-1 text-xs font-mono text-text-secondary">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <span>~{sprint.estimatedHours} hrs</span>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-medium text-text-primary">
              {completedDays} / {totalDays} days ({percentage}%)
            </div>
            <div className="w-28 bg-surface-subtle h-2 rounded-full overflow-hidden border border-white/[0.04] mt-1">
              <div
                className="bg-[#00B8A3] h-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sprint Days Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6 bg-surface/50 border-t border-border space-y-5">
          {sprint.days.map((day) => (
            <DayTimeline
              key={day.id}
              day={day}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
