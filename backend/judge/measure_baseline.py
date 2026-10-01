"""Comprehensive Baseline Latency Benchmark for VERNIQ Judge Pipeline."""
import os
import sys
import time
import json
import statistics
import urllib.request
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.runner.sandbox import SandboxRunner, TestCaseItem

PYTHON_CODE = '''class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        lookup = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in lookup:
                return [lookup[diff], i]
            lookup[num] = i
        return []
'''

JAVA_CODE = '''import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}
'''

CPP_CODE = '''#include <vector>
#include <unordered_map>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        std::unordered_map<int, int> map;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};
'''

TEST_CASES_SAMPLE = [
    TestCaseItem(input="nums = [2,7,11,15], target = 9", expected_output="[0,1]", is_sample=True)
]

TEST_CASES_FULL = [
    TestCaseItem(input="nums = [2,7,11,15], target = 9", expected_output="[0,1]", is_sample=True),
    TestCaseItem(input="nums = [3,2,4], target = 6", expected_output="[1,2]", is_sample=True),
    TestCaseItem(input="nums = [3,3], target = 6", expected_output="[0,1]", is_sample=True),
    TestCaseItem(input="nums = [1,5,3,7,9], target = 12", expected_output="[2,4]", is_sample=False),
    TestCaseItem(input="nums = [0,4,3,0], target = 0", expected_output="[0,3]", is_sample=False),
]

def benchmark_direct_runner(iterations=5):
    runner = SandboxRunner()
    results = {}

    for name, lang, code in [
        ("Python Run Code (1 sample)", "python", PYTHON_CODE),
        ("Python Submit (5 cases)", "python", PYTHON_CODE),
        ("Java Run Code (1 sample)", "java", JAVA_CODE),
        ("Java Submit (5 cases)", "java", JAVA_CODE),
        ("C++ Run Code (1 sample)", "cpp", CPP_CODE),
        ("C++ Submit (5 cases)", "cpp", CPP_CODE),
    ]:
        tc = TEST_CASES_SAMPLE if "Run Code" in name else TEST_CASES_FULL
        is_custom = "Run Code" in name
        timings = []
        for _ in range(iterations):
            t0 = time.perf_counter()
            res = runner.execute(language=lang, source_code=code, test_cases=tc, is_custom_run=is_custom)
            dur = (time.perf_counter() - t0) * 1000
            timings.append((dur, res.runtime_ms, res.verdict))

        latencies = [t[0] for t in timings]
        program_runtimes = [t[1] for t in timings]
        verdicts = [t[2] for t in timings]

        results[name] = {
            "p50": round(statistics.median(latencies), 1),
            "p90": round(sorted(latencies)[int(len(latencies)*0.9)], 1),
            "p95": round(sorted(latencies)[int(len(latencies)*0.95)], 1),
            "p99": round(sorted(latencies)[-1], 1),
            "avg_program_runtime_ms": round(statistics.mean(program_runtimes), 1),
            "verdict": verdicts[0],
            "raw": [round(x, 1) for x in latencies]
        }
    return results

def benchmark_http_api(iterations=5):
    url = "http://127.0.0.1:8080/execute"
    results = {}

    for name, lang, code in [
        ("HTTP Python Run Code", "python", PYTHON_CODE),
        ("HTTP Java Run Code", "java", JAVA_CODE),
        ("HTTP C++ Run Code", "cpp", CPP_CODE),
    ]:
        payload = json.dumps({
            "language": lang,
            "source_code": code,
            "stdin_input": "nums = [2,7,11,15], target = 9",
            "is_custom_run": True,
            "test_cases": [{"input": "nums = [2,7,11,15], target = 9", "expected_output": "[0,1]", "is_sample": True}]
        }).encode("utf-8")

        timings = []
        for _ in range(iterations):
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            t0 = time.perf_counter()
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    dur = (time.perf_counter() - t0) * 1000
                    timings.append((dur, data.get("runtime_ms", 0), data.get("verdict")))
            except Exception as e:
                timings.append((9999, 0, str(e)))

        latencies = [t[0] for t in timings]
        results[name] = {
            "p50": round(statistics.median(latencies), 1),
            "p90": round(sorted(latencies)[int(len(latencies)*0.9)], 1),
            "p95": round(sorted(latencies)[int(len(latencies)*0.95)], 1),
            "p99": round(sorted(latencies)[-1], 1),
            "raw": [round(x, 1) for x in latencies]
        }
    return results

def measure_java_breakdown():
    """Breaks down Java compilation vs execution vs JVM startup."""
    import tempfile
    import subprocess
    import shutil

    with tempfile.TemporaryDirectory() as td:
        src_path = os.path.join(td, "Main.java")
        # generate simple Java program
        with open(src_path, "w") as f:
            f.write('''public class Main {
    public static void main(String[] args) {
        System.out.println("hello world");
    }
}''')
        # Measure javac compilation
        t0 = time.perf_counter()
        cp = subprocess.run(["javac", "Main.java"], cwd=td, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        t_compile = (time.perf_counter() - t0) * 1000

        # Measure 1st java execution
        t0 = time.perf_counter()
        rp1 = subprocess.run(["java", "-Xmx256m", "-Xss64m", "-cp", ".", "Main"], cwd=td, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        t_run1 = (time.perf_counter() - t0) * 1000

        # Measure 2nd java execution (cold process spawn, but OS file cached)
        t0 = time.perf_counter()
        rp2 = subprocess.run(["java", "-Xmx256m", "-Xss64m", "-cp", ".", "Main"], cwd=td, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        t_run2 = (time.perf_counter() - t0) * 1000

        return {
            "javac_compile_ms": round(t_compile, 1),
            "java_process_spawn_1_ms": round(t_run1, 1),
            "java_process_spawn_2_ms": round(t_run2, 1),
        }

if __name__ == "__main__":
    print("=== MEASURING CURRENT JAVA BREAKDOWN ===")
    j_breakdown = measure_java_breakdown()
    print(json.dumps(j_breakdown, indent=2))

    print("\n=== MEASURING DIRECT SANDBOX RUNNER BASELINE ===")
    runner_bench = benchmark_direct_runner(iterations=5)
    print(json.dumps(runner_bench, indent=2))

    print("\n=== MEASURING HTTP API BASELINE ===")
    http_bench = benchmark_http_api(iterations=5)
    print(json.dumps(http_bench, indent=2))
