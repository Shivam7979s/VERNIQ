"""
VERNIQ Problem Content Quality & Gating Validator
==================================================
Enforces rigorous quality gates, test suite validation (200/250/300 minimums),
multi-language starter templates, provenance verification, technical reviews,
and workflow transition safety rules before problem publication or judge activation.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Set

from .models import (
    BlockerStatus,
    ContentSnapshot,
    JudgeReadinessStatus,
    MIN_CANONICAL_TESTS,
    ProblemWorkflowStatus,
    ProvenanceSourceType,
    ProvenanceVerificationStatus,
    TechnicalChecklist,
    TechnicalReviewStatus,
    TestCaseCategory,
    TestSuiteMetrics,
    ValidationResult,
)

logger = logging.getLogger("verniq.authoring.validator")

REQUIRED_LANGUAGES = ["cpp", "python", "java", "typescript", "go"]


class ProblemValidator:
    """Enforces content quality, multi-language coverage, test-suite metrics, and gated transitions."""

    @staticmethod
    def validate_content(
        snapshot: ContentSnapshot,
        domain_name: Optional[str] = None,
        difficulty: Optional[str] = None,
        topics: Optional[List[str]] = None,
    ) -> ValidationResult:
        """
        Validates structured problem content for authoring completeness before entering review.
        Invalid drafts remain in authoring. Does NOT silently repair content.
        """
        errors: List[str] = []
        warnings: List[str] = []

        # 1. Title validation
        if not snapshot.title or len(snapshot.title.strip()) < 3:
            errors.append("Title must be at least 3 characters long.")

        # 2. Statement / Description validation
        desc = (snapshot.description_markdown or "").strip()
        if not desc:
            errors.append("Statement (description markdown) is missing or empty.")
        elif "pending review" in desc.lower() or "specification in review" in desc.lower():
            errors.append("Statement contains placeholder quarantine text; authoring is incomplete.")
        elif len(desc) < 40:
            errors.append("Statement is too brief (minimum 40 characters required).")

        # 3. Input & Output format specifications
        in_fmt = (snapshot.input_format or "").strip()
        if not in_fmt:
            errors.append("Input specification is missing or empty.")
        elif len(in_fmt) < 5:
            errors.append("Input specification is too brief (minimum 5 characters).")

        out_fmt = (snapshot.output_format or "").strip()
        if not out_fmt:
            errors.append("Output specification is missing or empty.")
        elif len(out_fmt) < 3:
            errors.append("Output specification is too brief (minimum 3 characters).")

        # 4. Constraints validation
        constraints = (snapshot.constraints_markdown or "").strip()
        if not constraints:
            errors.append("Constraints specification is missing or empty.")
        elif "in review" in constraints.lower() and len(constraints) < 30:
            errors.append("Constraints contain unauthored placeholder text; mathematical bounds are required.")

        # 5. Examples validation (presence & internal consistency)
        if not snapshot.examples or len(snapshot.examples) < 1:
            errors.append("At least 1 verified example is required for content completeness.")
        else:
            for idx, ex in enumerate(snapshot.examples, start=1):
                inp = ex.get("input")
                out = ex.get("output")
                if inp is None or str(inp).strip() == "":
                    errors.append(f"Example {idx} is missing an input definition.")
                if out is None or str(out).strip() == "":
                    errors.append(f"Example {idx} is missing an expected output definition.")

        # 6. Difficulty validation
        if difficulty is not None:
            clean_diff = difficulty.strip().lower()
            if clean_diff not in ["easy", "medium", "hard"]:
                errors.append(f"Invalid difficulty '{difficulty}'. Must be 'easy', 'medium', or 'hard'.")

        # 7. Domain validation
        if domain_name is not None and not domain_name.strip():
            errors.append("Domain is missing or blank.")

        # 8. Topics validation
        if topics is not None and len(topics) == 0:
            warnings.append("No curriculum topics assigned to problem.")

        # 9. Multi-language starter templates (Java, C++, Python, TypeScript, Go)
        templates = snapshot.starter_templates or {}
        if not templates or len(templates) == 0:
            errors.append("Starter templates are missing.")
        else:
            missing_langs = [lang for lang in REQUIRED_LANGUAGES if not templates.get(lang) or not templates[lang].strip()]
            if missing_langs:
                warnings.append(f"Starter templates pending for runtime languages: {', '.join(missing_langs)}")

        # 10. Execution limits
        if snapshot.time_limit_ms < 100 or snapshot.time_limit_ms > 15000:
            errors.append(f"Time limit {snapshot.time_limit_ms}ms outside allowed window (100ms - 15000ms).")
        if snapshot.memory_limit_mb < 16 or snapshot.memory_limit_mb > 2048:
            errors.append(f"Memory limit {snapshot.memory_limit_mb}MB outside allowed window (16MB - 2048MB).")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            gates_passed={"content_completeness": len(errors) == 0},
        )

    @staticmethod
    def validate_test_suite(
        test_cases: List[Dict[str, Any]],
        difficulty: str = "easy",
    ) -> TestSuiteMetrics:
        """
        Validates canonical test generation pipeline requirements:
        EASY >= 200, MEDIUM >= 250, HARD >= 300.
        Reports: total, sample, visible, hidden, edge, stress, adversarial, boundary.
        Enforces uniqueness and specification compliance.
        """
        clean_diff = difficulty.strip().lower()
        min_required = MIN_CANONICAL_TESTS.get(clean_diff, 200)

        errors: List[str] = []
        warnings: List[str] = []

        total = len(test_cases)
        sample = 0
        visible = 0
        hidden = 0
        edge = 0
        stress = 0
        adversarial = 0
        boundary = 0

        seen_inputs: Set[str] = set()
        duplicate_count = 0

        for idx, tc in enumerate(test_cases, start=1):
            inp = tc.get("input")
            out = tc.get("expected_output")
            cat = (tc.get("category") or "").strip().lower()
            is_samp = bool(tc.get("is_sample", False))

            if inp is None:
                errors.append(f"Test case #{idx} has null input vector.")
            if out is None:
                errors.append(f"Test case #{idx} has null expected output.")

            # Uniqueness check
            inp_key = str(inp).strip()
            if inp_key in seen_inputs:
                duplicate_count += 1
            else:
                seen_inputs.add(inp_key)

            # Categorization
            if is_samp or cat == TestCaseCategory.SAMPLE.value:
                sample += 1
            elif cat == TestCaseCategory.VISIBLE.value:
                visible += 1
            elif cat in [TestCaseCategory.EDGE_CASE.value, "edge"]:
                edge += 1
                hidden += 1
            elif cat == TestCaseCategory.STRESS.value:
                stress += 1
                hidden += 1
            elif cat == TestCaseCategory.ADVERSARIAL.value:
                adversarial += 1
                hidden += 1
            elif cat == TestCaseCategory.BOUNDARY.value:
                boundary += 1
                hidden += 1
            else:
                hidden += 1

        unique_inputs_count = len(seen_inputs)

        # Minimum counts gate
        meets_minimum = total >= min_required
        if not meets_minimum:
            errors.append(
                f"Test suite count ({total}) does not meet the minimum requirement for {clean_diff.upper()} ({min_required}+ required)."
            )

        if sample < 1:
            errors.append("At least 1 visible sample test case is required.")

        if duplicate_count > 0:
            pct_dupe = (duplicate_count / total) * 100 if total > 0 else 0
            if pct_dupe > 5.0:
                errors.append(f"High duplicate test inputs detected: {duplicate_count} ({pct_dupe:.1f}%). Must provide unique vectors.")
            else:
                warnings.append(f"{duplicate_count} duplicate test inputs found in suite.")

        return TestSuiteMetrics(
            total=total,
            sample=sample,
            visible=visible,
            hidden=hidden,
            edge=edge,
            stress=stress,
            adversarial=adversarial,
            boundary=boundary,
            unique_inputs_count=unique_inputs_count,
            difficulty=clean_diff,
            min_required=min_required,
            meets_minimum=meets_minimum and len(errors) == 0,
            is_deterministic=True,
            errors=errors,
            warnings=warnings,
        )

    @staticmethod
    def validate_provenance(sources: List[Dict[str, Any]]) -> ValidationResult:
        """Validates problem provenance records and rights verification."""
        errors: List[str] = []
        warnings: List[str] = []

        if not sources or len(sources) == 0:
            errors.append("No provenance records found. A problem must have explicit provenance documentation.")
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings, gates_passed={"provenance_verified": False})

        valid_count = 0
        for idx, src in enumerate(sources, start=1):
            src_type = src.get("source_type", "")
            ver_status = src.get("verification_status", "pending_review")

            if ver_status == ProvenanceVerificationStatus.REJECTED.value:
                errors.append(f"Provenance record {idx} has been explicitly REJECTED: {src.get('notes', 'No notes')}")
                continue

            if ver_status == ProvenanceVerificationStatus.VERIFIED_VALID.value:
                valid_count += 1
            else:
                warnings.append(f"Provenance record {idx} is pending verification ({src.get('source_name', 'unknown')}).")

            if src_type not in [ProvenanceSourceType.VERNIQ_ORIGINAL.value, ProvenanceSourceType.OPEN_LICENSE.value]:
                if not src.get("commercial_use_allowed", False):
                    warnings.append(f"Source {idx} ({src_type}) does not confirm commercial use permission.")

        if valid_count == 0:
            errors.append("No provenance records have been verified as valid (PROVENANCE_REVIEW_REQUIRED).")

        return ValidationResult(
            is_valid=len(errors) == 0 and valid_count > 0,
            errors=errors,
            warnings=warnings,
            gates_passed={"provenance_verified": len(errors) == 0 and valid_count > 0},
        )

    @staticmethod
    def validate_technical_review(reviews: List[Dict[str, Any]]) -> ValidationResult:
        """Validates that a formal technical review has been recorded and passed."""
        errors: List[str] = []
        warnings: List[str] = []

        if not reviews or len(reviews) == 0:
            errors.append("No technical reviews recorded. A technical review is required before judge activation.")
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings, gates_passed={"technical_review_passed": False})

        passed_reviews = [r for r in reviews if r.get("status") == TechnicalReviewStatus.PASSED.value]
        if not passed_reviews:
            errors.append("Problem has not passed technical review. Status is pending or failed.")
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings, gates_passed={"technical_review_passed": False})

        latest = passed_reviews[-1]
        checklist_data = latest.get("checklist") or {}
        checklist = TechnicalChecklist.from_dict(checklist_data)

        if not checklist.is_complete():
            missing = [k for k, v in checklist.to_dict().items() if not v]
            errors.append(f"Technical review checklist is incomplete. Incomplete checkpoints: {', '.join(missing)}")

        if not latest.get("reviewer_id"):
            warnings.append("Technical review lacks reviewer_id attribution.")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            gates_passed={"technical_review_passed": len(errors) == 0},
        )

    @classmethod
    def evaluate_blockers(
        cls,
        problem_data: Dict[str, Any],
        sources: List[Dict[str, Any]],
        reviews: List[Dict[str, Any]],
        test_cases: List[Dict[str, Any]],
    ) -> Dict[str, Optional[str]]:
        """
        Evaluates potential blockers across each gated phase:
        Returns dict with keys: content, technical, provenance, judge.
        """
        blockers: Dict[str, Optional[str]] = {
            "content": None,
            "technical": None,
            "provenance": None,
            "judge": None,
        }

        # Content review blocker
        snapshot = ContentSnapshot.from_dict(problem_data)
        content_res = cls.validate_content(
            snapshot,
            domain_name=problem_data.get("domain_name"),
            difficulty=problem_data.get("difficulty"),
            topics=problem_data.get("topics"),
        )
        if not content_res.is_valid:
            blockers["content"] = f"{BlockerStatus.CONTENT_REVIEW_BLOCKED.value}: {'; '.join(content_res.errors[:2])}"

        # Technical review blocker
        tech_res = cls.validate_technical_review(reviews)
        if not tech_res.is_valid:
            blockers["technical"] = f"{BlockerStatus.TECHNICAL_REVIEW_BLOCKED.value}: {'; '.join(tech_res.errors[:2])}"

        # Provenance blocker
        prov_res = cls.validate_provenance(sources)
        if not prov_res.is_valid:
            blockers["provenance"] = f"{BlockerStatus.PROVENANCE_REVIEW_BLOCKED.value}: {'; '.join(prov_res.errors[:2])}"

        # Judge validation blocker
        diff = problem_data.get("difficulty", "easy")
        test_metrics = cls.validate_test_suite(test_cases, difficulty=diff)
        if not test_metrics.meets_minimum:
            blockers["judge"] = f"{BlockerStatus.JUDGE_VALIDATION_BLOCKED.value}: {'; '.join(test_metrics.errors[:2])}"

        return blockers

    @classmethod
    def validate_workflow_transition(
        cls,
        current_status: ProblemWorkflowStatus,
        target_status: ProblemWorkflowStatus,
        problem_data: Dict[str, Any],
        sources: Optional[List[Dict[str, Any]]] = None,
        reviews: Optional[List[Dict[str, Any]]] = None,
        test_cases: Optional[List[Dict[str, Any]]] = None,
    ) -> ValidationResult:
        """
        Validates transition between workflow states against all required quality gates.
        Enforces strict lifecycle rules:
        DRAFT -> CONTENT_AUTHORING -> CONTENT_REVIEW -> TECHNICAL_REVIEW -> PROVENANCE_REVIEW -> JUDGE_READY -> PUBLISHED
        """
        errors: List[str] = []
        warnings: List[str] = []
        gates: Dict[str, bool] = {}

        allowed_transitions = {
            ProblemWorkflowStatus.DRAFT: [
                ProblemWorkflowStatus.CONTENT_AUTHORING,
                ProblemWorkflowStatus.ARCHIVED,
            ],
            ProblemWorkflowStatus.CONTENT_AUTHORING: [
                ProblemWorkflowStatus.CONTENT_REVIEW,
                ProblemWorkflowStatus.DRAFT,
                ProblemWorkflowStatus.ARCHIVED,
            ],
            ProblemWorkflowStatus.CONTENT_REVIEW: [
                ProblemWorkflowStatus.TECHNICAL_REVIEW,
                ProblemWorkflowStatus.CONTENT_AUTHORING,
                ProblemWorkflowStatus.DRAFT,
                ProblemWorkflowStatus.ARCHIVED,
            ],
            ProblemWorkflowStatus.TECHNICAL_REVIEW: [
                ProblemWorkflowStatus.PROVENANCE_REVIEW,
                ProblemWorkflowStatus.CONTENT_AUTHORING,
                ProblemWorkflowStatus.ARCHIVED,
            ],
            ProblemWorkflowStatus.PROVENANCE_REVIEW: [
                ProblemWorkflowStatus.JUDGE_READY,
                ProblemWorkflowStatus.CONTENT_AUTHORING,
                ProblemWorkflowStatus.ARCHIVED,
            ],
            ProblemWorkflowStatus.JUDGE_READY: [
                ProblemWorkflowStatus.PUBLISHED,
                ProblemWorkflowStatus.CONTENT_AUTHORING,
                ProblemWorkflowStatus.ARCHIVED,
            ],
            ProblemWorkflowStatus.PUBLISHED: [
                ProblemWorkflowStatus.ARCHIVED,
            ],
            ProblemWorkflowStatus.ARCHIVED: [
                ProblemWorkflowStatus.DRAFT,
            ],
        }

        if current_status != target_status:
            valid_next = allowed_transitions.get(current_status, [])
            if target_status not in valid_next:
                errors.append(
                    f"Invalid workflow transition from '{current_status.value}' to '{target_status.value}'. "
                    f"Allowed next states: {[s.value for s in valid_next]}"
                )

        snapshot = ContentSnapshot.from_dict(problem_data)

        # Content review gate
        if target_status in [
            ProblemWorkflowStatus.CONTENT_REVIEW,
            ProblemWorkflowStatus.TECHNICAL_REVIEW,
            ProblemWorkflowStatus.PROVENANCE_REVIEW,
            ProblemWorkflowStatus.JUDGE_READY,
            ProblemWorkflowStatus.PUBLISHED,
        ]:
            content_res = cls.validate_content(
                snapshot,
                domain_name=problem_data.get("domain_name"),
                difficulty=problem_data.get("difficulty"),
                topics=problem_data.get("topics"),
            )
            gates.update(content_res.gates_passed)
            if not content_res.is_valid:
                errors.extend(content_res.errors)
            warnings.extend(content_res.warnings)

        # Technical review gate
        if target_status in [
            ProblemWorkflowStatus.TECHNICAL_REVIEW,
            ProblemWorkflowStatus.PROVENANCE_REVIEW,
            ProblemWorkflowStatus.JUDGE_READY,
            ProblemWorkflowStatus.PUBLISHED,
        ]:
            if target_status in [ProblemWorkflowStatus.PROVENANCE_REVIEW, ProblemWorkflowStatus.JUDGE_READY, ProblemWorkflowStatus.PUBLISHED]:
                tech_res = cls.validate_technical_review(reviews or [])
                gates.update(tech_res.gates_passed)
                if not tech_res.is_valid:
                    errors.extend(tech_res.errors)
                warnings.extend(tech_res.warnings)

        # Provenance review gate
        if target_status in [ProblemWorkflowStatus.JUDGE_READY, ProblemWorkflowStatus.PUBLISHED]:
            prov_res = cls.validate_provenance(sources or [])
            gates.update(prov_res.gates_passed)
            if not prov_res.is_valid:
                errors.extend(prov_res.errors)
            warnings.extend(prov_res.warnings)

            # Test suite gate
            diff = problem_data.get("difficulty", "easy")
            test_metrics = cls.validate_test_suite(test_cases or [], difficulty=diff)
            gates["test_assets_valid"] = test_metrics.meets_minimum
            if not test_metrics.meets_minimum:
                errors.extend(test_metrics.errors)
            warnings.extend(test_metrics.warnings)

        # Publication gate: strictly require human approval
        if target_status == ProblemWorkflowStatus.PUBLISHED:
            if not problem_data.get("human_reviewed", False):
                errors.append("Publication gate failed: Human review must be explicitly confirmed before publishing.")

            if problem_data.get("author_type") == "imported" and not sources:
                errors.append("Imported catalog records cannot be published without authored content and verified provenance.")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            gates_passed=gates,
        )
