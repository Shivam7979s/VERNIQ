"""
VERNIQ Roadmap Service
======================
High-performance database data access and progression orchestration.
Integrates read-only Problem Catalog data via permanent verniq_id.
"""

from __future__ import annotations
import json
import logging
from typing import Any, Dict, List, Optional

from backend.importer.importer import ProblemCatalogImporter
from .models import (
    ContinueLearningTarget,
    LearningItemType,
    ProblemSummary,
    Roadmap,
    RoadmapDay,
    RoadmapItem,
    RoadmapItemStatus,
    RoadmapPhase,
    RoadmapProblemReference,
    RoadmapSprint,
    RoadmapTopic,
    UserItemProgress,
    UserRoadmapProgress,
)
from .progress_engine import RoadmapProgressEngine

logger = logging.getLogger("verniq.roadmap")


class RoadmapService:
    """Service layer for roadmap operations, queries, and progression updates."""

    def __init__(self, importer: Optional[ProblemCatalogImporter] = None):
        self.importer = importer or ProblemCatalogImporter()

    def get_roadmap_by_slug(self, slug: str, user_id: Optional[str] = None) -> Optional[Roadmap]:
        """Loads complete hierarchical roadmap tree and merges read-only problem summaries."""
        clean_slug = slug.strip().replace("'", "''")

        # 1. Fetch Roadmap
        r_rows = self.importer.run_query(f"""
            SELECT id, title, slug, description, estimated_duration, total_sprints, icon_name, order_index, is_published
            FROM public.roadmaps
            WHERE slug = '{clean_slug}' AND is_published = true
            LIMIT 1;
        """)
        if not r_rows:
            return None
        r_row = r_rows[0]
        roadmap_id = r_row["id"]

        # 2. Fetch Phases
        phases = []
        phase_rows = self.importer.run_query(f"""
            SELECT id, roadmap_id, title, slug, description, position
            FROM public.roadmap_phases
            WHERE roadmap_id = '{roadmap_id}'
            ORDER BY position ASC;
        """)
        for p in phase_rows:
            phases.append(RoadmapPhase(
                id=p["id"],
                roadmap_id=p["roadmap_id"],
                title=p["title"],
                slug=p["slug"],
                description=p.get("description"),
                position=p["position"],
            ))

        # 3. Fetch Sprints
        sprint_rows = self.importer.run_query(f"""
            SELECT id, roadmap_id, phase_id, title, slug, description, position, estimated_hours, is_published
            FROM public.roadmap_sprints
            WHERE roadmap_id = '{roadmap_id}' AND is_published = true
            ORDER BY position ASC;
        """)

        # 4. Fetch Days
        day_rows = self.importer.run_query(f"""
            SELECT d.id, d.sprint_id, d.day_number, d.title, d.description, d.learning_objectives, d.position
            FROM public.roadmap_days d
            JOIN public.roadmap_sprints s ON d.sprint_id = s.id
            WHERE s.roadmap_id = '{roadmap_id}'
            ORDER BY d.position ASC;
        """)

        # 5. Fetch Topics
        topic_rows = self.importer.run_query(f"""
            SELECT t.id, t.day_id, t.title, t.description, t.position
            FROM public.roadmap_day_topics t
            JOIN public.roadmap_days d ON t.day_id = d.id
            JOIN public.roadmap_sprints s ON d.sprint_id = s.id
            WHERE s.roadmap_id = '{roadmap_id}'
            ORDER BY t.position ASC;
        """)

        # 6. Fetch Items
        item_rows = self.importer.run_query(f"""
            SELECT i.id, i.day_id, i.topic_id, i.title, i.description, i.item_type,
                   i.position, i.required, i.estimated_minutes, i.content_url,
                   i.content_markdown, i.metadata
            FROM public.roadmap_items i
            JOIN public.roadmap_days d ON i.day_id = d.id
            JOIN public.roadmap_sprints s ON d.sprint_id = s.id
            WHERE s.roadmap_id = '{roadmap_id}'
            ORDER BY i.position ASC;
        """)

        # 7. Fetch Problem References and join with Problem Catalog
        ref_rows = self.importer.run_query(f"""
            SELECT r.id, r.roadmap_item_id, r.verniq_problem_id, r.position, r.required, r.notes,
                   p.title as problem_title, p.difficulty as problem_difficulty, p.slug as problem_slug
            FROM public.roadmap_problem_references r
            JOIN public.roadmap_items i ON r.roadmap_item_id = i.id
            JOIN public.roadmap_days d ON i.day_id = d.id
            JOIN public.roadmap_sprints s ON d.sprint_id = s.id
            LEFT JOIN public.problems p ON p.verniq_id = r.verniq_problem_id
            WHERE s.roadmap_id = '{roadmap_id}'
            ORDER BY r.position ASC;
        """)

        # Map references by item_id
        ref_by_item: Dict[str, RoadmapProblemReference] = {}
        for ref in ref_rows:
            prob_summary = None
            if ref.get("problem_title"):
                prob_summary = ProblemSummary(
                    verniq_id=ref["verniq_problem_id"],
                    title=ref["problem_title"],
                    difficulty=ref["problem_difficulty"],
                    slug=ref["problem_slug"],
                )
            ref_by_item[ref["roadmap_item_id"]] = RoadmapProblemReference(
                id=ref["id"],
                roadmap_item_id=ref["roadmap_item_id"],
                verniq_problem_id=ref["verniq_problem_id"],
                position=ref["position"],
                required=ref["required"],
                notes=ref.get("notes"),
                problem_summary=prob_summary,
            )

        # Assemble items
        items_by_day: Dict[str, List[RoadmapItem]] = {}
        for item in item_rows:
            r_item = RoadmapItem(
                id=item["id"],
                day_id=item["day_id"],
                topic_id=item.get("topic_id"),
                title=item["title"],
                description=item.get("description"),
                item_type=LearningItemType(item["item_type"]),
                position=item["position"],
                required=item["required"],
                estimated_minutes=item.get("estimated_minutes", 20),
                content_url=item.get("content_url"),
                content_markdown=item.get("content_markdown"),
                metadata=item.get("metadata", {}),
                problem_reference=ref_by_item.get(item["id"]),
            )
            items_by_day.setdefault(item["day_id"], []).append(r_item)

        # Assemble topics
        topics_by_day: Dict[str, List[RoadmapTopic]] = {}
        for t in topic_rows:
            r_topic = RoadmapTopic(
                id=t["id"],
                day_id=t["day_id"],
                title=t["title"],
                description=t.get("description"),
                position=t["position"],
                items=[i for i in items_by_day.get(t["day_id"], []) if i.topic_id == t["id"]],
            )
            topics_by_day.setdefault(t["day_id"], []).append(r_topic)

        # Assemble days
        days_by_sprint: Dict[str, List[RoadmapDay]] = {}
        for d in day_rows:
            objectives = d.get("learning_objectives", [])
            if isinstance(objectives, str):
                try:
                    objectives = json.loads(objectives)
                except Exception:
                    objectives = []

            r_day = RoadmapDay(
                id=d["id"],
                sprint_id=d["sprint_id"],
                day_number=d["day_number"],
                title=d["title"],
                description=d.get("description"),
                learning_objectives=objectives,
                position=d["position"],
                topics=topics_by_day.get(d["id"], []),
                items=items_by_day.get(d["id"], []),
            )
            days_by_sprint.setdefault(d["sprint_id"], []).append(r_day)

        # Assemble sprints
        sprints: List[RoadmapSprint] = []
        for s in sprint_rows:
            r_sprint = RoadmapSprint(
                id=s["id"],
                roadmap_id=s["roadmap_id"],
                phase_id=s.get("phase_id"),
                title=s["title"],
                slug=s["slug"],
                description=s.get("description"),
                position=s["position"],
                estimated_hours=float(s.get("estimated_hours", 10.0)),
                is_published=s["is_published"],
                days=days_by_sprint.get(s["id"], []),
            )
            sprints.append(r_sprint)

        roadmap = Roadmap(
            id=roadmap_id,
            title=r_row["title"],
            slug=r_row["slug"],
            description=r_row.get("description"),
            estimated_duration=r_row.get("estimated_duration", "~120 Hours"),
            total_sprints=r_row.get("total_sprints", len(sprints)),
            icon_name=r_row.get("icon_name", "Compass"),
            position=r_row.get("order_index", 1),
            is_published=r_row["is_published"],
            phases=phases,
            sprints=sprints,
        )

        # If user_id provided, calculate dynamic locking and completion states
        if user_id:
            user_progress = self.get_user_progress_map(user_id, roadmap_id)
            roadmap = RoadmapProgressEngine.apply_locking_and_states(roadmap, user_progress)

        return roadmap

    def get_user_progress_map(self, user_id: str, roadmap_id: str) -> Dict[str, RoadmapItemStatus]:
        """Retrieves item completion map for a user on a given roadmap."""
        clean_user = user_id.replace("'", "''")
        rows = self.importer.run_query(f"""
            SELECT p.roadmap_item_id, p.status
            FROM public.user_roadmap_item_progress p
            WHERE p.user_id = '{clean_user}';
        """)
        return {r["roadmap_item_id"]: RoadmapItemStatus(r["status"]) for r in rows}

    def set_item_status(
        self,
        user_id: str,
        roadmap_item_id: str,
        status: RoadmapItemStatus,
        notes: Optional[str] = None,
    ) -> bool:
        """Sets status of an item (e.g. COMPLETED, IN_PROGRESS, SKIPPED) and updates aggregates."""
        clean_user = user_id.replace("'", "''")
        clean_item = roadmap_item_id.replace("'", "''")
        clean_status = status.value
        completed_clause = "NOW()" if status == RoadmapItemStatus.COMPLETED else "NULL"
        clean_notes = notes.replace("'", "''") if notes else None
        notes_clause = f"'{clean_notes}'" if clean_notes else "NULL"

        self.importer.run_query(f"""
            INSERT INTO public.user_roadmap_item_progress (user_id, roadmap_item_id, status, completed_at, notes, updated_at)
            VALUES ('{clean_user}', '{clean_item}', '{clean_status}', {completed_clause}, {notes_clause}, NOW())
            ON CONFLICT (user_id, roadmap_item_id) DO UPDATE
            SET status = EXCLUDED.status,
                completed_at = EXCLUDED.completed_at,
                notes = COALESCE(EXCLUDED.notes, public.user_roadmap_item_progress.notes),
                updated_at = NOW();
        """)
        return True

    def get_continue_learning(
        self,
        roadmap_slug: str,
        user_id: Optional[str] = None,
    ) -> Optional[ContinueLearningTarget]:
        """Calculates the deterministic next incomplete learning item for a user."""
        roadmap = self.get_roadmap_by_slug(roadmap_slug, user_id=user_id)
        if not roadmap:
            return None
        progress_map = self.get_user_progress_map(user_id, roadmap.id) if user_id else {}
        return RoadmapProgressEngine.resolve_continue_learning(roadmap, progress_map)
