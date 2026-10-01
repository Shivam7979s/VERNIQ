# VERNIQ — Problem Content Authoring Specification

## 1. Overview & Architectural Principles

The Verniq Content Authoring Pipeline establishes the infrastructure required to transform raw catalog index records into fully authored, pedagogically rigorous, mathematically sound, and original engineering problems.

Verniq maintains an authoritative catalog of **3,392 problems** with permanent, immutable Verniq IDs:
```
VRQ-000001
VRQ-000002
...
VRQ-003392
```

Every problem authored in the Verniq platform must strictly adhere to the following core tenets:

1. **Permanent Identity**: Verniq IDs are never renumbered, recycled, or duplicated. All revisions, reviews, and test suites are linked directly to the permanent UUID and Verniq ID.
2. **Original Expression**: Verniq does not copy, scrape, or reproduce third-party copyrighted expression. An underlying algorithmic concept (e.g., Two Pointers, Dynamic Programming, Disjoint-Set Union) is universal, but the narrative statement, constraints, examples, explanations, and test cases must be independently composed by Verniq authors.
3. **Structured Content Model**: Content is stored in discrete, validated relational fields rather than opaque blobs, enabling rich rendering, multi-language starter code generation, and automated validation.
4. **Immutable Revision History**: Every content update generates an immutable revision in `problem_content_revisions`, preserving complete historical traceability.
5. **Separation of Concerns**: Problem authoring is strictly decoupled from provenance review, technical review, and judge execution enablement.

---

## 2. Problem Content Schema

The core `public.problems` table has been extended with high-precision engineering specifications:

| Field | Type | Description |
|---|---|---|
| `verniq_id` | `text UNIQUE` | Permanent catalog identifier (`VRQ-000001` to `VRQ-003392`). |
| `title` | `text` | Authored problem title. |
| `slug` | `text UNIQUE` | URL-safe slug for workspace routing (`/problems/:slug`). |
| `difficulty` | `difficulty_level` | `easy`, `medium`, or `hard`. |
| `domain_id` | `uuid FK` | Primary engineering domain (`DSA`, `SYSTEMS`, `DATABASE`, `CONCURRENCY`, `NETWORKING`). |
| `description_markdown`| `text` | Complete, original problem description written in GitHub-flavored Markdown. |
| `input_format` | `text` | Precise specification of input data types, bounds, and order. |
| `output_format` | `text` | Precise specification of return types, formatting, and mathematical bounds. |
| `constraints_markdown`| `text` | Formal mathematical and runtime constraints. |
| `edge_cases` | `jsonb` | Array of critical boundary conditions that solutions must handle. |
| `hints` | `jsonb` | Array of progressive socratic hints for guided learning. |
| `starter_templates` | `jsonb` | Idiomatic starter code for all 5 supported languages (`cpp`, `python`, `java`, `typescript`, `go`). |
| `time_limit_ms` | `integer` | Sandbox CPU execution limit in milliseconds (default: 2000 ms). |
| `memory_limit_mb` | `integer` | Sandbox memory allocation limit in megabytes (default: 256 MB). |
| `supported_languages` | `text[]` | Array of verified languages for this problem. |
| `author_type` | `text` | `human`, `ai_assisted`, `community`, or `imported`. |
| `generated_with_ai` | `boolean` | Flag indicating whether AI assistance was used during draft formulation. |
| `human_reviewed` | `boolean` | Flag indicating whether a human engineer has thoroughly reviewed and certified the content. |
| `workflow_status` | `enum` | Active lifecycle stage in the authoring pipeline. |
| `provenance_status` | `enum` | IP clearance status (`VERIFIED_VALID`, `PROVENANCE_REVIEW_REQUIRED`, `REJECTED`). |
| `judge_readiness_status` | `enum` | Judge execution clearance (`NOT_READY`, `TESTS_PENDING`, `JUDGE_READY`). |
| `is_published` | `boolean` | Publication state in the public problem workspace. |

---

## 3. Original Expression Guidelines

Verniq maintains strict standards regarding intellectual property and pedagogical quality:

### Permitted
- Implementing standard, universal algorithmic concepts (e.g., Dijkstra's algorithm, sliding window maximum, LRU eviction semantics, topological sort).
- Original scenario modeling, problem narrative, and variable naming.
- Custom-generated mathematical constraints calibrated to standard hardware limits (10^8 operations per second).
- Independently constructed test vectors, sample cases, and explanations.

### Strictly Prohibited
- Copying third-party problem statements word-for-word.
- Copying exact examples, input/output values, or story narratives from proprietary platforms (LeetCode, Codeforces, HackerRank, etc.).
- Copying third-party editorial explanations or proprietary diagrams.
- Reusing proprietary hidden test suites.

---

## 4. Multi-Language Starter Code Standards

Every authored problem must provide production-grade, idiomatic starter templates for all 5 supported languages:

1. **C++ (C++20)**:
   ```cpp
   #include <vector>
   #include <string>

   class Solution {
   public:
       // Implement optimal solution
   };
   ```
2. **Python (Python 3.11)**:
   ```python
   class Solution:
       def solve(self) -> int:
           # Implement optimal solution
           pass
   ```
3. **Java (OpenJDK 21)**:
   ```java
   class Solution {
       public int solve() {
           // Implement optimal solution
           return 0;
       }
   }
   ```
4. **TypeScript (Node.js 20)**:
   ```typescript
   function solve(): number {
       // Implement optimal solution
       return 0;
   }
   ```
5. **Go (Go 1.22)**:
   ```go
   package main

   func solve() int {
       // Implement optimal solution
       return 0;
   }
   ```

---

## 5. Content Revision & Audit Trail Model

Every time a draft is saved or transitioned, an entry is recorded in `public.problem_content_revisions`:

```sql
CREATE TABLE public.problem_content_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    author_id UUID REFERENCES auth.users(id),
    author_type TEXT NOT NULL DEFAULT 'human',
    generated_with_ai BOOLEAN NOT NULL DEFAULT false,
    human_reviewed BOOLEAN NOT NULL DEFAULT false,
    content_snapshot JSONB NOT NULL,
    review_status TEXT NOT NULL DEFAULT 'draft',
    change_summary TEXT NOT NULL,
    source_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
```

### Snapshot Structure
The `content_snapshot` JSONB contains a complete, self-contained record of the problem at that revision:
```json
{
  "title": "Two Sum",
  "difficulty": "easy",
  "description_markdown": "...",
  "constraints_markdown": "...",
  "input_format": "...",
  "output_format": "...",
  "edge_cases": [...],
  "hints": [...],
  "starter_templates": {...},
  "time_limit_ms": 2000,
  "memory_limit_mb": 256,
  "supported_languages": ["cpp", "python", "java", "typescript", "go"]
}
```

---

## 6. AI-Assisted Authoring Standards

When AI generation is utilized to draft candidates for problem statements, hints, or test vectors:

1. **Transparency**: `generated_with_ai` is permanently set to `true`.
2. **Attribution**: `author_type` is set to `ai_assisted`.
3. **Human Review Gate**: AI-generated content can **NEVER** bypass human review. The database check constraint `chk_problems_publication_gates` strictly forbids `is_published = true` when `generated_with_ai = true` unless `human_reviewed = true`.
4. **Pluggable Architecture**: The `BaseAIAuthoringProvider` abstraction in `backend/authoring/ai_provider.py` ensures Verniq is provider-agnostic, supporting OpenAI, Anthropic, Gemini, or self-hosted LLM endpoints.
