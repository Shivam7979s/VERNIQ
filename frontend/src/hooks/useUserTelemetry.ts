import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import type { Submission } from '@/types';

export interface UserTelemetryData {
  totalSubmissions: number;
  activeDays: number;
  maxStreak: number;
  currentStreak: number;
  activityMap: Record<string, number>;
  recentSubmissions: Submission[];
  solvedCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useUserTelemetry = (): UserTelemetryData => {
  const { user } = useAuth();
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [activeDays, setActiveDays] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTelemetry = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setTotalSubmissions(0);
      setActiveDays(0);
      setMaxStreak(0);
      setCurrentStreak(0);
      setActivityMap({});
      setRecentSubmissions([]);
      setSolvedCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Query all submissions by user
      const { data: subsData, error: subsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (subsError) {
        console.warn('[Telemetry] Submissions query:', subsError.message);
      }

      const subs: Submission[] = (subsData as Submission[]) || [];
      setTotalSubmissions(subs.length);
      setRecentSubmissions(subs.slice(0, 10));

      // 2. Build activity map (YYYY-MM-DD -> count)
      const map: Record<string, number> = {};
      subs.forEach((s) => {
        if (s.created_at) {
          const dateStr = s.created_at.split('T')[0];
          map[dateStr] = (map[dateStr] || 0) + 1;
        }
      });
      setActivityMap(map);

      const uniqueDays = Object.keys(map).sort();
      setActiveDays(uniqueDays.length);

      // 3. Compute streaks from sorted unique days
      if (uniqueDays.length === 0) {
        setMaxStreak(0);
        setCurrentStreak(0);
      } else {
        let maxS = 1;
        let curS = 1;

        for (let i = 1; i < uniqueDays.length; i++) {
          const prev = new Date(uniqueDays[i - 1]).getTime();
          const curr = new Date(uniqueDays[i]).getTime();
          const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            curS += 1;
            if (curS > maxS) maxS = curS;
          } else if (diffDays > 1) {
            curS = 1;
          }
        }

        // Check if last active day is today or yesterday for current active streak
        const todayStr = new Date().toISOString().split('T')[0];
        const lastDay = uniqueDays[uniqueDays.length - 1];
        const lastTime = new Date(lastDay).getTime();
        const todayTime = new Date(todayStr).getTime();
        const diffToday = Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24));

        const activeCurrentStreak = diffToday <= 1 ? curS : 0;

        setMaxStreak(maxS);
        setCurrentStreak(activeCurrentStreak);
      }

      // 4. Query problems solved count from public.user_problem_progress
      try {
        const { count, error: progError } = await supabase
          .from('user_problem_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'solved');

        if (!progError && count !== null) {
          setSolvedCount(count);
        }
      } catch {
        // Fallback
      }
    } catch (err) {
      console.error('[Telemetry] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  return {
    totalSubmissions,
    activeDays,
    maxStreak,
    currentStreak,
    activityMap,
    recentSubmissions,
    solvedCount,
    loading,
    refresh: fetchTelemetry,
  };
};
