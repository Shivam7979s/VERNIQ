"""
VERNIQ Roadmap Subsystem Test Suite
===================================
Automated verification of Roadmap domain architecture, hierarchy,
ordering invariants, problem catalog references, deterministic progress,
sequential locking rules, and "Continue Learning" resolution.
"""

from __future__ import annotations
import unittest
from backend.importer.importer import ProblemCatalogImporter
from backend.roadmap.models import (
    ContinueLearningTarget,
    LearningItemType,
    ProgressSummary,
    Roadmap,
    RoadmapDay,
    RoadmapItem,
    RoadmapItemStatus,
    RoadmapSprint,
)
from backend.roadmap.progress_engine import RoadmapProgressEngine
from backend.roadmap.service import RoadmapService


class TestRoadmapSubsystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.importer = ProblemCatalogImporter()
        cls.service = RoadmapService(cls.importer)

    def test_01_roadmap_hierarchy_and_retrieval(self):
        """Verifies roadmap -> sprint -> day -> item hierarchy loads cleanly from database."""
        roadmap = self.service.get_roadmap_by_slug("dsa-mastery")
        self.assertIsNotNone(roadmap, "Roadmap 'dsa-mastery' not found in database!")
        self.assertEqual(roadmap.slug, "dsa-mastery")
        self.assertEqual(roadmap.title, "DSA Interview Mastery")
        self.assertGreaterEqual(len(roadmap.sprints), 3)

        # Check first sprint
        sprint1 = roadmap.sprints[0]
        self.assertEqual(sprint1.position, 1)
        self.assertIn("Sprint 1", sprint1.title)
        self.assertGreaterEqual(len(sprint1.days), 2)

        # Check first day
        day1 = sprint1.days[0]
        self.assertEqual(day1.position, 1)
        self.assertEqual(day1.day_number, 1)
        self.assertGreaterEqual(len(day1.items), 3)

    def test_02_strict_ordering_invariants(self):
        """Verifies sprints, days, and items adhere to strictly ascending position sequences."""
        roadmap = self.service.get_roadmap_by_slug("dsa-mastery")
        self.assertIsNotNone(roadmap)

        # Sprints ordered
        sprint_positions = [s.position for s in roadmap.sprints]
        self.assertEqual(sprint_positions, sorted(sprint_positions))

        for sprint in roadmap.sprints:
            day_positions = [d.position for d in sprint.days]
            self.assertEqual(day_positions, sorted(day_positions), f"Days in sprint {sprint.title} out of order")

            for day in sprint.days:
                item_positions = [i.position for i in day.items]
                self.assertEqual(item_positions, sorted(item_positions), f"Items in day {day.title} out of order")

    def test_03_problem_catalog_reference_boundary(self):
        """
        Verifies roadmap items reference permanent Verniq IDs and dynamically join
        with the Problem Catalog WITHOUT duplicating canonical problem records.
        """
        roadmap = self.service.get_roadmap_by_slug("dsa-mastery")
        self.assertIsNotNone(roadmap)

        all_items = [item for s in roadmap.sprints for d in s.days for item in d.items]
        problem_items = [i for i in all_items if i.item_type == LearningItemType.PROBLEM]

        self.assertGreater(len(problem_items), 0, "No problem items found in roadmap!")

        for p_item in problem_items:
            self.assertIsNotNone(p_item.problem_reference, f"Item {p_item.title} missing problem reference!")
            verniq_id = p_item.problem_reference.verniq_problem_id
            self.assertTrue(verniq_id.startswith("VRQ-"), f"Invalid Verniq ID format: {verniq_id}")

            # Verify problem summary resolved from catalog
            summary = p_item.problem_reference.problem_summary
            self.assertIsNotNone(summary, f"Problem Catalog join failed for {verniq_id}")
            self.assertEqual(summary.verniq_id, verniq_id)
            self.assertTrue(len(summary.title) > 0)
            self.assertIn(summary.difficulty, ("easy", "medium", "hard"))
            self.assertTrue(len(summary.slug) > 0)

    def test_04_deterministic_progress_calculation(self):
        """Verifies deterministic math: completed items / total applicable items."""
        mock_items = [
            RoadmapItem(id="item-1", day_id="d1", topic_id=None, title="Item 1", description=None,
                        item_type=LearningItemType.CONCEPT, position=1, required=True),
            RoadmapItem(id="item-2", day_id="d1", topic_id=None, title="Item 2", description=None,
                        item_type=LearningItemType.PROBLEM, position=2, required=True),
            RoadmapItem(id="item-3", day_id="d1", topic_id=None, title="Item 3", description=None,
                        item_type=LearningItemType.REVISION, position=3, required=False), # Optional!
        ]

        # 0 of 2 required completed
        p0 = RoadmapProgressEngine.calculate_item_progress(mock_items, {})
        self.assertEqual(p0.completed_items, 0)
        self.assertEqual(p0.total_items, 2)  # Optional item not in denominator
        self.assertEqual(p0.percentage, 0)
        self.assertEqual(p0.status, RoadmapItemStatus.AVAILABLE)

        # 1 of 2 required completed
        p1 = RoadmapProgressEngine.calculate_item_progress(
            mock_items,
            {"item-1": RoadmapItemStatus.COMPLETED}
        )
        self.assertEqual(p1.completed_items, 1)
        self.assertEqual(p1.total_items, 2)
        self.assertEqual(p1.percentage, 50)
        self.assertEqual(p1.status, RoadmapItemStatus.IN_PROGRESS)

        # 2 of 2 required completed
        p2 = RoadmapProgressEngine.calculate_item_progress(
            mock_items,
            {"item-1": RoadmapItemStatus.COMPLETED, "item-2": RoadmapItemStatus.COMPLETED}
        )
        self.assertEqual(p2.completed_items, 2)
        self.assertEqual(p2.total_items, 2)
        self.assertEqual(p2.percentage, 100)
        self.assertEqual(p2.status, RoadmapItemStatus.COMPLETED)

    def test_05_sequential_locking_and_prerequisites(self):
        """
        Verifies sequential prerequisite rules:
        - Sprint 1 Day 1 Item 1 is AVAILABLE.
        - Item 2 is LOCKED until Item 1 completes.
        - Day 2 is LOCKED until Day 1 completes.
        - Sprint 2 is LOCKED until Sprint 1 completes.
        """
        roadmap = self.service.get_roadmap_by_slug("dsa-mastery")
        self.assertIsNotNone(roadmap)

        # State 1: Fresh user with zero completions
        evaluated_fresh = RoadmapProgressEngine.apply_locking_and_states(roadmap, {})
        sprint1 = evaluated_fresh.sprints[0]
        sprint2 = evaluated_fresh.sprints[1]
        self.assertEqual(sprint1.status, RoadmapItemStatus.AVAILABLE)
        self.assertEqual(sprint2.status, RoadmapItemStatus.LOCKED)

        day1 = sprint1.days[0]
        day2 = sprint1.days[1]
        self.assertEqual(day1.status, RoadmapItemStatus.AVAILABLE)
        self.assertEqual(day2.status, RoadmapItemStatus.LOCKED)

        item1 = day1.items[0]
        item2 = day1.items[1]
        self.assertEqual(item1.status, RoadmapItemStatus.AVAILABLE)
        # item 2 requires item 1
        self.assertEqual(item2.status, RoadmapItemStatus.LOCKED)

        # State 2: User completes item 1 in Day 1
        progress_map = {item1.id: RoadmapItemStatus.COMPLETED}
        evaluated_p1 = RoadmapProgressEngine.apply_locking_and_states(roadmap, progress_map)
        item1_eval = evaluated_p1.sprints[0].days[0].items[0]
        item2_eval = evaluated_p1.sprints[0].days[0].items[1]
        self.assertEqual(item1_eval.status, RoadmapItemStatus.COMPLETED)
        self.assertEqual(item2_eval.status, RoadmapItemStatus.AVAILABLE)

    def test_06_deterministic_continue_learning_resolution(self):
        """Verifies Continue Learning deterministically identifies the exact next actionable item."""
        roadmap = self.service.get_roadmap_by_slug("dsa-mastery")
        self.assertIsNotNone(roadmap)

        # Fresh user -> target should be Day 1 Item 1
        target_fresh = RoadmapProgressEngine.resolve_continue_learning(roadmap, {})
        self.assertIsNotNone(target_fresh)
        self.assertEqual(target_fresh.day_number, 1)
        self.assertEqual(target_fresh.item_title, roadmap.sprints[0].days[0].items[0].title)

        # Complete Item 1 -> target advances to Item 2
        first_item_id = roadmap.sprints[0].days[0].items[0].id
        second_item_id = roadmap.sprints[0].days[0].items[1].id
        target_step2 = RoadmapProgressEngine.resolve_continue_learning(
            roadmap,
            {first_item_id: RoadmapItemStatus.COMPLETED}
        )
        self.assertIsNotNone(target_step2)
        self.assertEqual(target_step2.item_id, second_item_id)

    def test_07_content_type_extensibility(self):
        """Verifies diverse item types are supported (CONCEPT, LECTURE, PROBLEM, REVISION, etc.)."""
        roadmap = self.service.get_roadmap_by_slug("dsa-mastery")
        self.assertIsNotNone(roadmap)

        all_types = {item.item_type for s in roadmap.sprints for d in s.days for item in d.items}
        self.assertIn(LearningItemType.CONCEPT, all_types)
        self.assertIn(LearningItemType.PROBLEM, all_types)
        self.assertIn(LearningItemType.LECTURE, all_types)
        self.assertIn(LearningItemType.REVISION, all_types)


if __name__ == "__main__":
    unittest.main()
