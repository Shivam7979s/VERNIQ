import React from 'react';
import { Link } from 'react-router-dom';
import type { StudySprint, SprintTask } from '@/types';
import { Calendar, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActiveSprintBannerProps {
  sprint: StudySprint | null;
  tasks: SprintTask[];
  onRebalanceClick?: () => void;
  className?: string;
}

export const ActiveSprintBanner: React.FC<ActiveSprintBannerProps> = ({
  sprint,
  tasks,
  onRebalanceClick,
  className,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  if (!sprint) {
    return (
      <div
        className={cn(
          'p-6 rounded-2xl border border-white/[0.08] bg-[#12151D] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left shadow-elevation-1',
          className
        )}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Adaptive Sprint System
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">No Active Sprint Compiled</h3>
          <p className="text-xs text-neutral-400">
            Take the 8-question Algorithmic Diagnostic Assessment to evaluate your skills and compile your sprint.
          </p>
        </div>

        <Link to="/app/diagnostic">
          <button className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all">
            <span>Start Diagnostic</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    );
  }

  // Calculate day progress (e.g. Day 4 of 7)
  const startDate = new Date(sprint.start_date);
  const today = new Date(todayStr);
  const currentDay = Math.min(
    7,
    Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  );

  // Calculate minutes completed
  const totalMinutes = tasks.reduce((acc, t) => acc + (t.estimated_minutes || 30), 0) || 240;
  const completedMinutes = tasks
    .filter((t) => t.is_completed)
    .reduce((acc, t) => acc + (t.estimated_minutes || 30), 0);
  const percentage = Math.round((completedMinutes / totalMinutes) * 100);

  // Find next uncompleted problem
  const nextTask = tasks.find((t) => !t.is_completed && t.problem?.slug);
  const nextSlug = nextTask?.problem?.slug || 'two-sum';

  // Check overdue tasks
  const overdueTasks = tasks.filter((t) => !t.is_completed && t.scheduled_date < todayStr);

  return (
    <div
      className={cn(
        'p-6 rounded-2xl border border-white/[0.08] bg-[#12151D] shadow-elevation-1 space-y-5 text-left relative overflow-hidden',
        className
      )}
    >
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
              ACTIVE SPRINT
            </span>
            <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              Day {currentDay} of 7 • {sprint.primary_topic}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {sprint.title}
          </h2>
        </div>

        <Link to={`/problems/${nextSlug}`}>
          <button className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] shrink-0">
            <span>Continue Sprint in IDE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>

      {/* Overdue alert indicator */}
      {overdueTasks.length > 0 && (
        <div className="p-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>{overdueTasks.length} overdue tasks detected.</strong> Smoothly redistribute without burnout.
            </span>
          </div>
          <Link
            to="/app/plan"
            onClick={onRebalanceClick}
            className="text-amber-400 underline font-semibold hover:text-amber-300 font-mono text-[11px] shrink-0"
          >
            Rebalance Plan →
          </Link>
        </div>
      )}

      {/* Progress Bar & Minute Counter */}
      <div className="space-y-2 pt-1 border-t border-white/[0.05]">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-400">
            Sprint Progress:{' '}
            <strong className="text-white">
              {completedMinutes}m / {totalMinutes}m
            </strong>
          </span>
          <span className="text-emerald-400 font-bold">{percentage}% Complete</span>
        </div>

        <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-primary to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
