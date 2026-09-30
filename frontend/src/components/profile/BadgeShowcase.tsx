import React from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Target, Crown, Cpu, Zap, Award, Flame } from 'lucide-react';

export interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  earnedDate: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface BadgeShowcaseProps {
  className?: string;
  badges?: MilestoneBadge[];
}

const DEFAULT_BADGES: MilestoneBadge[] = [
  {
    id: 'badge-100-days',
    title: '100 Days Streak',
    description: 'Maintained uninterrupted 100-day daily problem solving streak.',
    earnedDate: 'Sep 2026',
    icon: <Flame className="w-5 h-5" />,
    color: '#FFC01E',
    bgColor: 'rgba(255, 192, 30, 0.12)',
    borderColor: 'rgba(255, 192, 30, 0.3)',
  },
  {
    id: 'badge-bs-master',
    title: 'Binary Search Master',
    description: 'Completed all foundational and rotated array binary search theorems.',
    earnedDate: 'Aug 2026',
    icon: <Target className="w-5 h-5" />,
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  {
    id: 'badge-campus-top-5',
    title: 'Campus Top 5',
    description: 'Ranked in the top 5 engineers across college cohort.',
    earnedDate: 'Jul 2026',
    icon: <Crown className="w-5 h-5" />,
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  {
    id: 'badge-dp-specialist',
    title: 'DP Specialist',
    description: 'Solved 25+ dynamic programming problems with optimal recurrence proofs.',
    earnedDate: 'Jun 2026',
    icon: <Cpu className="w-5 h-5" />,
    color: '#00B8A3',
    bgColor: 'rgba(0, 184, 163, 0.12)',
    borderColor: 'rgba(0, 184, 163, 0.3)',
  },
  {
    id: 'badge-speed-demon',
    title: 'Speed Demon',
    description: 'Passed all 64 judge test vectors within 20ms runtime benchmark.',
    earnedDate: 'May 2026',
    icon: <Zap className="w-5 h-5" />,
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  {
    id: 'badge-revision-champion',
    title: 'Spaced Repetition Champ',
    description: 'Maintained 0 overdue items in Ebbinghaus forgetting curve queue.',
    earnedDate: 'Apr 2026',
    icon: <Award className="w-5 h-5" />,
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
];

export const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({
  className,
  badges = DEFAULT_BADGES,
}) => {
  return (
    <div
      className={cn(
        'p-5 rounded-lg border border-white/[0.08] bg-surface space-y-4 shadow-elevation-1',
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-warning" />
          <h4 className="text-base font-semibold font-sans text-white tracking-[-0.015em]">
            Milestone Badges & Honors
          </h4>
        </div>
        <span className="text-xs font-mono text-text-secondary bg-[#181C28] px-2.5 py-1 rounded border border-white/[0.08]">
          {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="p-3 rounded-lg border border-white/[0.06] bg-[#181C28]/80 hover:bg-[#181C28] transition-all duration-200 flex flex-col items-center text-center group cursor-pointer"
            title={`${badge.title} — ${badge.description} (Earned ${badge.earnedDate})`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110 shadow-sm"
              style={{
                backgroundColor: badge.bgColor,
                borderColor: badge.borderColor,
                borderWidth: '1px',
                color: badge.color,
              }}
            >
              {badge.icon}
            </div>
            <span className="text-xs font-mono font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
              {badge.title}
            </span>
            <span className="text-[10px] text-text-muted font-mono mt-0.5">
              {badge.earnedDate}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
