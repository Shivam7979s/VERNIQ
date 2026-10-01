"""
VERNIQ Problem Content Authoring & Provenance Architecture Package
==================================================================
Production-scale content authoring pipeline (Phase 4.2).
"""

from .models import (
    AuthorType,
    AuthoringFailureStep,
    BatchDefinition,
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
    TechnicalReviewStatus,
    TestCaseCategory,
    TestSuiteMetrics,
    ValidationResult,
)
from .validator import ProblemValidator
from .pipeline import ContentAuthoringPipeline
from .selection import ProblemSelectionEngine
from .ai_provider import (
    BaseAIAuthoringProvider,
    MockDeterministicAuthoringProvider,
    AnthropicAuthoringProvider,
    GeminiAuthoringProvider,
    OpenAIAuthoringProvider,
    OllamaLocalAuthoringProvider,
    VerniqAuthoringAssistant,
    get_ai_authoring_provider,
)
from .batch_manager import AuthoringBatchManager

__all__ = [
    "AuthorType",
    "AuthoringFailureStep",
    "BatchDefinition",
    "BatchItemStatus",
    "BatchLifecycleStatus",
    "BlockerStatus",
    "COMPANY_METADATA_REQUIRES_MAPPING",
    "ContentSnapshot",
    "DEFAULT_BATCH_SIZE",
    "JudgeReadinessStatus",
    "MIN_CANONICAL_TESTS",
    "ProblemWorkflowStatus",
    "ProvenanceSourceType",
    "ProvenanceVerificationStatus",
    "SEMANTICS_UNCONFIRMED",
    "SUPPORTED_BATCH_SIZES",
    "TechnicalChecklist",
    "TechnicalReviewStatus",
    "TestCaseCategory",
    "TestSuiteMetrics",
    "ValidationResult",
    "ProblemValidator",
    "ContentAuthoringPipeline",
    "ProblemSelectionEngine",
    "BaseAIAuthoringProvider",
    "MockDeterministicAuthoringProvider",
    "AnthropicAuthoringProvider",
    "GeminiAuthoringProvider",
    "OpenAIAuthoringProvider",
    "OllamaLocalAuthoringProvider",
    "VerniqAuthoringAssistant",
    "get_ai_authoring_provider",
    "AuthoringBatchManager",
]
