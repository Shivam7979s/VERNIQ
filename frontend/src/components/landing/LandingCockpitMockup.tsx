import React, { useState } from 'react';
import { Check, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MockTask {
  id: string;
  type: 'learn' | 'practice' | 'revision';
  title: string;
  meta: string;
  isCompleted: boolean;
}

export const LandingCockpitMockup: React.FC = () => {
  const [tasks, setTasks] = useState<MockTask[]>([
    {
      id: '1',
      type: 'learn',
      title: 'Learn: Monotonic Search Space & Lower Bound Proof',
      meta: '20m',
      isCompleted: true,
    },
    {
      id: '2',
      type: 'practice',
      title: 'Practice: Search in Rotated Sorted Array',
      meta: 'Medium • 35m',
      isCompleted: true,
    },
    {
      id: '3',
      type: 'revision',
      title: 'Revision: Two Sum Dual-Pointer Invariant',
      meta: '15m',
      isCompleted: false,
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  return (
    <div className="bg-[#0D0F15] border border-white/[0.09] rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl text-left select-none">
      {/* Glow Ambient Filter */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Window Controls */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80" />
          <span className="text-[11px] font-mono text-neutral-400 ml-2">
            verniq-cockpit-v4.sys
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE TELEMETRY</span>
        </div>
      </div>

      {/* SPRINT CARD PREVIEW */}
      <div className="p-4 rounded-xl border border-white/[0.07] bg-[#12151D] space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                SPRINT 03
              </span>
              <span className="text-xs font-mono text-neutral-400">Day 4 of 7</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-1">
              Binary Search Invariants
            </h4>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-emerald-400">68%</span>
            <p className="text-[10px] font-mono text-neutral-400">5h 40m / 8h 30m</p>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
            style={{ width: '68%' }}
          />
        </div>
      </div>

      {/* LIVE INTERACTIVE TASK CHECKLIST */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 px-1">
          <span className="uppercase tracking-wider">Today's Adaptive Execution</span>
          <span>Click to test interactive state</span>
        </div>

        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={cn(
                'p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between group',
                task.isCompleted
                  ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
                  : 'border-white/[0.06] bg-[#12151D] hover:border-white/20'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 transition-colors',
                    task.isCompleted
                      ? 'border-emerald-500 bg-emerald-500 text-black font-bold'
                      : 'border-white/20 group-hover:border-emerald-400'
                  )}
                >
                  {task.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <span
                  className={cn(
                    'text-xs font-medium truncate',
                    task.isCompleted
                      ? 'line-through text-neutral-400'
                      : 'text-neutral-200 group-hover:text-white'
                  )}
                >
                  {task.title}
                </span>
              </div>

              <span className="text-[10px] font-mono text-neutral-400 shrink-0 ml-2">
                {task.meta}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE DIAGNOSTIC VECTOR PREVIEW */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 px-1">
          <span className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-blue-400" />
            <span>Diagnostic Competence Vector</span>
          </span>
          <span className="text-[10px] text-blue-400">Formal Verification</span>
        </div>

        <div className="space-y-2">
          {/* Arrays */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-neutral-300">Arrays & Hashing</span>
              <span className="text-emerald-400 font-bold">85% (Proficient)</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: '85%' }} />
            </div>
          </div>

          {/* Binary Search */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-neutral-300">Binary Search</span>
              <span className="text-blue-400 font-bold">62% (Competent)</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: '62%' }} />
            </div>
          </div>

          {/* Dynamic Programming */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-neutral-300">Dynamic Programming</span>
              <span className="text-amber-400 font-bold">30% (Novice)</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: '30%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
