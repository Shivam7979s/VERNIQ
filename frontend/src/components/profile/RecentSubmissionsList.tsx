import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/actions/Button';
import { CheckCircle2, Clock, Code2, ArrowRight } from 'lucide-react';
import type { Submission } from '@/types';
import { FALLBACK_PROBLEMS } from '@/lib/curriculumData';

export interface RecentSubmissionItem extends Submission {
  problemTitle?: string;
  problemSlug?: string;
}

export interface RecentSubmissionsListProps {
  submissions: RecentSubmissionItem[];
  loading?: boolean;
  className?: string;
}

const formatRelativeTime = (dateString: string): string => {
  try {
    const now = Date.now();
    const past = new Date(dateString).getTime();
    const diffSec = Math.max(0, Math.floor((now - past) / 1000));

    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'recently';
  }
};

const resolveProblemMeta = (sub: RecentSubmissionItem) => {
  if (sub.problemTitle && sub.problemSlug) {
    return { title: sub.problemTitle, slug: sub.problemSlug };
  }
  const pObj = (sub as any).problems;
  const p = Array.isArray(pObj) ? pObj[0] : pObj;
  if (p?.title && p?.slug) {
    return { title: p.title, slug: p.slug };
  }
  const match = FALLBACK_PROBLEMS.find((prob) => prob.id === sub.problem_id);
  if (match) {
    return { title: match.title, slug: match.slug };
  }
  return { title: 'Two Sum', slug: 'two-sum' };
};

const formatLanguageLabel = (lang: string) => {
  switch (lang?.toLowerCase()) {
    case 'cpp':
      return 'C++';
    case 'java':
      return 'Java';
    case 'python':
      return 'Python';
    case 'typescript':
      return 'TypeScript';
    case 'go':
      return 'Go';
    default:
      return lang?.toUpperCase() || 'Code';
  }
};

export const isAccepted = (verdict: string): boolean => {
  const v = (verdict || '').toLowerCase().trim();
  return v === 'accepted' || v === 'ac';
};

export const RecentSubmissionsList: React.FC<RecentSubmissionsListProps> = ({
  submissions = [],
  loading = false,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'ac' | 'all'>('ac');

  const acceptedList = submissions.filter((s) => isAccepted(s.verdict));
  const displayList = (activeTab === 'ac' ? acceptedList : submissions).slice(0, 10);

  return (
    <div
      className={cn(
        'p-5 rounded-lg border border-white/[0.08] bg-surface space-y-4 shadow-elevation-1 select-none text-left',
        className
      )}
    >
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <h4 className="text-base font-semibold font-sans text-white tracking-[-0.015em]">
            Recent Submissions
          </h4>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-md bg-[#181C28] border border-white/[0.06] text-xs font-mono">
          <button
            onClick={() => setActiveTab('ac')}
            className={cn(
              'px-3 py-1 rounded transition-colors flex items-center gap-1.5',
              activeTab === 'ac'
                ? 'bg-primary/20 text-primary border border-primary/30 font-semibold'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00B8A3]" />
            <span>Recent AC</span>
            <span className="text-[10px] opacity-75">({acceptedList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3 py-1 rounded transition-colors flex items-center gap-1.5',
              activeTab === 'all'
                ? 'bg-white/[0.08] text-white border border-white/[0.12] font-semibold'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <span>All Submissions</span>
            <span className="text-[10px] opacity-75">({submissions.length})</span>
          </button>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="py-8 text-center text-xs font-mono text-text-muted">
          Loading submission telemetry...
        </div>
      ) : displayList.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-text-muted">
            <CheckCircle2 className="w-6 h-6 opacity-40" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-sans text-text-secondary font-medium">
              {activeTab === 'ac'
                ? 'No accepted submissions yet. Solve your first problem to start your record.'
                : 'No submissions recorded yet. Submit your code to start your record.'}
            </p>
          </div>
          <Link to="/problems">
            <Button size="sm" variant="primary" className="text-xs mt-1">
              <span>Browse Problems</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {displayList.map((sub) => {
            const meta = resolveProblemMeta(sub);
            const isAc = isAccepted(sub.verdict);

            return (
              <div
                key={sub.id}
                className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-white/[0.02] rounded transition-colors text-xs font-mono"
              >
                {/* Left: Problem Title & Status Indicator */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {isAc ? (
                    <span className="w-2 h-2 rounded-full bg-[#00B8A3] shrink-0" title="Accepted" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#FF375F] shrink-0" title={sub.verdict} />
                  )}
                  <Link
                    to={`/problems/${meta.slug}`}
                    className="font-medium text-white hover:text-primary transition-colors truncate font-sans text-sm"
                  >
                    {meta.title}
                  </Link>
                </div>

                {/* Right: Language chip, Runtime, and Relative Time */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Language chip */}
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] text-neutral-300">
                    {formatLanguageLabel(sub.language)}
                  </span>

                  {/* Verdict tag if in 'All' tab and not accepted */}
                  {activeTab === 'all' && !isAc && (
                    <span className="px-2 py-0.5 rounded bg-[#FF375F]/10 border border-[#FF375F]/30 text-[10px] text-[#FF375F] font-bold uppercase">
                      {sub.verdict.replace('_', ' ')}
                    </span>
                  )}

                  {/* Relative Timestamp */}
                  <span className="text-[11px] text-text-muted flex items-center gap-1 min-w-[85px] justify-end">
                    <Clock className="w-3 h-3 opacity-60" />
                    <span>{formatRelativeTime(sub.created_at)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
