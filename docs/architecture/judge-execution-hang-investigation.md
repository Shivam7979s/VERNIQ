# VERNIQ Judge Execution Hang Investigation
**Status**: Root Cause Identified & Reproduction Verified  
**Date**: October 2026 | **Author**: Senior Backend & Frontend Debugging Engineer  
**Target Problem**: Container With Most Water (`/problems/container-with-most-water`) | **Language**: Java 21

---

## 1. Reproduction Summary

The execution hang was reproduced in the browser via automated browser subagent:
1. Navigated to `http://localhost:5173/problems/container-with-most-water`.
2. Verified Java 21 was selected.
3. Provided the canonical Java two-pointer solution for `maxArea(int[] height)`:
   ```java
   class Solution {
       public int maxArea(int[] height) {
           int l = 0;
           int r = height.length - 1;
           int ans = 0;
           while (l < r) {
               ans = Math.max(ans, (r - l) * Math.min(height[l], height[r]));
               if (height[l] < height[r]) {
                   l++;
               } else {
                   r--;
               }
           }
           return ans;
       }
   }
   ```
4. Clicked **"Run Code"**.
5. Observed behavior:
   - UI switched to the **Result** tab.
   - Red **Stop** button became visible.
   - Headline banner showed:
     - `RUN`
     - `Executing in Isolated Sandbox...`
     - `Compiling source and dispatching across worker test vectors.`
   - Output pane displayed:
     - `Compiling solution in isolated sandbox...`
     - `Verifying visible test vectors...`
   - **The UI remained frozen indefinitely in this state.**
   - No JavaScript error was logged in the frontend console.

---

## 2. Server-Side Execution Trace

Examining the backend worker log (`task-3163.log`) revealed:
```
2026-10-01 12:49:06 [INFO] [JUDGE] Execution completed | ID: 93075bc6-352d-4197-9947-fa7424ed4528 | Lang: java | Mode: RUN | Verdict: accepted | Runtime: 249ms | Compile: 0ms | Cached: True | Total: 282ms
```

**Crucial Finding**:
- The Java compilation was **0 ms** (cache hit).
- The program executed in **249 ms**.
- The total backend worker execution time was **282 ms**.
- The verdict was **accepted**.
- **The backend finished execution in 282ms, but the frontend browser never finished waiting.**

---

## 3. Root-Cause Analysis (Why the Browser Hung)

### ROOT CAUSE: Missing `Content-Length` / `Connection: close` in HTTP/1.1 Server
In `backend/judge/src/worker.py`:
1. `JudgeRequestHandler` declared:
   ```python
   protocol_version = "HTTP/1.1"
   ```
2. Under HTTP/1.1, connections default to **persistent keep-alive**.
3. In `do_POST()` and `do_GET()`, the handler wrote the response headers:
   ```python
   self.send_response(200)
   self._send_cors_headers()
   self.send_header("Content-Type", "application/json")
   self.end_headers()
   self.wfile.write(result.model_dump_json().encode("utf-8"))
   ```
4. **Missing Response Framing**:
   - `Content-Length` was **never sent**.
   - `Transfer-Encoding: chunked` was **never sent**.
   - `Connection: close` was **never sent**.
5. According to RFC 7230 / RFC 9112 Section 6.3:
   When an HTTP/1.1 response has no `Content-Length` and is not chunked, the client cannot know when the message body ends until the server closes the TCP socket.
6. Because `ThreadingHTTPServer` kept the TCP socket open for keep-alive, the Chromium browser Fetch API kept the response body stream open indefinitely waiting for more data.
7. Consequently, `await response.json()` in `frontend/src/lib/submissionService.ts` **never resolved**. It remained in a permanent `(pending)` promise state.

### Contributing Frontend State Machine Flaws:
1. **Deferred `activeSubmissionId`**:
   `ProblemWorkspace.tsx` only called `setActiveSubmissionId(res.submissionId)` *after* `await runCode(...)` resolved. If in-flight, `activeSubmissionId` stayed `null`, which disabled user-triggered `cancelExecution` and prevented cancellation signals.
2. **Missing Direct Verdict State Dispatch**:
   `handleRunCode` didn't immediately update React state with `res.submission` upon return, relying exclusively on `useSubmissionRealtime` side effects.

### Secondary Platform Teardown & Verdict Issues (Resolved):
1. **Windows Subprocess Lock & Recursion in Cleanup**:
   On Windows, killing Java processes under TLE left file locks on compiled `.class` files. When exiting `tempfile.TemporaryDirectory`, Python 3.11's default `onerror` handler in `shutil.rmtree` encountered Access Denied and recurred infinitely, raising `RecursionError: maximum recursion depth exceeded`.
2. **Custom Run Output Comparison**:
   `sandbox.py` previously evaluated `if is_custom_run or tc.expected_output is None:`, skipping output comparison during "Run Code" even when `expected_output` was explicitly provided on test cases.

---

## 4. Comprehensive Engineering Fixes Applied

### Fix 1: HTTP Framing & Streaming Protocol (`backend/judge/src/worker.py`)
Introduced a centralized, RFC-compliant response framing helper:
```python
def _send_json(self, status_code: int, data: bytes):
    self.send_response(status_code)
    self._send_cors_headers()
    self.send_header("Content-Type", "application/json")
    self.send_header("Content-Length", str(len(data)))
    self.send_header("Connection", "close")
    self.end_headers()
    self.wfile.write(data)
    self.wfile.flush()
```
Applied across all endpoints: `/execute`, `/cancel`, `/health`, and `/telemetry`.

### Fix 2: Frontend State Machine & Cancellation (`frontend/src/components/workspace/ProblemWorkspace.tsx`)
- Generated a unique `subId = crypto.randomUUID()` upfront before dispatching `runCode`.
- Set `setActiveSubmissionId(subId)` immediately so user cancellation via the **Stop** button is active while the request is in-flight.
- When `runCode(...)` returns, immediately dispatch all execution fields (`verdict`, `runtimeMs`, `telemetry`, `stdoutLogs`, `stderrLogs`, `testCasesPassed`, `totalTestCases`) into component state.

### Fix 3: Robust Windows Process Teardown & Teardown Error Handling (`backend/judge/src/runner/sandbox.py`)
- Used `tempfile.TemporaryDirectory(prefix="verniq_sandbox_", ignore_cleanup_errors=True)` to prevent sharing-violation recursion on Windows.
- On Windows timeouts and cancellations, invoked `taskkill /F /T /PID <pid>` to terminate the entire Java JVM process tree cleanly before directory disposal.
- Fixed testcase comparison logic to always evaluate against `expected_output` when provided (`if tc.expected_output is None: continue`).

---

## 5. Verification Matrix & Evidence

### 1. Real Browser End-to-End Verification
- **URL**: `http://localhost:5173/problems/container-with-most-water`
- **Language**: Java 21
- **Action**: User clicked **"Run Code"**
- **Observed Result**:
  - UI cleanly transitioned from `"Executing in Isolated Sandbox..."` to **`AC Accepted`** in **454 ms**.
  - Telemetry: Compile: 0 ms (cached artifact hit), Exec: 428 ms, Total: 454 ms.
  - Testcases Passed: 2/2 sample vectors.
  - Stop button cleanly cleared.
- **Recording Artifact**: `browser_ui_test_1790841386760.webp`

### 2. Multi-Verdict Automated Regression Suite (`backend/judge/tests/test_all_verdicts.py`)
Executed full 7-test suite against live judge daemon on `http://127.0.0.1:8080`:
```
Ran 7 tests in 5.915s:
- test_a_java_accepted: PASSED [Accepted, 1/1 passed]
- test_b_java_compilation_error: PASSED [Compilation Error with diagnostic syntax message]
- test_c_java_wrong_answer: PASSED [Wrong Answer, 0/1 passed]
- test_d_java_runtime_error: PASSED [Runtime Error with stack trace]
- test_e_java_time_limit_exceeded: PASSED [Time Limit Exceeded after 3.0s wall limit]
- test_f_submit_canonical_suite: PASSED [Accepted, 3/3 passed on full suite]
- test_g_cancel_in_flight: PASSED [Cancelled / TLE on active stop signal]
```

### 3. TypeScript & Static Analysis
- Ran `npx tsc --noEmit` in `frontend/`: 0 errors.
- Clean build and type compliance across all React components and services.
