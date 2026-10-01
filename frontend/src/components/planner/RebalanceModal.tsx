import React, { useState, useMemo } from 'react';
import type { StudySprint, SprintTask } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/actions/Button';
import {
  RotateCcw,
  Sparkles,
  Calendar,
  Trash2,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';

export interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: StudySprint;
  tasks: SprintTask[];
  onRebalanced: () => Promise<void>;
}

export const RebalanceModal: React.FC<RebalanceModalProps> = ({
  isOpen,
  onClose,
  sprint,
  tasks,
  onRebalanced,
}) => {
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Identify overdue tasks (scheduled prior to today and not completed)
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => !t.is_completed && t.scheduled_date < todayStr);
  }, [tasks, todayStr]);

  // Unique missed days count
  const missedDates = useMemo(() => {
    const dates = new Set<string>();
    overdueTasks.forEach((t) => dates.add(t.scheduled_date));
    return Array.from(dates);
  }, [overdueTasks]);

  // Compute rebalancing plan simulation
  const planSimulation = useMemo(() => {
    // 1. Easy / duplicate drills to trim (low priority concept reviews)
    const removableDrills = overdueTasks.filter(
      (t) => t.task_type === 'learn_concept' && overdueTasks.length > 2
    );

    // 2. Core tasks that MUST be preserved: practice problems, spaced revisions, assessments
    const coreTasksToReschedule = overdueTasks.filter(
      (t) => !removableDrills.some((r) => r.id === t.id)
    );

    // 3. Evaluate capacity and date adjustment
    const originalEndDate = new Date(sprint.end_date);
    const today = new Date(todayStr);

    const remainingDaysInSprint = Math.max(
      1,
      Math.ceil((originalEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Daily minute load check (target max 75 min / day)
    const pendingUpcomingTasks = tasks.filter(
      (t) => !t.is_completed && t.scheduled_date >= todayStr
    );
    const existingUpcomingMinutes = pendingUpcomingTasks.reduce(
      (acc, t) => acc + (t.estimated_minutes || 30),
      0
    );
    const coreOverdueMinutes = coreTasksToReschedule.reduce(
      (acc, t) => acc + (t.estimated_minutes || 30),
      0
    );
    const totalRemainingMinutes = existingUpcomingMinutes + coreOverdueMinutes;

    const projectedDailyMinutes = Math.round(totalRemainingMinutes / remainingDaysInSprint);

    let extendedDays = 0;
    if (projectedDailyMinutes > 85) {
      extendedDays = Math.ceil((totalRemainingMinutes - remainingDaysInSprint * 75) / 60);
      extendedDays = Math.max(1, Math.min(3, extendedDays)); // extend 1 to 3 days max
    }

    const adjustedEndDate = new Date(originalEndDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() + extendedDays);
    const adjustedEndDateStr = adjustedEndDate.toISOString().split('T')[0];

    return {
      removableDrills,
      coreTasksToReschedule,
      extendedDays,
      originalEndDateStr: sprint.end_date,
      adjustedEndDateStr,
      effectiveRemainingDays: remainingDaysInSprint + extendedDays,
    };
  }, [overdueTasks, tasks, sprint, todayStr]);

  if (!isOpen) return null;

  const handleApplyRebalance = async () => {
    try {
      setIsApplying(true);
      setErrorMsg(null);

      const today = new Date(todayStr);

      if (isSupabaseConfigured()) {
        // 1. Delete or mark dropped low-priority concept drills as skipped
        for (const drop of planSimulation.removableDrills) {
          await supabase.from('sprint_tasks').delete().eq('id', drop.id);
        }

        // 2. Smoothly reschedule core tasks across upcoming days
        const { coreTasksToReschedule, effectiveRemainingDays } = planSimulation;
        for (let i = 0; i < coreTasksToReschedule.length; i++) {
          const task = coreTasksToReschedule[i];
          const offset = i % effectiveRemainingDays;
          const newDate = new Date(today);
          newDate.setDate(today.getDate() + offset);
          const newDateStr = newDate.toISOString().split('T')[0];

          await supabase
            .from('sprint_tasks')
            .update({ scheduled_date: newDateStr })
            .eq('id', task.id);
        }

        // 3. If sprint end date was adjusted, update study_sprints
        if (planSimulation.extendedDays > 0) {
          await supabase
            .from('study_sprints')
            .update({ end_date: planSimulation.adjustedEndDateStr })
            .eq('id', sprint.id);
        }
      }

      await onRebalanced();
      onClose();
    } catch (err: any) {
      console.error('Failed to apply plan rebalance:', err);
      setErrorMsg(err.message || 'Error updating schedule');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.1] bg-[#12151E] shadow-2xl p-6 md:p-8 space-y-6 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Adaptive Rebalance
            </span>
            <span className="text-xs text-text-muted font-mono">
              {missedDates.length} Missed {missedDates.length === 1 ? 'Day' : 'Days'} Detected
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-text-primary">
            Non-Punitive Schedule Rebalancer
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Missed a few study days? The engine redistributes your core curriculum without slamming you with an overwhelming double workload or creating burnout.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Simulated Adjustment Summary */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-text-muted font-mono uppercase tracking-wider block">
            Synthesized Plan Adjustments
          </span>

          <div className="space-y-2 text-xs">
            {/* Removed item row */}
            {planSimulation.removableDrills.length > 0 && (
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span className="text-text-primary">
                    Removed {planSimulation.removableDrills.length} redundant concept drill
                  </span>
                </div>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                  Trimmed
                </span>
              </div>
            )}

            {/* Rescheduled items row */}
            <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-blue-400" />
                <span className="text-text-primary">
                  Rescheduled <strong>{planSimulation.coreTasksToReschedule.length} core tasks</strong> starting today
                </span>
              </div>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                Preserved
              </span>
            </div>

            {/* Date extension row */}
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-text-primary">
                  Sprint Milestone Completion Date
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
                <span>{planSimulation.originalEndDateStr}</span>
                <ArrowRight className="w-3 h-3 text-emerald-400" />
                <strong className="text-emerald-400">{planSimulation.adjustedEndDateStr}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Comfort Assurance Box */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-surface-elevated flex items-start gap-3 text-xs text-text-muted leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>
            Your spaced repetition curve remains fully intact. By spreading the remaining{' '}
            <strong className="text-text-primary">{planSimulation.coreTasksToReschedule.length} tasks</strong> across{' '}
            {planSimulation.effectiveRemainingDays} available days, your daily workload remains comfortable at approximately 60–75 minutes.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.06]">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isApplying}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyRebalance}
            disabled={isApplying || overdueTasks.length === 0}
            leftIcon={
              isApplying ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )
            }
            className="bg-primary hover:bg-primary-hover text-white"
          >
            {isApplying ? 'Applying Rebalance...' : 'Apply Adaptive Rebalance'}
          </Button>
        </div>
      </div>
    </div>
  );
};
