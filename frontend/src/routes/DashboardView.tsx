import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/ui/layout/DashboardLayout';
import { RadialProgressRing } from '@/components/profile/RadialProgressRing';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import { Button } from '@/components/ui/actions/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import {
  Flame,
  Trophy,
  CheckCircle2,
  Clock,
  Circle,
  Code2,
  ArrowRight,
  BookOpen,
  Building2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface TargetProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
  tags: string[];
}

const TODAY_TARGETS: TargetProblem[] = [
  {
    id: '00000000-0000-0000-0000-000000000303',
    slug: '3sum',
    title: '3Sum',
    difficulty: 'medium',
    estimatedMinutes: 25,
    tags: ['Two Pointers', 'Array'],
  },
  {
    id: '00000000-0000-0000-0000-000000000305',
    slug: 'container-with-most-water',
    title: 'Container With Most Water',
    difficulty: 'medium',
    estimatedMinutes: 20,
    tags: ['Two Pointers', 'Greedy'],
  },
  {
    id: '00000000-0000-0000-0000-000000000306',
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'hard',
    estimatedMinutes: 40,
    tags: ['Two Pointers', 'Monotonic Stack'],
  },
];

interface CampusPeer {
  rank: number;
  name: string;
  username: string;
  solved: number;
  score: number;
  isCurrentUser?: boolean;
}

const SEEDED_CAMPUS_PEERS: CampusPeer[] = [
  { rank: 1, name: 'Aditya Verma', username: 'aditya_v', solved: 142, score: 2840 },
  { rank: 2, name: 'Priya Nair', username: 'priya_n', solved: 128, score: 2560 },
  { rank: 3, name: 'Rohan Deshmukh', username: 'rohan_d', solved: 116, score: 2320 },
  { rank: 4, name: 'Ananya Roy', username: 'ananya_r', solved: 98, score: 1960 },
  { rank: 5, name: 'Vikram Joshi', username: 'vikram_j', solved: 91, score: 1820 },
];

export const DashboardView: React.FC = () => {
  const { profile, user } = useAuth();
  const { progressMap, updateProgress } = useUserProgress();

  const displayName = profile?.full_name || (user?.user_metadata?.full_name as string) || (user ? 'Developer' : 'Guest Developer');
  const collegeName = profile?.college_name || (profile?.college_id ? 'Affiliated College' : 'Independent');
  const streak = profile?.current_streak || 0;
  const campusRank = profile?.score ? Math.max(1, 100 - Math.floor(profile.score / 50)) : '-';

  const realSolved = Object.values(progressMap).filter((s) => s === 'solved').length;
  const solvedCount = profile?.problems_solved_count !== undefined && profile.problems_solved_count > 0
    ? profile.problems_solved_count
    : realSolved;

  const easySolved = Math.round(solvedCount * 0.5);
  const mediumSolved = Math.round(solvedCount * 0.4);
  const hardSolved = Math.max(0, solvedCount - easySolved - mediumSolved);

  // Generate 30-day streak data dynamically based on real streak
  const recentDays = Array.from({ length: 30 }, (_, i) => {
    const isCompleted = streak > 0 && i < streak;
    return {
      day: 30 - i,
      completed: isCompleted,
    };
  }).reverse();

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Student Workspace', href: '/app/dashboard' },
        { label: 'Platform Mission Control' },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        {/* GUEST BANNER IF UNAUTHENTICATED */}
        {!user && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-between text-xs font-sans text-amber-300">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 border border-amber-500/40 text-amber-200">
                Guest Mode
              </span>
              <span>You are viewing the dashboard as a Guest Developer. Sign in to track algorithmic progress and persist submissions.</span>
            </div>
            <Link to="/login" className="font-semibold underline hover:text-white shrink-0">
              Sign In →
            </Link>
          </div>
        )}

        {/* TOP BAR: GREETING, ACTIVE STREAK PILL, CAMPUS STANDING */}
        <div className="p-6 rounded-lg border border-white/[0.08] bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-elevation-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                Mission Control
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B8A3] animate-pulse" />
              <span className="text-xs font-mono text-[#00B8A3]">System Nominal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-white tracking-[-0.025em]">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-neutral-400 font-sans mt-0.5">
              DSA Roadmap • TakeUForward A2Z Sheet Target in Progress
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Active Streak Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FFC01E]/30 bg-[#FFC01E]/10 text-xs font-mono text-[#FFC01E]">
              <Flame className="w-4 h-4 fill-[#FFC01E] text-[#FFC01E]" />
              <span className="font-bold">{streak} Day Streak</span>
              <span className="text-text-muted hidden sm:inline">{streak > 0 ? '• Active' : '• Start today'}</span>
            </div>

            {/* College Leaderboard Standing */}
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-mono text-primary hover:bg-primary/20 transition-colors"
            >
              <Trophy className="w-4 h-4 text-[#FFC01E]" />
              <span>
                {campusRank !== '-' ? (
                  <>Rank <strong className="text-text-primary">#{campusRank}</strong> in </>
                ) : null}
                <span className="truncate max-w-[140px] inline-block align-bottom font-medium">
                  {collegeName}
                </span>
              </span>
              <ArrowRight className="w-3 h-3 text-text-muted" />
            </Link>
          </div>
        </div>

        {/* MAIN COCKPIT: LEFT 65% / RIGHT 35% */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ============================================================== */}
          {/* LEFT 65% (8 COLS): CONTINUE LEARNING & TODAY'S TARGETS */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. CONTINUE LEARNING ACTIVE ROADMAP NODE */}
            <div className="p-6 rounded-lg border border-white/[0.08] bg-surface space-y-4 shadow-elevation-1">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
                    Active Roadmap Progress
                  </span>
                </div>
                <Link
                  to="/roadmaps"
                  className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                >
                  <span>View Full Curriculum DAG</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono text-[#00B8A3] bg-[#00B8A3]/10 px-2 py-0.5 rounded border border-[#00B8A3]/30 uppercase font-semibold">
                      Step 3: Solve Problems on Arrays
                    </span>
                    <h3 className="text-base font-semibold font-sans text-white tracking-[-0.015em] mt-1.5">
                      Topic 3.3: Medium & Hard Array Problems
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-text-secondary tabular-nums">
                    <strong className="text-text-primary">4</strong> / 6 Solved (67%)
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  Mastering cyclic rotated arrays, monotonic water traps, and multi-pointer invariant contracts.
                </p>

                {/* Progress bar */}
                <div className="w-full bg-[#1C212E] h-2.5 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full"
                    style={{ width: '67%' }}
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs font-mono text-text-muted">
                    Next recommended problem: <strong className="text-text-primary">Search in Rotated Sorted Array</strong>
                  </div>
                  <Link to="/problems/search-in-rotated-sorted-array">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Code2 className="w-4 h-4" />}
                      className="text-xs font-mono"
                    >
                      Launch Workspace IDE
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. TODAY'S TARGET 3-PROBLEM CHECKLIST */}
            <div className="p-6 rounded-lg border border-white/[0.08] bg-surface space-y-4 shadow-elevation-1">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-warning" />
                  <div>
                    <h3 className="text-base font-semibold font-sans text-white tracking-[-0.015em]">
                      Today's Target Challenge Set
                    </h3>
                    <p className="text-[11px] text-text-muted font-sans">
                      Algorithmically curated based on your current knowledge frontier
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-text-secondary bg-[#181C28] px-2.5 py-1 rounded border border-white/[0.08]">
                  Est. 1h 25m total
                </span>
              </div>

              {/* Problem Rows */}
              <div className="space-y-3">
                {TODAY_TARGETS.map((target, idx) => {
                  const status = progressMap[target.id] || 'todo';
                  const isSolved = status === 'solved';

                  return (
                    <div
                      key={target.id}
                      className="p-3.5 rounded-lg border border-white/[0.06] bg-[#181C28]/80 hover:bg-[#181C28] transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Interactive Checkbox */}
                        <button
                          onClick={() => {
                            updateProgress(target.id, isSolved ? 'todo' : 'solved');
                          }}
                          className="text-text-muted hover:text-[#00B8A3] transition-colors shrink-0"
                          title={isSolved ? 'Mark as Todo' : 'Mark as Solved'}
                        >
                          {isSolved ? (
                            <CheckCircle2 className="w-5 h-5 text-[#00B8A3] fill-[#00B8A3]/10" />
                          ) : (
                            <Circle className="w-5 h-5 text-white/20 hover:text-white/40" />
                          )}
                        </button>

                        {/* Title and tags */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-text-muted font-bold">
                              #{idx + 1}
                            </span>
                            <Link
                              to={`/problems/${target.slug}`}
                              className="text-sm font-sans font-medium text-text-primary hover:text-blue-400 transition-colors truncate"
                            >
                              {target.title}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <DifficultyBadge difficulty={target.difficulty} />
                            <span className="text-[11px] font-mono text-text-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ~{target.estimatedMinutes}m
                            </span>
                            <div className="hidden sm:flex items-center gap-1.5">
                              {target.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-mono text-[#8F96A8] bg-[#1C212E] px-1.5 py-0.2 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <Link to={`/problems/${target.slug}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs font-mono shrink-0"
                          leftIcon={<Code2 className="w-3 h-3" />}
                        >
                          {isSolved ? 'Review' : 'Solve'}
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT 35% (4 COLS): MINI RADIAL, 30-DAY STREAK, CAMPUS LEAGUE */}
          {/* ============================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. MINI RADIAL PROGRESS CIRCLE */}
            <RadialProgressRing
              solved={solvedCount}
              total={150}
              easySolved={easySolved}
              easyTotal={60}
              mediumSolved={mediumSolved}
              mediumTotal={65}
              hardSolved={hardSolved}
              hardTotal={25}
              size={120}
              strokeWidth={8}
              compact={true}
              className="flex-col md:flex-col"
            />

            {/* 2. COMPACT 30-DAY STREAK ACTIVITY GRID */}
            <div className="p-5 rounded-lg border border-white/[0.08] bg-surface space-y-3 shadow-elevation-1">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FFC01E]" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                    30-Day Activity Pulse
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#00B8A3] font-bold">
                  23 / 30 Active
                </span>
              </div>

              {/* 30-day dots */}
              <div className="grid grid-cols-10 gap-1.5 py-1">
                {recentDays.map((d, idx) => (
                  <div
                    key={idx}
                    className={`h-4 rounded-[2px] transition-transform duration-75 cursor-pointer flex items-center justify-center text-[8px] font-mono ${
                      d.completed
                        ? 'bg-[#10B981] hover:brightness-125'
                        : 'bg-[#1C212E] hover:border-white/30 border border-transparent'
                    }`}
                    title={`Day ${d.day}: ${d.completed ? 'Active Submission' : 'Rest'}`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-1">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>

            {/* 3. QUICK CAMPUS LEADERBOARD WIDGET */}
            <div className="p-5 rounded-lg border border-white/[0.08] bg-surface space-y-3 shadow-elevation-1">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                    Campus Leaderboard Top 5
                  </h4>
                </div>
                <Link
                  to="/leaderboard"
                  className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1"
                >
                  <span>Full League</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="text-[11px] font-mono text-text-muted truncate">
                Institution: <strong className="text-text-primary">{collegeName}</strong>
              </div>

              {/* Top 5 list */}
              <div className="space-y-1.5">
                {SEEDED_CAMPUS_PEERS.map((peer) => (
                  <div
                    key={peer.rank}
                    className="p-2 rounded border border-white/[0.04] bg-[#181C28] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          peer.rank === 1
                            ? 'bg-[#FFC01E]/20 text-[#FFC01E]'
                            : peer.rank === 2
                            ? 'bg-gray-300/20 text-gray-300'
                            : peer.rank === 3
                            ? 'bg-amber-600/20 text-amber-500'
                            : 'bg-white/[0.06] text-text-muted'
                        }`}
                      >
                        {peer.rank}
                      </span>
                      <span className="text-text-primary truncate text-[12px]">{peer.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[#00B8A3] text-[11px] font-semibold">
                        {peer.solved} AC
                      </span>
                      <span className="text-text-muted text-[11px]">{peer.score} pts</span>
                    </div>
                  </div>
                ))}

                {/* Current user card if outside top 5 */}
                <div className="p-2 rounded border border-primary/40 bg-primary/10 flex items-center justify-between text-xs font-mono mt-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-primary text-text-inverse flex items-center justify-center text-[10px] font-bold">
                      #{campusRank}
                    </span>
                    <span className="text-text-primary font-bold truncate text-[12px]">
                      {displayName} (You)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#00B8A3] text-[11px] font-bold">{solvedCount} AC</span>
                    <span className="text-text-muted text-[11px]">890 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
