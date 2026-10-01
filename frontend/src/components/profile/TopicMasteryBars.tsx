import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Layers,
  GitCommit,
  Search,
  Cpu,
  FolderTree,
  Maximize2,
  ListOrdered,
  Zap,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { FALLBACK_PROBLEMS } from '@/lib/curriculumData';
import { isAccepted } from '@/hooks/useUserTelemetry';

export interface TopicStat {
  id: string;
  name: string;
  solved: number;
  total: number;
  icon: React.ReactNode;
  color: string;
}

export interface TopicMasteryBarsProps {
  className?: string;
  solvedProblemIds?: string[] | Set<string>;
  totalSolved?: number;
}

interface TopicDefinition {
  id: string;
  name: string;
  slugs: string[];
  icon: React.ReactNode;
  color: string;
}

const TOPIC_DEFINITIONS: TopicDefinition[] = [
  {
    id: 'arrays',
    name: 'Arrays',
    slugs: ['arrays', 'array'],
    icon: <Layers className="w-4 h-4" />,
    color: '#00B8A3',
  },
  {
    id: 'two-pointers',
    name: 'Two Pointers',
    slugs: ['two-pointers', 'two pointers'],
    icon: <GitCommit className="w-4 h-4" />,
    color: '#3B82F6',
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    slugs: ['binary-search', 'binary search'],
    icon: <Search className="w-4 h-4" />,
    color: '#8B5CF6',
  },
  {
    id: 'hash-map',
    name: 'Hash Map',
    slugs: ['hash-map', 'hash map', 'hashmap'],
    icon: <Maximize2 className="w-4 h-4" />,
    color: '#06B6D4',
  },
  {
    id: 'stack-queue',
    name: 'Stack & Queue',
    slugs: ['monotonic-stack', 'stack', 'queue'],
    icon: <ListOrdered className="w-4 h-4" />,
    color: '#F59E0B',
  },
  {
    id: 'greedy',
    name: 'Greedy',
    slugs: ['greedy'],
    icon: <Zap className="w-4 h-4" />,
    color: '#10B981',
  },
  {
    id: 'dp',
    name: 'Dynamic Programming',
    slugs: ['dynamic-programming', 'dp'],
    icon: <Cpu className="w-4 h-4" />,
    color: '#FF375F',
  },
  {
    id: 'trees-graphs',
    name: 'Trees & Graphs',
    slugs: ['trees', 'graphs', 'tree', 'graph'],
    icon: <FolderTree className="w-4 h-4" />,
    color: '#EC4899',
  },
];

export const TopicMasteryBars: React.FC<TopicMasteryBarsProps> = ({
  className,
  solvedProblemIds,
  totalSolved,
}) => {
  const { user } = useAuth();
  const [remoteProblems, setRemoteProblems] = useState<any[]>([]);
  const [fetchedSolvedIds, setFetchedSolvedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Fetch published problems with tags from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        // Fetch problems joined with tags
        if (isSupabaseConfigured()) {
          const { data: probData, error: probError } = await supabase
            .from('problems')
            .select('id, title, slug, is_published, problem_tags(tags(name, slug))')
            .eq('is_published', true);

          if (!probError && probData && probData.length > 0 && isMounted) {
            setRemoteProblems(probData);
          } else if (isMounted) {
            setRemoteProblems(FALLBACK_PROBLEMS);
          }
        } else if (isMounted) {
          setRemoteProblems(FALLBACK_PROBLEMS);
        }

        // Fetch user solved problem IDs if not passed via props
        if (user && isSupabaseConfigured() && !solvedProblemIds) {
          const solvedSet = new Set<string>();

          // Query user_problem_progress
          const { data: progData } = await supabase
            .from('user_problem_progress')
            .select('problem_id')
            .eq('user_id', user.id)
            .eq('status', 'solved');

          if (progData) {
            progData.forEach((row: { problem_id: string }) => {
              if (row.problem_id) solvedSet.add(row.problem_id);
            });
          }

          // Also query accepted submissions
          const { data: subsData } = await supabase
            .from('submissions')
            .select('problem_id, verdict')
            .eq('user_id', user.id);

          if (subsData) {
            subsData.forEach((sub: { problem_id?: string; verdict?: string }) => {
              if (sub.problem_id && isAccepted(sub.verdict || '')) {
                solvedSet.add(sub.problem_id);
              }
            });
          }

          if (isMounted) {
            setFetchedSolvedIds(solvedSet);
          }
        }
      } catch (err) {
        console.warn('Failed to load topic mastery telemetry:', err);
        if (isMounted) {
          setRemoteProblems(FALLBACK_PROBLEMS);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, solvedProblemIds]);

  // 2. Resolve active solved problem IDs set
  const activeSolvedSet = useMemo<Set<string>>(() => {
    if (solvedProblemIds) {
      if (solvedProblemIds instanceof Set) return solvedProblemIds;
      return new Set(solvedProblemIds);
    }
    return fetchedSolvedIds;
  }, [solvedProblemIds, fetchedSolvedIds]);

  // 3. Resolve active problems pool
  const activeProblems = useMemo(() => {
    if (remoteProblems.length > 0) return remoteProblems;
    return FALLBACK_PROBLEMS;
  }, [remoteProblems]);

  // 4. Compute topic stats dynamically
  const topicStats = useMemo<TopicStat[]>(() => {
    return TOPIC_DEFINITIONS.map((topicDef) => {
      let total = 0;
      let solved = 0;

      activeProblems.forEach((problem) => {
        // Extract tags from problem_tags or problem.tags
        let tags: string[] = [];
        if (Array.isArray(problem.problem_tags) && problem.problem_tags.length > 0) {
          tags = problem.problem_tags
            .map((pt: any) => (pt.tags?.slug || pt.tags?.name || '').toLowerCase())
            .filter(Boolean);
        } else if (Array.isArray(problem.tags)) {
          tags = problem.tags.map((t: string) => t.toLowerCase());
        } else {
          // Check matching fallback
          const fb = FALLBACK_PROBLEMS.find((f) => f.id === problem.id || f.slug === problem.slug);
          if (fb && Array.isArray(fb.tags)) {
            tags = fb.tags.map((t) => t.toLowerCase());
          }
        }

        const matches = tags.some((tag) =>
          topicDef.slugs.some((slug) => tag.includes(slug))
        );

        if (matches) {
          total++;
          if (activeSolvedSet.has(problem.id)) {
            solved++;
          }
        }
      });

      // Target total: minimum 1 so unseeded topics render as 0 / 1 (0%)
      const effectiveTotal = Math.max(total, 1);

      return {
        id: topicDef.id,
        name: topicDef.name,
        solved,
        total: effectiveTotal,
        icon: topicDef.icon,
        color: topicDef.color,
      };
    });
  }, [activeProblems, activeSolvedSet]);

  const overallSolvedCount = totalSolved !== undefined ? totalSolved : activeSolvedSet.size;
  const overallTotalCount = activeProblems.length;

  return (
    <div
      className={cn(
        'p-5 rounded-lg border border-white/[0.08] bg-surface space-y-4 shadow-elevation-1 text-left',
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <h4 className="text-base font-semibold font-sans text-white tracking-[-0.015em]">
            Topic-Wise Algorithmic Mastery
          </h4>
          <p className="text-xs text-text-muted mt-0.5">
            TakeUForward structured sheet progression and category coverage
          </p>
        </div>
        <span className="text-xs font-mono text-text-secondary bg-[#181C28] px-2.5 py-1 rounded border border-white/[0.08]">
          {overallSolvedCount} / {overallTotalCount} Solved Overall
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs font-mono text-text-muted">
          Loading topic mastery analytics...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
          {topicStats.map((topic) => {
            const percent = topic.total > 0 ? Math.round((topic.solved / topic.total) * 100) : 0;

            return (
              <div key={topic.id} className="space-y-1.5 group">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-text-primary">
                    <span className="text-text-muted group-hover:text-primary transition-colors">
                      {topic.icon}
                    </span>
                    <span className="font-medium text-[13px]">{topic.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary tabular-nums">
                      <strong className="text-text-primary">{topic.solved}</strong> / {topic.total}
                    </span>
                    <span
                      className="text-[11px] font-bold px-1.5 py-0.2 rounded"
                      style={{ color: topic.color, backgroundColor: `${topic.color}1A` }}
                    >
                      {percent}%
                    </span>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="w-full bg-[#1C212E] h-2 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: topic.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
