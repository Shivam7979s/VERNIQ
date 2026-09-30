# VERNIQ Database Conventions & Schema Standards

> **Document Version:** 1.0.0  
> **Status:** Mandatory Architectural Standard  
> **Database Engine:** PostgreSQL 16 (Supabase Managed)  

---

## 1. Relational Modeling Principles

1. **Normalized Relational Design by Default:** VERNIQ prioritizes Third Normal Form (3NF). Data must not be casually stuffed into unstructured JSONB columns. Entity relationships (e.g. Problems, Tags, Roadmaps, Submissions) must be modeled using distinct relational tables with foreign keys.
2. **Explicit Foreign Key Constraints:** Every relational association must enforce referential integrity using explicit `REFERENCES` and defined `ON DELETE` behavior (`CASCADE`, `RESTRICT`, or `SET NULL`).
3. **No Unindexed Foreign Keys:** Every foreign key column must have an accompanying B-Tree index to avoid full table scans during cascade checks and joins.

---

## 2. Naming Conventions

All database identifiers must follow strict `snake_case` in American English:

| Object Type | Convention | Example | Prohibited |
|---|---|---|---|
| **Tables** | Plural, lower snake_case | `problems`, `user_profiles`, `test_cases` | `Problem`, `userProfile`, `Problems` |
| **Columns** | Singular, lower snake_case | `title`, `execution_time_ms`, `user_id` | `Title`, `executionTime`, `userId` |
| **Primary Key** | Always `id` | `id UUID PRIMARY KEY` | `problem_id`, `pk_problems` |
| **Foreign Key** | Singular referenced table + `_id` | `user_id`, `problem_id`, `roadmap_id` | `user`, `problemFK` |
| **Boolean Flag** | Prefixed with `is_`, `has_`, or `can_` | `is_published`, `has_solution`, `is_active`| `published`, `active` |
| **Timestamp** | Suffixed with `_at` | `created_at`, `updated_at`, `deleted_at` | `created_time`, `updatedDate` |
| **Date Column** | Suffixed with `_date` | `scheduled_date`, `due_date` | `scheduled`, `dueDay` |

---

## 3. Identifiers & Primary Key Strategy

- **Type:** `UUID` (Universally Unique Identifier).
- **Generator:** `gen_random_uuid()` (v4) or `uuidv7` for high-insertion tables.
- **Rationale:**
  - Prevents enumeration attacks (sequential integer guessing).
  - Enables distributed, offline, and client-side pre-generation of IDs where necessary.
  - Avoids integer overflow limits.
- **Standard Primary Key Definition:**
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  ```

---

## 4. Timestamps & Audit Trail

Every table must include standard tracking columns:

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
```

### 4.1 Automatic `updated_at` Trigger
An immutable trigger function is maintained across all mutable tables:

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to every table via:
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.my_table
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

---

## 5. Soft Deletion Policy

- **Standard:** VERNIQ prefers **hard deletes** (`DELETE CASCADE`) for transient or user-owned sub-resources (drafts, bookmark tags) to prevent query pollution and simplify RLS policies.
- **Exception for Critical Entities:** High-value business entities (User Accounts, Courses, Problems, Forum Discussions) implement soft deletion:
  - Column: `deleted_at TIMESTAMPTZ NULL DEFAULT NULL`.
  - An entity is active when `deleted_at IS NULL`.
  - Indexes on soft-deleted tables must include a partial filter: `WHERE deleted_at IS NULL`.

---

## 6. Index Naming Conventions

Indexes must follow predictable naming structures:

| Index Type | Pattern | Example |
|---|---|---|
| **B-Tree Primary Index** | `pk_<table_name>` | `pk_problems` |
| **Foreign Key Index** | `idx_<table_name>_<foreign_key_column>` | `idx_submissions_problem_id` |
| **Unique Index** | `uq_<table_name>_<column_names>` | `uq_users_username` |
| **Partial Index** | `idx_<table_name>_<columns>_<filter>` | `idx_problems_difficulty_published` |
| **Trigram Search Index** | `idx_trgm_<table_name>_<column>` | `idx_trgm_problems_title` |
| **Vector Index** | `idx_vec_<table_name>_<column>` | `idx_vec_curriculum_embedding` |

---

## 7. Constraint Standards

- **Check Constraints (`chk_`):** Enforce domain boundaries at the database level:
  ```sql
  CONSTRAINT chk_problems_time_limit CHECK (time_limit_ms BETWEEN 100 AND 10000),
  CONSTRAINT chk_problems_memory_limit CHECK (memory_limit_mb BETWEEN 16 AND 1024)
  ```
- **Not Null:** Columns must be marked `NOT NULL` unless a `NULL` state is semantically valid.

---

## 8. Enum Strategy vs Lookup Tables

- **PostgreSQL Native Enums:** Used strictly for small, immutable, universal states that will not change dynamically without code deployments:
  ```sql
  CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
  CREATE TYPE submission_verdict AS ENUM ('ac', 'wa', 'tle', 'mle', 'ce', 're', 'pe');
  ```
- **Lookup Tables:** Used whenever categories require metadata, admin customization, or translations (e.g. `tags`, `skills`, `companies`).

---

## 9. JSONB Usage Governance

**JSONB is permitted only for:**
1. Dynamically configured test case metadata or compiler flags.
2. Structured user editor preferences (e.g. `{ "vim_mode": true, "tab_size": 2 }`).
3. External webhook payloads and raw telemetry logs.

**JSONB is strictly forbidden for:**
- Core relational links between entities.
- Fields that require frequent individual filtering, indexing, or sorting.
- Primary curriculum definitions.

---

## 10. Migration File Naming and Governance

All database changes must be version-controlled via immutable migrations stored in `supabase/migrations/`:

- **Format:** `<YYYYMMDDHHMMSS>_<descriptive_snake_case_action>.sql`
- **Example:** `20261001120000_create_problems_and_submissions.sql`
- **Rules:**
  1. Migrations must be idempotent and transactional.
  2. Never modify an existing migration file that has been merged into `main`.
  3. Every new table migration must include: Table definition, Primary/Foreign keys, Indexes, RLS activation, and RLS policies.
