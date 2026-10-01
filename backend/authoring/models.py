"""
VERNIQ Problem Content Authoring & Provenance Domain Models
============================================================
Defines domain entities, enums, checklists, and data structures
for the problem authoring lifecycle, provenance tracking, quality gates,
and production batch operations (Phase 4.2).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class ProblemWorkflowStatus(str, Enum):
    """Lifecycle states for problem catalog items."""
    DRAFT = "draft"
    CONTENT_AUTHORING = "content_authoring"
    CONTENT_REVIEW = "content_review"
    TECHNICAL_REVIEW = "technical_review"
    PROVENANCE_REVIEW = "provenance_review"
    JUDGE_READY = "judge_ready"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class BatchLifecycleStatus(str, Enum):
    """Lifecycle states for a controlled authoring batch."""
    CREATED = "CREATED"
    SELECTED = "SELECTED"
    AUTHORING = "AUTHORING"
    CONTENT_REVIEW = "CONTENT_REVIEW"
    TECHNICAL_REVIEW = "TECHNICAL_REVIEW"
    PROVENANCE_REVIEW = "PROVENANCE_REVIEW"
    JUDGE_VALIDATION = "JUDGE_VALIDATION"
    HUMAN_APPROVAL = "HUMAN_APPROVAL"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class BatchItemStatus(str, Enum):
    """Lifecycle states for individual problem items within a batch."""
    SELECTED = "SELECTED"
    AUTHORING = "AUTHORING"
    CONTENT_REVIEW = "CONTENT_REVIEW"
    CONTENT_REVIEW_BLOCKED = "CONTENT_REVIEW_BLOCKED"
    TECHNICAL_REVIEW = "TECHNICAL_REVIEW"
    TECHNICAL_REVIEW_BLOCKED = "TECHNICAL_REVIEW_BLOCKED"
    PROVENANCE_REVIEW = "PROVENANCE_REVIEW"
    PROVENANCE_REVIEW_BLOCKED = "PROVENANCE_REVIEW_BLOCKED"
    JUDGE_VALIDATION = "JUDGE_VALIDATION"
    JUDGE_VALIDATION_BLOCKED = "JUDGE_VALIDATION_BLOCKED"
    HUMAN_APPROVAL = "HUMAN_APPROVAL"
    APPROVED = "APPROVED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class AuthoringFailureStep(str, Enum):
    """Categorized failure points for granular retry."""
    CONTENT_GENERATION_FAILED = "CONTENT_GENERATION_FAILED"
    TEST_GENERATION_FAILED = "TEST_GENERATION_FAILED"
    TECHNICAL_REVIEW_FAILED = "TECHNICAL_REVIEW_FAILED"
    JUDGE_FAILED = "JUDGE_FAILED"
    PROVENANCE_FAILED = "PROVENANCE_FAILED"


class BlockerStatus(str, Enum):
    """Actionable blockers preventing forward state progression."""
    CONTENT_REVIEW_BLOCKED = "CONTENT_REVIEW_BLOCKED"
    TECHNICAL_REVIEW_BLOCKED = "TECHNICAL_REVIEW_BLOCKED"
    PROVENANCE_REVIEW_BLOCKED = "PROVENANCE_REVIEW_BLOCKED"
    JUDGE_VALIDATION_BLOCKED = "JUDGE_VALIDATION_BLOCKED"


class ProvenanceSourceType(str, Enum):
    """Provenance origin types."""
    VERNIQ_ORIGINAL = "verniq_original"
    LICENSED = "licensed"
    OPEN_LICENSE = "open_license"
    COMMUNITY_CONTRIBUTED = "community_contributed"
    EXTERNAL_REFERENCE = "external_reference"
    UNKNOWN_PENDING_REVIEW = "unknown_pending_review"


class ProvenanceVerificationStatus(str, Enum):
    """Provenance audit verification states."""
    PENDING_REVIEW = "pending_review"
    VERIFIED_VALID = "verified_valid"
    REJECTED = "rejected"


class TechnicalReviewStatus(str, Enum):
    """Technical evaluation outcomes."""
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"


class TestCaseCategory(str, Enum):
    """Granular categorization for problem test vectors."""
    SAMPLE = "sample"
    VISIBLE = "visible"
    HIDDEN = "hidden"
    EDGE_CASE = "edge_case"
    STRESS = "stress"
    ADVERSARIAL = "adversarial"
    BOUNDARY = "boundary"


class JudgeReadinessStatus(str, Enum):
    """Readiness status for sandbox code evaluation."""
    NOT_READY = "NOT_READY"
    TESTS_PENDING = "TESTS_PENDING"
    LIMITS_PENDING = "LIMITS_PENDING"
    JUDGE_READY = "JUDGE_READY"


class AuthorType(str, Enum):
    """Origin of problem authorship."""
    HUMAN = "human"
    AI_ASSISTED = "ai_assisted"
    COMMUNITY = "community"
    IMPORTED = "imported"


# Minimum canonical tests requirements per difficulty
MIN_CANONICAL_TESTS = {
    "easy": 200,
    "medium": 250,
    "hard": 300,
}

# Permitted batch sizes
SUPPORTED_BATCH_SIZES = [20, 50, 100, 250]
DEFAULT_BATCH_SIZE = 50

# Unresolved raw metadata flags (must remain unconfirmed until source meaning is verified)
COMPANY_METADATA_REQUIRES_MAPPING = "COMPANY_METADATA_REQUIRES_MAPPING"
SEMANTICS_UNCONFIRMED = "SEMANTICS_UNCONFIRMED"


@dataclass
class TechnicalChecklist:
    """9-point rigorous technical quality verification checklist."""
    statement_consistent: bool = False
    examples_correct: bool = False
    constraints_consistent: bool = False
    edge_cases_covered: bool = False
    solution_logic_valid: bool = False
    starter_templates_compile: bool = False
    canonical_tests_valid: bool = False
    expected_outputs_correct: bool = False
    languages_compatible: bool = False

    def is_complete(self) -> bool:
        """Returns True if every required technical check passes."""
        return all([
            self.statement_consistent,
            self.examples_correct,
            self.constraints_consistent,
            self.edge_cases_covered,
            self.solution_logic_valid,
            self.starter_templates_compile,
            self.canonical_tests_valid,
            self.expected_outputs_correct,
            self.languages_compatible,
        ])

    def to_dict(self) -> Dict[str, bool]:
        return {
            "statement_consistent": self.statement_consistent,
            "examples_correct": self.examples_correct,
            "constraints_consistent": self.constraints_consistent,
            "edge_cases_covered": self.edge_cases_covered,
            "solution_logic_valid": self.solution_logic_valid,
            "starter_templates_compile": self.starter_templates_compile,
            "canonical_tests_valid": self.canonical_tests_valid,
            "expected_outputs_correct": self.expected_outputs_correct,
            "languages_compatible": self.languages_compatible,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> TechnicalChecklist:
        return cls(
            statement_consistent=bool(data.get("statement_consistent", False)),
            examples_correct=bool(data.get("examples_correct", False)),
            constraints_consistent=bool(data.get("constraints_consistent", False)),
            edge_cases_covered=bool(data.get("edge_cases_covered", False)),
            solution_logic_valid=bool(data.get("solution_logic_valid", False)),
            starter_templates_compile=bool(data.get("starter_templates_compile", False)),
            canonical_tests_valid=bool(data.get("canonical_tests_valid", False)),
            expected_outputs_correct=bool(data.get("expected_outputs_correct", False)),
            languages_compatible=bool(data.get("languages_compatible", False)),
        )


@dataclass
class ContentSnapshot:
    """Immutable snapshot of problem content for revision tracking."""
    title: str
    description_markdown: str
    constraints_markdown: str
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    examples: List[Dict[str, Any]] = field(default_factory=list)
    edge_cases: List[str] = field(default_factory=list)
    hints: List[str] = field(default_factory=list)
    starter_templates: Dict[str, str] = field(default_factory=dict)
    time_limit_ms: int = 2000
    memory_limit_mb: int = 256
    supported_languages: List[str] = field(default_factory=lambda: ["cpp", "python", "java", "typescript", "go"])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "description_markdown": self.description_markdown,
            "constraints_markdown": self.constraints_markdown,
            "input_format": self.input_format,
            "output_format": self.output_format,
            "examples": self.examples,
            "edge_cases": self.edge_cases,
            "hints": self.hints,
            "starter_templates": self.starter_templates,
            "time_limit_ms": self.time_limit_ms,
            "memory_limit_mb": self.memory_limit_mb,
            "supported_languages": self.supported_languages,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> ContentSnapshot:
        return cls(
            title=data.get("title", ""),
            description_markdown=data.get("description_markdown", ""),
            constraints_markdown=data.get("constraints_markdown", ""),
            input_format=data.get("input_format"),
            output_format=data.get("output_format"),
            examples=data.get("examples") or [],
            edge_cases=data.get("edge_cases") or [],
            hints=data.get("hints") or [],
            starter_templates=data.get("starter_templates") or {},
            time_limit_ms=int(data.get("time_limit_ms", 2000)),
            memory_limit_mb=int(data.get("memory_limit_mb", 256)),
            supported_languages=data.get("supported_languages") or ["cpp", "python", "java", "typescript", "go"],
        )


@dataclass
class ValidationResult:
    """Outcome of quality gate evaluation."""
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    gates_passed: Dict[str, bool] = field(default_factory=dict)


@dataclass
class TestSuiteMetrics:
    """Detailed category breakdown and compliance evaluation for problem test suites."""
    total: int = 0
    sample: int = 0
    visible: int = 0
    hidden: int = 0
    edge: int = 0
    stress: int = 0
    adversarial: int = 0
    boundary: int = 0
    unique_inputs_count: int = 0
    difficulty: str = "easy"
    min_required: int = 200
    meets_minimum: bool = False
    is_deterministic: bool = True
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total": self.total,
            "sample": self.sample,
            "visible": self.visible,
            "hidden": self.hidden,
            "edge": self.edge,
            "stress": self.stress,
            "adversarial": self.adversarial,
            "boundary": self.boundary,
            "unique_inputs_count": self.unique_inputs_count,
            "difficulty": self.difficulty,
            "min_required": self.min_required,
            "meets_minimum": self.meets_minimum,
            "is_deterministic": self.is_deterministic,
            "errors": self.errors,
            "warnings": self.warnings,
        }


@dataclass
class BatchDefinition:
    """Represents an authoring batch record."""
    id: str
    batch_name: str
    target_count: int
    actual_count: int = 0
    batch_status: BatchLifecycleStatus = BatchLifecycleStatus.CREATED
    authoring_status: str = "PENDING"
    review_status: str = "PENDING"
    completion_percentage: float = 0.0
    failure_count: int = 0
    published_count: int = 0
    selection_criteria: Dict[str, Any] = field(default_factory=dict)
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    completed_at: Optional[str] = None


@dataclass
class BatchProblemItem:
    """Represents a problem assigned to an authoring batch."""
    id: str
    batch_id: str
    problem_id: str
    item_status: BatchItemStatus = BatchItemStatus.SELECTED
    assigned_author_id: Optional[str] = None
    assigned_reviewer_id: Optional[str] = None
    failure_step: Optional[AuthoringFailureStep] = None
    failure_reason: Optional[str] = None
    retry_count: int = 0
    content_completeness_pct: int = 0
    test_completeness_pct: int = 0
    judge_readiness_pct: int = 0


@dataclass
class AuthoringQueueItem:
    """Structured representation of a catalog problem in the authoring queue."""
    id: str
    verniq_id: str
    title: str
    difficulty: str
    domain: str
    topics: List[str]
    workflow_status: str
    provenance_status: str
    content_completeness: int
    test_completeness: int
    judge_readiness: str
    assigned_batch_id: Optional[str] = None
    assigned_batch_name: Optional[str] = None
    assigned_author: Optional[str] = None
    ai_assisted: bool = False
    human_reviewed: bool = False
    is_published: bool = False
