"""
VERNIQ Problem Dataset Validator
================================
Validates raw problem catalog CSV datasets against the Phase 3.0 Dataset Contract.

Guarantees:
- Never modifies the source file (strictly read-only).
- Zero silent repairs: invalid entries, duplicate IDs, and malformed fields are explicitly flagged.
- Reports exact row numbers (1-indexed CSV line numbers), column names, and offending values.
"""

from __future__ import annotations

import csv
import hashlib
import json
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

REQUIRED_COLUMNS: List[str] = [
    "Verniq_ID",
    "Title",
    "difficulty",
    "Topics",
    "companies",
    "records",
]

VALID_DIFFICULTIES: Set[str] = {"easy", "medium", "hard"}


@dataclass
class ValidationError:
    """Represents a discrete validation issue found within the dataset."""
    row_number: int  # 1-indexed line number in the CSV file
    column: str
    error_type: str  # missing_value, duplicate_value, invalid_enum, malformed_format, schema_mismatch
    message: str
    offending_value: Optional[str] = None


@dataclass
class ValidationReport:
    """Complete diagnostic report for a validated problem dataset."""
    file_path: str
    file_sha256: str
    file_size_bytes: int
    is_valid: bool
    total_rows: int
    valid_rows: int
    errors: List[ValidationError] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    difficulty_counts: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    unique_verniq_ids: int = 0
    unique_titles: int = 0
    duplicate_verniq_ids: Dict[str, List[int]] = field(default_factory=dict)
    duplicate_titles: Dict[str, List[int]] = field(default_factory=dict)

    @property
    def error_count(self) -> int:
        return len(self.errors)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["error_count"] = self.error_count
        return d

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    def to_markdown_summary(self) -> str:
        status_badge = "✅ PASSED" if self.is_valid else "❌ FAILED"
        lines = [
            f"# Problem Dataset Validation Report",
            f"- **Target File**: `{self.file_path}`",
            f"- **File Size**: {self.file_size_bytes:,} bytes",
            f"- **SHA-256**: `{self.file_sha256}`",
            f"- **Validation Status**: **{status_badge}**",
            f"- **Total Rows Parsed**: {self.total_rows:,}",
            f"- **Valid Rows**: {self.valid_rows:,}",
            f"- **Error Count**: {self.error_count}",
            f"- **Unique Verniq_IDs**: {self.unique_verniq_ids:,}",
            f"- **Unique Titles**: {self.unique_titles:,}",
            "",
            "## Difficulty Distribution",
        ]
        for diff, count in sorted(self.difficulty_counts.items()):
            lines.append(f"- **{diff.title()}**: {count:,}")

        if self.warnings:
            lines.append("\n## Warnings")
            for w in self.warnings:
                lines.append(f"- ⚠️ {w}")

        if self.duplicate_verniq_ids:
            lines.append("\n## Duplicate Verniq_ID Errors")
            for vid, rows in list(self.duplicate_verniq_ids.items())[:20]:
                lines.append(f"- ID `{vid}` occurs on rows: {rows}")
            if len(self.duplicate_verniq_ids) > 20:
                lines.append(f"- ... and {len(self.duplicate_verniq_ids) - 20} more duplicate IDs.")

        if self.errors:
            lines.append("\n## Detailed Errors (First 25)")
            for err in self.errors[:25]:
                val_disp = f" (Value: `{err.offending_value}`)" if err.offending_value is not None else ""
                lines.append(f"- **Row {err.row_number}** [{err.column}]: {err.message}{val_disp}")
            if len(self.errors) > 25:
                lines.append(f"- ... and {len(self.errors) - 25} more errors.")

        return "\n".join(lines)


class ProblemValidator:
    """Validates problem catalog CSV files against contract specifications."""

    def __init__(self, strict_mode: bool = True):
        self.strict_mode = strict_mode

    @staticmethod
    def compute_sha256(file_path: Path) -> str:
        """Compute SHA-256 checksum of a file without loading entire file in memory."""
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                hasher.update(chunk)
        return hasher.hexdigest()

    def validate_file(self, file_path_str: str | Path) -> ValidationReport:
        """Run complete contract validation on a problem CSV file."""
        path = Path(file_path_str)

        if not path.exists():
            return ValidationReport(
                file_path=str(path),
                file_sha256="",
                file_size_bytes=0,
                is_valid=False,
                total_rows=0,
                valid_rows=0,
                errors=[
                    ValidationError(
                        row_number=0,
                        column="file",
                        error_type="file_not_found",
                        message=f"File does not exist: {path}",
                    )
                ],
            )

        if path.stat().st_size == 0:
            return ValidationReport(
                file_path=str(path),
                file_sha256="",
                file_size_bytes=0,
                is_valid=False,
                total_rows=0,
                valid_rows=0,
                errors=[
                    ValidationError(
                        row_number=0,
                        column="file",
                        error_type="empty_file",
                        message=f"File is completely empty: {path}",
                    )
                ],
            )

        sha256_hash = self.compute_sha256(path)
        file_size = path.stat().st_size

        errors: List[ValidationError] = []
        warnings: List[str] = []
        difficulty_counts: Dict[str, int] = defaultdict(int)

        verniq_id_to_rows: Dict[str, List[int]] = defaultdict(list)
        title_to_rows: Dict[str, List[int]] = defaultdict(list)

        total_rows = 0
        valid_rows = 0

        # Read strictly as read-only UTF-8
        try:
            with open(path, mode="r", encoding="utf-8-sig", newline="") as csvfile:
                # Use standard csv.reader to check header
                reader = csv.reader(csvfile)
                try:
                    header = next(reader)
                except StopIteration:
                    errors.append(
                        ValidationError(
                            row_number=1,
                            column="header",
                            error_type="missing_header",
                            message="CSV contains no header line.",
                        )
                    )
                    return ValidationReport(
                        file_path=str(path),
                        file_sha256=sha256_hash,
                        file_size_bytes=file_size,
                        is_valid=False,
                        total_rows=0,
                        valid_rows=0,
                        errors=errors,
                    )

                # Clean header names (strip whitespace)
                cleaned_header = [h.strip() for h in header]

                # Check required columns
                missing_columns = [col for col in REQUIRED_COLUMNS if col not in cleaned_header]
                if missing_columns:
                    for mc in missing_columns:
                        errors.append(
                            ValidationError(
                                row_number=1,
                                column=mc,
                                error_type="missing_column",
                                message=f"Required column '{mc}' is missing from header.",
                            )
                        )

                extra_columns = [col for col in cleaned_header if col not in REQUIRED_COLUMNS]
                if extra_columns:
                    warnings.append(
                        f"Found unexpected extra columns in header: {extra_columns}. These will be ignored."
                    )

                # If missing required columns, stop row iteration
                if missing_columns:
                    return ValidationReport(
                        file_path=str(path),
                        file_sha256=sha256_hash,
                        file_size_bytes=file_size,
                        is_valid=False,
                        total_rows=0,
                        valid_rows=0,
                        errors=errors,
                        warnings=warnings,
                    )

                # Map column name to index
                col_index = {col: cleaned_header.index(col) for col in REQUIRED_COLUMNS}

                # Row-by-row validation
                line_number = 1  # header was row 1
                for raw_row in reader:
                    line_number += 1
                    total_rows += 1
                    row_has_error = False

                    # Check column count
                    if len(raw_row) != len(header):
                        errors.append(
                            ValidationError(
                                row_number=line_number,
                                column="row",
                                error_type="malformed_format",
                                message=f"Row has {len(raw_row)} fields, expected {len(header)} fields.",
                                offending_value=",".join(raw_row)[:100],
                            )
                        )
                        row_has_error = True
                        continue

                    # Extract required fields
                    v_id = raw_row[col_index["Verniq_ID"]].strip()
                    title = raw_row[col_index["Title"]].strip()
                    diff = raw_row[col_index["difficulty"]].strip()
                    topics = raw_row[col_index["Topics"]].strip()
                    companies = raw_row[col_index["companies"]].strip()
                    records = raw_row[col_index["records"]].strip()

                    # 1. Validate Verniq_ID
                    if not v_id:
                        errors.append(
                            ValidationError(
                                row_number=line_number,
                                column="Verniq_ID",
                                error_type="missing_value",
                                message="Verniq_ID is empty or blank.",
                            )
                        )
                        row_has_error = True
                    else:
                        verniq_id_to_rows[v_id].append(line_number)

                    # 2. Validate Title
                    if not title:
                        errors.append(
                            ValidationError(
                                row_number=line_number,
                                column="Title",
                                error_type="missing_value",
                                message="Title is empty or blank.",
                            )
                        )
                        row_has_error = True
                    else:
                        title_to_rows[title].append(line_number)

                    # 3. Validate difficulty
                    if not diff:
                        errors.append(
                            ValidationError(
                                row_number=line_number,
                                column="difficulty",
                                error_type="missing_value",
                                message="difficulty is empty or blank.",
                            )
                        )
                        row_has_error = True
                    elif diff.lower() not in VALID_DIFFICULTIES:
                        errors.append(
                            ValidationError(
                                row_number=line_number,
                                column="difficulty",
                                error_type="invalid_enum",
                                message=f"Invalid difficulty value '{diff}'. Expected one of {sorted(VALID_DIFFICULTIES)}.",
                                offending_value=diff,
                            )
                        )
                        row_has_error = True
                    else:
                        difficulty_counts[diff.lower()] += 1

                    # 4. Validate Topics
                    if not topics:
                        errors.append(
                            ValidationError(
                                row_number=line_number,
                                column="Topics",
                                error_type="missing_value",
                                message="Topics field is empty or blank.",
                            )
                        )
                        row_has_error = True
                    else:
                        # Check for malformed syntax (e.g., unbalanced brackets or control characters)
                        if topics.count("[") != topics.count("]") or topics.count("(") != topics.count(")"):
                            errors.append(
                                ValidationError(
                                    row_number=line_number,
                                    column="Topics",
                                    error_type="malformed_format",
                                    message=f"Topics field contains unbalanced brackets: '{topics}'.",
                                    offending_value=topics,
                                )
                            )
                            row_has_error = True
                        elif any(ord(char) < 32 and char not in "\t\n\r" for char in topics):
                            errors.append(
                                ValidationError(
                                    row_number=line_number,
                                    column="Topics",
                                    error_type="malformed_format",
                                    message="Topics field contains illegal unescaped control characters.",
                                    offending_value=topics,
                                )
                            )
                            row_has_error = True

                    # 5. Raw fields check (companies, records)
                    # Note: per contract, we preserve raw values without numeric assumptions.
                    # We only flag if the column is physically missing from the row, which is guarded by len(raw_row).

                    if not row_has_error:
                        valid_rows += 1

        except UnicodeDecodeError as ude:
            errors.append(
                ValidationError(
                    row_number=0,
                    column="encoding",
                    error_type="encoding_error",
                    message=f"File encoding is not valid UTF-8: {str(ude)}",
                )
            )
        except csv.Error as csve:
            errors.append(
                ValidationError(
                    row_number=0,
                    column="csv_syntax",
                    error_type="malformed_csv",
                    message=f"CSV parser error: {str(csve)}",
                )
            )
        except Exception as e:
            errors.append(
                ValidationError(
                    row_number=0,
                    column="system",
                    error_type="read_error",
                    message=f"Unexpected error while reading CSV: {str(e)}",
                )
            )

        # Post-scan duplicate analysis
        duplicate_vids: Dict[str, List[int]] = {
            v_id: rows for v_id, rows in verniq_id_to_rows.items() if len(rows) > 1
        }
        if duplicate_vids:
            for vid, rows in duplicate_vids.items():
                for row_idx in rows[1:]:  # report duplicates on subsequent rows
                    errors.append(
                        ValidationError(
                            row_number=row_idx,
                            column="Verniq_ID",
                            error_type="duplicate_value",
                            message=f"Duplicate Verniq_ID '{vid}' already exists on row {rows[0]}.",
                            offending_value=vid,
                        )
                    )

        duplicate_titles: Dict[str, List[int]] = {
            title: rows for title, rows in title_to_rows.items() if len(rows) > 1
        }
        if duplicate_titles:
            warnings.append(
                f"Found {len(duplicate_titles)} duplicate title(s) across different rows. "
                "These should be inspected for slug collisions."
            )

        is_valid = len(errors) == 0

        return ValidationReport(
            file_path=str(path),
            file_sha256=sha256_hash,
            file_size_bytes=file_size,
            is_valid=is_valid,
            total_rows=total_rows,
            valid_rows=valid_rows,
            errors=errors,
            warnings=warnings,
            difficulty_counts=dict(difficulty_counts),
            unique_verniq_ids=len(verniq_id_to_rows),
            unique_titles=len(title_to_rows),
            duplicate_verniq_ids=duplicate_vids,
            duplicate_titles=duplicate_titles,
        )
