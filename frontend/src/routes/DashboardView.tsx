import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/ui/layout/DashboardLayout';
import { RadialProgressRing } from '@/components/profile/RadialProgressRing';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import { Button } from '@/components/ui/actions/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useUserTelemetry } from '@/hooks/useUserTelemetry';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { FALLBACK_PROBLEMS } from '@/lib/curriculumData';
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
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TargetProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
  tags: string[];
}

interface RealCampusPeer {
  rank: number;
  id: string;
  name: string;
  username: string;
  solved: number;
  score: number;
  isCurrentUser: boolean;
}

export const DashboardView: React.FC = () => {
  const { profile, user } = useAuth();
  const { progressMap, updateProgress } = useUserProgress();
  const telemetry = useUserTelemetry();

  const displayName = profile?.full_name || (user?.user_metadata?.full_name as string) || (user ? 'Developer' : 'Guest Developer');
  const collegeName = profile?.college_name || (profile?.college_id ? 'Affiliated College' : 'Independent');
  const streak = telemetry.currentStreak > 0 ? telemetry.currentStreak : profile?.current_streak || 0;
  const campusRank = profile?.score ? Math.max(1, 100 - Math.floor(profile.score / 50)) : '1';

  // Real solved count
  const realSolved = Object.values(progressMap).filter((s) => s === 'solved').length;
  const solvedCount = telemetry.solvedCount > 0
    ? telemetry.solvedCount
    : profile?.problems_solved_count !== undefined && profile.problems_solved_count > 0
    ? profile.problems_solved_count
    : realSolved;

  const easySolved = Math.round(solvedCount * 0.5);
  const mediumSolved = Math.round(solvedCount * 0.4);
  const hardSolved = Math.max(0, solvedCount - easySolved - mediumSolved);

  // 1. Dynamic unsolved targets
  const [targetProblems, setTargetProblems] = useState<TargetProblem[]>([]);
  const [activeContinueProblem, setActiveContinueProblem] = useState<TargetProblem>({
    id: '00000000-0000-0000-0000-000000000304',
    slug: 'search-in-rotated-sorted-array',
    title: 'Search in Rotated Sorted Array',
    difficulty: 'medium',
    estimatedMinutes: 25,
    tags: ['Binary Search', 'Arrays'],
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchTargets() {
      const solvedSet = new Set(telemetry.solvedProblemIds);
      Object.entries(progressMap).forEach(([id, status]) => {
        if (status === 'solved') solvedSet.add(id);
      });

      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from('problems')
            .select('id, title, slug, difficulty, problem_tags(tags(name))')
            .eq('is_published', true);

          if (!error && data && data.length > 0 && isMounted) {
            const allMapped: TargetProblem[] = data.map((p: any) => {
              const tags = (p.problem_tags || []).map((pt: any) => pt.tags?.name).filter(Boolean);
              return {
                id: p.id,
                slug: p.slug,
                title: p.title,
                difficulty: p.difficulty,
                estimatedMinutes: p.difficulty === 'hard' ? 40 : p.difficulty === 'medium' ? 25 : 15,
                tags: tags.length > 0 ? tags : ['Algorithms'],
              };
            });

            // Find unsolved problems
            const unsolved = allMapped.filter((p) => !solvedSet.has(p.id));
            if (unsolved.length > 0) {
              setTargetProblems(unsolved.slice(0, 3));
              setActiveContinueProblem(unsolved[0]);
            } else {
              setTargetProblems(allMapped.slice(0, 3));
              setActiveContinueProblem(allMapped[0]);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load targets from Supabase:', err);
      }

      // Fallback
      if (isMounted) {
        const unsolvedFallback = FALLBACK_PROBLEMS.filter((p) => !solvedSet.has(p.id)).map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          difficulty: p.difficulty,
          estimatedMinutes: p.difficulty === 'hard' ? 40 : p.difficulty === 'medium' ? 25 : 15,
          tags: p.tags || ['Arrays'],
        }));
        if (unsolvedFallback.length > 0) {
          setTargetProblems(unsolvedFallback.slice(0, 3));
          setActiveContinueProblem(unsolvedFallback[0]);
        } else {
          const allFb = FALLBACK_PROBLEMS.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            difficulty: p.difficulty,
            estimatedMinutes: 20,
            tags: p.tags || ['Arrays'],
          }));
          setTargetProblems(allFb.slice(0, 3));
          setActiveContinueProblem(allFb[0]);
        }
      }
    }

    fetchTargets();

    return () => {
      isMounted = false;
    };
  }, [telemetry.solvedProblemIds, progressMap]);

  // 2. Real Campus Standing Peers query from Supabase
  const [campusPeers, setCampusPeers] = useState<RealCampusPeer[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCampusPeers() {
      if (!isSupabaseConfigured() || !profile?.college_id) {
        if (isMounted && profile) {
          setCampusPeers([
            {
              rank: 1,
              id: profile.id,
              name: displayName,
              username: profile.username || 'dev',
              solved: solvedCount,
              score: profile.score || 0,
              isCurrentUser: true,
            },
          ]);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, score, problems_solved_count')
          .eq('college_id', profile.college_id)
          .order('score', { ascending: false })
          .limit(5);

        if (!error && data && data.length > 0 && isMounted) {
          const peers: RealCampusPeer[] = data.map((row: any, idx: number) => ({
            rank: idx + 1,
            id: row.id,
            name: row.full_name || 'Developer',
            username: row.username || 'dev',
            solved: row.problems_solved_count || 0,
            score: row.score || 0,
            isCurrentUser: row.id === user?.id || row.username === profile.username,
          }));
          setCampusPeers(peers);
        } else if (isMounted) {
          setCampusPeers([
            {
              rank: 1,
              id: profile.id,
              name: displayName,
              username: profile.username || 'dev',
              solved: solvedCount,
              score: profile.score || 0,
              isCurrentUser: true,
            },
          ]);
        }
      } catch (err) {
        console.warn('Campus peers query failed:', err);
      }
    }

    fetchCampusPeers();

    return () => {
      isMounted = false;
    };
  }, [profile?.college_id, profile?.username, profile?.score, solvedCount, user?.id, displayName]);

  // 3. Dynamic 30-Day Activity Pulse (strictly derived from telemetry submissions)
  const today = useMemo(() => new Date(), []);
  const recentDays = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      const dateStr = d.toISOString().split('T')[0];
      const isCompleted = (telemetry.activityMap[dateStr] || 0) > 0;
      return {
        day: i + 1,
        dateStr,
        completed: isCompleted,
      };
    });
  }, [today, telemetry.activityMap]);

  const activeInLast30 = useMemo(() => {
    return recentDays.filter((d) => d.completed).length;
  }, [recentDays]);

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Student Workspace', href: '/app/dashboard' },
        { label: 'Platform Mission Control' },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        {/* 1. TOP COMMAND BAR: SINGLE-ROW HEADER */}
        <div className="p-5 sm:p-6 rounded-xl border border-white/[0.08] bg-[#12151E] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-elevation-1">
          <div className="space-y-0.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-white tracking-[-0.025em]">
              Welcome back, {displayName}
            </h1>
            <p className="text-xs text-text-secondary font-sans">
              DSA Mastery • Step 1: Learn the Basics & Algorithmic Invariants
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Real Streak Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#FFC01E]/30 bg-[#FFC01E]/10 text-xs font-mono text-[#FFC01E] shadow-xs">
              <Flame className="w-4 h-4 fill-[#FFC01E] text-[#FFC01E]" />
              <span className="font-bold">{streak} Day Streak</span>
            </div>

            {/* Campus Rank Pill */}
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-mono text-primary hover:bg-primary/20 transition-colors shadow-xs"
            >
              <Trophy className="w-4 h-4 text-[#FFC01E]" />
              <span className="truncate max-w-[200px]">
                {collegeName} • Rank #{campusRank}
              </span>
              <ArrowRight className="w-3 h-3 text-text-muted" />
            </Link>
          </div>
        </div>

        {/* 2. MAIN GRID (65% Execution Rail / 35% Telemetry Rail) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ============================================================== */}
          {/* LEFT RAIL (65% / 8 COLS): ACTION CENTER */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* Bento Card: "CONTINUE WORKING" */}
            <div className="border border-white/[0.08] bg-[#12151E] p-5 rounded-xl space-y-4 shadow-elevation-1">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
                    Continue Working
                  </span>
                </div>
                <Link
                  to="/roadmaps"
                  className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                >
                  <span>View Full Curriculum</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#00B8A3] bg-[#00B8A3]/10 px-2 py-0.5 rounded border border-[#00B8A3]/30 uppercase font-semibold">
                      DSA Mastery Node
                    </span>
                    <DifficultyBadge difficulty={activeContinueProblem.difficulty} />
                  </div>
                  <h3 className="text-lg font-bold font-sans text-white tracking-[-0.015em]">
                    {activeContinueProblem.title}
                  </h3>
                  <p className="text-xs text-text-secondary font-sans">
                    Optimal time & space invariants • Focus on binary search index bounds and two-pointer contracts.
                  </p>
                </div>

                <Link
                  to={`/problems/${activeContinueProblem.slug}`}
                  className="shrink-0"
                >
                  <button className="bg-[#2563EB] hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 shadow-sm">
                    <Code2 className="w-4 h-4" />
                    <span>Launch Workspace IDE →</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Bento Card: "TODAY'S TARGETS" */}
            <div className="border border-white/[0.08] bg-[#12151E] p-5 rounded-xl space-y-4 shadow-elevation-1">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h3 className="text-base font-semibold font-sans text-white tracking-[-0.015em]">
                    Today's Targets
                  </h3>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  3 Algorithmically Curated Challenges
                </span>
              </div>

              <div className="space-y-2.5">
                {targetProblems.map((target, idx) => {
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
                              className="text-sm font-sans font-medium text-text-primary hover:text-primary transition-colors truncate"
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
                                  className="text-[10px] font-mono text-neutral-300 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.2 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Direct Solve Button */}
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
          {/* RIGHT RAIL (35% / 4 COLS): TELEMETRY & STANDINGS */}
          {/* ============================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. SOLVED DISTRIBUTION CARD */}
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

            {/* 2. 30-DAY ACTIVITY PULSE (BINDED STRICTLY TO REAL SUBMISSIONS) */}
            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#12151E] space-y-3 shadow-elevation-1">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FFC01E]" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                    30-Day Activity Pulse
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#00B8A3] font-bold">
                  {activeInLast30} / 30 Active
                </span>
              </div>

              {/* 30-day dots: dark slate (#1C212E) for inactive, vibrant green (#00B8A3) for active */}
              <div className="grid grid-cols-10 gap-1.5 py-1">
                {recentDays.map((d, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'h-4 rounded-[2px] transition-transform duration-75 cursor-pointer flex items-center justify-center text-[8px] font-mono border',
                      d.completed
                        ? 'bg-[#00B8A3] border-[#00B8A3]/40 shadow-xs'
                        : 'bg-[#1C212E] border-transparent hover:border-white/20'
                    )}
                    title={`${d.dateStr}: ${d.completed ? 'Active Submission' : 'No Activity'}`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-1">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>

            {/* 3. CAMPUS STANDING WIDGET (PURE REAL DATA) */}
            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#12151E] space-y-3 shadow-elevation-1">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                    Campus Leaderboard
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

              {/* Real peer list */}
              <div className="space-y-1.5">
                {campusPeers.map((peer) => (
                  <div
                    key={peer.id}
                    className={cn(
                      'p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between',
                      peer.isCurrentUser
                        ? 'bg-primary/10 border-primary/30 text-white'
                        : 'bg-[#181C28] border-white/[0.04] text-text-secondary'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                          peer.rank === 1
                            ? 'bg-[#FFC01E]/20 text-[#FFC01E]'
                            : peer.rank === 2
                            ? 'bg-gray-300/20 text-gray-300'
                            : peer.rank === 3
                            ? 'bg-amber-600/20 text-amber-500'
                            : 'bg-white/[0.06] text-text-muted'
                        )}
                      >
                        #{peer.rank}
                      </span>
                      <span className="text-text-primary font-medium truncate text-xs">
                        {peer.name} {peer.isCurrentUser && <span className="text-primary text-[10px]">(You)</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[#00B8A3] text-[11px] font-semibold">
                        {peer.solved} AC
                      </span>
                      <span className="text-text-muted text-[11px]">{peer.score} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
