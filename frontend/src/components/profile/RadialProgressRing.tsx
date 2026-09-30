import React from 'react';
import { cn } from '@/lib/utils';

export interface RadialProgressRingProps {
  solved: number;
  total: number;
  easySolved: number;
  easyTotal: number;
  mediumSolved: number;
  mediumTotal: number;
  hardSolved: number;
  hardTotal: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  compact?: boolean;
}

export const RadialProgressRing: React.FC<RadialProgressRingProps> = ({
  solved,
  total,
  easySolved,
  easyTotal,
  mediumSolved,
  mediumTotal,
  hardSolved,
  hardTotal,
  size = 140,
  strokeWidth = 10,
  className,
  compact = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const overallPercent = total > 0 ? Math.min(100, (solved / total) * 100) : 0;
  const strokeDashoffset = circumference - (overallPercent / 100) * circumference;

  return (
    <div
      className={cn(
        'p-5 rounded-lg border border-white/[0.08] bg-surface flex flex-col md:flex-row items-center justify-between gap-6 shadow-elevation-1',
        className
      )}
    >
      {/* SVG Circular Ring */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3B82F6"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Central Counter Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="font-mono text-2xl font-bold text-text-primary tracking-tight tabular-nums">
            {solved}
          </span>
          <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-text-muted">
            / {total} Solved
          </span>
          <span className="text-[11px] font-mono font-medium text-primary mt-0.5">
            {overallPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Breakdown Micro-bars */}
      <div className={cn('flex-1 w-full space-y-3', compact ? 'space-y-2' : '')}>
        {/* Easy */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#00B8A3] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B8A3]" />
              Easy
            </span>
            <span className="text-text-secondary tabular-nums">
              <strong className="text-text-primary">{easySolved}</strong> / {easyTotal}
              <span className="text-text-muted ml-1 text-[11px]">
                ({easyTotal > 0 ? Math.round((easySolved / easyTotal) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="w-full bg-[#1C212E] h-2 rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className="bg-[#00B8A3] h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${easyTotal > 0 ? Math.min(100, (easySolved / easyTotal) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Medium */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#FFC01E] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFC01E]" />
              Medium
            </span>
            <span className="text-text-secondary tabular-nums">
              <strong className="text-text-primary">{mediumSolved}</strong> / {mediumTotal}
              <span className="text-text-muted ml-1 text-[11px]">
                ({mediumTotal > 0 ? Math.round((mediumSolved / mediumTotal) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="w-full bg-[#1C212E] h-2 rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className="bg-[#FFC01E] h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${mediumTotal > 0 ? Math.min(100, (mediumSolved / mediumTotal) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Hard */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#FF375F] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF375F]" />
              Hard
            </span>
            <span className="text-text-secondary tabular-nums">
              <strong className="text-text-primary">{hardSolved}</strong> / {hardTotal}
              <span className="text-text-muted ml-1 text-[11px]">
                ({hardTotal > 0 ? Math.round((hardSolved / hardTotal) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="w-full bg-[#1C212E] h-2 rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className="bg-[#FF375F] h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${hardTotal > 0 ? Math.min(100, (hardSolved / hardTotal) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
