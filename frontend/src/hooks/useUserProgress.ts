import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import type { ProblemStatus } from '@/types';

const LOCAL_STORAGE_PROGRESS_KEY = 'verniq_user_progress_cache';
const LOCAL_STORAGE_REVISION_KEY = 'verniq_user_revision_cache';

export const useUserProgress = () => {
  const { user } = useAuth();

  // Progress cache: problemId -> status ('todo' | 'attempted' | 'solved')
  const [progressMap, setProgressMap] = useState<Record<string, ProblemStatus>>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return {
      'prob-00000001-0000-0000-0000-000000000001': 'solved',
      'prob-00000002-0000-0000-0000-000000000002': 'solved',
      'prob-00000003-0000-0000-0000-000000000003': 'attempted',
    };
  });

  // Revision queue cache: problemId -> boolean
  const [revisionMap, setRevisionMap] = useState<Record<string, boolean>>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_REVISION_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return {
      'prob-00000001-0000-0000-0000-000000000001': true,
      'prob-00000006-0000-0000-0000-000000000006': true,
    };
  });

  const [loading, setLoading] = useState<boolean>(false);

  // Sync with Supabase on mount or when user changes
  useEffect(() => {
    const fetchRemoteProgress = async () => {
      if (!isSupabaseConfigured() || !user) return;
      try {
        setLoading(true);
        // Fetch progress
        const { data: progData, error: progError } = await supabase
          .from('user_problem_progress')
          .select('problem_id, status')
          .eq('user_id', user.id);

        if (!progError && progData) {
          const map: Record<string, ProblemStatus> = {};
          progData.forEach((row: { problem_id: string; status: ProblemStatus }) => {
            map[row.problem_id] = row.status;
          });
          setProgressMap((prev) => {
            const merged = { ...prev, ...map };
            localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(merged));
            return merged;
          });
        }

        // Fetch revision queue
        const { data: revData, error: revError } = await supabase
          .from('user_revision_queue')
          .select('problem_id, is_reviewed')
          .eq('user_id', user.id)
          .eq('is_reviewed', false);

        if (!revError && revData) {
          const rMap: Record<string, boolean> = {};
          revData.forEach((row: { problem_id: string }) => {
            rMap[row.problem_id] = true;
          });
          setRevisionMap((prev) => {
            const merged = { ...prev, ...rMap };
            localStorage.setItem(LOCAL_STORAGE_REVISION_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.warn('Failed to load remote progress, using local cache:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRemoteProgress();
  }, [user]);

  // Mutation: Update problem progress
  const updateProgress = useCallback(
    async (problemId: string, status: ProblemStatus, notes?: string) => {
      // 1. Optimistic Local State Update
      setProgressMap((prev) => {
        const next = { ...prev, [problemId]: status };
        localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(next));
        return next;
      });

      // 2. Remote Supabase Update if session active
      if (isSupabaseConfigured() && user) {
        try {
          await supabase.from('user_problem_progress').upsert({
            user_id: user.id,
            problem_id: problemId,
            status,
            solved_at: status === 'solved' ? new Date().toISOString() : null,
            notes: notes || null,
          });
        } catch (err) {
          console.error('Error syncing progress to Supabase:', err);
        }
      }
    },
    [user]
  );

  // Mutation: Toggle Revision Queue
  const toggleRevision = useCallback(
    async (problemId: string) => {
      const current = Boolean(revisionMap[problemId]);
      const nextVal = !current;

      // 1. Optimistic update
      setRevisionMap((prev) => {
        const next = { ...prev, [problemId]: nextVal };
        localStorage.setItem(LOCAL_STORAGE_REVISION_KEY, JSON.stringify(next));
        return next;
      });

      // 2. Remote Supabase Update
      if (isSupabaseConfigured() && user) {
        try {
          if (nextVal) {
            await supabase.from('user_revision_queue').upsert({
              user_id: user.id,
              problem_id: problemId,
              interval_days: 1,
              next_review_at: new Date(Date.now() + 86400000).toISOString(),
              is_reviewed: false,
            });
          } else {
            await supabase
              .from('user_revision_queue')
              .delete()
              .eq('user_id', user.id)
              .eq('problem_id', problemId);
          }
        } catch (err) {
          console.error('Error updating revision queue in Supabase:', err);
        }
      }
    },
    [revisionMap, user]
  );

  return {
    progressMap,
    revisionMap,
    updateProgress,
    toggleRevision,
    loading,
  };
};
