# VERNIQ Judge Execution Architecture
**Version**: 2.0 (Optimized Pipeline) | **Status**: Active Production Standard  
**Author**: Senior Distributed-Systems & Secure Online-Judge Architect  
**Date**: October 2026

---

## 1. System Topology & Request Lifecycle

```
                           VERNIQ Web Frontend
                        (Monaco Editor & Workspace)
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
         [Run Code]                                 [Submit]
   (Ephemeral Dev Run)                       (Canonical Evaluation)
              │                                         │
              │                                         ▼
              │                             Asynchronous DB Record
              │                              (Non-blocking write)
              │                                         │
              └────────────────────┬────────────────────┘
                                   │ HTTP POST /execute
                                   ▼
                    VERNIQ Threaded Judge HTTP Server
                       (Concurrency: 8 Workers)
                                   │
                                   ▼
                   Job Dispatcher & Active Job Registry
                    (Tracking execution_id for cancel)
                                   │
                                   ▼
                      Deterministic Compiler Cache
               SHA256(source + lang + version + flags)
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
                 [CACHE HIT]                [CACHE MISS]
              Copy cached binary          Compile in scratch
              (Compile: 0ms)             (Store in cache)
                     │                           │
                     └─────────────┬─────────────┘
                                   ▼
                       Isolated Ephemeral Sandbox
                  (Non-root, Memory Limits, Wall Timeout)
                                   │
                                   ▼
                         Multi-Vector Runner
                       (Pass/Fail/WA/TLE/MLE)
                                   │
                                   ▼
                     Telemetry & Verdict Packaging
                                   │
                                   ▼
                         Immediate UI Response
                         (Sub-second P50/P95)
```

---

## 2. Workload Separation: Run Code vs. Submit

| Property | Run Code (Fast Feedback) | Submit (Official Evaluation) |
| :--- | :--- | :--- |
| **Primary Goal** | Sub-second developer iteration loop | Comprehensive canonical grading |
| **Test Case Scope** | Visible sample cases or custom input | Complete test matrix (sample + hidden) |
| **Database Persistence** | **None** (zero DB roundtrips) | **Asynchronous Background** (non-blocking) |
| **Rating / Telemetry Mutations** | None | Updates problem progress & adaptive diagnostic DAG |
| **Typical Latency** | **76ms – 220ms** | **350ms – 1,100ms** |
| **Cancellation Support** | Instant via `/cancel` endpoint | Instant via `/cancel` endpoint |

---

## 3. Deterministic Compilation Caching

### A. Cache Key Derivation
To guarantee security, language compatibility, and zero cache poisoning across users or compilations, the cache key is computed cryptographically:

```
Key = SHA256(
    normalized_language + "::" +
    compiler_version_string + "::" +
    compiler_flags_string + "::" +
    source_code_hash
)
```

### B. Isolation Invariant
- **No In-Place Execution**: Execution NEVER takes place inside the cache directory.
- When a cache hit occurs, compiled binaries (e.g. `solution.exe` or `.class` files) are copied into a fresh, isolated scratch directory created specifically for that invocation (`tempfile.TemporaryDirectory(prefix="verniq_sandbox_")`).
- The scratch directory is strictly wiped and purged upon execution completion.
- LRU pruning removes oldest entries when the cache reaches capacity (default: 500 entries).

---

## 4. Concurrency & Worker Pool Architecture

- **Server Daemon**: Built upon Python's standard `http.server.ThreadingHTTPServer` to eliminate single-threaded request head-of-line blocking.
- **Worker Execution Pool**: Managed via `concurrent.futures.ThreadPoolExecutor(max_workers=8)` (configurable via `WORKER_CONCURRENCY`).
- **Active Job Registry**: Thread-safe registry mapping `execution_id -> subprocess.Popen`. If an execution times out or receives a `POST /cancel` signal, the process tree is immediately killed (`proc.kill()`) and resources are recycled.

---

## 5. Execution Telemetry Data Contract

Every execution payload returned by the judge includes an `ExecutionTelemetry` object:

```json
{
  "execution_id": "sub-8d91a27b",
  "request_received_at": "2026-10-01T06:24:39.102Z",
  "job_queued_at": "2026-10-01T06:24:39.104Z",
  "worker_acquired_at": "2026-10-01T06:24:39.105Z",
  "sandbox_created_at": "2026-10-01T06:24:39.106Z",
  "compile_started_at": "2026-10-01T06:24:39.108Z",
  "compile_finished_at": "2026-10-01T06:24:39.108Z",
  "execution_started_at": "2026-10-01T06:24:39.109Z",
  "execution_finished_at": "2026-10-01T06:24:39.198Z",
  "result_collected_at": "2026-10-01T06:24:39.200Z",
  "response_sent_at": "2026-10-01T06:24:39.201Z",
  "sandbox_startup_ms": 1,
  "compile_ms": 0,
  "execution_ms": 89,
  "total_ms": 99,
  "cached_compilation": true
}
```

---

## 6. Horizontal Scaling Readiness

The judge is entirely decoupled from:
- Frontend static assets
- Supabase Edge Functions
- AI Assistant services
- Web app API servers

In production deployment:
1. Multiple container instances of the judge worker can run behind a standard Layer 7 reverse proxy (e.g., NGINX, AWS ALB) or Kubernetes Service.
2. The compilation cache can be backed by a shared read-through SSD volume or remain instance-local with high cache hit ratios.
