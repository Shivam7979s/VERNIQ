import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Flame, CheckCircle2 } from 'lucide-react';

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityHeatmapProps {
  totalSubmissions?: number;
  activeDays?: number;
  maxStreak?: number;
  className?: string;
  compact?: boolean;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  totalSubmissions = 482,
  activeDays = 184,
  maxStreak = 28,
  className,
  compact = false,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Generate 52 weeks (364 days) of deterministic activity ending today
  const { weeks, monthLabels } = useMemo(() => {
    const totalDays = compact ? 140 : 364; // 20 weeks for compact, 52 weeks full
    const days: HeatmapDay[] = [];
    const today = new Date();

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Deterministic pseudorandom count based on date string hash for realistic distribution
      let hash = 0;
      for (let j = 0; j < dateStr.length; j++) {
        hash = (hash * 31 + dateStr.charCodeAt(j)) % 1000;
      }

      // 60% chance of active on weekdays, lighter on weekends
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      let count = 0;

      if (!isWeekend && hash % 10 > 2) {
        count = (hash % 8) + 1;
      } else if (isWeekend && hash % 10 > 6) {
        count = (hash % 5) + 1;
      }

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 8) level = 4;
      else if (count >= 5) level = 3;
      else if (count >= 3) level = 2;
      else if (count >= 1) level = 1;

      days.push({ date: dateStr, count, level });
    }

    // Group into 7-day columns (weeks)
    const weekGroups: HeatmapDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weekGroups.push(days.slice(i, i + 7));
    }

    // Calculate month labels positioned along the columns
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels: { name: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weekGroups.forEach((wk, wkIdx) => {
      if (wk.length > 0) {
        const m = new Date(wk[0].date).getMonth();
        if (m !== lastMonth && (wkIdx === 0 || wkIdx - (labels[labels.length - 1]?.weekIndex || 0) >= 4)) {
          labels.push({ name: months[m], weekIndex: wkIdx });
          lastMonth = m;
        }
      }
    });

    return { weeks: weekGroups, monthLabels: labels };
  }, [compact]);

  // Color mappings for intensity tiers
  const levelColors: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: 'bg-[#1C212E] hover:border-white/40',
    1: 'bg-[#065F46] hover:brightness-125',
    2: 'bg-[#059669] hover:brightness-125',
    3: 'bg-[#10B981] hover:brightness-125',
    4: 'bg-[#3B82F6] hover:brightness-125',
  };

  return (
    <div
      className={cn(
        'p-5 rounded-lg border border-white/[0.08] bg-surface space-y-4 shadow-elevation-1 select-none relative',
        className
      )}
    >
      {/* Header telemetry summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h4 className="text-base font-semibold font-sans text-white tracking-[-0.015em]">
            Submission & Consistency Heatmap
          </h4>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>
              <strong className="text-text-primary">{totalSubmissions}</strong> submissions
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>
              <strong className="text-text-primary">{activeDays}</strong> active days
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Flame className="w-3.5 h-3.5 text-warning" />
            <span>
              <strong className="text-text-primary">{maxStreak}</strong> days max streak
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid & Month Labels */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          {/* Month Labels Bar */}
          <div className="flex text-[10px] font-mono text-text-muted mb-1.5 pl-6 relative h-4">
            {monthLabels.map((lbl) => (
              <span
                key={lbl.name + lbl.weekIndex}
                className="absolute"
                style={{ left: `${lbl.weekIndex * 13 + 24}px` }}
              >
                {lbl.name}
              </span>
            ))}
          </div>

          <div className="flex gap-1.5">
            {/* Day of Week Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] font-mono text-text-muted pr-1.5 h-[88px] select-none">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Week Columns */}
            <div className="flex gap-[3px]">
              {weeks.map((wk, wkIdx) => (
                <div key={wkIdx} className="flex flex-col gap-[3px]">
                  {wk.map((day) => (
                    <div
                      key={day.date}
                      className={cn(
                        'w-[10px] h-[10px] rounded-[2px] transition-transform duration-75 cursor-pointer border border-transparent',
                        levelColors[day.level]
                      )}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredDay({
                          date: day.date,
                          count: day.count,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                        });
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Legend */}
      <div className="flex items-center justify-between pt-2 text-[11px] font-mono text-text-muted">
        <span>365-day algorithmic activity log</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#1C212E] border border-white/[0.04]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#065F46]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#059669]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#10B981]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#3B82F6]" />
          <span>More</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-tooltip px-2.5 py-1 rounded bg-[#181C28] border border-white/[0.12] text-text-primary text-[11px] font-mono shadow-elevation-3 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: hoveredDay.x, top: hoveredDay.y }}
        >
          <div className="font-semibold">
            {hoveredDay.count > 0
              ? `${hoveredDay.count} submission${hoveredDay.count > 1 ? 's' : ''}`
              : 'No submissions'}
          </div>
          <div className="text-[10px] text-text-muted">{hoveredDay.date}</div>
        </div>
      )}
    </div>
  );
};
