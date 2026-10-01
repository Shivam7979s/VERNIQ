"""
VERNIQ Deterministic Problem Selection & Prioritization Engine
==============================================================
Selects catalog problems into authoring batches according to structured,
deterministic criteria without creating new IDs, duplicating active items,
or automatically publishing.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from backend.importer.importer import ProblemCatalogImporter
from .models import (
    COMPANY_METADATA_REQUIRES_MAPPING,
    DEFAULT_BATCH_SIZE,
    SEMANTICS_UNCONFIRMED,
    SUPPORTED_BATCH_SIZES,
)

logger = logging.getLogger("verniq.authoring.selection")

# Curriculum core topics in canonical priority order
CORE_TOPIC_PRIORITIES = [
    "Arrays",
    "Strings",
    "Hash Table",
    "Two Pointers",
    "Sliding Window",
    "Dynamic Programming",
    "Tree",
    "Depth-First Search",
    "Breadth-First Search",
    "Binary Search",
    "Sorting",
    "Greedy",
    "Matrix",
    "Bit Manipulation",
    "Prefix Sum",
    "Stack",
    "Queue",
    "Linked List",
    "Heap (Priority Queue)",
    "Graph",
]


class ProblemSelectionEngine:
    """
    Deterministic selection engine for controlled problem authoring batches.
    Guarantees:
    - Never creates new Verniq IDs (only existing catalog items).
    - Never selects already published problems (e.g. pilot 20).
    - Never duplicates a problem into multiple active batches.
    - Preserves unconfirmed company/records metadata status.
    - Produces strictly deterministic results for identical criteria.
    """

    def __init__(self, importer: Optional[ProblemCatalogImporter] = None):
        self.importer = importer or ProblemCatalogImporter()

    def select_candidates(
        self,
        domain: Optional[str] = "DSA",
        topics: Optional[List[str]] = None,
        difficulty: Optional[str] = None,
        difficulty_distribution: Optional[Dict[str, float]] = None,
        workflow_status: str = "draft",
        batch_size: int = DEFAULT_BATCH_SIZE,
        exclude_problem_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Selects candidate problems from the unauthored catalog.
        batch_size: Must be one of SUPPORTED_BATCH_SIZES or <= 250.
        """
        if batch_size not in SUPPORTED_BATCH_SIZES and batch_size > 250:
            raise ValueError(f"Batch size {batch_size} exceeds maximum allowed (250).")

        # If a difficulty distribution is provided (e.g., 40% Easy, 40% Medium, 20% Hard)
        if difficulty_distribution and not difficulty:
            return self._select_with_distribution(
                domain=domain,
                topics=topics,
                distribution=difficulty_distribution,
                workflow_status=workflow_status,
                batch_size=batch_size,
                exclude_problem_ids=exclude_problem_ids,
            )

        # Standard query with optional single difficulty
        where_clauses = [
            "p.is_published = false",
            f"p.workflow_status = '{workflow_status}'",
            # Ensure problem is NOT currently in an active authoring batch
            """p.id NOT IN (
                SELECT bpi.problem_id 
                FROM public.batch_problem_items bpi 
                WHERE bpi.item_status NOT IN ('COMPLETED', 'FAILED')
            )""",
        ]

        if domain:
            clean_dom = domain.strip().replace("'", "''")
            where_clauses.append(f"d.name ILIKE '{clean_dom}'")

        if difficulty:
            clean_diff = difficulty.strip().lower().replace("'", "''")
            where_clauses.append(f"p.difficulty = '{clean_diff}'")

        if exclude_problem_ids and len(exclude_problem_ids) > 0:
            quoted_ids = ", ".join(f"'{pid}'" for pid in exclude_problem_ids)
            where_clauses.append(f"p.id NOT IN ({quoted_ids})")

        topic_join = ""
        if topics and len(topics) > 0:
            escaped_list = [t.strip().replace("'", "''") for t in topics]
            escaped_topics = ", ".join(f"'{item}'" for item in escaped_list)
            topic_join = f"""
            JOIN public.problem_topics pt ON p.id = pt.problem_id
            JOIN public.topics t ON pt.topic_id = t.id AND t.name IN ({escaped_topics})
            """

        where_sql = " AND ".join(where_clauses)

        sql = f"""
        SELECT DISTINCT
            p.id, p.verniq_id, p.title, p.slug, p.difficulty, p.acceptance_rate,
            p.workflow_status, p.provenance_status, p.judge_readiness_status,
            p.metadata, d.name as domain_name
        FROM public.problems p
        LEFT JOIN public.domains d ON p.domain_id = d.id
        {topic_join}
        WHERE {where_sql}
        ORDER BY p.verniq_id ASC
        LIMIT {batch_size};
        """

        candidates = self.importer.run_query(sql)
        return self._enrich_and_verify(candidates)

    def _select_with_distribution(
        self,
        domain: Optional[str],
        topics: Optional[List[str]],
        distribution: Dict[str, float],
        workflow_status: str,
        batch_size: int,
        exclude_problem_ids: Optional[List[str]],
    ) -> List[Dict[str, Any]]:
        """Selects problems proportionally according to difficulty distribution."""
        selected: List[Dict[str, Any]] = []
        already_selected_ids = list(exclude_problem_ids or [])

        # Calculate counts per difficulty
        # Example for 50 problems: easy=20 (0.4), medium=20 (0.4), hard=10 (0.2)
        remaining = batch_size
        diff_targets: List[Tuple[str, int]] = []
        diffs = ["easy", "medium", "hard"]

        for idx, diff in enumerate(diffs):
            pct = distribution.get(diff, 0.0)
            if idx == len(diffs) - 1:
                count = remaining
            else:
                count = round(batch_size * pct)
                remaining -= count
            diff_targets.append((diff, max(0, count)))

        for diff, target_count in diff_targets:
            if target_count <= 0:
                continue
            diff_candidates = self.select_candidates(
                domain=domain,
                topics=topics,
                difficulty=diff,
                difficulty_distribution=None,
                workflow_status=workflow_status,
                batch_size=target_count,
                exclude_problem_ids=already_selected_ids,
            )
            for c in diff_candidates:
                selected.append(c)
                already_selected_ids.append(c["id"])

        return selected

    def _enrich_and_verify(self, problems: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enriches selected candidates with topics while preserving metadata flags.
        Ensures COMPANY_METADATA_REQUIRES_MAPPING and SEMANTICS_UNCONFIRMED are strictly maintained.
        """
        if not problems:
            return []

        prob_ids = [f"'{p['id']}'" for p in problems]
        ids_sql = ", ".join(prob_ids)

        topics_sql = f"""
        SELECT pt.problem_id, t.name as topic_name
        FROM public.problem_topics pt
        JOIN public.topics t ON pt.topic_id = t.id
        WHERE pt.problem_id IN ({ids_sql})
        ORDER BY t.name ASC;
        """
        topic_rows = self.importer.run_query(topics_sql)
        topic_map: Dict[str, List[str]] = {}
        for r in topic_rows:
            topic_map.setdefault(r["problem_id"], []).append(r["topic_name"])

        enriched = []
        for p in problems:
            p_meta = p.get("metadata") or {}
            # Guarantee safety flags remain unconfirmed
            if not p_meta.get("company_metadata_status"):
                p_meta["company_metadata_status"] = COMPANY_METADATA_REQUIRES_MAPPING
            if not p_meta.get("records_metadata_status"):
                p_meta["records_metadata_status"] = SEMANTICS_UNCONFIRMED

            p["topics"] = topic_map.get(p["id"], [])
            p["metadata"] = p_meta
            enriched.append(p)

        return enriched

    def get_selection_summary(self) -> Dict[str, Any]:
        """Provides availability counts across domains and difficulties for batch planning."""
        sql = """
        SELECT 
            d.name as domain_name,
            p.difficulty,
            count(*) as available_count
        FROM public.problems p
        LEFT JOIN public.domains d ON p.domain_id = d.id
        WHERE p.is_published = false
          AND p.workflow_status = 'draft'
          AND p.id NOT IN (
              SELECT bpi.problem_id 
              FROM public.batch_problem_items bpi 
              WHERE bpi.item_status NOT IN ('COMPLETED', 'FAILED')
          )
        GROUP BY d.name, p.difficulty
        ORDER BY d.name, p.difficulty;
        """
        rows = self.importer.run_query(sql)
        return {
            "available_for_batching": rows,
            "total_available": sum(r["available_count"] for r in rows),
        }
