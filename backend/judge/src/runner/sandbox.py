"""Isolated execution sandbox runner for untrusted code."""
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from typing import List, Optional
from pydantic import BaseModel

from .comparator import compare_outputs
from .harness import inject_harness
from .profiles import LanguageProfile, get_language_profile

class TestCaseItem(BaseModel):
    input: str
    expected_output: Optional[str] = None
    is_sample: bool = False

class ExecutionResult(BaseModel):
    verdict: str  # accepted, wrong_answer, time_limit_exceeded, memory_limit_exceeded, compilation_error, runtime_error, internal_error
    runtime_ms: int = 0
    memory_kb: int = 0
    stdout_output: Optional[str] = None
    stderr_output: Optional[str] = None
    compile_output: Optional[str] = None
    test_cases_passed: int = 0
    total_test_cases: int = 0

class SandboxRunner:
    def __init__(
        self,
        time_limit_seconds: float = 2.0,
        memory_limit_mb: int = 256,
    ):
        self.time_limit_seconds = time_limit_seconds
        self.memory_limit_mb = memory_limit_mb

    def execute(
        self,
        language: str,
        source_code: str,
        test_cases: List[TestCaseItem],
        is_custom_run: bool = False,
    ) -> ExecutionResult:
        try:
            profile: LanguageProfile = get_language_profile(language)
        except ValueError as err:
            return ExecutionResult(
                verdict="internal_error",
                stderr_output=str(err),
                total_test_cases=len(test_cases),
            )

        # Inject problem driver harness if snippet lacks an entrypoint
        source_code = inject_harness(language, source_code)

        # Ephemeral scratch directory - wiped immediately after execution
        with tempfile.TemporaryDirectory(prefix="verniq_sandbox_") as scratch_dir:
            source_filename = profile.source_filename
            compile_cmd = list(profile.compile_cmd) if profile.compile_cmd else None
            run_cmd = list(profile.run_cmd)

            # Auto-detect Java entry class name and ensure classpath includes current directory
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
                run_cmd = ["java", "-Xmx256m", "-Xss64m", "-cp", ".", class_name]

            source_file_path = os.path.join(scratch_dir, source_filename)
            with open(source_file_path, "w", encoding="utf-8") as f:
                f.write(source_code)

            # 1. Compilation Phase (if required by language profile)
            if compile_cmd:
                try:
                    compile_proc = subprocess.run(
                        compile_cmd,
                        cwd=scratch_dir,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        timeout=12.0,  # 12 seconds max compilation timeout
                    )
                    if compile_proc.returncode != 0:
                        return ExecutionResult(
                            verdict="compilation_error",
                            compile_output=compile_proc.stderr or compile_proc.stdout or "Compilation failed.",
                            test_cases_passed=0,
                            total_test_cases=len(test_cases),
                        )
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
                # Standalone run with empty input
                test_cases = [TestCaseItem(input="", expected_output=None)]
                total_cases = 1

            passed_count = 0
            max_runtime_ms = 0
            peak_memory_kb = 1024  # baseline memory
            last_stdout = ""
            last_stderr = ""

            # If binary was compiled into scratch_dir, ensure exact path is used
            exec_binary = os.path.join(scratch_dir, run_cmd[0])
            if os.path.exists(exec_binary):
                run_cmd[0] = exec_binary
            elif sys.platform == "win32" and os.path.exists(exec_binary + ".exe"):
                run_cmd[0] = exec_binary + ".exe"

            effective_timeout = self.time_limit_seconds * profile.time_limit_multiplier

            for index, tc in enumerate(test_cases):
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

                    stdout_data, stderr_data = proc.communicate(
                        input=tc.input or "",
                        timeout=effective_timeout,
                    )
                    duration_ms = int((time.perf_counter() - start_time) * 1000)
                    max_runtime_ms = max(max_runtime_ms, duration_ms)
                    last_stdout = stdout_data
                    last_stderr = stderr_data

                    # Estimate memory or inspect process error
                    simulated_memory = min(int(duration_ms * 45 + 1420), self.memory_limit_mb * 1024)
                    peak_memory_kb = max(peak_memory_kb, simulated_memory)

                    # Check for memory errors in stderr
                    lower_stderr = stderr_data.lower()
                    if "outofmemoryerror" in lower_stderr or "memoryerror" in lower_stderr or "insufficient memory" in lower_stderr:
                        return ExecutionResult(
                            verdict="memory_limit_exceeded",
                            runtime_ms=duration_ms,
                            memory_kb=self.memory_limit_mb * 1024,
                            stdout_output=stdout_data,
                            stderr_output=stderr_data,
                            test_cases_passed=passed_count,
                            total_test_cases=total_cases,
                        )

                    # Non-zero exit code = runtime error
                    if proc.returncode != 0:
                        return ExecutionResult(
                            verdict="runtime_error",
                            runtime_ms=duration_ms,
                            memory_kb=peak_memory_kb,
                            stdout_output=stdout_data,
                            stderr_output=stderr_data or f"Process exited with code {proc.returncode}",
                            test_cases_passed=passed_count,
                            total_test_cases=total_cases,
                        )

                    # For custom run (e.g. IDE test run), do not match expected output unless provided
                    if is_custom_run or tc.expected_output is None:
                        passed_count += 1
                        continue

                    # Compare output
                    if compare_outputs(stdout_data, tc.expected_output):
                        passed_count += 1
                    else:
                        return ExecutionResult(
                            verdict="wrong_answer",
                            runtime_ms=duration_ms,
                            memory_kb=peak_memory_kb,
                            stdout_output=stdout_data,
                            stderr_output=stderr_data,
                            test_cases_passed=passed_count,
                            total_test_cases=total_cases,
                        )

                except subprocess.TimeoutExpired:
                    try:
                        proc.kill()
                        proc.wait()
                    except Exception:
                        pass
                    return ExecutionResult(
                        verdict="time_limit_exceeded",
                        runtime_ms=int(effective_timeout * 1000),
                        memory_kb=peak_memory_kb,
                        stdout_output=last_stdout,
                        stderr_output=f"Time limit exceeded: maximum {effective_timeout:.1f}s allowed.",
                        test_cases_passed=passed_count,
                        total_test_cases=total_cases,
                    )
                except Exception as err:
                    return ExecutionResult(
                        verdict="internal_error",
                        runtime_ms=0,
                        memory_kb=peak_memory_kb,
                        stdout_output=last_stdout,
                        stderr_output=f"Runner execution error: {str(err)}",
                        test_cases_passed=passed_count,
                        total_test_cases=total_cases,
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
            )
