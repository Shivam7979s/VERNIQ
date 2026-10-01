/**
 * VERNIQ Deterministic Client-Side Progress Engine
 * =================================================
 * Mathematical calculation of completion percentages, sequential prerequisite locking,
 * and deterministic Continue Learning target evaluation.
 */

import type {
  Roadmap,
  RoadmapSprint,
  RoadmapDay,
  RoadmapItem,
  RoadmapItemStatus,
  ProgressSummary,
  ContinueLearningTarget,
} from '../types';

export const calculateItemProgress = (
  items: RoadmapItem[],
  progressMap: Record<string, RoadmapItemStatus>
): ProgressSummary => {
  if (!items || items.length === 0) {
    return {
      completedItems: 0,
      totalItems: 0,
      percentage: 0,
      completedDays: 0,
      totalDays: 0,
      status: 'AVAILABLE',
    };
  }

  const requiredItems = items.filter((i) => i.required);
  const evalItems = requiredItems.length > 0 ? requiredItems : items;

  const total = evalItems.length;
  const completed = evalItems.filter((i) => progressMap[i.id] === 'COMPLETED').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const status: RoadmapItemStatus =
    completed === total && total > 0
      ? 'COMPLETED'
      : completed > 0
      ? 'IN_PROGRESS'
      : 'AVAILABLE';

  return {
    completedItems: completed,
    totalItems: total,
    percentage,
    completedDays: 0,
    totalDays: 0,
    status,
  };
};

export const applyLockingAndStates = (
  roadmap: Roadmap,
  progressMap: Record<string, RoadmapItemStatus>,
  enforceSequential: boolean = true
): Roadmap => {
  let previousSprintCompleted = true;

  const sortedSprints = [...roadmap.sprints].sort((a, b) => a.position - b.position);

  const sprints: RoadmapSprint[] = sortedSprints.map((sprint) => {
    const sprintLocked = enforceSequential ? !previousSprintCompleted : false;
    let previousDayCompleted = true;

    const sortedDays = [...sprint.days].sort((a, b) => a.position - b.position);

    const days: RoadmapDay[] = sortedDays.map((day) => {
      const dayLocked = sprintLocked || (enforceSequential ? !previousDayCompleted : false);
      let previousItemSatisfied = true;

      const sortedItems = [...day.items].sort((a, b) => a.position - b.position);

      const items: RoadmapItem[] = sortedItems.map((item) => {
        const currentStatus = progressMap[item.id];
        let itemStatus: RoadmapItemStatus = 'AVAILABLE';

        if (currentStatus === 'COMPLETED') {
          itemStatus = 'COMPLETED';
        } else if (currentStatus === 'SKIPPED') {
          itemStatus = 'SKIPPED';
        } else if (currentStatus === 'IN_PROGRESS') {
          itemStatus = 'IN_PROGRESS';
        } else if (dayLocked) {
          itemStatus = 'LOCKED';
        } else if (enforceSequential && !previousItemSatisfied) {
          itemStatus = 'LOCKED';
        } else {
          itemStatus = 'AVAILABLE';
        }

        if (item.required && itemStatus !== 'COMPLETED' && itemStatus !== 'SKIPPED') {
          previousItemSatisfied = false;
        }

        return {
          ...item,
          status: itemStatus,
        };
      });

      const reqItems = items.filter((i) => i.required);
      const evalItems = reqItems.length > 0 ? reqItems : items;
      const dayCompleted =
        evalItems.length > 0 &&
        evalItems.every((i) => i.status === 'COMPLETED' || i.status === 'SKIPPED');

      let dayStatus: RoadmapItemStatus = 'AVAILABLE';
      if (dayLocked) {
        dayStatus = 'LOCKED';
      } else if (dayCompleted) {
        dayStatus = 'COMPLETED';
      } else if (items.some((i) => i.status === 'IN_PROGRESS' || i.status === 'COMPLETED')) {
        dayStatus = 'IN_PROGRESS';
      }

      previousDayCompleted = dayCompleted;

      return {
        ...day,
        items,
        status: dayStatus,
      };
    });

    const sprintCompleted =
      days.length > 0 && days.every((d) => d.status === 'COMPLETED');

    let sprintStatus: RoadmapItemStatus = 'AVAILABLE';
    if (sprintLocked) {
      sprintStatus = 'LOCKED';
    } else if (sprintCompleted) {
      sprintStatus = 'COMPLETED';
    } else if (days.some((d) => d.status === 'IN_PROGRESS' || d.status === 'COMPLETED')) {
      sprintStatus = 'IN_PROGRESS';
    }

    previousSprintCompleted = sprintCompleted;

    return {
      ...sprint,
      days,
      status: sprintStatus,
    };
  });

  return {
    ...roadmap,
    sprints,
  };
};

export const resolveContinueLearning = (
  roadmap: Roadmap,
  progressMap: Record<string, RoadmapItemStatus>
): ContinueLearningTarget | null => {
  const evaluated = applyLockingAndStates(roadmap, progressMap, true);

  for (const sprint of evaluated.sprints) {
    if (sprint.status === 'LOCKED') continue;

    for (const day of sprint.days) {
      if (day.status === 'LOCKED') continue;

      for (const item of day.items) {
        if (item.status === 'COMPLETED' || item.status === 'SKIPPED' || item.status === 'LOCKED') {
          continue;
        }

        const probRef = item.problemReference;
        return {
          roadmapId: evaluated.id,
          sprintId: sprint.id,
          sprintTitle: sprint.title,
          dayId: day.id,
          dayNumber: day.dayNumber,
          dayTitle: day.title,
          itemId: item.id,
          itemTitle: item.title,
          itemType: item.itemType,
          verniqProblemId: probRef?.verniqProblemId ?? null,
          problemSlug: probRef?.problemSummary?.slug ?? null,
          problemTitle: probRef?.problemSummary?.title ?? null,
          problemDifficulty: probRef?.problemSummary?.difficulty ?? null,
          estimatedMinutes: item.estimatedMinutes,
        };
      }
    }
  }

  return null;
};
