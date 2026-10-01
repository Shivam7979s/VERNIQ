"""VERNIQ Online Judge Worker & Execution Server Daemon."""
import json
import logging
import signal
import sys
import threading
import time
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import List, Optional

try:
    from supabase import Client, create_client
except ImportError:
    create_client = None
    Client = None

from .config import config
from .runner.sandbox import ExecutionResult, SandboxRunner, TestCaseItem

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
        self.supabase = None
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

    def fetch_test_cases(self, problem_id: Optional[str], is_custom_run: bool, stdin_input: Optional[str]) -> List[TestCaseItem]:
        """Fetches test cases for a submission."""
        if is_custom_run or not problem_id:
            return [TestCaseItem(input=stdin_input or "", expected_output=None, is_sample=True)]

        if not self.supabase:
            return [TestCaseItem(input=stdin_input or "", expected_output=None)]

        try:
            res = (
                self.supabase.table("test_cases")
                .select("input, expected_output, is_sample")
                .eq("problem_id", problem_id)
                .order("order_index", desc=False)
                .execute()
            )
            if res.data and len(res.data) > 0:
                return [
                    TestCaseItem(
                        input=tc["input"],
                        expected_output=tc["expected_output"],
                        is_sample=tc.get("is_sample", False),
                    )
                    for tc in res.data
                ]
        except Exception as err:
            logger.error(f"Failed to fetch test cases for problem {problem_id}: {err}")

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


def create_http_handler(worker: JudgeWorker):
    class JudgeRequestHandler(BaseHTTPRequestHandler):
        def _send_cors_headers(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

        def do_OPTIONS(self):
            self.send_response(204)
            self._send_cors_headers()
            self.end_headers()

        def do_GET(self):
            if self.path in ("/health", "/"):
                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(
                    json.dumps({
                        "status": "healthy",
                        "worker": config.worker_id,
                        "time": datetime.now(timezone.utc).isoformat(),
                    }).encode("utf-8")
                )
                return
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()

        def do_POST(self):
            if self.path == "/execute":
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                try:
                    payload = json.loads(body)
                except Exception:
                    self.send_response(400)
                    self._send_cors_headers()
                    self.end_headers()
                    self.wfile.write(b'{"error": "Invalid JSON"}')
                    return

                language = payload.get("language", "python")
                source_code = payload.get("source_code") or payload.get("code", "")
                stdin_input = payload.get("stdin_input", "")
                is_custom_run = payload.get("is_custom_run", True)

                # Format test cases
                raw_cases = payload.get("test_cases")
                if raw_cases and isinstance(raw_cases, list):
                    test_cases = [
                        TestCaseItem(
                            input=c.get("input", ""),
                            expected_output=c.get("expected_output"),
                            is_sample=c.get("is_sample", False),
                        )
                        for c in raw_cases
                    ]
                else:
                    test_cases = [TestCaseItem(input=stdin_input or "", expected_output=None)]

                logger.info(f"Direct HTTP execute request: language={language}, custom={is_custom_run}")

                # Real compiler / sandbox execution
                result: ExecutionResult = worker.runner.execute(
                    language=language,
                    source_code=source_code,
                    test_cases=test_cases,
                    is_custom_run=is_custom_run,
                )

                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(result.model_dump_json().encode("utf-8"))
                return

            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()

        def log_message(self, format, *args):
            # Suppress noisy access logs
            pass

    return JudgeRequestHandler


def main():
    worker = JudgeWorker()
    http_port = 8080

    handler_class = create_http_handler(worker)
    try:
        httpd = HTTPServer(("127.0.0.1", http_port), handler_class)
        logger.info(f"VERNIQ Judge Execution HTTP Server listening on http://127.0.0.1:{http_port}")
        server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        server_thread.start()
    except Exception as e:
        logger.warning(f"Could not bind HTTP server to port {http_port}: {e}")
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
