/**
 * VERNIQ useRoadmap Hook
 * =======================
 * Manages roadmap tree fetching, user progress synchronization,
 * sequential locking evaluation, and status mutations.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { roadmapService } from '../services/roadmapService';
import { applyLockingAndStates, calculateItemProgress } from '../utils/progressEngine';
import type { Roadmap, RoadmapItemStatus, ProgressSummary } from '../types';

export const useRoadmap = (slug: string = 'dsa-mastery') => {
  const { user } = useAuth();
  const [rawRoadmap, setRawRoadmap] = useState<Roadmap | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, RoadmapItemStatus>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedRoadmap, fetchedProgress] = await Promise.all([
        roadmapService.getRoadmapBySlug(slug),
        roadmapService.getUserProgress(user?.id),
      ]);
      setRawRoadmap(fetchedRoadmap);
      setProgressMap(fetchedProgress);
    } catch (err: any) {
      console.error('Error fetching roadmap:', err);
      setError(err?.message || 'Failed to load roadmap.');
    } finally {
      setLoading(false);
    }
  }, [slug, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Evaluated roadmap with prerequisite states and locking
  const evaluatedRoadmap = useMemo(() => {
    if (!rawRoadmap) return null;
    return applyLockingAndStates(rawRoadmap, progressMap, true);
  }, [rawRoadmap, progressMap]);

  // Overall roadmap progress summary
  const progressSummary: ProgressSummary = useMemo(() => {
    if (!rawRoadmap) {
      return {
        completedItems: 0,
        totalItems: 0,
        percentage: 0,
        completedDays: 0,
        totalDays: 0,
        status: 'AVAILABLE',
      };
    }
    const allItems = rawRoadmap.sprints.flatMap((s) => s.days.flatMap((d) => d.items));
    return calculateItemProgress(allItems, progressMap);
  }, [rawRoadmap, progressMap]);

  // Toggle item completion
  const toggleItemCompleted = useCallback(
    async (itemId: string) => {
      const current = progressMap[itemId];
      const nextStatus: RoadmapItemStatus = current === 'COMPLETED' ? 'AVAILABLE' : 'COMPLETED';

      // Optimistic update
      setProgressMap((prev) => ({
        ...prev,
        [itemId]: nextStatus,
      }));

      await roadmapService.setItemStatus(itemId, nextStatus, user?.id);
    },
    [progressMap, user?.id]
  );

  // Set specific item status
  const setItemStatus = useCallback(
    async (itemId: string, status: RoadmapItemStatus) => {
      setProgressMap((prev) => ({
        ...prev,
        [itemId]: status,
      }));
      await roadmapService.setItemStatus(itemId, status, user?.id);
    },
    [user?.id]
  );

  return {
    roadmap: evaluatedRoadmap,
    rawRoadmap,
    progressMap,
    progressSummary,
    loading,
    error,
    refetch: fetchData,
    toggleItemCompleted,
    setItemStatus,
  };
};
