import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import type { ProblemOfTheDay } from '@/types';
import { FALLBACK_PROBLEMS } from '@/lib/curriculumData';
import { Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProblemOfTheDayCardProps {
  solvedProblemIds?: string[];
  className?: string;
}

export const ProblemOfTheDayCard: React.FC<ProblemOfTheDayCardProps> = ({
  solvedProblemIds = [],
  className,
}) => {
  const [potd, setPotd] = useState<ProblemOfTheDay | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('00:00:00');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Fetch today's POTD from Supabase
  useEffect(() => {
    const fetchPOTD = async () => {
      if (!isSupabaseConfigured()) {
        setPotd({
          id: 'mock-potd',
          problem_id: FALLBACK_PROBLEMS[0].id,
          scheduled_date: todayStr,
          points_bonus: 50,
          created_at: new Date().toISOString(),
          problems: FALLBACK_PROBLEMS[0],
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('problem_of_the_day')
          .select(`
            id,
            problem_id,
            scheduled_date,
            points_bonus,
            created_at,
            problems:problem_id (
              id,
              title,
              slug,
              difficulty
            )
          `)
          .eq('scheduled_date', todayStr)
          .maybeSingle();

        if (error) {
          console.warn('Could not fetch POTD:', error);
          setPotd(null);
        } else if (data) {
          const rawProblem: any = Array.isArray(data.problems) ? data.problems[0] : data.problems;
          const matchedFallback = FALLBACK_PROBLEMS.find((p) => p.id === data.problem_id);
          setPotd({
            id: data.id,
            problem_id: data.problem_id,
            scheduled_date: data.scheduled_date,
            points_bonus: data.points_bonus,
            created_at: data.created_at,
            problems: rawProblem
              ? {
                  id: rawProblem.id,
                  title: rawProblem.title,
                  slug: rawProblem.slug,
                  difficulty: rawProblem.difficulty,
                  tags: matchedFallback?.tags || ['Algorithms', 'DSA'],
                }
              : FALLBACK_PROBLEMS[0],
          });
        } else {
          // Fallback to first problem in catalog
          setPotd({
            id: 'potd-fallback',
            problem_id: FALLBACK_PROBLEMS[0].id,
            scheduled_date: todayStr,
            points_bonus: 50,
            created_at: new Date().toISOString(),
            problems: FALLBACK_PROBLEMS[0],
          });
        }
      } catch (err) {
        console.error('POTD fetch exception:', err);
      }
    };

    fetchPOTD();
  }, [todayStr]);

  // Live countdown timer until midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      const diff = Math.max(0, midnight.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, '0')} : ${minutes
          .toString()
          .padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const isSolved = potd?.problem_id ? solvedProblemIds.includes(potd.problem_id) : false;
  const problemSlug = potd?.problems?.slug || 'two-sum';
  const problemTitle = potd?.problems?.title || 'Two Sum';
  const difficulty = potd?.problems?.difficulty || 'easy';
  const tags = potd?.problems?.tags || ['Arrays', 'Two Pointers'];

  return (
    <div
      className={cn(
        'p-5 rounded-2xl border border-white/[0.08] bg-[#12151D] shadow-elevation-1 space-y-4 text-left relative overflow-hidden',
        className
      )}
    >
      {/* Ambient Top Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
            Problem of the Day
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Sparkles className="w-3 h-3" />
          <span>+{potd?.points_bonus || 50} Pts</span>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="bg-[#090B0E] border border-white/[0.05] rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-neutral-500" />
          <span>Resets in:</span>
        </div>
        <div className="font-mono text-xs font-bold text-white tracking-widest bg-white/[0.04] px-2.5 py-1 rounded border border-white/[0.06]">
          {timeRemaining}
        </div>
      </div>

      {/* Problem Meta */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <DifficultyBadge difficulty={difficulty} className="text-[10px] px-2 py-0.2" />
          <h3 className="text-base font-bold text-white tracking-tight truncate font-sans">
            {problemTitle}
          </h3>
        </div>

        {/* Topic Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono text-neutral-400 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Solved Status or Primary Action */}
      <div className="pt-2">
        {isSolved ? (
          <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>✓ Solved Today • +50 Pts Claimed</span>
          </div>
        ) : (
          <Link to={`/problems/${problemSlug}`} className="block">
            <button className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-medium text-xs font-sans flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <span>Solve POTD</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};
export default ProblemOfTheDayCard;
