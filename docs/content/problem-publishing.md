# VERNIQ — Problem Publishing & Judge Readiness Specification

## 1. Publication & Judge-Readiness Gating

In Verniq, a problem can **NEVER** become published or judge-ready merely because markdown content exists in the database.

Publication and judge execution are protected by both:
1. Application-level pipeline validation (`backend/authoring/validator.py`)
2. Database-level check constraints (`chk_problems_publication_gates`)

---

## 2. Judge-Readiness Gates

Sandbox code execution is strictly disabled for all problems in stages:
- `draft`
- `content_authoring`
- `content_review`
- `technical_review`
- `provenance_review`

A problem may only transition to `JUDGE_READY` when all of the following conditions are met:
1. **Complete Content Specification**: Non-empty description, formal constraints, input format, and output format.
2. **Multi-Language Starter Code**: Valid templates for C++, Python, Java, TypeScript, and Go.
3. **Canonical Test Suite**: At least one verified active test case registered in `public.test_cases`.
4. **Execution Boundaries**: Verified `time_limit_ms` (50–10000) and `memory_limit_mb` (16–1024).
5. **Technical Review Sign-off**: Approved 9-point technical checklist recorded in `public.problem_technical_reviews`.
6. **Provenance Clearance**: `provenance_status` verified as `VERIFIED_VALID`.

---

## 3. Test Case Taxonomy & Model

The `public.test_cases` table supports 5 distinct test categories:

```sql
CREATE TYPE public.test_case_category AS ENUM (
    'sample',      -- Visible in problem workspace description and test console
    'visible',     -- Visible in test runner tabs for debugging
    'hidden',      -- Evaluated only during full judge submission
    'edge_case',   -- Targeted boundary/extreme condition test
    'stress'       -- Maximum constraint scale test to catch TLE/MLE
);
```

### Table Schema
```sql
ALTER TABLE public.test_cases
    ADD COLUMN category public.test_case_category NOT NULL DEFAULT 'sample',
    ADD COLUMN explanation TEXT,
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
```

---

## 4. Database-Enforced Publication Gate

Migration 11 enforces database invariants that cannot be bypassed even by direct SQL queries:

```sql
ALTER TABLE public.problems
    ADD CONSTRAINT chk_problems_publication_gates
    CHECK (
        is_published = false
        OR (
            workflow_status = 'published'
            AND judge_readiness_status = 'JUDGE_READY'
            AND provenance_status = 'VERIFIED_VALID'
            AND (generated_with_ai = false OR human_reviewed = true)
        )
    );
```

### Attempting to publish without passing gates:
If any script or user attempts:
```sql
UPDATE public.problems SET is_published = true WHERE verniq_id = 'VRQ-000004';
```
PostgreSQL will immediately reject the operation with a check constraint violation error:
```
ERROR: 23514: new row for relation "problems" violates check constraint "chk_problems_publication_gates"
```

---

## 5. Controlled Batch Authoring Workflow

For future content scale-up across the 3,386 catalog index records, Verniq uses the `AuthoringBatchManager` (`backend/authoring/batch_manager.py`):

```
SELECT CANDIDATE BATCH (e.g. 20 problems by topic)
          │
          ▼
   FORMULATE DRAFTS (Independent narrative & templates)
          │
          ▼
   CONTENT REVIEW (Pedagogical quality & language)
          │
          ▼
   TECHNICAL REVIEW (9-point invariant sign-off)
          │
          ▼
   PROVENANCE REVIEW (IP clearance)
          │
          ▼
   ACTIVATE JUDGE ASSETS (Test suite validation)
          │
          ▼
   STAGED PUBLICATION (Production activation)
```

### Batch Safety Rules:
- **Never bulk-publish**: Every problem must independently pass all 7 lifecycle gates.
- **Never auto-approve AI output**: `generated_with_ai = true` mandates human engineering sign-off.
- **Permanent Verniq IDs**: Batch authoring never mutates, re-orders, or recycles Verniq IDs.
