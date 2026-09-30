# VERNIQ Online Judge Service (`services/judge`)

> **Service Type:** Isolated Execution Sandbox & Worker Daemon  
> **Runtime:** Containerized Runtime with gVisor / nsjail Isolation  
> **Status:** Architecture Baseline & Security Specification (Phase 0)  

---

## Security Invariants

The Online Judge handles execution of **untrusted user source code**. To protect the platform, the following invariants are strictly enforced:

1. **Air-Gapped Network:** Sandboxes run with `--network none`. No outbound or inbound network connections are possible.
2. **Resource Constraints:**
   - **CPU Time Limit:** Strict hard timeout enforced via `setrlimit` (RLIMIT_CPU) and Linux `cgroups v2`.
   - **Memory Cap:** Hard resident memory limit enforced via `cgroups v2` (OOM kill triggered immediately if exceeded).
   - **Disk Space:** Ephemeral `tmpfs` mounts (in-memory) capped at 32MB. No persistence to physical disks.
3. **Syscall Whitelisting:** Untrusted binaries run under `seccomp-bpf` filters blocking forbidden syscalls (`fork` bombs, `socket`, `ptrace`, `kill`).
4. **No Direct Database Access:** The judge service has zero database credentials. It consumes execution requests from a message queue and reports verdicts via authenticated internal webhooks.

### Supported Language Environments (Phase Roadmap):
- **C++:** GCC 13 (C++20), `-O2`
- **Java:** OpenJDK 21
- **Python:** Python 3.12 (with PyPy option)
- **Go:** Go 1.22
- **Rust:** Rust 1.77
- **TypeScript / JavaScript:** Node.js 20 LTS / Deno
