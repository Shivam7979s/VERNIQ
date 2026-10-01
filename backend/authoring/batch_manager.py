"""
VERNIQ Controlled Batch Authoring Infrastructure
================================================
Coordinates staged problem selection, authoring batch tracking,
review pipelines, failure retry workflows, and production dashboard analytics
without automated publication.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from backend.importer.importer import ProblemCatalogImporter
from .models import (
    AuthoringFailureStep,
    BatchItemStatus,
    BatchLifecycleStatus,
    BlockerStatus,
    DEFAULT_BATCH_SIZE,
    MIN_CANONICAL_TESTS,
    ProblemWorkflowStatus,
    SUPPORTED_BATCH_SIZES,
)
from .pipeline import ContentAuthoringPipeline
from .selection import ProblemSelectionEngine
from .validator import ProblemValidator

logger = logging.getLogger("verniq.batch_authoring")


class AuthoringBatchManager:
    """Manages controlled authoring batches, queue queries, and pipeline tracking."""

    def __init__(
        self,
        pipeline: Optional[ContentAuthoringPipeline] = None,
        selection_engine: Optional[ProblemSelectionEngine] = None,
    ):
        self.pipeline = pipeline or ContentAuthoringPipeline()
        self.importer = self.pipeline.importer
        self.selection_engine = selection_engine or ProblemSelectionEngine(self.importer)

    def create_batch(
        self,
        name: str,
        target_count: int = DEFAULT_BATCH_SIZE,
        criteria: Optional[Dict[str, Any]] = None,
        created_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Creates a new authoring batch in CREATED status.
        Does NOT execute or publish automatically.
        """
        clean_name = name.strip().replace("'", "''")
        if not clean_name:
            raise ValueError("Batch name cannot be empty.")

        if target_count not in SUPPORTED_BATCH_SIZES and target_count > 250:
            raise ValueError(f"Batch target count {target_count} exceeds maximum allowed (250).")

        criteria_json = json.dumps(criteria or {}).replace("'", "''")
        creator_val = f"'{created_by}'" if created_by else "NULL"

        sql = f"""
        INSERT INTO public.problem_authoring_batches (
          batch_name, target_count, actual_count, batch_status, authoring_status,
          review_status, completion_percentage, failure_count, published_count,
          selection_criteria, created_by
        ) VALUES (
          '{clean_name}', {target_count}, 0, '{BatchLifecycleStatus.CREATED.value}', 'PENDING',
          'PENDING', 0.00, 0, 0,
          '{criteria_json}'::jsonb, {creator_val}
        ) RETURNING id, batch_name, target_count, batch_status, created_at;
        """
        rows = self.importer.run_query(sql)
        logger.info(f"Created authoring batch '{clean_name}' (target: {target_count})")
        return rows[0]

    def select_problems_into_batch(
        self,
        batch_id: str,
        criteria: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Uses ProblemSelectionEngine to populate a batch with unauthored catalog problems.
        Enforces anti-duplication: no problem can be in multiple active batches.
        """
        # Fetch batch
        batch_sql = f"SELECT id, batch_name, target_count, batch_status FROM public.problem_authoring_batches WHERE id = '{batch_id}';"
        batch_rows = self.importer.run_query(batch_sql)
        if not batch_rows:
            raise ValueError(f"Batch not found: {batch_id}")

        batch = batch_rows[0]
        if batch["batch_status"] not in [BatchLifecycleStatus.CREATED.value, BatchLifecycleStatus.SELECTED.value]:
            raise ValueError(f"Cannot select problems for batch in '{batch['batch_status']}' status.")

        crit = criteria or {}
        domain = crit.get("domain", "DSA")
        topics = crit.get("topics")
        difficulty = crit.get("difficulty")
        difficulty_distribution = crit.get("difficulty_distribution")
        batch_size = int(crit.get("batch_size") or batch["target_count"])

        candidates = self.selection_engine.select_candidates(
            domain=domain,
            topics=topics,
            difficulty=difficulty,
            difficulty_distribution=difficulty_distribution,
            batch_size=batch_size,
        )

        if not candidates:
            return {"batch_id": batch_id, "selected_count": 0, "problems": []}

        # Insert items and link problems in batch
        values_sql = ", ".join(
            f"('{batch_id}', '{p['id']}', '{BatchItemStatus.SELECTED.value}', 0)"
            for p in candidates
        )
        insert_items_sql = f"""
        INSERT INTO public.batch_problem_items (
            batch_id, problem_id, item_status, retry_count
        ) VALUES {values_sql}
        RETURNING id, problem_id, item_status;
        """
        inserted_items = self.importer.run_query(insert_items_sql)

        # Batch update problem current_batch_id
        candidate_ids_sql = ", ".join(f"'{p['id']}'" for p in candidates)
        self.importer.run_query(
            f"UPDATE public.problems SET current_batch_id = '{batch_id}' WHERE id IN ({candidate_ids_sql});"
        )

        # Update batch actual_count and advance status to SELECTED
        update_batch_sql = f"""
        UPDATE public.problem_authoring_batches
        SET actual_count = {len(inserted_items)},
            batch_status = '{BatchLifecycleStatus.SELECTED.value}',
            updated_at = timezone('utc'::text, now())
        WHERE id = '{batch_id}';
        """
        self.importer.run_query(update_batch_sql)

        logger.info(f"Populated batch '{batch['batch_name']}' with {len(inserted_items)} problems.")
        return {
            "batch_id": batch_id,
            "selected_count": len(inserted_items),
            "problems": [c["verniq_id"] for c in candidates],
        }

    def assign_problems_to_batch(
        self,
        batch_id: str,
        verniq_ids: List[str],
    ) -> Dict[str, Any]:
        """
        Assigns an explicitly approved list of unauthored catalog problems into a batch.
        Guarantees:
        - Exactly preserves Verniq IDs and existing unconfirmed metadata status.
        - None are published.
        - None are already assigned to an active batch.
        """
        batch_sql = f"SELECT id, batch_name, target_count, batch_status FROM public.problem_authoring_batches WHERE id = '{batch_id}';"
        batch_rows = self.importer.run_query(batch_sql)
        if not batch_rows:
            raise ValueError(f"Batch not found: {batch_id}")

        batch = batch_rows[0]
        if batch["batch_status"] not in [BatchLifecycleStatus.CREATED.value, BatchLifecycleStatus.SELECTED.value]:
            raise ValueError(f"Cannot assign problems for batch in '{batch['batch_status']}' status.")

        quoted_ids = ", ".join(f"'{vid.strip()}'" for vid in verniq_ids)
        probs_sql = f"""
        SELECT id, verniq_id, title, difficulty, is_published, current_batch_id
        FROM public.problems
        WHERE verniq_id IN ({quoted_ids})
        ORDER BY verniq_id ASC;
        """
        probs = self.importer.run_query(probs_sql)
        if len(probs) != len(verniq_ids):
            found_vids = {p["verniq_id"] for p in probs}
            missing = set(verniq_ids) - found_vids
            raise ValueError(f"Could not find all requested problems in catalog. Missing: {missing}")

        for p in probs:
            if p["is_published"]:
                raise ValueError(f"Cannot assign published problem: {p['verniq_id']}")
            if p.get("current_batch_id") and p["current_batch_id"] != batch_id:
                raise ValueError(f"Problem {p['verniq_id']} is already assigned to batch {p['current_batch_id']}")

        # Insert items into batch_problem_items
        values_sql = ", ".join(
            f"('{batch_id}', '{p['id']}', '{BatchItemStatus.SELECTED.value}', 0)"
            for p in probs
        )
        insert_items_sql = f"""
        INSERT INTO public.batch_problem_items (
            batch_id, problem_id, item_status, retry_count
        ) VALUES {values_sql}
        RETURNING id, problem_id, item_status;
        """
        inserted_items = self.importer.run_query(insert_items_sql)

        # Batch update problem current_batch_id
        candidate_ids_sql = ", ".join(f"'{p['id']}'" for p in probs)
        self.importer.run_query(
            f"UPDATE public.problems SET current_batch_id = '{batch_id}' WHERE id IN ({candidate_ids_sql});"
        )

        # Update batch actual_count and advance status to SELECTED
        update_batch_sql = f"""
        UPDATE public.problem_authoring_batches
        SET actual_count = {len(probs)},
            batch_status = '{BatchLifecycleStatus.SELECTED.value}',
            updated_at = timezone('utc'::text, now())
        WHERE id = '{batch_id}';
        """
        self.importer.run_query(update_batch_sql)

        logger.info(f"Assigned {len(probs)} approved problems into batch '{batch['batch_name']}'.")
        return {
            "batch_id": batch_id,
            "selected_count": len(probs),
            "problems": [p["verniq_id"] for p in probs],
        }


    def advance_batch_lifecycle(
        self,
        batch_id: str,
        target_status: BatchLifecycleStatus,
    ) -> Tuple[bool, List[str]]:
        """
        Advances the batch through its lifecycle:
        CREATED -> SELECTED -> AUTHORING -> CONTENT_REVIEW -> TECHNICAL_REVIEW -> PROVENANCE_REVIEW -> JUDGE_VALIDATION -> HUMAN_APPROVAL -> COMPLETED
        Validates batch item states and NEVER automatically publishes.
        """
        batch_sql = f"SELECT id, batch_name, batch_status, actual_count FROM public.problem_authoring_batches WHERE id = '{batch_id}';"
        batch_rows = self.importer.run_query(batch_sql)
        if not batch_rows:
            return False, [f"Batch not found: {batch_id}"]

        batch = batch_rows[0]
        current_status = BatchLifecycleStatus(batch["batch_status"])

        lifecycle_order = [
            BatchLifecycleStatus.CREATED,
            BatchLifecycleStatus.SELECTED,
            BatchLifecycleStatus.AUTHORING,
            BatchLifecycleStatus.CONTENT_REVIEW,
            BatchLifecycleStatus.TECHNICAL_REVIEW,
            BatchLifecycleStatus.PROVENANCE_REVIEW,
            BatchLifecycleStatus.JUDGE_VALIDATION,
            BatchLifecycleStatus.HUMAN_APPROVAL,
            BatchLifecycleStatus.COMPLETED,
        ]

        if target_status not in lifecycle_order:
            return False, [f"Unknown lifecycle target status: {target_status}"]

        curr_idx = lifecycle_order.index(current_status)
        target_idx = lifecycle_order.index(target_status)

        if target_idx < curr_idx:
            return False, [f"Cannot move backward in lifecycle from '{current_status.value}' to '{target_status.value}'."]

        # Check items readiness before advancing
        items_sql = f"""
        SELECT id, problem_id, item_status, failure_step 
        FROM public.batch_problem_items 
        WHERE batch_id = '{batch_id}';
        """
        items = self.importer.run_query(items_sql)
        if not items and target_status != BatchLifecycleStatus.CREATED:
            return False, ["Cannot advance batch with no problem items."]

        # Specific stage validation
        blocked_items = [
            item for item in items 
            if item["item_status"] in [
                BatchItemStatus.CONTENT_REVIEW_BLOCKED.value,
                BatchItemStatus.TECHNICAL_REVIEW_BLOCKED.value,
                BatchItemStatus.PROVENANCE_REVIEW_BLOCKED.value,
                BatchItemStatus.JUDGE_VALIDATION_BLOCKED.value,
                BatchItemStatus.FAILED.value,
            ]
        ]
        if blocked_items and target_status in [BatchLifecycleStatus.JUDGE_VALIDATION, BatchLifecycleStatus.HUMAN_APPROVAL, BatchLifecycleStatus.COMPLETED]:
            return False, [f"Batch has {len(blocked_items)} blocked or failed items that must be resolved first."]

        completed_clause = ", completed_at = timezone('utc'::text, now())" if target_status == BatchLifecycleStatus.COMPLETED else ""

        sql = f"""
        UPDATE public.problem_authoring_batches
        SET batch_status = '{target_status.value}',
            updated_at = timezone('utc'::text, now())
            {completed_clause}
        WHERE id = '{batch_id}';
        """
        self.importer.run_query(sql)
        logger.info(f"Advanced batch '{batch['batch_name']}' from {current_status.value} to {target_status.value}")
        return True, []

    def update_problem_item_status(
        self,
        batch_id: str,
        problem_id: str,
        new_status: BatchItemStatus,
        failure_step: Optional[AuthoringFailureStep] = None,
        failure_reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Updates the status of an individual problem within a batch."""
        fail_step_sql = f"'{failure_step.value}'" if failure_step else "NULL"
        fail_reason_clean = (failure_reason or "").replace("'", "''")
        fail_reason_sql = f"'{fail_reason_clean}'" if failure_reason else "NULL"

        sql = f"""
        UPDATE public.batch_problem_items
        SET item_status = '{new_status.value}',
            failure_step = {fail_step_sql},
            failure_reason = {fail_reason_sql},
            updated_at = timezone('utc'::text, now())
        WHERE batch_id = '{batch_id}' AND problem_id = '{problem_id}'
        RETURNING id, problem_id, item_status, failure_step, retry_count;
        """
        rows = self.importer.run_query(sql)
        self.recalculate_batch_metrics(batch_id)
        return rows[0] if rows else {}

    def retry_failed_item(
        self,
        batch_id: str,
        problem_id: str,
        failure_step: Optional[AuthoringFailureStep] = None,
    ) -> Dict[str, Any]:
        """
        Supports retrying failed authoring steps without restarting the entire problem.
        CONTENT_GENERATION_FAILED -> retry content generation
        TEST_GENERATION_FAILED    -> retry test generation
        TECHNICAL_REVIEW_FAILED   -> return to authoring
        JUDGE_FAILED              -> return to technical review
        PROVENANCE_FAILED         -> return to provenance review
        Never overwrites an approved revision.
        """
        item_sql = f"""
        SELECT id, batch_id, problem_id, item_status, failure_step, retry_count
        FROM public.batch_problem_items
        WHERE batch_id = '{batch_id}' AND problem_id = '{problem_id}';
        """
        item_rows = self.importer.run_query(item_sql)
        if not item_rows:
            raise ValueError(f"Batch item not found for batch {batch_id} and problem {problem_id}")

        item = item_rows[0]
        step = failure_step or (AuthoringFailureStep(item["failure_step"]) if item.get("failure_step") else AuthoringFailureStep.CONTENT_GENERATION_FAILED)

        # Transition map for granular retries
        target_item_status = BatchItemStatus.AUTHORING
        if step == AuthoringFailureStep.CONTENT_GENERATION_FAILED:
            target_item_status = BatchItemStatus.AUTHORING
        elif step == AuthoringFailureStep.TEST_GENERATION_FAILED:
            target_item_status = BatchItemStatus.TECHNICAL_REVIEW
        elif step == AuthoringFailureStep.TECHNICAL_REVIEW_FAILED:
            target_item_status = BatchItemStatus.AUTHORING
        elif step == AuthoringFailureStep.JUDGE_FAILED:
            target_item_status = BatchItemStatus.TECHNICAL_REVIEW
        elif step == AuthoringFailureStep.PROVENANCE_FAILED:
            target_item_status = BatchItemStatus.PROVENANCE_REVIEW

        sql = f"""
        UPDATE public.batch_problem_items
        SET item_status = '{target_item_status.value}',
            failure_step = NULL,
            failure_reason = NULL,
            retry_count = retry_count + 1,
            updated_at = timezone('utc'::text, now())
        WHERE batch_id = '{batch_id}' AND problem_id = '{problem_id}'
        RETURNING id, problem_id, item_status, failure_step, retry_count;
        """
        rows = self.importer.run_query(sql)
        self.recalculate_batch_metrics(batch_id)
        logger.info(f"Retried failed item {problem_id} in batch {batch_id} for step {step.value} (retry #{rows[0]['retry_count']})")
        return rows[0]

    def recalculate_batch_metrics(self, batch_id: str) -> Dict[str, Any]:
        """Calculates completion percentage, failure count, and published count for a batch."""
        sql = f"""
        SELECT item_status, count(*) as count
        FROM public.batch_problem_items
        WHERE batch_id = '{batch_id}'
        GROUP BY item_status;
        """
        rows = self.importer.run_query(sql)
        counts = {r["item_status"]: r["count"] for r in rows}
        total = sum(counts.values())

        if total == 0:
            return {"completion_percentage": 0.0, "failure_count": 0, "published_count": 0}

        completed = counts.get(BatchItemStatus.COMPLETED.value, 0) + counts.get(BatchItemStatus.APPROVED.value, 0)
        failures = sum(
            counts.get(s, 0)
            for s in [
                BatchItemStatus.FAILED.value,
                BatchItemStatus.CONTENT_REVIEW_BLOCKED.value,
                BatchItemStatus.TECHNICAL_REVIEW_BLOCKED.value,
                BatchItemStatus.PROVENANCE_REVIEW_BLOCKED.value,
                BatchItemStatus.JUDGE_VALIDATION_BLOCKED.value,
            ]
        )

        # Check published problems
        pub_sql = f"""
        SELECT count(*) as count
        FROM public.batch_problem_items bpi
        JOIN public.problems p ON bpi.problem_id = p.id
        WHERE bpi.batch_id = '{batch_id}' AND p.is_published = true;
        """
        pub_count = self.importer.run_query(pub_sql)[0]["count"]

        pct = round((completed / total) * 100.0, 2)

        update_sql = f"""
        UPDATE public.problem_authoring_batches
        SET completion_percentage = {pct},
            failure_count = {failures},
            published_count = {pub_count},
            updated_at = timezone('utc'::text, now())
        WHERE id = '{batch_id}';
        """
        self.importer.run_query(update_sql)
        return {
            "completion_percentage": pct,
            "failure_count": failures,
            "published_count": pub_count,
            "total_items": total,
        }

    def list_batches(self) -> List[Dict[str, Any]]:
        """Lists all authoring batches with summary information."""
        sql = """
        SELECT 
            b.id, b.batch_name, b.target_count, b.actual_count, b.batch_status,
            b.authoring_status, b.review_status, b.completion_percentage,
            b.failure_count, b.published_count, b.selection_criteria,
            b.created_at, b.updated_at, b.completed_at,
            p.username as creator_username
        FROM public.problem_authoring_batches b
        LEFT JOIN public.profiles p ON b.created_by = p.id
        ORDER BY b.created_at DESC;
        """
        return self.importer.run_query(sql)

    def get_batch_details(self, batch_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves complete details of a batch and all its assigned problem items."""
        batch_sql = f"""
        SELECT b.*, pr.username as creator_username
        FROM public.problem_authoring_batches b
        LEFT JOIN public.profiles pr ON b.created_by = pr.id
        WHERE b.id = '{batch_id}';
        """
        batch_rows = self.importer.run_query(batch_sql)
        if not batch_rows:
            return None

        batch = batch_rows[0]

        items_sql = f"""
        SELECT 
            bpi.id as batch_item_id, bpi.batch_id, bpi.problem_id, bpi.item_status,
            bpi.failure_step, bpi.failure_reason, bpi.retry_count,
            bpi.content_completeness_pct, bpi.test_completeness_pct, bpi.judge_readiness_pct,
            p.verniq_id, p.title, p.difficulty, p.workflow_status, p.provenance_status,
            p.judge_readiness_status, p.is_published, p.human_reviewed, p.generated_with_ai,
            d.name as domain_name
        FROM public.batch_problem_items bpi
        JOIN public.problems p ON bpi.problem_id = p.id
        LEFT JOIN public.domains d ON p.domain_id = d.id
        WHERE bpi.batch_id = '{batch_id}'
        ORDER BY p.verniq_id ASC;
        """
        items = self.importer.run_query(items_sql)
        batch["items"] = items
        return batch

    def get_authoring_queue(
        self,
        workflow_status: Optional[str] = None,
        difficulty: Optional[str] = None,
        domain: Optional[str] = None,
        topic: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "verniq_id",
        sort_asc: bool = True,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Retrieves the filtered and sorted authoring queue across catalog problems.
        Includes completeness metrics, provenance status, judge readiness, and assigned batch.
        """
        where_clauses = ["1=1"]

        if workflow_status and workflow_status != "all":
            clean_wf = workflow_status.strip().replace("'", "''")
            where_clauses.append(f"p.workflow_status = '{clean_wf}'")

        if difficulty and difficulty != "all":
            clean_diff = difficulty.strip().lower().replace("'", "''")
            where_clauses.append(f"p.difficulty = '{clean_diff}'")

        if domain and domain != "all":
            clean_dom = domain.strip().replace("'", "''")
            where_clauses.append(f"d.name ILIKE '{clean_dom}'")

        if search:
            clean_s = search.strip().replace("'", "''")
            where_clauses.append(f"(p.verniq_id ILIKE '%{clean_s}%' OR p.title ILIKE '%{clean_s}%')")

        topic_filter = ""
        if topic and topic != "all":
            clean_top = topic.strip().replace("'", "''")
            topic_filter = f"""
            JOIN public.problem_topics pt_filter ON p.id = pt_filter.problem_id
            JOIN public.topics t_filter ON pt_filter.topic_id = t_filter.id AND t_filter.name ILIKE '{clean_top}'
            """

        where_sql = " AND ".join(where_clauses)

        # Count total matching
        count_sql = f"""
        SELECT count(DISTINCT p.id) as total_count
        FROM public.problems p
        LEFT JOIN public.domains d ON p.domain_id = d.id
        {topic_filter}
        WHERE {where_sql};
        """
        total_count = self.importer.run_query(count_sql)[0]["total_count"]

        # Sort field mapping
        sort_col = "p.verniq_id"
        if sort_by == "title":
            sort_col = "p.title"
        elif sort_by == "difficulty":
            sort_col = "p.difficulty"
        elif sort_by == "workflow_status":
            sort_col = "p.workflow_status"
        elif sort_by == "provenance_status":
            sort_col = "p.provenance_status"

        order_dir = "ASC" if sort_asc else "DESC"

        items_sql = f"""
        SELECT DISTINCT
            p.id, p.verniq_id, p.title, p.slug, p.difficulty, p.workflow_status,
            p.provenance_status, p.judge_readiness_status, p.is_published,
            p.generated_with_ai, p.human_reviewed, p.author_type,
            d.name as domain_name,
            b.id as batch_id, b.batch_name,
            COALESCE(
              (SELECT count(*) FROM public.test_cases tc WHERE tc.problem_id = p.id), 0
            ) as test_case_count
        FROM public.problems p
        LEFT JOIN public.domains d ON p.domain_id = d.id
        LEFT JOIN public.problem_authoring_batches b ON p.current_batch_id = b.id
        {topic_filter}
        WHERE {where_sql}
        ORDER BY {sort_col} {order_dir}
        LIMIT {limit} OFFSET {offset};
        """
        rows = self.importer.run_query(items_sql)

        # Enrich with topics and completeness scores
        prob_ids = [f"'{r['id']}'" for r in rows]
        topic_map: Dict[str, List[str]] = {}
        if prob_ids:
            t_sql = f"""
            SELECT pt.problem_id, t.name as topic_name
            FROM public.problem_topics pt
            JOIN public.topics t ON pt.topic_id = t.id
            WHERE pt.problem_id IN ({', '.join(prob_ids)});
            """
            for trow in self.importer.run_query(t_sql):
                topic_map.setdefault(trow["problem_id"], []).append(trow["topic_name"])

        queue_items = []
        for r in rows:
            diff = r["difficulty"]
            min_tests = MIN_CANONICAL_TESTS.get(diff, 200)
            tc_count = int(r["test_case_count"])
            test_completeness = min(100, int((tc_count / min_tests) * 100))

            content_pct = 100 if r["workflow_status"] in ["technical_review", "provenance_review", "judge_ready", "published"] else (
                50 if r["workflow_status"] == "content_review" else (
                    25 if r["workflow_status"] == "content_authoring" else 0
                )
            )

            queue_items.append({
                "id": r["id"],
                "verniq_id": r["verniq_id"],
                "title": r["title"],
                "difficulty": r["difficulty"],
                "domain": r["domain_name"] or "DSA",
                "topics": topic_map.get(r["id"], []),
                "workflow_status": r["workflow_status"],
                "provenance_status": r["provenance_status"],
                "content_completeness": content_pct,
                "test_completeness": test_completeness,
                "test_case_count": tc_count,
                "min_tests_required": min_tests,
                "judge_readiness": r["judge_readiness_status"],
                "assigned_batch_id": r["batch_id"],
                "assigned_batch_name": r["batch_name"],
                "ai_assisted": bool(r["generated_with_ai"]),
                "human_reviewed": bool(r["human_reviewed"]),
                "is_published": bool(r["is_published"]),
            })

        return {
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "items": queue_items,
        }

    def get_production_dashboard_metrics(self) -> Dict[str, Any]:
        """
        Aggregate analytics for the production content authoring pipeline:
        - Total catalog, published, draft, and intermediate workflow states
        - Missing provenance, missing tests, judge failures, and active batches
        Does NOT fabricate analytics.
        """
        # Catalog workflow breakdown
        wf_sql = """
        SELECT workflow_status, count(*) as count
        FROM public.problems
        GROUP BY workflow_status;
        """
        wf_rows = self.importer.run_query(wf_sql)
        wf_counts = {r["workflow_status"]: r["count"] for r in wf_rows}
        total_catalog = sum(wf_counts.values())
        published_count = wf_counts.get("published", 0)

        # Batch counts
        batch_sql = """
        SELECT 
            count(*) as total_batches,
            count(*) FILTER (WHERE batch_status NOT IN ('COMPLETED', 'ARCHIVED')) as active_batches,
            COALESCE(AVG(completion_percentage), 0.0) as avg_completion,
            COALESCE(SUM(failure_count), 0) as total_failures
        FROM public.problem_authoring_batches;
        """
        b_metrics = self.importer.run_query(batch_sql)[0]

        # Missing provenance count
        prov_sql = """
        SELECT count(*) as count
        FROM public.problems
        WHERE provenance_status != 'VERIFIED_VALID';
        """
        missing_prov = self.importer.run_query(prov_sql)[0]["count"]

        # Missing tests count (problems with < minimum required canonical tests)
        # easy < 200, medium < 250, hard < 300
        tests_sql = """
        SELECT count(*) as count
        FROM public.problems p
        LEFT JOIN (
            SELECT problem_id, count(*) as tc_count 
            FROM public.test_cases 
            GROUP BY problem_id
        ) tc ON p.id = tc.problem_id
        WHERE COALESCE(tc.tc_count, 0) < CASE 
            WHEN p.difficulty = 'hard' THEN 300
            WHEN p.difficulty = 'medium' THEN 250
            ELSE 200
        END;
        """
        missing_tests = self.importer.run_query(tests_sql)[0]["count"]

        # Blocked batch items
        blocked_sql = """
        SELECT count(*) as count
        FROM public.batch_problem_items
        WHERE item_status IN (
            'CONTENT_REVIEW_BLOCKED',
            'TECHNICAL_REVIEW_BLOCKED',
            'PROVENANCE_REVIEW_BLOCKED',
            'JUDGE_VALIDATION_BLOCKED',
            'FAILED'
        );
        """
        blocked_items_count = self.importer.run_query(blocked_sql)[0]["count"]

        return {
            "total_catalog": total_catalog,
            "published": published_count,
            "draft": wf_counts.get("draft", 0),
            "content_authoring": wf_counts.get("content_authoring", 0),
            "content_review": wf_counts.get("content_review", 0),
            "technical_review": wf_counts.get("technical_review", 0),
            "provenance_review": wf_counts.get("provenance_review", 0),
            "judge_ready": wf_counts.get("judge_ready", 0),
            "blocked": blocked_items_count,
            "total_batches": b_metrics["total_batches"],
            "active_batches": b_metrics["active_batches"],
            "avg_completion_pct": round(float(b_metrics["avg_completion"]), 1),
            "total_failed_validations": int(b_metrics["total_failures"]),
            "missing_provenance": missing_prov,
            "missing_tests": missing_tests,
        }

    def get_pipeline_summary(self) -> Dict[str, Any]:
        """Provides high-level counts across all lifecycle workflow states (Phase 4.1 compatible)."""
        wf_sql = "SELECT workflow_status, count(*) as count FROM public.problems GROUP BY workflow_status;"
        wf_rows = self.importer.run_query(wf_sql)
        breakdown = {r["workflow_status"]: r["count"] for r in wf_rows}

        prov_sql = "SELECT provenance_status, count(*) as count FROM public.problems GROUP BY provenance_status;"
        prov_rows = self.importer.run_query(prov_sql)
        prov_breakdown = {r["provenance_status"]: r["count"] for r in prov_rows}

        judge_sql = "SELECT judge_readiness_status, count(*) as count FROM public.problems GROUP BY judge_readiness_status;"
        judge_rows = self.importer.run_query(judge_sql)
        judge_breakdown = {r["judge_readiness_status"]: r["count"] for r in judge_rows}

        rev_sql = "SELECT count(*) as count FROM public.problem_content_revisions;"
        rev_count = self.importer.run_query(rev_sql)[0]["count"]

        tech_sql = "SELECT count(*) as count FROM public.problem_technical_reviews;"
        tech_count = self.importer.run_query(tech_sql)[0]["count"]

        return {
            "total_problems": sum(breakdown.values()),
            "workflow_breakdown": breakdown,
            "provenance_breakdown": prov_breakdown,
            "judge_readiness_breakdown": judge_breakdown,
            "total_revisions_recorded": rev_count,
            "total_technical_reviews_recorded": tech_count,
        }
