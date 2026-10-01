"""
VERNIQ Problem Content Authoring Pipeline Manager
=================================================
Coordinates content authoring, immutable revisions, technical reviews,
provenance audits, and gated lifecycle state transitions.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from backend.importer.importer import ProblemCatalogImporter

from .models import (
    AuthorType,
    ContentSnapshot,
    JudgeReadinessStatus,
    ProblemWorkflowStatus,
    ProvenanceSourceType,
    ProvenanceVerificationStatus,
    TechnicalChecklist,
    TechnicalReviewStatus,
    TestCaseCategory,
    ValidationResult,
)
from .validator import ProblemValidator

logger = logging.getLogger("verniq.authoring")


class ContentAuthoringPipeline:
    """Orchestrates problem content lifecycle, revisions, technical reviews, and publication."""

    def __init__(self, importer: Optional[ProblemCatalogImporter] = None):
        self.importer = importer or ProblemCatalogImporter()

    def get_problem(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Finds a problem by UUID, verniq_id (e.g. VRQ-000001), or slug."""
        clean_id = identifier.strip().replace("'", "''")
        sql = f"""
        SELECT 
            p.id, p.verniq_id, p.title, p.slug, p.difficulty, p.acceptance_rate,
            p.description_markdown, p.constraints_markdown, p.starter_templates,
            p.input_format, p.output_format, p.edge_cases, p.hints, p.time_limit_ms,
            p.memory_limit_mb, p.supported_languages, p.author_type, p.generated_with_ai,
            p.human_reviewed, p.provenance_status, p.judge_readiness_status,
            p.workflow_status, p.is_published, p.is_premium, p.metadata,
            d.name as domain_name, d.slug as domain_slug
        FROM public.problems p
        LEFT JOIN public.domains d ON p.domain_id = d.id
        WHERE p.id::text = '{clean_id}' 
           OR p.verniq_id = '{clean_id}' 
           OR p.slug = '{clean_id}'
        LIMIT 1;
        """
        rows = self.importer.run_query(sql)
        return rows[0] if rows else None

    def get_revisions(self, problem_id: str) -> List[Dict[str, Any]]:
        """Retrieves complete revision history for a problem."""
        sql = f"""
        SELECT id, problem_id, revision_number, author_id, author_type,
               generated_with_ai, human_reviewed, source_reference, change_summary,
               content_snapshot, review_status, created_at
        FROM public.problem_content_revisions
        WHERE problem_id = '{problem_id}'
        ORDER BY revision_number DESC;
        """
        return self.importer.run_query(sql)

    def get_provenance_sources(self, problem_id: str) -> List[Dict[str, Any]]:
        """Retrieves all provenance source records for a problem."""
        sql = f"""
        SELECT id, problem_id, source_type, source_name, source_url, license,
               license_url, attribution_required, commercial_use_allowed,
               derivative_work_allowed, source_identifier, provenance_status,
               verification_status, verified_at, verified_by, notes, created_at
        FROM public.problem_sources
        WHERE problem_id = '{problem_id}'
        ORDER BY created_at DESC;
        """
        return self.importer.run_query(sql)

    def get_technical_reviews(self, problem_id: str) -> List[Dict[str, Any]]:
        """Retrieves technical reviews for a problem."""
        sql = f"""
        SELECT id, problem_id, revision_id, status, reviewer_id, reviewed_at,
               checklist, review_notes, created_at
        FROM public.problem_technical_reviews
        WHERE problem_id = '{problem_id}'
        ORDER BY created_at DESC;
        """
        return self.importer.run_query(sql)

    def get_test_cases(self, problem_id: str) -> List[Dict[str, Any]]:
        """Retrieves test cases for a problem."""
        sql = f"""
        SELECT id, problem_id, input, expected_output, is_sample, order_index,
               category, explanation, is_active
        FROM public.test_cases
        WHERE problem_id = '{problem_id}'
        ORDER BY order_index ASC;
        """
        return self.importer.run_query(sql)

    def create_revision(
        self,
        problem_id: str,
        content: ContentSnapshot,
        change_summary: str,
        author_id: Optional[str] = None,
        author_type: AuthorType = AuthorType.HUMAN,
        generated_with_ai: bool = False,
        human_reviewed: bool = False,
        source_reference: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Creates an immutable new revision for a problem and updates active draft fields.
        Increments revision_number monotonically without overwriting past versions.
        """
        # Determine next revision number
        count_sql = f"SELECT COALESCE(MAX(revision_number), 0) as max_rev FROM public.problem_content_revisions WHERE problem_id = '{problem_id}';"
        count_rows = self.importer.run_query(count_sql)
        next_rev = (count_rows[0]["max_rev"] if count_rows else 0) + 1

        snapshot_json = json.dumps(content.to_dict()).replace("'", "''")
        auth_id_val = f"'{author_id}'" if author_id else "NULL"
        clean_src_ref = source_reference.replace("'", "''") if source_reference else ""
        src_ref_val = f"'{clean_src_ref}'" if source_reference else "NULL"
        summary_val = change_summary.replace("'", "''")

        # Insert revision audit record
        rev_sql = f"""
        INSERT INTO public.problem_content_revisions (
            problem_id, revision_number, author_id, author_type, generated_with_ai,
            human_reviewed, source_reference, change_summary, content_snapshot, review_status
        ) VALUES (
            '{problem_id}', {next_rev}, {auth_id_val}, '{author_type.value}', {str(generated_with_ai).lower()},
            {str(human_reviewed).lower()}, {src_ref_val}, '{summary_val}', '{snapshot_json}', 'draft'
        ) RETURNING id, revision_number, created_at;
        """
        rev_rows = self.importer.run_query(rev_sql)
        rev_id = rev_rows[0]["id"]

        # Update problem working fields
        title_esc = content.title.replace("'", "''")
        desc_esc = content.description_markdown.replace("'", "''")
        const_esc = content.constraints_markdown.replace("'", "''")
        in_esc = (content.input_format or "").replace("'", "''")
        out_esc = (content.output_format or "").replace("'", "''")
        edges_json = json.dumps(content.edge_cases).replace("'", "''")
        hints_json = json.dumps(content.hints).replace("'", "''")
        tmpl_json = json.dumps(content.starter_templates).replace("'", "''")

        update_prob_sql = f"""
        UPDATE public.problems
        SET title = '{title_esc}',
            description_markdown = '{desc_esc}',
            constraints_markdown = '{const_esc}',
            input_format = '{in_esc}',
            output_format = '{out_esc}',
            edge_cases = '{edges_json}'::jsonb,
            hints = '{hints_json}'::jsonb,
            starter_templates = '{tmpl_json}'::jsonb,
            time_limit_ms = {content.time_limit_ms},
            memory_limit_mb = {content.memory_limit_mb},
            author_type = '{author_type.value}',
            generated_with_ai = {str(generated_with_ai).lower()},
            human_reviewed = {str(human_reviewed).lower()},
            workflow_status = CASE 
                WHEN workflow_status = 'draft' THEN 'content_authoring'::public.problem_workflow_status 
                ELSE workflow_status 
            END,
            updated_at = timezone('utc'::text, now())
        WHERE id = '{problem_id}';
        """
        self.importer.run_query(update_prob_sql)
        logger.info(f"Created revision #{next_rev} for problem {problem_id}")

        return {
            "revision_id": rev_id,
            "revision_number": next_rev,
            "problem_id": problem_id,
            "status": "created",
        }

    def record_technical_review(
        self,
        problem_id: str,
        checklist: TechnicalChecklist,
        review_notes: str,
        reviewer_id: Optional[str] = None,
        revision_id: Optional[str] = None,
        status: TechnicalReviewStatus = TechnicalReviewStatus.PASSED,
    ) -> Dict[str, Any]:
        """Records a structured technical review."""
        rev_id_val = f"'{revision_id}'" if revision_id else "NULL"
        reviewer_val = f"'{reviewer_id}'" if reviewer_id else "NULL"
        notes_esc = review_notes.replace("'", "''")
        checklist_json = json.dumps(checklist.to_dict()).replace("'", "''")
        now_ts = datetime.now(timezone.utc).isoformat()

        sql = f"""
        INSERT INTO public.problem_technical_reviews (
            problem_id, revision_id, status, reviewer_id, reviewed_at, checklist, review_notes
        ) VALUES (
            '{problem_id}', {rev_id_val}, '{status.value}', {reviewer_val}, '{now_ts}',
            '{checklist_json}'::jsonb, '{notes_esc}'
        ) RETURNING id, status, reviewed_at;
        """
        res = self.importer.run_query(sql)
        logger.info(f"Recorded technical review ({status.value}) for problem {problem_id}")
        return res[0] if res else {}

    def record_provenance(
        self,
        problem_id: str,
        source_type: ProvenanceSourceType,
        source_name: str,
        source_url: Optional[str] = None,
        license: Optional[str] = None,
        verification_status: ProvenanceVerificationStatus = ProvenanceVerificationStatus.PENDING_REVIEW,
        attribution_required: bool = False,
        commercial_use_allowed: bool = False,
        derivative_work_allowed: bool = False,
        source_identifier: Optional[str] = None,
        notes: str = "",
        verified_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Records or updates provenance source records."""
        clean_url = source_url.replace("'", "''") if source_url else ""
        url_val = f"'{clean_url}'" if source_url else "NULL"
        clean_lic = license.replace("'", "''") if license else ""
        lic_val = f"'{clean_lic}'" if license else "NULL"
        clean_id = source_identifier.replace("'", "''") if source_identifier else ""
        id_val = f"'{clean_id}'" if source_identifier else "NULL"
        v_by_val = f"'{verified_by}'" if verified_by else "NULL"
        v_at_val = f"'{datetime.now(timezone.utc).isoformat()}'" if verification_status == ProvenanceVerificationStatus.VERIFIED_VALID else "NULL"
        notes_esc = notes.replace("'", "''")
        name_esc = source_name.replace("'", "''")

        sql = f"""
        INSERT INTO public.problem_sources (
            problem_id, source_type, source_name, source_url, license,
            attribution_required, commercial_use_allowed, derivative_work_allowed,
            source_identifier, provenance_status, verification_status, verified_at,
            verified_by, notes
        ) VALUES (
            '{problem_id}', '{source_type.value}', '{name_esc}', {url_val}, {lic_val},
            {str(attribution_required).lower()}, {str(commercial_use_allowed).lower()},
            {str(derivative_work_allowed).lower()}, {id_val},
            '{verification_status.name}', '{verification_status.value}', {v_at_val},
            {v_by_val}, '{notes_esc}'
        )
        ON CONFLICT (problem_id) DO UPDATE SET
            source_type = EXCLUDED.source_type,
            source_name = EXCLUDED.source_name,
            source_url = EXCLUDED.source_url,
            license = EXCLUDED.license,
            attribution_required = EXCLUDED.attribution_required,
            commercial_use_allowed = EXCLUDED.commercial_use_allowed,
            derivative_work_allowed = EXCLUDED.derivative_work_allowed,
            source_identifier = EXCLUDED.source_identifier,
            provenance_status = EXCLUDED.provenance_status,
            verification_status = EXCLUDED.verification_status,
            verified_at = EXCLUDED.verified_at,
            verified_by = EXCLUDED.verified_by,
            notes = EXCLUDED.notes,
            updated_at = timezone('utc'::text, now())
        RETURNING id, verification_status, created_at;
        """
        res = self.importer.run_query(sql)

        # Update problem level provenance status
        prob_prov_status = "VERIFIED_VALID" if verification_status == ProvenanceVerificationStatus.VERIFIED_VALID else "PROVENANCE_REVIEW_REQUIRED"
        self.importer.run_query(f"UPDATE public.problems SET provenance_status = '{prob_prov_status}' WHERE id = '{problem_id}';")

        logger.info(f"Recorded provenance ({verification_status.value}) for problem {problem_id}")
        return res[0] if res else {}

    def transition_workflow(
        self,
        problem_id: str,
        target_status: ProblemWorkflowStatus,
        user_id: Optional[str] = None,
    ) -> Tuple[bool, List[str]]:
        """
        Safely transitions a problem through lifecycle gates.
        Returns (success: bool, errors: list[str]).
        """
        prob = self.get_problem(problem_id)
        if not prob:
            return False, [f"Problem not found: {problem_id}"]

        current_status = ProblemWorkflowStatus(prob["workflow_status"])
        sources = self.get_provenance_sources(problem_id)
        reviews = self.get_technical_reviews(problem_id)
        test_cases = self.get_test_cases(problem_id)
        if not prob.get("examples"):
            prob["examples"] = [
                {"input": tc["input"], "output": tc["expected_output"], "explanation": tc.get("explanation", "")}
                for tc in test_cases if tc.get("is_sample")
            ]

        # Validate gate rules
        val_res = ProblemValidator.validate_workflow_transition(
            current_status=current_status,
            target_status=target_status,
            problem_data=prob,
            sources=sources,
            reviews=reviews,
            test_cases=test_cases,
        )

        if not val_res.is_valid:
            logger.warning(f"Workflow transition blocked for {problem_id} to {target_status.value}: {val_res.errors}")
            return False, val_res.errors

        # Execute transition
        is_pub_sql = "true" if target_status == ProblemWorkflowStatus.PUBLISHED else "false"
        judge_status_sql = "JUDGE_READY" if target_status in [ProblemWorkflowStatus.JUDGE_READY, ProblemWorkflowStatus.PUBLISHED] else prob["judge_readiness_status"]

        sql = f"""
        UPDATE public.problems
        SET workflow_status = '{target_status.value}'::public.problem_workflow_status,
            is_published = {is_pub_sql},
            judge_readiness_status = '{judge_status_sql}',
            updated_at = timezone('utc'::text, now())
        WHERE id = '{problem_id}';
        """
        self.importer.run_query(sql)
        logger.info(f"Transitioned problem {problem_id} from {current_status.value} to {target_status.value}")

        return True, []

    def promote_to_judge_ready(self, problem_id: str) -> Tuple[bool, List[str]]:
        """Promotes a problem to JUDGE_READY if all technical review and test assets pass."""
        return self.transition_workflow(problem_id, ProblemWorkflowStatus.JUDGE_READY)

    def publish_problem(self, problem_id: str, publisher_id: Optional[str] = None) -> Tuple[bool, List[str]]:
        """Publishes a problem after verifying content, provenance, and judge-readiness."""
        return self.transition_workflow(problem_id, ProblemWorkflowStatus.PUBLISHED, user_id=publisher_id)

    def archive_problem(self, problem_id: str) -> Tuple[bool, List[str]]:
        """Archives a problem (terminal or withdrawn state)."""
        return self.transition_workflow(problem_id, ProblemWorkflowStatus.ARCHIVED)
