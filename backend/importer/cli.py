"""
VERNIQ Problem Catalog CLI Entry Point
======================================
Usage:
  python -m backend.importer.cli validate --file data/problems/raw/source.csv
  python -m backend.importer.cli report --file data/problems/raw/source.csv [--format markdown|json]
  python -m backend.importer.cli stage --file data/problems/raw/source.csv
  python -m backend.importer.cli check-dirs
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .pipeline import ProblemImportPipeline
from .validator import ProblemValidator


def cmd_check_dirs(pipeline: ProblemImportPipeline) -> int:
    """Verifies that all required dataset directories exist."""
    print("Checking VERNIQ Problem Catalog directory hierarchy...")
    dirs = [
        ("Raw Directory", pipeline.raw_dir),
        ("Staging Directory", pipeline.staging_dir),
        ("Processed Directory", pipeline.processed_dir),
    ]

    all_ok = True
    for label, d in dirs:
        exists = d.exists() and d.is_dir()
        status = "OK" if exists else "MISSING"
        print(f"  [{status}] {label}: {d}")
        if not exists:
            all_ok = False

    readme_path = pipeline.base_dir / "data" / "problems" / "README.md"
    readme_exists = readme_path.exists()
    print(f"  [{'OK' if readme_exists else 'MISSING'}] Catalog README: {readme_path}")
    if not readme_exists:
        all_ok = False

    if all_ok:
        print("\nAll problem dataset locations are correctly configured.")
        return 0
    else:
        print("\nOne or more problem dataset locations are missing.", file=sys.stderr)
        return 1


def cmd_validate(pipeline: ProblemImportPipeline, file_path: Path) -> int:
    """Validates a dataset against the Phase 3.0 schema contract."""
    print(f"Validating problem dataset: {file_path}")
    report = pipeline.validate(file_path)

    print("-" * 60)
    print(f"File SHA-256 : {report.file_sha256}")
    print(f"File Size    : {report.file_size_bytes:,} bytes")
    print(f"Total Rows   : {report.total_rows:,}")
    print(f"Valid Rows   : {report.valid_rows:,}")
    print(f"Error Count  : {report.error_count}")
    print("-" * 60)

    if report.warnings:
        print("\nWarnings:")
        for w in report.warnings:
            print(f"  [WARN] {w}")

    if report.is_valid:
        print("\n SUCCESS: Dataset passed all contract validations.")
        print("Difficulty distribution:")
        for diff, count in sorted(report.difficulty_counts.items()):
            print(f"  - {diff.title()}: {count:,}")
        return 0
    else:
        print(f"\n FAILURE: Dataset failed contract validation with {report.error_count} error(s):", file=sys.stderr)
        for err in report.errors[:20]:
            val = f" (Value: '{err.offending_value}')" if err.offending_value is not None else ""
            print(f"  [Row {err.row_number}] [{err.column}]: {err.message}{val}", file=sys.stderr)
        if len(report.errors) > 20:
            print(f"  ... and {len(report.errors) - 20} more error(s).", file=sys.stderr)
        return 1


def cmd_report(pipeline: ProblemImportPipeline, file_path: Path, output_format: str) -> int:
    """Outputs a full validation report in Markdown or JSON format."""
    report = pipeline.validate(file_path)
    if output_format.lower() == "json":
        print(report.to_json(indent=2))
    else:
        print(report.to_markdown_summary())
    return 0 if report.is_valid else 1


def cmd_stage(pipeline: ProblemImportPipeline, file_path: Path) -> int:
    """Safely stages a validated dataset into data/problems/staging/."""
    print(f"Attempting to stage: {file_path}")
    result = pipeline.stage_dataset(file_path)
    if result["success"]:
        print(f" Successfully staged to: {result['staged_path']}")
        print(f" Manifest generated at: {result['manifest_path']}")
        return 0
    else:
        print(f" Staging failed: {result['error']}", file=sys.stderr)
        return 1


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="verniq-importer",
        description="VERNIQ Problem Catalog Ingestion & Validation CLI (Phase 3.0)",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # check-dirs
    subparsers.add_parser("check-dirs", help="Check that problem catalog directories exist")

    # validate
    validate_parser = subparsers.add_parser("validate", help="Validate a CSV problem dataset")
    validate_parser.add_argument("--file", "-f", required=True, type=Path, help="Path to the CSV file")

    # report
    report_parser = subparsers.add_parser("report", help="Generate a comprehensive validation report")
    report_parser.add_argument("--file", "-f", required=True, type=Path, help="Path to the CSV file")
    report_parser.add_argument(
        "--format",
        choices=["markdown", "json"],
        default="markdown",
        help="Report output format (default: markdown)",
    )

    # stage
    stage_parser = subparsers.add_parser("stage", help="Validate and stage dataset to data/problems/staging/")
    stage_parser.add_argument("--file", "-f", required=True, type=Path, help="Path to the source CSV file")

    args = parser.parse_args()

    pipeline = ProblemImportPipeline()

    if args.command == "check-dirs":
        sys.exit(cmd_check_dirs(pipeline))
    elif args.command == "validate":
        sys.exit(cmd_validate(pipeline, args.file))
    elif args.command == "report":
        sys.exit(cmd_report(pipeline, args.file, args.format))
    elif args.command == "stage":
        sys.exit(cmd_stage(pipeline, args.file))
    else:
        parser.print_help()
        sys.exit(0)


if __name__ == "__main__":
    main()
