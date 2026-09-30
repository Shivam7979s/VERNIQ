# Supabase Database Migrations (`supabase/migrations`)

> **Phase 0 Status:** Architectural standards established. Zero premature tables created.

---

## Migration Rules

1. **Immutable & Version Controlled:** All production and staging database schemas are generated strictly through versioned migrations in this directory.
2. **Naming Standard:**
   ```
   YYYYMMDDHHMMSS_<descriptive_action>.sql
   ```
3. **Execution Order:** Migrations are applied in alphabetical/chronological order.
4. **Phase 1 Kickoff:**
   Phase 1 will introduce the foundational identity and user profile schema:
   - `20261001000000_init_user_profiles_and_roles.sql`
   - Enabling RLS, creating triggers for `handle_updated_at`, and linking to `auth.users`.
