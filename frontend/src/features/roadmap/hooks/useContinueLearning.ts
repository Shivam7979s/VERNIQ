/**
 * VERNIQ useContinueLearning Hook
 * ================================
 * Deterministically resolves the next actionable incomplete learning item.
 */

import { useMemo } from 'react';
import { resolveContinueLearning } from '../utils/progressEngine';
import type { Roadmap, RoadmapItemStatus, ContinueLearningTarget } from '../types';

export const useContinueLearning = (
  roadmap: Roadmap | null,
  progressMap: Record<string, RoadmapItemStatus>
): ContinueLearningTarget | null => {
  return useMemo(() => {
    if (!roadmap) return null;
    return resolveContinueLearning(roadmap, progressMap);
  }, [roadmap, progressMap]);
};
