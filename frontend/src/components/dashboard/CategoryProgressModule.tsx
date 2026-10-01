import React from 'react';
import { RadialProgressRing } from '@/components/profile/RadialProgressRing';
import { cn } from '@/lib/utils';

export interface CategoryProgressModuleProps {
  solvedCount: number;
  totalProblems: number;
  easySolved: number;
  easyTotal: number;
  medSolved: number;
  medTotal: number;
  hardSolved: number;
  hardTotal: number;
  topicMastery: {
    id: string;
    name: string;
    solved: number;
    total: number;
    color: string;
  }[];
  className?: string;
}

export const CategoryProgressModule: React.FC<CategoryProgressModuleProps> = ({
  solvedCount,
  totalProblems,
  easySolved,
  easyTotal,
  medSolved,
  medTotal,
  hardSolved,
  hardTotal,
  topicMastery,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-12 gap-5', className)}>
      {/* Left: Radial Progress Ring (5 cols) */}
      <div className="md:col-span-5 p-5 rounded-2xl border border-white/[0.08] bg-[#12151D] flex flex-col justify-between shadow-elevation-1">
        <div className="text-left mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
            Empirical Curriculum Solves
          </span>
          <h4 className="text-sm font-bold text-white mt-0.5">Problem Difficulty Ratio</h4>
        </div>

        <RadialProgressRing
          solved={solvedCount}
          total={totalProblems}
          easySolved={easySolved}
          easyTotal={easyTotal}
          mediumSolved={medSolved}
          mediumTotal={medTotal}
          hardSolved={hardSolved}
          hardTotal={hardTotal}
          size={130}
          strokeWidth={9}
          className="border-0 p-0 shadow-none bg-transparent"
        />
      </div>

      {/* Right: Horizontal Topic Progress Bars (7 cols) */}
      <div className="md:col-span-7 p-5 rounded-2xl border border-white/[0.08] bg-[#12151D] flex flex-col justify-between shadow-elevation-1 space-y-4 text-left">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
              Pattern Competence
            </span>
            <h4 className="text-sm font-bold text-white">Topic-Wise Problem Mastery</h4>
          </div>
          <span className="text-xs font-mono text-neutral-400">Live Solves</span>
        </div>

        <div className="space-y-3 flex-1 justify-center flex flex-col">
          {topicMastery.map((topic) => {
            const pct = topic.total > 0 ? Math.round((topic.solved / topic.total) * 100) : 0;
            return (
              <div key={topic.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-200 font-medium">{topic.name}</span>
                  <span className="text-neutral-400">
                    <strong className="text-white">{topic.solved}</strong> / {topic.total} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(4, pct)}%`,
                      backgroundColor: topic.color || '#3B82F6',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
