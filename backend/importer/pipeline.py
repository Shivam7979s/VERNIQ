"""
VERNIQ Problem Catalog Import Pipeline Entry Point
=================================================
Safe, staged pipeline architecture for problem catalog data.

Phase 3.0 Scope:
- Ingestion validation & provenance verification.
- Safe non-destructive staging.
- Explicit prohibition of premature or fabricated database imports.
- Dry-run reporting.
"""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from .validator import ProblemValidator, ValidationReport


class ProblemImportPipeline:
    """Orchestrates the safe, staged ingestion of problem catalog datasets."""

    def __init__(
        self,
        base_dir: Optional[Path] = None,
        validator: Optional[ProblemValidator] = None,
    ):
        self.base_dir = base_dir or Path(__file__).resolve().parents[2]
        self.raw_dir = self.base_dir / "data" / "problems" / "raw"
        self.staging_dir = self.base_dir / "data" / "problems" / "staging"
        self.processed_dir = self.base_dir / "data" / "problems" / "processed"
        self.validator = validator or ProblemValidator(strict_mode=True)

        # Ensure directory structure exists
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.staging_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    def validate(self, file_path: str | Path) -> ValidationReport:
        """Run complete contract validation on a problem CSV file."""
        return self.validator.validate_file(file_path)

    def stage_dataset(
        self,
        raw_file_path: str | Path,
        staged_filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Safely validate and stage a raw dataset into `data/problems/staging/`.
        
        Guarantees:
        - The source file in `raw/` is never modified.
        - Fails if the dataset fails validation.
        - Produces a cryptographic manifest alongside the staged artifact.
        """
        raw_path = Path(raw_file_path).resolve()
        report = self.validate(raw_path)

        if not report.is_valid:
            return {
                "success": False,
                "error": f"Dataset validation failed with {report.error_count} error(s).",
                "report": report.to_dict(),
            }

        target_name = staged_filename or f"staged_{raw_path.name}"
        staged_path = self.staging_dir / target_name

        # Copy byte-for-byte to staging (never modifying the source)
        shutil.copyfile(raw_path, staged_path)

        # Generate cryptographic provenance manifest
        manifest = {
            "source_file": str(raw_path),
            "staged_file": str(staged_path),
            "staged_at": datetime.now(timezone.utc).isoformat(),
            "file_sha256": report.file_sha256,
            "file_size_bytes": report.file_size_bytes,
            "total_rows": report.total_rows,
            "valid_rows": report.valid_rows,
            "difficulty_counts": report.difficulty_counts,
            "unique_verniq_ids": report.unique_verniq_ids,
            "unique_titles": report.unique_titles,
            "status": "ready_for_phase_3_1_normalization",
        }

        manifest_path = staged_path.with_suffix(".manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as mf:
            json.dump(manifest, mf, indent=2)

        return {
            "success": True,
            "staged_path": str(staged_path),
            "manifest_path": str(manifest_path),
            "manifest": manifest,
            "report": report.to_dict(),
        }

    def execute_import(self, *args, **kwargs):
        """
        Phase Guard: Prohibits premature database import in Phase 3.0.
        
        In Phase 3.1, this method will execute transactional, idempotent batch
        insertion into Supabase `public.problems` and `public.tags`.
        """
        raise NotImplementedError(
            "PHASE 3.0 SAFETY GUARD: Database import is prohibited during Phase 3.0. "
            "Phase 3.0 is strictly dedicated to dataset location, contract definition, "
            "and validation scaffolding. Import execution will be implemented in Phase 3.1 "
            "upon delivery of the canonical 3,392-problem source CSV."
        )
