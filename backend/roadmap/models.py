"""
VERNIQ Roadmap Domain Models
============================
Clean domain entities adhering strictly to the separation of concerns:
Roadmap owns progression; Problem Catalog owns canonical problems.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class LearningItemType(str, Enum):
    VIDEO = "VIDEO"
    ARTICLE = "ARTICLE"
    CONCEPT = "CONCEPT"
    LECTURE = "LECTURE"
    PRACTICE = "PRACTICE"
    PROBLEM = "PROBLEM"
    QUIZ = "QUIZ"
    PROJECT = "PROJECT"
    REVISION = "REVISION"
    MOCK_INTERVIEW = "MOCK_INTERVIEW"


class RoadmapItemStatus(str, Enum):
    LOCKED = "LOCKED"
    AVAILABLE = "AVAILABLE"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"


@dataclass
class ProblemSummary:
    """Read-only view of a problem from the Problem Catalog."""
    verniq_id: str
    title: str
    difficulty: str
    slug: str
    topics: List[str] = field(default_factory=list)


@dataclass
class RoadmapProblemReference:
    """Reference to a canonical problem in the Problem Catalog."""
    id: str
    roadmap_item_id: str
    verniq_problem_id: str
    position: int = 0
    required: bool = True
    notes: Optional[str] = None
    problem_summary: Optional[ProblemSummary] = None


@dataclass
class RoadmapItem:
    id: str
    day_id: str
    topic_id: Optional[str]
    title: str
    description: Optional[str]
    item_type: LearningItemType
    position: int = 0
    required: bool = True
    estimated_minutes: int = 20
    content_url: Optional[str] = None
    content_markdown: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    problem_reference: Optional[RoadmapProblemReference] = None
    status: RoadmapItemStatus = RoadmapItemStatus.AVAILABLE


@dataclass
class RoadmapTopic:
    id: str
    day_id: str
    title: str
    description: Optional[str]
    position: int = 0
    items: List[RoadmapItem] = field(default_factory=list)


@dataclass
class RoadmapDay:
    id: str
    sprint_id: str
    day_number: int
    title: str
    description: Optional[str]
    learning_objectives: List[str] = field(default_factory=list)
    position: int = 0
    topics: List[RoadmapTopic] = field(default_factory=list)
    items: List[RoadmapItem] = field(default_factory=list)
    status: RoadmapItemStatus = RoadmapItemStatus.AVAILABLE


@dataclass
class RoadmapSprint:
    id: str
    roadmap_id: str
    phase_id: Optional[str]
    title: str
    slug: str
    description: Optional[str]
    position: int = 0
    estimated_hours: float = 10.0
    is_published: bool = True
    days: List[RoadmapDay] = field(default_factory=list)
    status: RoadmapItemStatus = RoadmapItemStatus.AVAILABLE


@dataclass
class RoadmapPhase:
    id: str
    roadmap_id: str
    title: str
    slug: str
    description: Optional[str]
    position: int = 0


@dataclass
class Roadmap:
    id: str
    title: str
    slug: str
    description: Optional[str]
    estimated_duration: str = "~120 Hours"
    total_sprints: int = 0
    icon_name: str = "Compass"
    position: int = 0
    is_published: bool = True
    phases: List[RoadmapPhase] = field(default_factory=list)
    sprints: List[RoadmapSprint] = field(default_factory=list)


@dataclass
class UserItemProgress:
    user_id: str
    roadmap_item_id: str
    status: RoadmapItemStatus
    completed_at: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class UserRoadmapProgress:
    user_id: str
    roadmap_id: str
    current_sprint_id: Optional[str] = None
    current_day_id: Optional[str] = None
    current_item_id: Optional[str] = None
    status: str = "in_progress"
    completed_items_count: int = 0
    total_items_count: int = 0
    last_accessed_at: Optional[str] = None


@dataclass
class ProgressSummary:
    completed_items: int
    total_items: int
    percentage: int
    completed_days: int
    total_days: int
    status: RoadmapItemStatus


@dataclass
class ContinueLearningTarget:
    roadmap_id: str
    sprint_id: str
    sprint_title: str
    day_id: str
    day_number: int
    day_title: str
    item_id: str
    item_title: str
    item_type: LearningItemType
    verniq_problem_id: Optional[str] = None
    problem_slug: Optional[str] = None
    problem_title: Optional[str] = None
    problem_difficulty: Optional[str] = None
    estimated_minutes: int = 20
