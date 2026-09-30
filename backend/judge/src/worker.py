"""VERNIQ Online Judge Worker Daemon."""
import logging
import signal
import sys
import time
from datetime import datetime, timezone
from typing import List, Optional

from supabase import Client, create_client

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
        self.supabase: Optional[Client] = None
        self._init_supabase()

    def _init_supabase(self):
        key = config.supabase_service_role_key or config.supabase_anon_key
        if config.supabase_url and key:
            try:
                self.supabase = create_client(config.supabase_url, key)
                logger.info(f"Supabase client initialized for {config.supabase_url}")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.supabase = None
        else:
            logger.warning("Supabase credentials missing. Worker operating in standby/test mode.")

    def claim_next_submission(self) -> Optional[dict]:
        """Polls for the oldest pending submission and marks it as running."""
        if not self.supabase:
            return None

        try:
            # Query for the oldest pending submission
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

            # Optimistic lock: update verdict to running only if still pending
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
        # Custom runs or standalone IDE runs use stdin_input
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

        # Fallback to stdin_input if problem has no registered test cases
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

        # Run within isolated sandbox
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

        # Update Supabase submission record
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

    def start(self):
        logger.info(f"Starting VERNIQ Online Judge Worker ({config.worker_id})...")
        while self.running:
            sub = self.claim_next_submission()
            if sub:
                self.process_submission(sub)
            else:
                time.sleep(config.poll_interval_seconds)

    def stop(self):
        logger.info("Stopping Judge Worker...")
        self.running = False


def main():
    worker = JudgeWorker()

    def handle_signal(sig, frame):
        logger.info("Received termination signal.")
        worker.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    worker.start()

if __name__ == "__main__":
    main()
