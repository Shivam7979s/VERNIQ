import React from 'react';
import type { StudySprint, SprintTask } from '@/types';
import { Clock, Calendar, Code2, Repeat, Award, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SprintCardProps {
  sprint: StudySprint;
  tasks: SprintTask[];
  onRebalanceClick?: () => void;
  hasOverdueTasks?: boolean;
}

export const SprintCard: React.FC<SprintCardProps> = ({
  sprint,
  tasks,
  onRebalanceClick,
  hasOverdueTasks = false,
}) => {
  // Compute aggregate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;

  const totalMinutes = tasks.reduce((acc, t) => acc + (t.estimated_minutes || 30), 0);
  const completedMinutes = tasks
    .filter((t) => t.is_completed)
    .reduce((acc, t) => acc + (t.estimated_minutes || 30), 0);

  const percentage = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0;

  const problemCount = tasks.filter((t) => t.task_type === 'practice_problem').length;
  const revisionCount = tasks.filter((t) => t.task_type === 'spaced_revision').length;
  const assessmentCount = tasks.filter((t) => t.task_type === 'sprint_assessment').length;

  // Format hours and minutes
  const totalHours = Math.floor(totalMinutes / 60);
  const totalRemainingMins = totalMinutes % 60;
  const completedHours = Math.floor(completedMinutes / 60);
  const completedRemainingMins = completedMinutes % 60;

  return (
    <div className="p-6 md:p-8 rounded-2xl border border-white/[0.08] bg-surface shadow-elevation-1 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Sprint {sprint.sprint_number < 10 ? `0${sprint.sprint_number}` : sprint.sprint_number}
            </span>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-surface-elevated border border-white/[0.06] text-text-muted">
              {sprint.status === 'active' ? 'Active Sprint' : 'Completed'}
            </span>
            <span className="text-xs text-text-muted font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {sprint.start_date} → {sprint.end_date}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
            {sprint.title}
          </h2>
        </div>

        {onRebalanceClick && (
          <button
            type="button"
            onClick={onRebalanceClick}
            className={cn(
              'px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto',
              hasOverdueTasks
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'border-white/[0.08] bg-surface-elevated text-text-secondary hover:text-text-primary hover:border-white/20'
            )}
          >
            <RotateCcw
              className={cn(
                'w-3.5 h-3.5',
                hasOverdueTasks ? 'text-amber-400 animate-spin-slow' : 'text-text-muted'
              )}
            />
            <span>{hasOverdueTasks ? 'Rebalance Overdue Workload' : 'Rebalance Schedule'}</span>
          </button>
        )}
      </div>

      {/* Stats Nodes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        <div className="p-3.5 rounded-xl border border-white/[0.05] bg-surface-elevated">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase font-semibold">Duration</span>
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-base font-bold font-mono text-text-primary">7 Days</p>
          <span className="text-[10px] text-text-muted">1 Week Sprint</span>
        </div>

        <div className="p-3.5 rounded-xl border border-white/[0.05] bg-surface-elevated">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase font-semibold">Target Hours</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-base font-bold font-mono text-text-primary">
            {totalHours}h {totalRemainingMins > 0 ? `${totalRemainingMins}m` : ''}
          </p>
          <span className="text-[10px] text-emerald-400 font-mono">
            {completedHours}h {completedRemainingMins}m done
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-white/[0.05] bg-surface-elevated">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase font-semibold">Problems</span>
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-base font-bold font-mono text-text-primary">{problemCount}</p>
          <span className="text-[10px] text-text-muted">Target Drills</span>
        </div>

        <div className="p-3.5 rounded-xl border border-white/[0.05] bg-surface-elevated">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase font-semibold">Revisions</span>
            <Repeat className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-base font-bold font-mono text-text-primary">{revisionCount}</p>
          <span className="text-[10px] text-text-muted">Spaced Review</span>
        </div>

        <div className="p-3.5 rounded-xl border border-white/[0.05] bg-surface-elevated col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase font-semibold">Assessments</span>
            <Award className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-base font-bold font-mono text-text-primary">{assessmentCount}</p>
          <span className="text-[10px] text-text-muted">Benchmark Tests</span>
        </div>
      </div>

      {/* Linear Progress Bar */}
      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-text-muted">
            Sprint Minutes Completed:{' '}
            <strong className="text-text-primary">
              {completedMinutes} / {totalMinutes}m
            </strong>
          </span>
          <span className="text-emerald-400 font-bold">{percentage}%</span>
        </div>

        <div className="h-2.5 w-full bg-surface-subtle rounded-full overflow-hidden border border-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-primary to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-mono text-text-muted">
          <span>{completedTasks} of {totalTasks} action items complete</span>
          <span>{totalTasks - completedTasks} items remaining</span>
        </div>
      </div>
    </div>
  );
};
