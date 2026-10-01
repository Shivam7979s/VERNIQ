# VERNIQ — Problem Review Workflow & Lifecycle Specification

## 1. The 7-Stage Controlled Lifecycle

The Verniq Content Authoring Pipeline governs every problem transition through a formal 7-stage state machine:

```
               [DRAFT]
                  │
                  ▼
         [CONTENT_AUTHORING]
                  │
                  ▼
          [CONTENT_REVIEW]
                  │
                  ▼
         [TECHNICAL_REVIEW]
                  │
                  ▼
        [PROVENANCE_REVIEW]
                  │
                  ▼
           [JUDGE_READY]
                  │
                  ▼
            [PUBLISHED]
```

At any point prior to publication, a problem can be safely retired to `ARCHIVED`.

---

## 2. State Transition Matrix & Invariants

| Stage | Permitted Successors | Prerequisites |
|---|---|---|
| `draft` | `content_authoring`, `archived` | Problem exists in catalog index. |
| `content_authoring` | `content_review`, `draft`, `archived` | Initial draft markdown and starter templates saved. |
| `content_review` | `technical_review`, `content_authoring`, `archived` | Pedagogical clarity, grammar, topic tagging verified. |
| `technical_review` | `provenance_review`, `content_review`, `archived` | **9-Point Technical Review Checklist** approved. |
| `provenance_review`| `judge_ready`, `content_review`, `archived` | Intellectual property cleared (`provenance_status = 'VERIFIED_VALID'`). |
| `judge_ready` | `published`, `technical_review`, `archived` | Test suite verified, limits configured, sandbox certified. |
| `published` | `archived` | All publication gates validated green. |
| `archived` | `draft` | Explicit administrative reopening. |

---

## 3. The 9-Point Technical Review Invariants

Before any problem can pass the `technical_review` gate, a verified engineer or domain expert must sign off on the 9 technical review invariants recorded in `public.problem_technical_reviews`:

```json
{
  "statement_consistent": true,
  "examples_correct": true,
  "constraints_consistent": true,
  "behavior_unambiguous": true,
  "edge_cases_covered": true,
  "solution_valid": true,
  "complexity_reasonable": true,
  "templates_compile": true,
  "test_cases_valid": true
}
```

### Invariant Details:
1. **Statement Consistency**: Terminology, variable names, and problem requirements are internally consistent from start to finish.
2. **Examples Correctness**: Every sample input produces the mathematically and logically exact sample output listed in the statement.
3. **Constraint Bounds**: Constraints represent valid domain bounds (e.g., array length $N \ge 1$, node values within standard integer ranges).
4. **Unambiguous Behavior**: Specification defines behavior for edge scenarios (e.g., ties, empty subsets, negative values) without room for multiple interpretations.
5. **Edge Cases Covered**: Boundary conditions (empty inputs, single elements, duplicates, extreme values) are identified and tested.
6. **Solution Logic Valid**: The reference solution passes all sample and hidden test cases within expected time complexity.
7. **Reasonable Complexity**: Theoretical time and space complexity ($O(N \log N)$, $O(N)$) align with sandbox time (2000 ms) and memory limits (256 MB).
8. **Templates Compile**: Starter code signatures across C++, Python, Java, TypeScript, and Go compile cleanly without syntax or typing errors.
9. **Test Cases Valid**: Canonical test cases match the required input format and expected output format.

---

## 4. Technical Review Database Record

```sql
CREATE TABLE public.problem_technical_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    revision_id UUID REFERENCES public.problem_content_revisions(id),
    reviewer_id UUID REFERENCES auth.users(id),
    status public.technical_review_status NOT NULL DEFAULT 'PENDING',
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
```

---

## 5. Automated Validation Engine

The `ProblemValidator` in `backend/authoring/validator.py` executes automated quality checks on every transition:
- Verifies description markdown is non-empty and does not contain draft quarantine placeholders.
- Verifies at least 1 structured example with input, output, and rationale exists.
- Verifies formal mathematical constraints are present.
- Verifies input format and output format are specified.
- Verifies starter templates exist for all 5 languages.
- Verifies sandbox time limits (50 ms – 10,000 ms) and memory limits (16 MB – 1,024 MB).
- Validates the 9-point technical checklist before permitting transition to `provenance_review` or `judge_ready`.
