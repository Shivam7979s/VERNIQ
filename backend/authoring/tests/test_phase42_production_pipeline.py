"""
VERNIQ Phase 4.2 Production Content Authoring Pipeline Test Suite
==================================================================
Comprehensive automated verification of:
1. Controlled batch model & supported sizes (20, 50, 100, 250).
2. Deterministic selection engine & metadata preservation.
3. Batch lifecycle progression without automated publication.
4. Anti-duplication guards for active batches.
5. Canonical test suite quality gates (200/250/300 minimums & 8-category breakdown).
6. Multi-language starter template verification (Java, C++, Python, TypeScript, Go).
7. Granular failure & retry workflows.
8. Provenance & human approval publication gates.
9. Pilot compatibility (20 published problems unchanged).
10. Untouched remaining catalog integrity.
"""

from __future__ import annotations

import unittest
from backend.importer.importer import ProblemCatalogImporter
from backend.authoring.models import (
    AuthoringFailureStep,
    BatchItemStatus,
    BatchLifecycleStatus,
    BlockerStatus,
    COMPANY_METADATA_REQUIRES_MAPPING,
    ContentSnapshot,
    DEFAULT_BATCH_SIZE,
    JudgeReadinessStatus,
    MIN_CANONICAL_TESTS,
    ProblemWorkflowStatus,
    ProvenanceSourceType,
    ProvenanceVerificationStatus,
    SEMANTICS_UNCONFIRMED,
    SUPPORTED_BATCH_SIZES,
    TechnicalChecklist,
    TestCaseCategory,
)
from backend.authoring.validator import ProblemValidator
from backend.authoring.pipeline import ContentAuthoringPipeline
from backend.authoring.selection import ProblemSelectionEngine
from backend.authoring.batch_manager import AuthoringBatchManager
from backend.authoring.ai_provider import (
    MockDeterministicAuthoringProvider,
    get_ai_authoring_provider,
)


class TestPhase42ProductionPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.importer = ProblemCatalogImporter()
        cls.pipeline = ContentAuthoringPipeline(cls.importer)
        cls.selection_engine = ProblemSelectionEngine(cls.importer)
        cls.batch_mgr = AuthoringBatchManager(cls.pipeline, cls.selection_engine)
        cls.test_batch_id = None
        cls._cleanup_test_batches()

    @classmethod
    def tearDownClass(cls):
        cls._cleanup_test_batches()

    @classmethod
    def _cleanup_test_batches(cls):
        """Clean up any test batches created during test runs."""
        batches = cls.importer.run_query(
            "SELECT id FROM public.problem_authoring_batches WHERE batch_name LIKE 'TEST-BATCH-%';"
        )
        for b in batches:
            cls.importer.run_query(
                f"UPDATE public.problems SET current_batch_id = NULL WHERE current_batch_id = '{b['id']}';"
            )
            cls.importer.run_query(
                f"DELETE FROM public.problem_authoring_batches WHERE id = '{b['id']}';"
            )

    def test_01_supported_batch_sizes(self):
        """Verifies supported batch sizes: 20, 50, 100, 250, default 50."""
        self.assertEqual(SUPPORTED_BATCH_SIZES, [20, 50, 100, 250])
        self.assertEqual(DEFAULT_BATCH_SIZE, 50)

        # Invalid batch size > 250 should raise ValueError
        with self.assertRaises(ValueError):
            self.batch_mgr.create_batch(name="TEST-BATCH-OVERSIZED", target_count=500)

    def test_02_deterministic_problem_selection(self):
        """Verifies deterministic selection does not invent IDs, skips published, and preserves metadata flags."""
        candidates1 = self.selection_engine.select_candidates(
            domain="DSA",
            difficulty="medium",
            batch_size=20,
        )
        candidates2 = self.selection_engine.select_candidates(
            domain="DSA",
            difficulty="medium",
            batch_size=20,
        )

        self.assertEqual(len(candidates1), 20)
        self.assertEqual(len(candidates2), 20)

        # Strict determinism: same query must return identical IDs in identical order
        ids1 = [c["verniq_id"] for c in candidates1]
        ids2 = [c["verniq_id"] for c in candidates2]
        self.assertEqual(ids1, ids2)

        # None of the candidates should be published
        quoted_ids_sql = ", ".join(f"'{cid}'" for cid in ids1)
        pub_check = self.importer.run_query(
            f"SELECT count(*) as count FROM public.problems WHERE verniq_id IN ({quoted_ids_sql}) AND is_published = true;"
        )
        self.assertEqual(pub_check[0]["count"], 0)

        # Preserves safety flags
        for c in candidates1:
            meta = c.get("metadata") or {}
            self.assertEqual(meta.get("company_metadata_status"), COMPANY_METADATA_REQUIRES_MAPPING)
            self.assertEqual(meta.get("records_metadata_status"), SEMANTICS_UNCONFIRMED)

    def test_03_difficulty_distribution_selection(self):
        """Verifies balanced curriculum selection (e.g. 40% Easy, 40% Medium, 20% Hard for batch of 20)."""
        dist = {"easy": 0.4, "medium": 0.4, "hard": 0.2}
        candidates = self.selection_engine.select_candidates(
            domain="DSA",
            difficulty_distribution=dist,
            batch_size=20,
        )
        self.assertEqual(len(candidates), 20)
        diff_counts = {}
        for c in candidates:
            diff_counts[c["difficulty"]] = diff_counts.get(c["difficulty"], 0) + 1

        self.assertEqual(diff_counts.get("easy", 0), 8)
        self.assertEqual(diff_counts.get("medium", 0), 8)
        self.assertEqual(diff_counts.get("hard", 0), 4)

    def test_04_batch_creation_and_item_selection(self):
        """Verifies batch lifecycle starts at CREATED and progresses to SELECTED upon problem assignment."""
        batch = self.batch_mgr.create_batch(
            name="TEST-BATCH-PILOT-01",
            target_count=20,
            criteria={"domain": "DSA", "difficulty": "easy"},
        )
        self.assertIsNotNone(batch["id"])
        self.assertEqual(batch["batch_status"], BatchLifecycleStatus.CREATED.value)
        self.__class__.test_batch_id = batch["id"]

        # Populate batch
        sel_res = self.batch_mgr.select_problems_into_batch(
            batch_id=batch["id"],
            criteria={"domain": "DSA", "difficulty": "easy", "batch_size": 20},
        )
        self.assertEqual(sel_res["selected_count"], 20)

        # Verify batch status updated to SELECTED
        details = self.batch_mgr.get_batch_details(batch["id"])
        self.assertIsNotNone(details)
        self.assertEqual(details["batch_status"], BatchLifecycleStatus.SELECTED.value)
        self.assertEqual(len(details["items"]), 20)
        for item in details["items"]:
            self.assertEqual(item["item_status"], BatchItemStatus.SELECTED.value)

    def test_05_anti_duplication_guard(self):
        """Verifies that an active batch item cannot be duplicated into another active batch."""
        # Query a problem currently in our active test batch
        active_items = self.importer.run_query(
            f"SELECT problem_id FROM public.batch_problem_items WHERE batch_id = '{self.__class__.test_batch_id}' LIMIT 1;"
        )
        self.assertTrue(len(active_items) > 0)
        problem_id = active_items[0]["problem_id"]

        # Create a second test batch
        batch2 = self.batch_mgr.create_batch(name="TEST-BATCH-PILOT-02", target_count=20)

        # Attempt to insert the same problem_id directly into batch_problem_items: must violate unique constraint
        with self.assertRaises(Exception):
            self.importer.run_query(
                f"INSERT INTO public.batch_problem_items (batch_id, problem_id, item_status) VALUES ('{batch2['id']}', '{problem_id}', 'SELECTED');"
            )

    def test_06_canonical_test_suite_minimums_gate(self):
        """Verifies canonical test requirements: Easy >= 200, Medium >= 250, Hard >= 300."""
        # Easy problem with 199 tests: FAIL
        easy_under = [{"input": f"inp_{i}", "expected_output": f"out_{i}", "category": "hidden"} for i in range(199)]
        easy_under[0]["category"] = "sample"
        easy_under[0]["is_sample"] = True
        metrics_easy_under = ProblemValidator.validate_test_suite(easy_under, difficulty="easy")
        self.assertFalse(metrics_easy_under.meets_minimum)
        self.assertTrue(any("200+ required" in e for e in metrics_easy_under.errors))

        # Easy problem with 200 tests: PASS
        easy_valid = [{"input": f"inp_{i}", "expected_output": f"out_{i}", "category": "hidden"} for i in range(200)]
        easy_valid[0]["category"] = "sample"
        easy_valid[0]["is_sample"] = True
        metrics_easy_valid = ProblemValidator.validate_test_suite(easy_valid, difficulty="easy")
        self.assertTrue(metrics_easy_valid.meets_minimum)
        self.assertEqual(metrics_easy_valid.total, 200)
        self.assertEqual(metrics_easy_valid.sample, 1)

        # Medium requires 250
        metrics_med = ProblemValidator.validate_test_suite(easy_valid, difficulty="medium")
        self.assertFalse(metrics_med.meets_minimum)
        self.assertTrue(any("250+ required" in e for e in metrics_med.errors))

        # Hard requires 300
        metrics_hard = ProblemValidator.validate_test_suite(easy_valid, difficulty="hard")
        self.assertFalse(metrics_hard.meets_minimum)
        self.assertTrue(any("300+ required" in e for e in metrics_hard.errors))

    def test_07_test_suite_category_breakdown_and_uniqueness(self):
        """Verifies report of all 8 categories: total, sample, visible, hidden, edge, stress, adversarial, boundary."""
        tests = [
            {"input": "s1", "expected_output": "o1", "category": "sample", "is_sample": True},
            {"input": "v1", "expected_output": "o2", "category": "visible"},
            {"input": "e1", "expected_output": "o3", "category": "edge_case"},
            {"input": "st1", "expected_output": "o4", "category": "stress"},
            {"input": "adv1", "expected_output": "o5", "category": "adversarial"},
            {"input": "b1", "expected_output": "o6", "category": "boundary"},
            {"input": "h1", "expected_output": "o7", "category": "hidden"},
        ]
        metrics = ProblemValidator.validate_test_suite(tests, difficulty="easy")
        self.assertEqual(metrics.total, 7)
        self.assertEqual(metrics.sample, 1)
        self.assertEqual(metrics.visible, 1)
        self.assertEqual(metrics.edge, 1)
        self.assertEqual(metrics.stress, 1)
        self.assertEqual(metrics.adversarial, 1)
        self.assertEqual(metrics.boundary, 1)
        self.assertEqual(metrics.unique_inputs_count, 7)

    def test_08_multi_language_starter_templates(self):
        """Verifies starter templates for Java, C++, Python, TypeScript, and Go."""
        provider = MockDeterministicAuthoringProvider()
        draft = provider.generate_draft({
            "title": "Merge K Sorted Intervals",
            "domain_name": "DSA",
            "difficulty": "hard",
            "topics": ["Heap", "Sorting"],
        })

        for lang in ["cpp", "python", "java", "typescript", "go"]:
            self.assertIn(lang, draft.starter_templates)
            self.assertTrue(len(draft.starter_templates[lang].strip()) > 10)

    def test_09_failure_and_granular_retry_workflow(self):
        """Verifies retry of failed authoring steps without restarting the entire problem."""
        # Pick an item in our test batch
        items = self.importer.run_query(
            f"SELECT problem_id FROM public.batch_problem_items WHERE batch_id = '{self.__class__.test_batch_id}' LIMIT 1;"
        )
        prob_id = items[0]["problem_id"]

        # Mark item as failed at TEST_GENERATION_FAILED
        self.batch_mgr.update_problem_item_status(
            batch_id=self.__class__.test_batch_id,
            problem_id=prob_id,
            new_status=BatchItemStatus.TECHNICAL_REVIEW_BLOCKED,
            failure_step=AuthoringFailureStep.TEST_GENERATION_FAILED,
            failure_reason="Canonical test count (45) under required 200 minimum.",
        )

        item_row = self.importer.run_query(
            f"SELECT item_status, failure_step, retry_count FROM public.batch_problem_items WHERE batch_id = '{self.__class__.test_batch_id}' AND problem_id = '{prob_id}';"
        )[0]
        self.assertEqual(item_row["item_status"], BatchItemStatus.TECHNICAL_REVIEW_BLOCKED.value)
        self.assertEqual(item_row["failure_step"], AuthoringFailureStep.TEST_GENERATION_FAILED.value)

        # Trigger granular retry
        retry_res = self.batch_mgr.retry_failed_item(
            batch_id=self.__class__.test_batch_id,
            problem_id=prob_id,
            failure_step=AuthoringFailureStep.TEST_GENERATION_FAILED,
        )
        self.assertEqual(retry_res["item_status"], BatchItemStatus.TECHNICAL_REVIEW.value)
        self.assertIsNone(retry_res["failure_step"])
        self.assertEqual(retry_res["retry_count"], 1)

    def test_10_pilot_20_published_problems_intact(self):
        """Verifies the Phase 4.1 pilot problems remain 100% published, verified, and judge ready."""
        pilot_slugs = [
            "two-sum",
            "lru-cache",
            "merge-intervals",
            "valid-parentheses",
            "longest-substring-without-repeating-characters",
            "best-time-to-buy-and-sell-stock",
            "number-of-islands",
            "trapping-rain-water",
            "maximum-subarray",
            "container-with-most-water",
            "3sum",
            "search-in-rotated-sorted-array",
            "merge-k-sorted-lists",
            "sliding-window-maximum",
            "median-of-two-sorted-arrays",
            "course-schedule",
            "koko-eating-bananas",
            "move-zeroes",
            "valid-anagram",
            "word-ladder",
        ]
        for slug in pilot_slugs:
            p = self.pipeline.get_problem(slug)
            self.assertIsNotNone(p, f"Pilot problem {slug} missing!")
            self.assertTrue(p["is_published"], f"Pilot problem {slug} must remain published!")
            self.assertEqual(p["workflow_status"], "published")
            self.assertEqual(p["provenance_status"], "VERIFIED_VALID")
            self.assertEqual(p["judge_readiness_status"], "JUDGE_READY")

    def test_11_remaining_catalog_untouched(self):
        """Verifies that remaining catalog problems remain unpublished, unauthored, and in draft."""
        # Total catalog must be 3,392
        total_sql = "SELECT count(*) as total, count(*) FILTER (WHERE is_published) as published, count(*) FILTER (WHERE workflow_status = 'draft') as draft FROM public.problems;"
        res = self.importer.run_query(total_sql)[0]
        self.assertEqual(res["total"], 3392)
        self.assertEqual(res["published"], 26)  # Exactly 26 published
        self.assertEqual(res["draft"], 3366)    # Exactly 3,366 quarantined drafts


if __name__ == "__main__":
    unittest.main()
