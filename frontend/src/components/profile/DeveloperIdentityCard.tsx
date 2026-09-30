import React from 'react';
import { cn } from '@/lib/utils';
import {
  Building2,
  ExternalLink,
  CheckCircle2,
  Settings,
  Code2,
  Globe,
} from 'lucide-react';
import { GithubIcon } from '@/components/ui/icons/GithubIcon';
import { Badge } from '@/components/ui/data/Badge';
import { Button } from '@/components/ui/actions/Button';
import type { UserProfile } from '@/types';

export interface DeveloperIdentityCardProps {
  profile?: UserProfile | null;
  onEditSettings?: () => void;
  className?: string;
}

export const DeveloperIdentityCard: React.FC<DeveloperIdentityCardProps> = ({
  profile,
  onEditSettings,
  className,
}) => {
  const displayName = profile?.full_name || 'Shivam Sharma';
  const username = profile?.username || 'shivam7979';
  const roleName = profile?.role || 'student';
  const collegeName = profile?.college_name || 'Rajiv Gandhi Proudyogiki Vishwavidyalaya';
  const bio =
    profile?.bio ||
    'Distributed Systems & Algorithmic Engineering @ VERNIQ. Specializing in high-throughput query engines and concurrent data structures.';

  const githubUser = profile?.github_username || 'Shivam7979s';
  const linkedinUrl = profile?.linkedin_url || 'https://linkedin.com/in/shivam-sharma';
  const leetcodeUser = profile?.leetcode_username || 'shivam7979';

  const contestRating = 1642;
  const globalRank = 4210;
  const campusRank = 14;
  const problemsSolved = profile?.problems_solved_count ?? 74;
  const currentStreak = profile?.current_streak ?? 7;
  const maxStreak = profile?.max_streak ?? 28;

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'VN';

  return (
    <div
      className={cn(
        'p-6 rounded-lg border border-white/[0.08] bg-surface space-y-6 shadow-elevation-1 text-left',
        className
      )}
    >
      {/* Avatar, Status Outline, Role Badge */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-0.5 shadow-elevation-2">
            <div className="w-full h-full rounded-full bg-[#12151E] flex items-center justify-center text-primary font-mono text-xl font-bold border-2 border-white/[0.08]">
              {initials}
            </div>
          </div>
          {/* Active status pip */}
          <span
            className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#00B8A3] border-2 border-[#12151E]"
            title="Online & Synchronized"
          />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold font-sans text-text-primary tracking-tight">
            {displayName}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-mono text-text-muted">@{username}</span>
            <Badge variant="primary" className="text-[10px] uppercase font-mono px-2 py-0">
              {roleName}
            </Badge>
          </div>
        </div>

        {/* Verified College Badge & Campus Standing */}
        <div className="w-full p-2.5 rounded-lg border border-white/[0.06] bg-[#181C28]/90 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span className="text-text-secondary truncate" title={collegeName}>
              {collegeName}
            </span>
          </div>
          <span className="text-[#FFC01E] font-bold shrink-0 bg-[#FFC01E]/10 px-2 py-0.5 rounded border border-[#FFC01E]/30">
            Rank #{campusRank}
          </span>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-1 text-xs text-text-secondary leading-relaxed font-sans border-t border-white/[0.06] pt-4">
        <span className="font-mono text-[10px] uppercase font-semibold text-text-muted block mb-1">
          Engineering Bio
        </span>
        <p>{bio}</p>
      </div>

      {/* Social & Platform Sync Badges */}
      <div className="space-y-2 border-t border-white/[0.06] pt-4">
        <span className="font-mono text-[10px] uppercase font-semibold text-text-muted block">
          Connected Profiles & Sync Status
        </span>

        {/* GitHub */}
        <a
          href={`https://github.com/${githubUser}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2 rounded border border-white/[0.06] bg-[#181C28] hover:bg-white/[0.04] transition-colors text-xs font-mono group"
        >
          <div className="flex items-center gap-2 text-text-primary">
            <GithubIcon className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
            <span className="truncate max-w-[120px]">{githubUser}</span>
          </div>
          <span className="text-[#00B8A3] text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Synced
          </span>
        </a>

        {/* LeetCode */}
        <a
          href={`https://leetcode.com/${leetcodeUser}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2 rounded border border-white/[0.06] bg-[#181C28] hover:bg-white/[0.04] transition-colors text-xs font-mono group"
        >
          <div className="flex items-center gap-2 text-text-primary">
            <Code2 className="w-4 h-4 text-[#FFA116] group-hover:text-[#FFA116]" />
            <span className="truncate max-w-[120px]">{leetcodeUser}</span>
          </div>
          <span className="text-primary text-[10px] flex items-center gap-1 font-mono">
            {contestRating} Rating
          </span>
        </a>

        {/* LinkedIn */}
        <a
          href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2 rounded border border-white/[0.06] bg-[#181C28] hover:bg-white/[0.04] transition-colors text-xs font-mono group"
        >
          <div className="flex items-center gap-2 text-text-primary">
            <Globe className="w-4 h-4 text-[#0A66C2]" />
            <span className="truncate max-w-[120px]">LinkedIn</span>
          </div>
          <ExternalLink className="w-3 h-3 text-text-muted group-hover:text-text-primary" />
        </a>
      </div>

      {/* Community / Platform Standing Stats */}
      <div className="space-y-2 border-t border-white/[0.06] pt-4">
        <span className="font-mono text-[10px] uppercase font-semibold text-text-muted block">
          Platform Telemetry
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-[#181C28] border border-white/[0.06]">
            <span className="text-[10px] text-text-muted block uppercase">Contest Rating</span>
            <span className="text-base font-bold text-primary tabular-nums">
              {contestRating}
            </span>
            <span className="text-[10px] text-[#00B8A3] block">Top 8.2%</span>
          </div>

          <div className="p-2.5 rounded bg-[#181C28] border border-white/[0.06]">
            <span className="text-[10px] text-text-muted block uppercase">Global Rank</span>
            <span className="text-base font-bold text-text-primary tabular-nums">
              #{globalRank.toLocaleString()}
            </span>
            <span className="text-[10px] text-text-muted block">of 62,400</span>
          </div>

          <div className="p-2.5 rounded bg-[#181C28] border border-white/[0.06]">
            <span className="text-[10px] text-text-muted block uppercase">Solved Total</span>
            <span className="text-base font-bold text-[#00B8A3] tabular-nums">
              {problemsSolved}
            </span>
            <span className="text-[10px] text-text-muted block">Verified AC</span>
          </div>

          <div className="p-2.5 rounded bg-[#181C28] border border-white/[0.06]">
            <span className="text-[10px] text-text-muted block uppercase">Active Streak</span>
            <span className="text-base font-bold text-[#FFC01E] tabular-nums">
              {currentStreak} Days
            </span>
            <span className="text-[10px] text-text-muted block">Max {maxStreak}d</span>
          </div>
        </div>
      </div>

      {/* Action to Edit Profile / Affiliation */}
      {onEditSettings && (
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs font-mono"
            leftIcon={<Settings className="w-3.5 h-3.5" />}
            onClick={onEditSettings}
          >
            Edit Profile & Affiliation
          </Button>
        </div>
      )}
    </div>
  );
};
