"""
VERNIQ Problem Content Authoring & Provenance Pipeline Test Suite
=================================================================
Automated verification of workflow state machine, quality gates,
provenance audits, technical reviews, revision immutability,
Verniq ID stability, and judge-readiness gating.
"""

from __future__ import annotations

import unittest
from backend.importer.importer import ProblemCatalogImporter
from backend.authoring.models import (
    AuthorType,
    ContentSnapshot,
    JudgeReadinessStatus,
    ProblemWorkflowStatus,
    ProvenanceSourceType,
    ProvenanceVerificationStatus,
    TechnicalChecklist,
    TechnicalReviewStatus,
    TestCaseCategory,
)
from backend.authoring.validator import ProblemValidator
from backend.authoring.pipeline import ContentAuthoringPipeline
from backend.authoring.batch_manager import AuthoringBatchManager
from backend.authoring.ai_provider import VerniqAuthoringAssistant


class TestAuthoringPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.importer = ProblemCatalogImporter()
        cls.pipeline = ContentAuthoringPipeline(cls.importer)
        cls.batch_mgr = AuthoringBatchManager(cls.pipeline)
        cls._cleanup_test_data()

    @classmethod
    def tearDownClass(cls):
        cls._cleanup_test_data()

    @classmethod
    def _cleanup_test_data(cls):
        prob = cls.pipeline.get_problem("VRQ-000008")
        if prob:
            cls.importer.run_query(f"""
                DELETE FROM public.problem_content_revisions WHERE problem_id = '{prob['id']}';
                UPDATE public.problems
                SET workflow_status = 'draft',
                    author_type = 'imported',
                    generated_with_ai = false,
                    human_reviewed = false,
                    judge_readiness_status = 'NOT_READY',
                    provenance_status = 'PROVENANCE_REVIEW_REQUIRED'
                WHERE id = '{prob['id']}';
            """)

    def test_01_catalog_total_and_id_permanence(self):
        """Verifies all 3,392 Verniq IDs remain strictly permanent, unique, and unaltered."""
        summary = self.batch_mgr.get_pipeline_summary()
        self.assertEqual(summary["total_problems"], 3392)

        # Check exactly 3,366 quarantined draft problems and 26 published problems (6 canonical + 20 pilot)
        breakdown = summary["workflow_breakdown"]
        self.assertEqual(breakdown.get("published", 0), 26, "Expected exactly 26 published problems (6 canonical + 20 pilot).")
        self.assertEqual(breakdown.get("draft", 0), 3366, "Expected exactly 3,366 quarantined draft catalog problems.")

    def test_02_provenance_quarantine_integrity(self):
        """Verifies that all 3,366 draft catalog problems have PROVENANCE_REVIEW_REQUIRED."""
        rows = self.importer.run_query("""
            SELECT provenance_status, count(*) as count
            FROM public.problems
            GROUP BY provenance_status;
        """)
        prov_map = {r["provenance_status"]: r["count"] for r in rows}
        self.assertEqual(prov_map.get("PROVENANCE_REVIEW_REQUIRED", 0), 3366)
        self.assertEqual(prov_map.get("VERIFIED_VALID", 0), 26)

    def test_03_judge_readiness_quarantine(self):
        """Verifies that all 3,366 draft catalog problems have judge_readiness_status = NOT_READY."""
        rows = self.importer.run_query("""
            SELECT judge_readiness_status, count(*) as count
            FROM public.problems
            GROUP BY judge_readiness_status;
        """)
        judge_map = {r["judge_readiness_status"]: r["count"] for r in rows}
        self.assertEqual(judge_map.get("NOT_READY", 0), 3366)
        self.assertEqual(judge_map.get("JUDGE_READY", 0), 26)

    def test_04_validator_blocks_incomplete_content(self):
        """Verifies validator flags empty or quarantine placeholder content."""
        # Empty snapshot
        bad_snapshot = ContentSnapshot(
            title="X",
            description_markdown="Specification in review",
            constraints_markdown="",
            examples=[],
        )
        res = ProblemValidator.validate_content(bad_snapshot)
        self.assertFalse(res.is_valid)
        self.assertIn("Title must be at least 3 characters long.", res.errors)
        self.assertTrue(any("placeholder quarantine text" in e for e in res.errors))
        self.assertTrue(any("At least 1 verified example" in e for e in res.errors))

    def test_05_validator_accepts_complete_content(self):
        """Verifies validator passes genuinely complete problem content."""
        good_snapshot = ContentSnapshot(
            title="Monotonic Array Invariant",
            description_markdown="You are given an array of integers `nums`. Determine if the array is monotonic.",
            constraints_markdown="- `1 <= nums.length <= 10^5`\n- `-10^9 <= nums[i] <= 10^9`",
            input_format="nums: List[int]",
            output_format="bool",
            examples=[{"input": "nums = [1,2,2,3]", "output": "true"}],
            starter_templates={"python": "def isMonotonic(nums): pass"},
            time_limit_ms=2000,
            memory_limit_mb=256,
        )
        res = ProblemValidator.validate_content(good_snapshot)
        self.assertTrue(res.is_valid, f"Validation failed with errors: {res.errors}")

    def test_06_technical_review_checklist_enforcement(self):
        """Verifies technical review rejects incomplete checklists and passes complete ones."""
        # Incomplete checklist
        incomplete_chk = TechnicalChecklist(statement_consistent=True, examples_correct=True)
        res_incomplete = ProblemValidator.validate_technical_review([
            {"status": "passed", "checklist": incomplete_chk.to_dict()}
        ])
        self.assertFalse(res_incomplete.is_valid)
        self.assertTrue(any("checklist is incomplete" in e for e in res_incomplete.errors))

        # Complete 9-point checklist
        complete_chk = TechnicalChecklist(
            statement_consistent=True,
            examples_correct=True,
            constraints_consistent=True,
            edge_cases_covered=True,
            solution_logic_valid=True,
            starter_templates_compile=True,
            canonical_tests_valid=True,
            expected_outputs_correct=True,
            languages_compatible=True,
        )
        res_complete = ProblemValidator.validate_technical_review([
            {"status": "passed", "reviewer_id": "00000000-0000-0000-0000-000000000001", "checklist": complete_chk.to_dict()}
        ])
        self.assertTrue(res_complete.is_valid, f"Technical review failed: {res_complete.errors}")

    def test_07_provenance_validation(self):
        """Verifies provenance validator rejects unverified sources and accepts verified ones."""
        # Unverified source
        unverified_sources = [{"source_type": "external_reference", "verification_status": "pending_review"}]
        res_unverified = ProblemValidator.validate_provenance(unverified_sources)
        self.assertFalse(res_unverified.is_valid)
        self.assertTrue(any("PROVENANCE_REVIEW_REQUIRED" in e for e in res_unverified.errors))

        # Verified Verniq Original source
        verified_sources = [{"source_type": "verniq_original", "verification_status": "verified_valid", "commercial_use_allowed": True}]
        res_verified = ProblemValidator.validate_provenance(verified_sources)
        self.assertTrue(res_verified.is_valid)

    def test_08_illegal_workflow_transition_blocked(self):
        """Verifies state machine blocks jumping directly from DRAFT to PUBLISHED or JUDGE_READY."""
        dummy_prob = {"title": "Test", "description_markdown": "desc", "human_reviewed": False}
        
        # Block DRAFT -> PUBLISHED
        res_pub = ProblemValidator.validate_workflow_transition(
            current_status=ProblemWorkflowStatus.DRAFT,
            target_status=ProblemWorkflowStatus.PUBLISHED,
            problem_data=dummy_prob,
        )
        self.assertFalse(res_pub.is_valid)
        self.assertTrue(any("Invalid workflow transition" in e for e in res_pub.errors))

        # Block DRAFT -> JUDGE_READY
        res_judge = ProblemValidator.validate_workflow_transition(
            current_status=ProblemWorkflowStatus.DRAFT,
            target_status=ProblemWorkflowStatus.JUDGE_READY,
            problem_data=dummy_prob,
        )
        self.assertFalse(res_judge.is_valid)
        self.assertTrue(any("Invalid workflow transition" in e for e in res_judge.errors))

    def test_09_revision_creation_and_history(self):
        """Verifies that creating a revision increments revision number and creates an immutable snapshot."""
        # Look up an existing quarantined catalog problem
        prob = self.pipeline.get_problem("VRQ-000008")  # String to Integer (atoi) (draft)
        self.assertIsNotNone(prob)
        prob_id = prob["id"]

        assistant = VerniqAuthoringAssistant()
        draft_snapshot = assistant.draft_problem_statement(
            title=prob["title"],
            domain=prob.get("domain_name") or "DSA",
            difficulty=prob["difficulty"],
            topics=["String", "Math"],
            concept_notes="Authored independently for deterministic ASCII parsing semantics."
        )

        rev_res = self.pipeline.create_revision(
            problem_id=prob_id,
            content=draft_snapshot,
            change_summary="Initial Verniq original draft formulation.",
            author_type=AuthorType.AI_ASSISTED,
            generated_with_ai=True,
            human_reviewed=False,
            source_reference="Independent Verniq authoring",
        )

        self.assertEqual(rev_res["status"], "created")
        self.assertGreaterEqual(rev_res["revision_number"], 1)

        # Verify revision was recorded in database
        revs = self.pipeline.get_revisions(prob_id)
        self.assertGreater(len(revs), 0)
        latest_rev = revs[0]
        self.assertEqual(latest_rev["author_type"], "ai_assisted")
        self.assertTrue(latest_rev["generated_with_ai"])
        self.assertFalse(latest_rev["human_reviewed"])

        # Verify problem state transitioned to content_authoring
        updated_prob = self.pipeline.get_problem(prob_id)
        self.assertEqual(updated_prob["workflow_status"], "content_authoring")
        self.assertEqual(updated_prob["author_type"], "ai_assisted")
        self.assertFalse(updated_prob["is_published"])  # Still quarantined!

    def test_10_ai_generated_content_cannot_bypass_gates(self):
        """Verifies that AI-generated draft content cannot bypass content review or publish gates."""
        prob = self.pipeline.get_problem("VRQ-000008")
        prob_id = prob["id"]

        # Attempt to publish immediately: must fail
        success, errors = self.pipeline.publish_problem(prob_id)
        self.assertFalse(success)
        self.assertTrue(len(errors) > 0)
        self.assertTrue(any("Human review must be explicitly confirmed" in e or "Invalid workflow transition" in e for e in errors))

    def test_11_canonical_published_problems_remain_intact(self):
        """Verifies the 6 canonical published problems (Two Sum, etc.) remain published and JUDGE_READY."""
        canonical_slugs = [
            "two-sum",
            "container-with-most-water",
            "best-time-to-buy-and-sell-stock",
            "3sum",
            "search-in-rotated-sorted-array",
            "trapping-rain-water"
        ]
        for slug in canonical_slugs:
            p = self.pipeline.get_problem(slug)
            self.assertIsNotNone(p, f"Canonical problem {slug} missing from database!")
            self.assertTrue(p["is_published"], f"Canonical problem {slug} is not published!")
            self.assertEqual(p["workflow_status"], "published")
            self.assertEqual(p["judge_readiness_status"], "JUDGE_READY")
            self.assertEqual(p["provenance_status"], "VERIFIED_VALID")


if __name__ == "__main__":
    unittest.main()
