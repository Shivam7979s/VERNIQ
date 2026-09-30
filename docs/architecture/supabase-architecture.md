# VERNIQ Supabase Architecture & Security Model

> **Document Version:** 1.0.0  
> **Status:** Canonical Backend & Security Specification  
> **Backend Platform:** Supabase (PostgreSQL 16 Engine)  

---

## 1. Core Supabase Responsibilities

```
                                  ┌───────────────────────────┐
                                  │       Supabase Core       │
                                  └─────────────┬─────────────┘
          ┌─────────────────────┬───────────────┼───────────────┬─────────────────────┐
          │                     │               │               │                     │
┌─────────▼─────────┐ ┌─────────▼─────────┐ ┌───▼───┐ ┌─────────▼─────────┐ ┌─────────▼─────────┐
│   Supabase Auth   │ │   PostgreSQL 16   │ │Storage│ │ Supabase Realtime │ │   Edge Functions    │
│  (JWT, Sessions,  │ │  (Normalized DB,  │ │(Assets│ │(Submissions, Live │ │  (Deno TS, Webhooks,│
│   OAuth, Roles)   │ │  RLS, pgvector)   │ │Blobs) │ │  Contests, Chat)  │ │  Privileged Tasks)  │
└───────────────────┘ └───────────────────┘ └───────┘ └───────────────────┘ └───────────────────┘
```

### 1.1 Supabase Auth
- **Authentication Providers:** Email + Password, Magic Link (passwordless), GitHub OAuth, Google OAuth.
- **Identity Storage:** Managed within `auth.users`. Each user has an immutable UUID (`auth.uid()`).
- **Session Tokens:** Emits standard signed JSON Web Tokens (JWT) containing user ID, email, role, and custom application metadata.
- **Role-Based Access Control (RBAC):** Roles (`student`, `mentor`, `admin`) are stored in `auth.users.raw_app_meta_data` or a dedicated `public.user_roles` table, preventing client modification.

### 1.2 PostgreSQL 16 & Relational Core
- Primary datastore enforcing referential integrity, foreign key cascades, and check constraints.
- Optimized connection pooling via Supavisor for scalable query handling.
- Integrated extensions:
  - `pgcrypto`: Cryptographic hashing and UUID generation (`gen_random_uuid()`).
  - `pgvector`: High-dimensional vector indexing (`HNSW` / `IVFFlat`) for curriculum and problem embeddings.
  - `pg_trgm`: Trigram fuzzy search indexing for instant problem search.

### 1.3 Supabase Storage
- Bucket segregation:
  - `avatars` (Public read, user-restricted write).
  - `problem-assets` (Public read, admin-only write).
  - `submission-artefacts` (Private read, judge/user restricted).
- Bucket policies enforce size limits (e.g. max 2MB for avatars) and MIME type whitelists (PNG, JPG, WebP, SVG).

### 1.4 Supabase Realtime
- WebSocket channels listening to PostgreSQL Write-Ahead Logs (WAL) via logical replication:
  - Real-time submission execution tickers (`UPDATE on submissions WHERE user_id = auth.uid()`).
  - Live contest leaderboards (`broadcast` channel to prevent DB write storms).
  - Synchronized collaborative interview sessions (`presence` state).

### 1.5 Supabase Edge Functions (Deno / TypeScript)
- Serverless functions used for operations that require privilege escalation:
  - Stripe webhook processing (subscription provisioning).
  - Enqueueing code evaluation jobs to the Online Judge worker queue.
  - Proxying requests to the FastAPI AI service with signed authorization headers.

---

## 2. Row Level Security (RLS) Architecture

The security model adheres to **Default-Deny Least Privilege**. Every single table created in `public` must execute:

```sql
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
```

### 2.1 RLS Policy Taxonomy

| Pattern | Access Rule | Policy Implementation Example |
|---|---|---|
| **Public Read-Only** | Any user or guest can view published content. | `CREATE POLICY "Public read-only" ON public.problems FOR SELECT USING (is_published = true);` |
| **Owner CRUD** | User can only read and mutate records they own. | `CREATE POLICY "User own data" ON public.submissions FOR ALL USING (user_id = auth.uid());` |
| **Admin Bypass** | Platform administrators have full oversight. | `CREATE POLICY "Admin full access" ON public.problems FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');` |
| **Read After Submission** | Students can view peer solutions only after solving. | `CREATE POLICY "Read solutions after solve" ON public.solutions FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_problem_progress WHERE user_id = auth.uid() AND problem_id = solutions.problem_id AND status = 'solved'));` |

---

## 3. Strict Credential & Secret Isolation Rules

1. **Frontend Bundle Security:**
   - The frontend application (`apps/web`) is distributed to untrusted browsers.
   - It **MUST ONLY** receive:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - The frontend **MUST NEVER** receive `SUPABASE_SERVICE_ROLE_KEY` or any database connection strings (`postgres://...`).
2. **Never Trust Client Claims:**
   - Any parameter supplied in an HTTP request body (such as `user_id`, `role`, or `is_premium`) is untrusted. All database mutations rely on `auth.uid()` and server-evaluated RLS policies.
3. **Audit Logging:**
   - High-privilege administrative actions (modifying problem test cases, banning users) are captured in an immutable `audit_logs` table via database triggers.

---

## 4. Integration Topologies with AI and Judge Services

```
AI Integration Flow:
  [Client Browser]
        │ (1. POST /api/v1/mentor/chat with Supabase JWT)
        ▼
  [FastAPI Microservice]
        │ (2. Validates JWT against Supabase Auth JWKS)
        │ (3. Vector similarity query via pgvector)
        ▼
  [PostgreSQL (pgvector)]

Judge Integration Flow:
  [Client Browser]
        │ (1. POST /functions/v1/submit with JWT & Code)
        ▼
  [Supabase Edge Function]
        │ (2. Enqueues job to Redis queue using private secret)
        ▼
  [Job Queue (Redis)]
        │ (3. Dequeues job)
        ▼
  [Isolated Judge Worker Sandbox]
        │ (4. Executes code, writes verdict back via Edge webhook)
        ▼
  [PostgreSQL (submissions table)]
        │ (5. Realtime WAL pushes status back to browser)
        ▼
  [Client Browser]
```
