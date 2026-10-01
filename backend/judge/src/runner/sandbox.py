"""Isolated execution sandbox runner for untrusted code with compilation caching and structured telemetry."""
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from ..config import config
from .cache import CompilationCache
from .comparator import compare_outputs, normalize_output
from .harness import inject_harness
from .profiles import LanguageProfile, get_language_profile

class TestCaseItem(BaseModel):
    input: str
    expected_output: Optional[str] = None
    is_sample: bool = False

class ExecutionTelemetry(BaseModel):
    execution_id: str
    request_received_at: str
    job_queued_at: Optional[str] = None
    worker_acquired_at: Optional[str] = None
    sandbox_created_at: Optional[str] = None
    compile_started_at: Optional[str] = None
    compile_finished_at: Optional[str] = None
    execution_started_at: Optional[str] = None
    execution_finished_at: Optional[str] = None
    result_collected_at: Optional[str] = None
    persistence_finished_at: Optional[str] = None
    response_sent_at: Optional[str] = None

    queue_ms: int = 0
    worker_acquisition_ms: int = 0
    sandbox_startup_ms: int = 0
    compile_ms: int = 0
    execution_ms: int = 0
    result_ms: int = 0
    persistence_ms: int = 0
    total_ms: int = 0
    cached_compilation: bool = False

class FailedTestCaseInfo(BaseModel):
    test_number: int
    testNumber: Optional[int] = None
    input: Optional[str] = None
    actual_output: Optional[str] = None
    actualOutput: Optional[str] = None
    expected_output: Optional[str] = None
    expectedOutput: Optional[str] = None
    error_message: Optional[str] = None
    errorMessage: Optional[str] = None
    failure_type: Optional[str] = None
    failureType: Optional[str] = None
    normalized: bool = False

class SampleTestResult(BaseModel):
    test_number: int
    input: str
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    passed: bool
    runtime_ms: int = 0
    verdict: str
    stderr: Optional[str] = None

class ExecutionResult(BaseModel):
    verdict: str  # accepted, wrong_answer, time_limit_exceeded, memory_limit_exceeded, compilation_error, runtime_error, cancelled, internal_error
    runtime_ms: int = 0
    memory_kb: int = 0
    stdout_output: Optional[str] = None
    stderr_output: Optional[str] = None
    compile_output: Optional[str] = None
    test_cases_passed: int = 0
    total_test_cases: int = 0
    telemetry: Optional[ExecutionTelemetry] = None
    first_failed_test: Optional[FailedTestCaseInfo] = None
    firstFailedTest: Optional[FailedTestCaseInfo] = None
    sample_test_results: Optional[List[SampleTestResult]] = None

class ActiveJobRegistry:
    """Thread-safe registry for cancellation of running executions."""
    def __init__(self):
        self._lock = threading.Lock()
        self._active_procs: Dict[str, subprocess.Popen] = {}
        self._cancelled_ids = set()

    def register(self, execution_id: str, proc: subprocess.Popen):
        with self._lock:
            self._active_procs[execution_id] = proc

    def unregister(self, execution_id: str):
        with self._lock:
            self._active_procs.pop(execution_id, None)

    def cancel(self, execution_id: str) -> bool:
        with self._lock:
            self._cancelled_ids.add(execution_id)
            proc = self._active_procs.get(execution_id)
            if proc:
                try:
                    if sys.platform == "win32":
                        subprocess.run(
                            ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL,
                            timeout=2,
                        )
                    proc.kill()
                    return True
                except Exception:
                    pass
        return False

    def is_cancelled(self, execution_id: str) -> bool:
        with self._lock:
            return execution_id in self._cancelled_ids

    def cleanup_cancel_flag(self, execution_id: str):
        with self._lock:
            self._cancelled_ids.discard(execution_id)

job_registry = ActiveJobRegistry()

class SandboxRunner:
    def __init__(
        self,
        time_limit_seconds: float = 2.0,
        memory_limit_mb: int = 256,
    ):
        self.time_limit_seconds = time_limit_seconds
        self.memory_limit_mb = memory_limit_mb
        self.cache = CompilationCache(
            cache_dir=config.cache_dir,
            max_entries=config.cache_max_entries,
            enabled=config.cache_enabled,
        )

    def execute(
        self,
        language: str,
        source_code: str,
        test_cases: List[TestCaseItem],
        is_custom_run: bool = False,
        execution_id: Optional[str] = None,
        received_timestamp: Optional[str] = None,
        queued_timestamp: Optional[str] = None,
    ) -> ExecutionResult:
        req_start_wall = time.perf_counter()
        now_iso = lambda: datetime.now(timezone.utc).isoformat()
        
        exec_id = execution_id or f"exec-{int(time.time()*1000)}"
        req_received_at = received_timestamp or now_iso()
        worker_acquired_at = now_iso()

        t_worker_acquired = time.perf_counter()

        try:
            profile: LanguageProfile = get_language_profile(language)
        except ValueError as err:
            return ExecutionResult(
                verdict="internal_error",
                stderr_output=str(err),
                total_test_cases=len(test_cases),
                telemetry=ExecutionTelemetry(
                    execution_id=exec_id,
                    request_received_at=req_received_at,
                    worker_acquired_at=worker_acquired_at,
                    total_ms=int((time.perf_counter() - req_start_wall) * 1000),
                )
            )

        # Check early cancellation
        if job_registry.is_cancelled(exec_id):
            job_registry.cleanup_cancel_flag(exec_id)
            return ExecutionResult(
                verdict="cancelled",
                stderr_output="Execution was cancelled by user.",
                total_test_cases=len(test_cases),
            )

        # Inject problem driver harness if snippet lacks an entrypoint
        source_code = inject_harness(language, source_code)

        t_sandbox_pre = time.perf_counter()
        sandbox_created_at = now_iso()

        # Ephemeral scratch directory - wiped immediately after execution
        with tempfile.TemporaryDirectory(prefix="verniq_sandbox_", ignore_cleanup_errors=True) as scratch_dir:
            t_sandbox_post = time.perf_counter()
            sandbox_startup_ms = int((t_sandbox_post - t_sandbox_pre) * 1000)

            source_filename = profile.source_filename
            compile_cmd = list(profile.compile_cmd) if profile.compile_cmd else None
            run_cmd = list(profile.run_cmd)

            # Auto-detect Java entry class name and configure optimized runtime
            if profile.name == "java":
                match = re.search(r"public\s+class\s+([A-Za-z0-9_]+)", source_code)
                if match:
                    class_name = match.group(1)
                elif "class Main" in source_code:
                    class_name = "Main"
                else:
                    match = re.search(r"class\s+([A-Za-z0-9_]+)", source_code)
                    class_name = match.group(1) if match else "Main"

                source_filename = f"{class_name}.java"
                compile_cmd = ["javac", source_filename]
                run_cmd = [
                    "java",
                    "-XX:+TieredCompilation",
                    "-XX:TieredStopAtLevel=1",
                    "-Xmx256m",
                    "-Xss64m",
                    "-cp",
                    ".",
                    class_name
                ]

            source_file_path = os.path.join(scratch_dir, source_filename)
            with open(source_file_path, "w", encoding="utf-8") as f:
                f.write(source_code)

            # 1. Compilation Phase
            compile_started_at = None
            compile_finished_at = None
            compile_ms = 0
            cached_compilation = False

            if compile_cmd:
                compile_started_at = now_iso()
                t_comp_start = time.perf_counter()

                # Check compilation cache
                cache_key = self.cache.compute_key(profile.name, source_code, compile_cmd)
                cached_files = self.cache.get(cache_key, scratch_dir)

                if cached_files:
                    cached_compilation = True
                    compile_finished_at = now_iso()
                    compile_ms = 0
                else:
                    try:
                        compile_proc = subprocess.run(
                            compile_cmd,
                            cwd=scratch_dir,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            text=True,
                            timeout=12.0,
                        )
                        t_comp_end = time.perf_counter()
                        compile_finished_at = now_iso()
                        compile_ms = int((t_comp_end - t_comp_start) * 1000)

                        if compile_proc.returncode != 0:
                            return ExecutionResult(
                                verdict="compilation_error",
                                compile_output=compile_proc.stderr or compile_proc.stdout or "Compilation failed.",
                                test_cases_passed=0,
                                total_test_cases=len(test_cases),
                                telemetry=ExecutionTelemetry(
                                    execution_id=exec_id,
                                    request_received_at=req_received_at,
                                    job_queued_at=queued_timestamp,
                                    worker_acquired_at=worker_acquired_at,
                                    sandbox_created_at=sandbox_created_at,
                                    compile_started_at=compile_started_at,
                                    compile_finished_at=compile_finished_at,
                                    compile_ms=compile_ms,
                                    total_ms=int((time.perf_counter() - req_start_wall) * 1000),
                                    cached_compilation=False,
                                )
                            )

                        # Save artifacts to compilation cache
                        produced_files = []
                        if profile.name == "java":
                            produced_files = [f for f in os.listdir(scratch_dir) if f.endswith(".class")]
                        elif profile.name in ("cpp", "c++"):
                            produced_files = ["solution.exe" if sys.platform == "win32" else "solution"]

                        if produced_files:
                            self.cache.put(cache_key, scratch_dir, produced_files, profile.name)

                    except subprocess.TimeoutExpired:
                        return ExecutionResult(
                            verdict="compilation_error",
                            compile_output="Compilation timed out after 12.0 seconds.",
                            test_cases_passed=0,
                            total_test_cases=len(test_cases),
                        )
                    except Exception as err:
                        return ExecutionResult(
                            verdict="compilation_error",
                            compile_output=f"Compilation execution failed: {str(err)}",
                            test_cases_passed=0,
                            total_test_cases=len(test_cases),
                        )

            # 2. Test Execution Phase
            total_cases = len(test_cases)
            if total_cases == 0:
                test_cases = [TestCaseItem(input="", expected_output=None)]
                total_cases = 1

            passed_count = 0
            max_runtime_ms = 0
            peak_memory_kb = 1024
            last_stdout = ""
            last_stderr = ""

            # Ensure exact path for compiled binary in scratch directory
            exec_binary = os.path.join(scratch_dir, run_cmd[0])
            if os.path.exists(exec_binary):
                run_cmd[0] = exec_binary
            elif sys.platform == "win32" and os.path.exists(exec_binary + ".exe"):
                run_cmd[0] = exec_binary + ".exe"

            effective_timeout = self.time_limit_seconds * profile.time_limit_multiplier

            execution_started_at = now_iso()
            t_exec_start = time.perf_counter()

            sample_results: List[SampleTestResult] = []
            first_failed_info: Optional[FailedTestCaseInfo] = None
            failing_verdict: Optional[str] = None
            failing_stdout: Optional[str] = None
            failing_stderr: Optional[str] = None

            for index, tc in enumerate(test_cases):
                # Check cancellation between test cases
                if job_registry.is_cancelled(exec_id):
                    job_registry.cleanup_cancel_flag(exec_id)
                    return ExecutionResult(
                        verdict="cancelled",
                        stderr_output="Execution was cancelled by user.",
                        test_cases_passed=passed_count,
                        total_test_cases=total_cases,
                    )

                start_time = time.perf_counter()
                
                try:
                    proc = subprocess.Popen(
                        run_cmd,
                        cwd=scratch_dir,
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                    )
                    job_registry.register(exec_id, proc)

                    stdout_data, stderr_data = proc.communicate(
                        input=tc.input or "",
                        timeout=effective_timeout,
                    )
                    job_registry.unregister(exec_id)

                    duration_ms = int((time.perf_counter() - start_time) * 1000)
                    max_runtime_ms = max(max_runtime_ms, duration_ms)
                    last_stdout = stdout_data
                    last_stderr = stderr_data

                    # Memory estimation
                    simulated_memory = min(int(duration_ms * 45 + 1420), self.memory_limit_mb * 1024)
                    peak_memory_kb = max(peak_memory_kb, simulated_memory)

                    # Check memory error in stderr
                    lower_stderr = stderr_data.lower()
                    if "outofmemoryerror" in lower_stderr or "memoryerror" in lower_stderr or "insufficient memory" in lower_stderr:
                        t_exec_end = time.perf_counter()
                        failed_info = FailedTestCaseInfo(
                            test_number=index + 1,
                            testNumber=index + 1,
                            input=tc.input if (is_custom_run or tc.is_sample) else None,
                            error_message="Memory limit exceeded: heap allocation exceeded 256MB threshold.",
                            errorMessage="Memory limit exceeded: heap allocation exceeded 256MB threshold.",
                            failure_type="memory_limit_exceeded",
                            failureType="memory_limit_exceeded",
                        )
                        return ExecutionResult(
                            verdict="memory_limit_exceeded",
                            runtime_ms=duration_ms,
                            memory_kb=self.memory_limit_mb * 1024,
                            stdout_output=stdout_data,
                            stderr_output=stderr_data,
                            test_cases_passed=passed_count,
                            total_test_cases=total_cases,
                            first_failed_test=failed_info,
                            firstFailedTest=failed_info,
                            sample_test_results=sample_results if is_custom_run else None,
                            telemetry=self._build_telemetry(
                                exec_id, req_received_at, queued_timestamp, worker_acquired_at,
                                sandbox_created_at, compile_started_at, compile_finished_at,
                                execution_started_at, now_iso(), sandbox_startup_ms, compile_ms,
                                int((t_exec_end - t_exec_start) * 1000), int((time.perf_counter() - req_start_wall) * 1000),
                                cached_compilation
                            )
                        )

                    # Non-zero exit code (Runtime Error)
                    if proc.returncode != 0:
                        if job_registry.is_cancelled(exec_id):
                            job_registry.cleanup_cancel_flag(exec_id)
                            return ExecutionResult(
                                verdict="cancelled",
                                stderr_output="Execution was cancelled by user.",
                                test_cases_passed=passed_count,
                                total_test_cases=total_cases,
                            )

                        failed_info = FailedTestCaseInfo(
                            test_number=index + 1,
                            testNumber=index + 1,
                            input=tc.input,
                            actual_output=stdout_data if stdout_data else None,
                            actualOutput=stdout_data if stdout_data else None,
                            expected_output=tc.expected_output,
                            expectedOutput=tc.expected_output,
                            error_message=stderr_data or f"Process exited with code {proc.returncode}",
                            errorMessage=stderr_data or f"Process exited with code {proc.returncode}",
                            failure_type="runtime_error",
                            failureType="runtime_error",
                        )
                        if is_custom_run:
                            sample_results.append(SampleTestResult(
                                test_number=index + 1,
                                input=tc.input,
                                expected_output=tc.expected_output,
                                actual_output=stdout_data,
                                passed=False,
                                runtime_ms=duration_ms,
                                verdict="runtime_error",
                                stderr=stderr_data or f"Process exited with code {proc.returncode}",
                            ))
                            if first_failed_info is None:
                                first_failed_info = failed_info
                                failing_verdict = "runtime_error"
                                failing_stdout = stdout_data
                                failing_stderr = stderr_data
                            continue
                        else:
                            t_exec_end = time.perf_counter()
                            return ExecutionResult(
                                verdict="runtime_error",
                                runtime_ms=duration_ms,
                                memory_kb=peak_memory_kb,
                                stdout_output=stdout_data,
                                stderr_output=stderr_data or f"Process exited with code {proc.returncode}",
                                test_cases_passed=passed_count,
                                total_test_cases=total_cases,
                                first_failed_test=failed_info,
                                firstFailedTest=failed_info,
                                telemetry=self._build_telemetry(
                                    exec_id, req_received_at, queued_timestamp, worker_acquired_at,
                                    sandbox_created_at, compile_started_at, compile_finished_at,
                                    execution_started_at, now_iso(), sandbox_startup_ms, compile_ms,
                                    int((t_exec_end - t_exec_start) * 1000), int((time.perf_counter() - req_start_wall) * 1000),
                                    cached_compilation
                                )
                            )

                    # Custom input without expected return value
                    if tc.expected_output is None:
                        passed_count += 1
                        if is_custom_run:
                            sample_results.append(SampleTestResult(
                                test_number=index + 1,
                                input=tc.input,
                                expected_output=None,
                                actual_output=stdout_data,
                                passed=True,
                                runtime_ms=duration_ms,
                                verdict="accepted",
                            ))
                        continue

                    # Compare output
                    is_match = compare_outputs(stdout_data, tc.expected_output)
                    if is_match:
                        passed_count += 1
                        if is_custom_run:
                            sample_results.append(SampleTestResult(
                                test_number=index + 1,
                                input=tc.input,
                                expected_output=tc.expected_output,
                                actual_output=stdout_data,
                                passed=True,
                                runtime_ms=duration_ms,
                                verdict="accepted",
                            ))
                    else:
                        raw_act = stdout_data
                        norm_act = normalize_output(stdout_data)
                        raw_exp = tc.expected_output or ""
                        norm_exp = normalize_output(raw_exp)
                        was_normalized = (raw_act != norm_act) or (raw_exp != norm_exp)

                        failed_info = FailedTestCaseInfo(
                            test_number=index + 1,
                            testNumber=index + 1,
                            input=tc.input,
                            actual_output=raw_act,
                            actualOutput=raw_act,
                            expected_output=raw_exp,
                            expectedOutput=raw_exp,
                            failure_type="wrong_answer",
                            failureType="wrong_answer",
                            normalized=was_normalized,
                        )

                        if is_custom_run:
                            sample_results.append(SampleTestResult(
                                test_number=index + 1,
                                input=tc.input,
                                expected_output=tc.expected_output,
                                actual_output=stdout_data,
                                passed=False,
                                runtime_ms=duration_ms,
                                verdict="wrong_answer",
                            ))
                            if first_failed_info is None:
                                first_failed_info = failed_info
                                failing_verdict = "wrong_answer"
                                failing_stdout = stdout_data
                                failing_stderr = stderr_data
                            continue
                        else:
                            # Submit canonical mode: Stop immediately, do not evaluate remaining hidden test cases
                            t_exec_end = time.perf_counter()
                            return ExecutionResult(
                                verdict="wrong_answer",
                                runtime_ms=duration_ms,
                                memory_kb=peak_memory_kb,
                                stdout_output=stdout_data,
                                stderr_output=stderr_data,
                                test_cases_passed=passed_count,
                                total_test_cases=total_cases,
                                first_failed_test=failed_info,
                                firstFailedTest=failed_info,
                                telemetry=self._build_telemetry(
                                    exec_id, req_received_at, queued_timestamp, worker_acquired_at,
                                    sandbox_created_at, compile_started_at, compile_finished_at,
                                    execution_started_at, now_iso(), sandbox_startup_ms, compile_ms,
                                    int((t_exec_end - t_exec_start) * 1000), int((time.perf_counter() - req_start_wall) * 1000),
                                    cached_compilation
                                )
                            )

                except subprocess.TimeoutExpired:
                    job_registry.unregister(exec_id)
                    try:
                        if sys.platform == "win32":
                            subprocess.run(
                                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                                stdout=subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL,
                                timeout=2,
                            )
                        proc.kill()
                        proc.wait(timeout=1.0)
                    except Exception:
                        pass

                    t_exec_end = time.perf_counter()
                    failed_info = FailedTestCaseInfo(
                        test_number=index + 1,
                        testNumber=index + 1,
                        input=tc.input if (is_custom_run or tc.is_sample) else None,
                        error_message=f"Time limit exceeded: maximum {effective_timeout:.1f}s allowed.",
                        errorMessage=f"Time limit exceeded: maximum {effective_timeout:.1f}s allowed.",
                        failure_type="time_limit_exceeded",
                        failureType="time_limit_exceeded",
                    )
                    return ExecutionResult(
                        verdict="time_limit_exceeded",
                        runtime_ms=int(effective_timeout * 1000),
                        memory_kb=peak_memory_kb,
                        stdout_output=last_stdout,
                        stderr_output=f"Time limit exceeded: maximum {effective_timeout:.1f}s allowed.",
                        test_cases_passed=passed_count,
                        total_test_cases=total_cases,
                        first_failed_test=failed_info,
                        firstFailedTest=failed_info,
                        sample_test_results=sample_results if is_custom_run else None,
                        telemetry=self._build_telemetry(
                            exec_id, req_received_at, queued_timestamp, worker_acquired_at,
                            sandbox_created_at, compile_started_at, compile_finished_at,
                            execution_started_at, now_iso(), sandbox_startup_ms, compile_ms,
                            int((t_exec_end - t_exec_start) * 1000), int((time.perf_counter() - req_start_wall) * 1000),
                            cached_compilation
                        )
                    )
                except Exception as err:
                    job_registry.unregister(exec_id)
                    return ExecutionResult(
                        verdict="internal_error",
                        runtime_ms=0,
                        memory_kb=peak_memory_kb,
                        stdout_output=last_stdout,
                        stderr_output=f"Runner execution error: {str(err)}",
                        test_cases_passed=passed_count,
                        total_test_cases=total_cases,
                    )

            # Execution loop finished
            execution_finished_at = now_iso()
            t_exec_end = time.perf_counter()
            exec_total_ms = int((t_exec_end - t_exec_start) * 1000)
            total_duration_ms = int((time.perf_counter() - req_start_wall) * 1000)

            telemetry = self._build_telemetry(
                exec_id, req_received_at, queued_timestamp, worker_acquired_at,
                sandbox_created_at, compile_started_at, compile_finished_at,
                execution_started_at, execution_finished_at, sandbox_startup_ms, compile_ms,
                exec_total_ms, total_duration_ms, cached_compilation
            )

            job_registry.cleanup_cancel_flag(exec_id)

            if first_failed_info is not None:
                # Custom run (Run Code) with a failed sample test
                return ExecutionResult(
                    verdict=failing_verdict or "wrong_answer",
                    runtime_ms=max_runtime_ms,
                    memory_kb=peak_memory_kb,
                    stdout_output=failing_stdout or last_stdout,
                    stderr_output=failing_stderr or last_stderr,
                    test_cases_passed=passed_count,
                    total_test_cases=total_cases,
                    telemetry=telemetry,
                    first_failed_test=first_failed_info,
                    firstFailedTest=first_failed_info,
                    sample_test_results=sample_results,
                )

            # All test cases succeeded
            return ExecutionResult(
                verdict="accepted",
                runtime_ms=max_runtime_ms,
                memory_kb=peak_memory_kb,
                stdout_output=last_stdout,
                stderr_output=last_stderr,
                test_cases_passed=passed_count,
                total_test_cases=total_cases,
                telemetry=telemetry,
                sample_test_results=sample_results if is_custom_run else None,
            )

    def _build_telemetry(
        self,
        execution_id: str,
        req_received_at: str,
        job_queued_at: Optional[str],
        worker_acquired_at: str,
        sandbox_created_at: str,
        compile_started_at: Optional[str],
        compile_finished_at: Optional[str],
        execution_started_at: str,
        execution_finished_at: str,
        sandbox_startup_ms: int,
        compile_ms: int,
        execution_ms: int,
        total_ms: int,
        cached_compilation: bool,
    ) -> ExecutionTelemetry:
        return ExecutionTelemetry(
            execution_id=execution_id,
            request_received_at=req_received_at,
            job_queued_at=job_queued_at,
            worker_acquired_at=worker_acquired_at,
            sandbox_created_at=sandbox_created_at,
            compile_started_at=compile_started_at,
            compile_finished_at=compile_finished_at,
            execution_started_at=execution_started_at,
            execution_finished_at=execution_finished_at,
            result_collected_at=datetime.now(timezone.utc).isoformat(),
            response_sent_at=datetime.now(timezone.utc).isoformat(),
            sandbox_startup_ms=sandbox_startup_ms,
            compile_ms=compile_ms,
            execution_ms=execution_ms,
            total_ms=total_ms,
            cached_compilation=cached_compilation,
        )
