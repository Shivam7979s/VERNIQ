# VERNIQ — Problem Provenance & Intellectual Property Model

## 1. Provenance Philosophy & Safety Imperative

Verniq is committed to the highest standards of intellectual property integrity. While mathematical concepts, algorithmic patterns, and computer science abstractions are universal, specific expressive implementations—including narrative statements, precise constraint formulations, hand-crafted examples, editorials, and hidden test suites—are protected under copyright law.

To safeguard the platform and its users, Verniq establishes a strict **Provenance Pipeline** that decouples problem references from copyrighted third-party expression.

---

## 2. Provenance Status Taxonomy

Every problem in the Verniq database maintains a first-class `provenance_status` attribute:

| Status | Meaning | Publication Allowed? |
|---|---|---|
| `PROVENANCE_REVIEW_REQUIRED` | Default state for all newly ingested catalog records. Rights or originality have not been legally certified. | **NO (Hard Block)** |
| `VERIFIED_VALID` | Rigorously reviewed by content legal/engineering leads. Clear rights or 100% original Verniq authorship established. | **YES (If all other gates pass)** |
| `REJECTED` | Intellectual property conflict detected, license unsuitable, or expressive similarity too high. Permanently quarantined. | **NO (Hard Block)** |

---

## 3. Supported Provenance Source Types

A single problem may link to one or more records in `public.problem_sources`. Each source record classifies the provenance origin:

```sql
CREATE TYPE public.provenance_source_type AS ENUM (
    'VERNIQ_ORIGINAL',          -- 100% authored from scratch by Verniq contributors
    'LICENSED',                 -- Commercial license acquired from original author/publisher
    'OPEN_LICENSE',             -- Permissive open-source license (MIT, CC-BY-SA, Apache-2.0, etc.)
    'COMMUNITY_CONTRIBUTED',    -- Contributed under Verniq Contributor License Agreement (CLA)
    'EXTERNAL_REFERENCE',       -- Conceptual/academic citation only (no copyrighted text copied)
    'UNKNOWN_PENDING_REVIEW'    -- Unclassified legacy/imported record awaiting clearance
);
```

### Required Source Metadata
Each `problem_sources` entry stores:
- `source_type`: One of the enum values above.
- `source_name`: Identifying name of the author, publication, competition, or repository.
- `source_url`: Verifiable URL of the original work.
- `source_identifier`: Upstream identifier (e.g., Olympiad year, contest problem ID).
- `license`: Explicit license code (e.g., `CC-BY-4.0`, `MIT`, `PROPRIETARY`).
- `license_url`: Link to the canonical license text.
- `attribution_required`: Boolean flag indicating if author attribution must be rendered.
- `commercial_use_allowed`: Boolean flag indicating whether commercial usage is legally cleared.
- `derivative_work_allowed`: Boolean flag indicating whether derivative adaptions are permitted.
- `verification_status`: `PENDING_REVIEW`, `VERIFIED_VALID`, or `REJECTED`.
- `verified_at`: Timestamp of legal/engineering certification.
- `verified_by`: User ID of certifying engineer.
- `provenance_notes`: Detailed audit commentary justifying the clearance determination.

---

## 4. Strict IP Guidelines

### Rule 1: No Inferred Rights from Public Accessibility
The fact that a problem statement is publicly viewable on a website or competitive programming forum **does not** imply a license for commercial or educational republishing. Rights must be explicitly licensed or governed by an unambiguous open license.

### Rule 2: Universal Algorithmic Concepts vs. Expressive Content
The pipeline strictly enforces the distinction between:
- **Universal Concepts (Freely Reusable)**: Binary search on monotonic functions, dynamic programming on trees, union-find with path compression, matrix exponentiation.
- **Expressive Content (Strictly Protected)**: Specific story narrative, character names, bespoke diagram artwork, exact sample input/output strings, proprietary constraint text, and internal judge test cases.

### Rule 3: Original Expression Standard
When authoring a Verniq problem based on a classic algorithmic concept:
- Formulate an entirely new, realistic scenario or clean mathematical formulation.
- Generate independent constraints calibrated to standard machine capabilities.
- Construct independent sample cases with clear explanatory rationales.
- Mark the source type as `VERNIQ_ORIGINAL` or cite the conceptual inspiration as `EXTERNAL_REFERENCE`.

---

## 5. Handling of Imported Phase 3 Metadata

The 3,386 catalog index records imported in Phase 3 carry historical raw source fields:
- `raw_source.companies`: Numeric identifier string (e.g. `"50, 48, 62"`).
- `raw_source.records`: Numeric count string (e.g. `"248"`).

### Quarantine Policy:
1. **Companies**: The source semantics of these numbers remain unverified. Verniq **does NOT** invent company relationships or speculate on their meaning. They remain quarantined in `metadata->'raw_source'->'companies'` with status `COMPANY_METADATA_REQUIRES_MAPPING`.
2. **Records**: The source semantics of this count remain unverified. Verniq **does NOT** interpret this field as submission counts, popularity, or difficulty. It remains quarantined in `metadata->'raw_source'->'records'`.
