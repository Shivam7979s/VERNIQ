"""VERNIQ Online Judge Worker & Execution Server Daemon with Threaded Pool & Realtime Telemetry."""
import concurrent.futures
import json
import logging
import signal
import sys
import threading
import time
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from typing import List, Optional

try:
    from supabase import Client, create_client
except ImportError:
    create_client = None
    Client = None

from .config import config
from .runner.sandbox import ExecutionResult, SandboxRunner, TestCaseItem, job_registry

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [JUDGE] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("judge-worker")

class JudgeWorker:
    def __init__(self):
        self.running = True
        self.runner = SandboxRunner(
            time_limit_seconds=config.max_cpu_time_seconds,
            memory_limit_mb=config.max_memory_mb,
        )
        self.executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=config.worker_concurrency,
            thread_name_prefix="judge-pool-worker"
        )
        self.supabase = None
        self._canonical_cache: Dict[str, List[TestCaseItem]] = {}
        self._init_supabase()

    def _init_supabase(self):
        if not create_client:
            logger.info("Supabase Python library not installed. Running in standalone HTTP sandbox mode.")
            return

        key = config.supabase_service_role_key or config.supabase_anon_key
        if config.supabase_url and key:
            try:
                self.supabase = create_client(config.supabase_url, key)
                logger.info(f"Supabase client initialized for {config.supabase_url}")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.supabase = None
        else:
            logger.info("Supabase credentials missing. Operating in standalone HTTP sandbox mode.")

    def claim_next_submission(self) -> Optional[dict]:
        """Polls for the oldest pending submission and marks it as running."""
        if not self.supabase:
            return None

        try:
            res = (
                self.supabase.table("submissions")
                .select("*")
                .eq("verdict", "pending")
                .order("created_at", desc=False)
                .limit(1)
                .execute()
            )
            if not res.data or len(res.data) == 0:
                return None

            submission = res.data[0]
            sub_id = submission["id"]

            update_res = (
                self.supabase.table("submissions")
                .update({"verdict": "running"})
                .eq("id", sub_id)
                .eq("verdict", "pending")
                .execute()
            )

            if update_res.data and len(update_res.data) > 0:
                return update_res.data[0]
            return None

        except Exception as err:
            logger.error(f"Error checking pending submissions: {err}")
            return None

    def fetch_canonical_test_cases(self, problem_id: str) -> List[TestCaseItem]:
        """Fetches complete canonical test cases for a problem, using in-memory cache and service_role PostgREST."""
        if not problem_id:
            return []

        if problem_id in self._canonical_cache:
            logger.info(f"Using cached canonical test suite for problem {problem_id}: {len(self._canonical_cache[problem_id])} cases")
            return self._canonical_cache[problem_id]

        # 1. Try Supabase Python client if available
        if self.supabase:
            try:
                res = (
                    self.supabase.table("test_cases")
                    .select("input, expected_output, is_sample")
                    .eq("problem_id", problem_id)
                    .order("order_index", desc=False)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    cases = [
                        TestCaseItem(
                            input=tc["input"],
                            expected_output=tc.get("expected_output"),
                            is_sample=tc.get("is_sample", False),
                        )
                        for tc in res.data
                    ]
                    self._canonical_cache[problem_id] = cases
                    logger.info(f"Loaded and cached {len(cases)} canonical test cases for problem {problem_id} via Supabase client")
                    return cases
            except Exception as e:
                logger.warning(f"Supabase client query failed for {problem_id}: {e}")

        # 2. Direct PostgREST query using service_role key via urllib
        key = config.supabase_service_role_key or config.supabase_anon_key
        if config.supabase_url and key:
            try:
                import urllib.request
                import json
                url = f"{config.supabase_url}/rest/v1/test_cases?problem_id=eq.{problem_id}&select=input,expected_output,is_sample&order=order_index.asc"
                headers = {
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                }
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=15.0) as resp:
                    raw_data = json.loads(resp.read().decode("utf-8"))
                    if raw_data and len(raw_data) > 0:
                        cases = [
                            TestCaseItem(
                                input=tc["input"],
                                expected_output=tc.get("expected_output"),
                                is_sample=tc.get("is_sample", False),
                            )
                            for tc in raw_data
                        ]
                        self._canonical_cache[problem_id] = cases
                        logger.info(f"Loaded and cached {len(cases)} canonical test cases for problem {problem_id} via PostgREST")
                        return cases
            except Exception as e:
                logger.error(f"PostgREST query failed for {problem_id}: {e}")

        logger.warning(f"Could not load canonical test cases for problem {problem_id}")
        return []

    def fetch_test_cases(self, problem_id: Optional[str], is_custom_run: bool, stdin_input: Optional[str]) -> List[TestCaseItem]:
        """Fetches test cases for a submission."""
        if is_custom_run or not problem_id:
            return [TestCaseItem(input=stdin_input or "", expected_output=None, is_sample=True)]

        canonical = self.fetch_canonical_test_cases(problem_id)
        if canonical:
            return canonical

        return [TestCaseItem(input=stdin_input or "", expected_output=None)]

    def process_submission(self, sub: dict):
        sub_id = sub["id"]
        language = sub["language"]
        source_code = sub["source_code"]
        is_custom_run = sub.get("is_custom_run", False)
        problem_id = sub.get("problem_id")
        stdin_input = sub.get("stdin_input", "")

        logger.info(
            f"Processing submission {sub_id} | Language: {language} | "
            f"Problem: {problem_id or 'Standalone'} | Custom: {is_custom_run}"
        )

        test_cases = self.fetch_test_cases(problem_id, is_custom_run, stdin_input)

        result: ExecutionResult = self.runner.execute(
            language=language,
            source_code=source_code,
            test_cases=test_cases,
            is_custom_run=is_custom_run,
            execution_id=sub_id,
        )

        logger.info(
            f"Submission {sub_id} finished with verdict: {result.verdict} | "
            f"Runtime: {result.runtime_ms}ms | Memory: {result.memory_kb}KB | "
            f"Passed: {result.test_cases_passed}/{result.total_test_cases}"
        )

        if self.supabase:
            try:
                self.supabase.table("submissions").update({
                    "verdict": result.verdict,
                    "runtime_ms": result.runtime_ms,
                    "memory_kb": result.memory_kb,
                    "stdout_output": result.stdout_output,
                    "stderr_output": result.stderr_output,
                    "compile_output": result.compile_output,
                    "test_cases_passed": result.test_cases_passed,
                    "total_test_cases": result.total_test_cases,
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", sub_id).execute()
            except Exception as err:
                logger.error(f"Failed to update submission {sub_id} verdict: {err}")

    def start_polling(self):
        while self.running:
            sub = self.claim_next_submission()
            if sub:
                self.process_submission(sub)
            else:
                time.sleep(config.poll_interval_seconds)

    def stop(self):
        logger.info("Stopping Judge Worker...")
        self.running = False
        self.executor.shutdown(wait=False)


def create_http_handler(worker: JudgeWorker):
    class JudgeRequestHandler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def _send_cors_headers(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Execution-ID")

        def _send_json(self, status_code: int, data_bytes: bytes):
            self.send_response(status_code)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data_bytes)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(data_bytes)
            self.wfile.flush()

        def do_OPTIONS(self):
            self.send_response(204)
            self._send_cors_headers()
            self.send_header("Content-Length", "0")
            self.send_header("Connection", "close")
            self.end_headers()

        def do_GET(self):
            if self.path in ("/health", "/"):
                body = json.dumps({
                    "status": "healthy",
                    "worker": config.worker_id,
                    "concurrency": config.worker_concurrency,
                    "cache_enabled": config.cache_enabled,
                    "time": datetime.now(timezone.utc).isoformat(),
                }).encode("utf-8")
                self._send_json(200, body)
                return

            if self.path == "/telemetry":
                body = json.dumps({
                    "worker_id": config.worker_id,
                    "concurrency": config.worker_concurrency,
                    "cache_entries": len(worker.runner.cache._access_times),
                    "max_cache_entries": config.cache_max_entries,
                }).encode("utf-8")
                self._send_json(200, body)
                return

            self._send_json(404, b'{"error": "Not found"}')

        def do_POST(self):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""

            if self.path == "/cancel":
                try:
                    payload = json.loads(body)
                except Exception:
                    self._send_json(400, b'{"error": "Invalid JSON"}')
                    return

                execution_id = payload.get("execution_id") or payload.get("submission_id")
                if not execution_id:
                    self._send_json(400, b'{"error": "Missing execution_id"}')
                    return

                cancelled = job_registry.cancel(execution_id)
                logger.info(f"Cancellation requested for {execution_id}: success={cancelled}")

                resp_body = json.dumps({
                    "status": "ok",
                    "cancelled": cancelled,
                    "execution_id": execution_id
                }).encode("utf-8")
                self._send_json(200, resp_body)
                return

            if self.path == "/execute":
                t_received = datetime.now(timezone.utc).isoformat()
                try:
                    payload = json.loads(body)
                except Exception:
                    self._send_json(400, b'{"error": "Invalid JSON"}')
                    return

                language = payload.get("language", "python")
                source_code = payload.get("source_code") or payload.get("code", "")
                stdin_input = payload.get("stdin_input", "")
                is_custom_run = payload.get("is_custom_run", True)
                execution_id = payload.get("execution_id") or f"exec-{int(time.time()*1000)}"
                mode = payload.get("mode", "RUN" if is_custom_run else "SUBMIT")
                problem_id = payload.get("problem_id")

                # Parse test cases
                raw_cases = payload.get("test_cases")
                if raw_cases and isinstance(raw_cases, list) and len(raw_cases) > 0:
                    test_cases = [
                        TestCaseItem(
                            input=c.get("input", ""),
                            expected_output=c.get("expected_output"),
                            is_sample=c.get("is_sample", False),
                        )
                        for c in raw_cases
                    ]
                elif problem_id and (mode == "SUBMIT" or not is_custom_run):
                    # Canonical submission: Load complete canonical test suite securely on backend using service_role
                    test_cases = worker.fetch_canonical_test_cases(problem_id)
                    if not test_cases:
                        test_cases = [TestCaseItem(input=stdin_input or "", expected_output=None)]
                else:
                    test_cases = [TestCaseItem(input=stdin_input or "", expected_output=None)]

                t_queued = datetime.now(timezone.utc).isoformat()

                # Dispatch execution to the warm thread worker pool
                future = worker.executor.submit(
                    worker.runner.execute,
                    language=language,
                    source_code=source_code,
                    test_cases=test_cases,
                    is_custom_run=is_custom_run,
                    execution_id=execution_id,
                    received_timestamp=t_received,
                    queued_timestamp=t_queued,
                )

                try:
                    # Scaled wall timeout accounting for process startup overhead across large test suites
                    pool_timeout = max(30.0, min(300.0, len(test_cases) * 0.8 + 25.0))
                    result: ExecutionResult = future.result(timeout=pool_timeout)
                except concurrent.futures.TimeoutError:
                    job_registry.cancel(execution_id)
                    result = ExecutionResult(
                        verdict="time_limit_exceeded",
                        stderr_output=f"Worker execution pool timeout after {pool_timeout:.1f}s.",
                        total_test_cases=len(test_cases),
                        telemetry=ExecutionTelemetry(
                            execution_id=execution_id,
                            request_received_at=t_received,
                            job_queued_at=t_queued,
                            total_ms=int(pool_timeout * 1000),
                            cached_compilation=False,
                        )
                    )
                except Exception as err:
                    result = ExecutionResult(
                        verdict="internal_error",
                        stderr_output=f"Worker pool error: {str(err)}",
                        total_test_cases=len(test_cases),
                        telemetry=ExecutionTelemetry(
                            execution_id=execution_id,
                            request_received_at=t_received,
                            job_queued_at=t_queued,
                            total_ms=0,
                            cached_compilation=False,
                        )
                    )

                # Structured log (does not log raw code or secrets)
                telemetry = result.telemetry
                total_ms = telemetry.total_ms if telemetry else 0
                compile_ms = telemetry.compile_ms if telemetry else 0
                cached = telemetry.cached_compilation if telemetry else False

                logger.info(
                    f"Execution completed | ID: {execution_id} | Lang: {language} | "
                    f"Mode: {mode} | Verdict: {result.verdict} | Runtime: {result.runtime_ms}ms | "
                    f"Compile: {compile_ms}ms | Cached: {cached} | Total: {total_ms}ms"
                )

                self._send_json(200, result.model_dump_json().encode("utf-8"))
                return

            self._send_json(404, b'{"error": "Not found"}')

        def log_message(self, format, *args):
            pass

    return JudgeRequestHandler


def main():
    worker = JudgeWorker()
    http_port = config.http_port
    http_host = config.http_host

    handler_class = create_http_handler(worker)
    try:
        httpd = ThreadingHTTPServer((http_host, http_port), handler_class)
        logger.info(f"VERNIQ Threaded Judge HTTP Server listening on http://{http_host}:{http_port} (Concurrency: {config.worker_concurrency})")
        server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        server_thread.start()
    except Exception as e:
        logger.warning(f"Could not bind Threading HTTP server to port {http_port}: {e}")
        httpd = None

    def handle_signal(sig, frame):
        logger.info("Received termination signal.")
        worker.stop()
        if httpd:
            httpd.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    logger.info(f"Starting VERNIQ Online Judge Worker ({config.worker_id})...")
    worker.start_polling()

if __name__ == "__main__":
    main()
