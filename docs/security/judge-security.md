# VERNIQ Judge Security Architecture & Sandbox Invariants
**Status**: Mandatory Security Policy | **Classification**: Tier-1 Confidential  
**Author**: Senior Distributed-Systems & Secure Online-Judge Architect  
**Date**: October 2026

---

## 1. Threat Model & Untrusted Code Guarantees

Competitive programming platforms execute arbitrary user-authored code from untrusted external actors. Under no circumstances may user-submitted code:
1. Access the host operating system, environment variables, or private networks.
2. Interfere with or inspect concurrent executions from other users.
3. Access or modify the compilation cache or persistence layers.
4. Execute inside Supabase Edge Functions, normal API servers, or client web browsers.
5. Escape filesystem sandboxes or exhaust server CPU, RAM, disk, or process limits.

---

## 2. Core Security Invariants

### Invariant 1: Non-Root Execution
- The judge container operates under an unprivileged user `sandboxuser` (`UID 1001`, `GID 1001`).
- Sudo access and root privileges are disabled.

### Invariant 2: Filesystem & Workspace Isolation
- Every execution runs inside an ephemeral, dedicated scratch folder generated via `tempfile.TemporaryDirectory(prefix="verniq_sandbox_")`.
- When an execution terminates (normal completion, timeout, cancellation, or error), the temporary directory is fully wiped (`shutil.rmtree`) before resources are released.
- Verified by automated unit test `test_sandbox_cleanup`: 0 residual files or directories remain after execution.

### Invariant 3: Zero Compilation Cache Contamination
- Compilation caching uses cryptographic SHA-256 keys containing source hash, compiler flags, and compiler version string.
- Cached artifacts are stored in a dedicated read-only cache directory.
- **Execution Isolation**: When a cache hit occurs, the artifact is copied into the user's isolated scratch directory. Subprocesses NEVER execute inside the cache directory.
- No user code can overwrite or poison another user's cached binary.

### Invariant 4: Strict Timeouts & Process Limits
- Wall-clock timeouts are enforced via Python subprocess timeouts and thread pool timeouts (default: 2.0s multiplied by language profile threshold).
- Active subprocesses are tracked in `ActiveJobRegistry`. If timeout expires or cancellation is triggered, `proc.kill()` sends `SIGKILL` to prevent orphan zombie processes.
- Memory consumption is capped per language profile (default: 256MB heap limit for JVM via `-Xmx256m -Xss64m`).

### Invariant 5: Air-Gapped Network Isolation (Production Container)
- In the container deployment (`backend/judge/Dockerfile`), all outbound socket connections for worker execution processes are dropped or blocked (`--network none`).
- User code cannot make network calls, port scans, or external egress requests.

### Invariant 6: Sanitized Harness & Argument Handling
- User code is never passed via shell string interpolation (`shell=False` everywhere in subprocess calls).
- Compiler arguments and flags are strictly white-listed in `profiles.py` and are not configurable by user input.
- User class names and solution files are validated via regex `[A-Za-z0-9_]+` to prevent path traversal or shell injection.

---

## 3. Defense Against Known Attack Vectors

| Attack Vector | Defense Mechanism | Verification |
| :--- | :--- | :--- |
| **Fork Bomb** | Subprocess timeout kills parent & tree; non-root user process limit. | `test_time_limit_exceeded` |
| **Infinite Loop** | Hard wall-clock timeout kills process with `time_limit_exceeded`. | Tested in `test_judge_performance.py` |
| **Memory Exhaustion** | Strict JVM `-Xmx256m` heap caps and memory threshold monitoring. | Tested in `test_judge_performance.py` |
| **Disk Filling** | Ephemeral scratch directory removed on completion; execution timeouts. | `test_sandbox_cleanup` |
| **Path Traversal (`../`)** | Isolated scratch root directory; strict filename regexes. | Verified in `profiles.py` & `sandbox.py` |
| **Cache Hijacking** | SHA-256 deterministic key; binary executed only in copied scratch dir. | `test_cache_correctness_and_invalidation` |
| **Cross-User Data Leak** | Completely independent processes, distinct PIDs, and isolated dirs. | `test_concurrent_executions_isolation` |
