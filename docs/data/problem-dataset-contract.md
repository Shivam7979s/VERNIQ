# VERNIQ Problem Catalog Dataset Contract & Ingestion Specification

> **Document Version:** 1.0.0  
> **Status:** Production Standard  
> **Target Phase:** Phase 3.0 (Foundation) & Phase 3.1+ (Staged Execution)  
> **Location:** `docs/data/problem-dataset-contract.md`

---

## 1. Executive Summary

This document establishes the binding dataset contract for the VERNIQ Problem Catalog ingestion pipeline. It details the required source CSV schema, strict validation rules, raw-data preservation guarantees, and the future pipeline stages required before database insertion into Supabase PostgreSQL.

The initial dataset consists of approximately **3,392 problem records**. Under Phase 3.0, the platform guarantees the storage infrastructure, integrity validation, and failure-reporting mechanisms without prematurely modifying or importing the records.

---

## 2. Source CSV Schema Contract

The source dataset must strictly match the following schema definition:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VERNIQ RAW DATASET SCHEMA                       │
├──────────────┬──────────────────┬──────────────┬───────────────────────┤
│ Column       │ Source Type      │ Target Type  │ Nullable / Required   │
├──────────────┼──────────────────┼──────────────┼───────────────────────┤
│ Verniq_ID    │ String / Integer │ String       │ NOT NULL / UNIQUE     │
│ Title        │ String           │ String       │ NOT NULL              │
│ difficulty   │ String           │ Enum         │ NOT NULL              │
│ Topics       │ String           │ List[String] │ NOT NULL              │
│ companies    │ String / Numeric │ Raw Field    │ NOT NULL (Raw Value)  │
│ records      │ String / Numeric │ Raw Field    │ NOT NULL (Raw Value)  │
└──────────────┴──────────────────┴──────────────┴───────────────────────┘
```

### 2.1 Column Definitions & Constraints

#### 1. `Verniq_ID`
- **Definition**: The unique external identifier assigned to the problem record in the raw catalog.
- **Contract Rules**:
  - Must be non-empty and non-whitespace.
  - Must be unique across all rows in the dataset.
  - Zero duplicate IDs permitted.
  - Preserved verbatim without re-indexing.

#### 2. `Title`
- **Definition**: The canonical display name of the algorithmic problem.
- **Contract Rules**:
  - Must be a non-empty string.
  - Must not consist exclusively of whitespace.
  - Duplicate titles across distinct `Verniq_ID`s are detected and flagged in validation diagnostics.

#### 3. `difficulty`
- **Definition**: Categorical problem difficulty tier.
- **Contract Rules**:
  - Must evaluate case-insensitively to one of the canonical tiers:
    - `Easy` (maps to `public.difficulty_level` enum `'easy'`)
    - `Medium` (maps to `public.difficulty_level` enum `'medium'`)
    - `Hard` (maps to `public.difficulty_level` enum `'hard'`)
  - Any other value (e.g., `Expert`, `Advanced`, `None`, empty) is treated as a fatal schema violation.

#### 4. `Topics`
- **Definition**: Algorithmic classification and data structure categories associated with the problem.
- **Contract Rules**:
  - Raw strings containing topics (e.g. `"Array, Two Pointers"`, `"Dynamic Programming"`).
  - Must not be structurally malformed (e.g., unclosed delimiters, invalid characters).
  - Individual topic tokens will be normalized into lowercase slugs and mapped to `public.tags` in Phase 3.1.

#### 5. `companies`
- **Definition**: Raw source attribute from the initial dataset.
- **Contract Rules**:
  - **CRITICAL RESTRICTION**: Do NOT assume numeric values represent company counts, problem IDs, or any specific semantic metric.
  - Stored verbatim as a raw source field.
  - No column renaming or type coercion is allowed during Phase 3.0.

#### 6. `records`
- **Definition**: Raw source attribute from the initial dataset.
- **Contract Rules**:
  - **CRITICAL RESTRICTION**: Do NOT assume numeric values represent submission statistics, acceptance records, or benchmark counts.
  - Stored verbatim as a raw source field.
  - No column renaming or type coercion is allowed during Phase 3.0.

---

## 3. Raw Data Preservation Mandate

To guarantee reproducibility, auditability, and data provenance:

1. **Byte-for-Byte Preservation**:
   All original problem CSV files must be deposited into:
   ```
   data/problems/raw/
   ```
   and kept completely untouched.
2. **Read-Only Ingestion**:
   Importers, parsers, and validation tools MUST open raw files in read-only mode (`r` with `newline=''`). Under no circumstance may any script write back or update files in `data/problems/raw/`.
3. **Derived Outputs Isolation**:
   - Validated snapshots: `data/problems/staging/`
   - Normalized relational representations: `data/problems/processed/`

---

## 4. Validation Engine Specifications

The validation suite (`backend/importer/validator.py`) enforces strict validation across six dimensions:

```
                ┌─────────────────────────────────┐
                │          RAW CSV INPUT          │
                └────────────────┬────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│ Header Conformance │ │  Syntax & Delimiter│ │  Cell Integrity    │
│ - Exact columns    │ │ - RFC 4180 parsing │ │ - Non-null checks  │
│ - No missing cols  │ │ - Quote validation │ │ - Non-empty titles │
└────────────────────┘ └────────────────────┘ └────────────────────┘
           │                     │                     │
           └─────────────────────┼─────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│   Enum Validation  │ │   Uniqueness Audit │ │   Report Generator │
│ - Easy/Med/Hard    │ │ - Unique Verniq_ID │ │ - Row-by-row logs  │
│ - Case-insensitive │ │ - Unique Titles    │ │ - Summary metrics  │
└────────────────────┘ └────────────────────┘ └────────────────────┘
```

### Rejection Policy:
- **Zero Silent Repairs**: Invalid values, trailing malformed quotes, and duplicate IDs are never silently discarded or auto-corrected.
- **Full Traceability**: Every error includes:
  - Row number (1-indexed CSV line)
  - Column name
  - Offending value
  - Error category
  - Remediation guidance

---

## 5. Roadmap to Phase 3.1: Staged Pipeline Execution

Phase 3.0 establishes the contract and verification tools. Future phases will proceed according to the following verified sequence:

1. **Phase 3.0 (Current)**:
   - Directory foundation (`raw/`, `staging/`, `processed/`).
   - Contract documentation.
   - Validation engine and CLI entry point.
   - Preservation standards established.
2. **Phase 3.1 (Normalization & Staging)**:
   - Ingestion of the 3,392-problem CSV into `raw/`.
   - Execution of `validator.py` on the real file.
   - Generation of staged, clean dataset in `staging/`.
   - Slug generation and slug collision resolution.
3. **Phase 3.2 (Relational Taxonomy & DB Ingestion)**:
   - Tag extraction and upsert into `public.tags`.
   - Idempotent upsert of 3,392 problems into `public.problems`.
   - Tag-to-problem relational mapping in `public.problem_tags`.
   - Validation against Supabase constraints and RLS policies.
