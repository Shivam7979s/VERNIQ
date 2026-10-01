"""
VERNIQ Deterministic Roadmap Progress Engine
============================================
Mathematical, deterministic progress evaluation, state progression,
sequential prerequisite gating, and "Continue Learning" item determination.
"""

from __future__ import annotations
from typing import Dict, List, Optional, Tuple

from .models import (
    ContinueLearningTarget,
    LearningItemType,
    ProgressSummary,
    Roadmap,
    RoadmapDay,
    RoadmapItem,
    RoadmapItemStatus,
    RoadmapSprint,
    UserItemProgress,
)


class RoadmapProgressEngine:
    """Computes deterministic progress metrics and progression states."""

    @staticmethod
    def calculate_item_progress(
        items: List[RoadmapItem],
        user_progress_map: Dict[str, RoadmapItemStatus],
    ) -> ProgressSummary:
        """
        Calculates deterministic completion metrics for an item set.
        Denominator: All required items (fallback to all items if none explicitly required).
        """
        if not items:
            return ProgressSummary(
                completed_items=0,
                total_items=0,
                percentage=0,
                completed_days=0,
                total_days=0,
                status=RoadmapItemStatus.AVAILABLE,
            )

        required_items = [i for i in items if i.required]
        eval_items = required_items if required_items else items

        total = len(eval_items)
        completed = sum(
            1 for item in eval_items
            if user_progress_map.get(item.id) == RoadmapItemStatus.COMPLETED
        )

        pct = round((completed / total) * 100) if total > 0 else 0

        status = RoadmapItemStatus.COMPLETED if (completed == total and total > 0) else (
            RoadmapItemStatus.IN_PROGRESS if completed > 0 else RoadmapItemStatus.AVAILABLE
        )

        return ProgressSummary(
            completed_items=completed,
            total_items=total,
            percentage=pct,
            completed_days=0,
            total_days=0,
            status=status,
        )

    @staticmethod
    def apply_locking_and_states(
        roadmap: Roadmap,
        user_progress_map: Dict[str, RoadmapItemStatus],
        enforce_sequential: bool = True,
    ) -> Roadmap:
        """
        Applies sequential locking and completion states across the entire roadmap tree.
        Deterministic rules:
        1. Sprint 1 is unlocked. Sprint N unlocks when Sprint N-1 is COMPLETED.
        2. Day 1 of an unlocked sprint is unlocked. Day M unlocks when Day M-1 is COMPLETED.
        3. An item in an unlocked day is AVAILABLE if prior required items are COMPLETED or SKIPPED,
           otherwise LOCKED (unless enforce_sequential is False).
        """
        previous_sprint_completed = True

        for sprint in sorted(roadmap.sprints, key=lambda s: s.position):
            if not enforce_sequential:
                sprint_locked = False
            else:
                sprint_locked = not previous_sprint_completed

            previous_day_completed = True

            for day in sorted(sprint.days, key=lambda d: d.position):
                if sprint_locked:
                    day_locked = True
                elif not enforce_sequential:
                    day_locked = False
                else:
                    day_locked = not previous_day_completed

                previous_item_satisfied = True

                for item in sorted(day.items, key=lambda i: i.position):
                    current_status = user_progress_map.get(item.id)

                    if current_status == RoadmapItemStatus.COMPLETED:
                        item.status = RoadmapItemStatus.COMPLETED
                    elif current_status == RoadmapItemStatus.SKIPPED:
                        item.status = RoadmapItemStatus.SKIPPED
                    elif current_status == RoadmapItemStatus.IN_PROGRESS:
                        item.status = RoadmapItemStatus.IN_PROGRESS
                    elif day_locked:
                        item.status = RoadmapItemStatus.LOCKED
                    elif enforce_sequential and not previous_item_satisfied:
                        item.status = RoadmapItemStatus.LOCKED
                    else:
                        item.status = RoadmapItemStatus.AVAILABLE

                    # Track completion of required items
                    if item.required:
                        if item.status not in (RoadmapItemStatus.COMPLETED, RoadmapItemStatus.SKIPPED):
                            previous_item_satisfied = False

                # Evaluate day completion
                req_items = [i for i in day.items if i.required]
                eval_items = req_items if req_items else day.items
                day_completed = (
                    len(eval_items) > 0
                    and all(i.status in (RoadmapItemStatus.COMPLETED, RoadmapItemStatus.SKIPPED) for i in eval_items)
                )

                if day_locked:
                    day.status = RoadmapItemStatus.LOCKED
                elif day_completed:
                    day.status = RoadmapItemStatus.COMPLETED
                elif any(i.status == RoadmapItemStatus.IN_PROGRESS or i.status == RoadmapItemStatus.COMPLETED for i in day.items):
                    day.status = RoadmapItemStatus.IN_PROGRESS
                else:
                    day.status = RoadmapItemStatus.AVAILABLE

                previous_day_completed = day_completed

            # Evaluate sprint completion
            sprint_completed = (
                len(sprint.days) > 0
                and all(d.status == RoadmapItemStatus.COMPLETED for d in sprint.days)
            )

            if sprint_locked:
                sprint.status = RoadmapItemStatus.LOCKED
            elif sprint_completed:
                sprint.status = RoadmapItemStatus.COMPLETED
            elif any(d.status in (RoadmapItemStatus.IN_PROGRESS, RoadmapItemStatus.COMPLETED) for d in sprint.days):
                sprint.status = RoadmapItemStatus.IN_PROGRESS
            else:
                sprint.status = RoadmapItemStatus.AVAILABLE

            previous_sprint_completed = sprint_completed

        return roadmap

    @classmethod
    def resolve_continue_learning(
        cls,
        roadmap: Roadmap,
        user_progress_map: Dict[str, RoadmapItemStatus],
    ) -> Optional[ContinueLearningTarget]:
        """
        Determines the exact next incomplete, accessible learning item according to strict rules:
        1. Sprints ordered by position ascending.
        2. Days ordered by position ascending.
        3. Items ordered by position ascending.
        4. Skip items that are COMPLETED or SKIPPED.
        5. Skip items that are LOCKED.
        6. Return the first AVAILABLE or IN_PROGRESS item.
        """
        # Ensure locking states are up-to-date
        evaluated_roadmap = cls.apply_locking_and_states(roadmap, user_progress_map)

        for sprint in sorted(evaluated_roadmap.sprints, key=lambda s: s.position):
            if sprint.status == RoadmapItemStatus.LOCKED:
                continue

            for day in sorted(sprint.days, key=lambda d: d.position):
                if day.status == RoadmapItemStatus.LOCKED:
                    continue

                for item in sorted(day.items, key=lambda i: i.position):
                    if item.status in (RoadmapItemStatus.COMPLETED, RoadmapItemStatus.SKIPPED, RoadmapItemStatus.LOCKED):
                        continue

                    # Found the target item
                    prob_ref = item.problem_reference
                    verniq_id = prob_ref.verniq_problem_id if prob_ref else None
                    prob_slug = prob_ref.problem_summary.slug if (prob_ref and prob_ref.problem_summary) else None
                    prob_title = prob_ref.problem_summary.title if (prob_ref and prob_ref.problem_summary) else None
                    prob_diff = prob_ref.problem_summary.difficulty if (prob_ref and prob_ref.problem_summary) else None

                    return ContinueLearningTarget(
                        roadmap_id=evaluated_roadmap.id,
                        sprint_id=sprint.id,
                        sprint_title=sprint.title,
                        day_id=day.id,
                        day_number=day.day_number,
                        day_title=day.title,
                        item_id=item.id,
                        item_title=item.title,
                        item_type=item.item_type,
                        verniq_problem_id=verniq_id,
                        problem_slug=prob_slug,
                        problem_title=prob_title,
                        problem_difficulty=prob_diff,
                        estimated_minutes=item.estimated_minutes,
                    )

        return None
