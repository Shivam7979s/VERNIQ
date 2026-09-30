# Supabase Edge Functions (`supabase/functions`)

> **Runtime:** Deno / TypeScript  
> **Status:** Scaffolding Baseline (Phase 0)  

---

## Edge Function Architecture

Edge Functions handle server-side tasks requiring elevated privileges (`SUPABASE_SERVICE_ROLE_KEY`) or external webhook verifications.

Planned Functions:
- `submit-job`: Enqueues student code submissions to the Judge message queue.
- `mentor-chat`: Proxies Socratic chat queries to the FastAPI microservice with authentication validation.
- `stripe-webhook`: Handles subscription lifecycle events.
