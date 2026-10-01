"""VERNIQ Online Judge Concurrency & Load Benchmark Suite."""
import concurrent.futures
import json
import os
import statistics
import sys
import time
import urllib.request
import urllib.error

JUDGE_URL = os.getenv("JUDGE_URL", "http://127.0.0.1:8080")

JAVA_CODE = '''import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) return new int[] { map.get(complement), i };
            map.put(nums[i], i);
        }
        return new int[0];
    }
}'''

PYTHON_CODE = '''class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        lookup = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in lookup: return [lookup[diff], i]
            lookup[num] = i
        return []'''

CPP_CODE = '''#include <vector>
#include <unordered_map>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        std::unordered_map<int, int> map;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) return {map[complement], i};
            map[nums[i]] = i;
        }
        return {};
    }
};'''

TEST_CASES_SAMPLE = [{"input": "nums = [2,7,11,15], target = 9", "expected_output": "[0,1]", "is_sample": True}]
TEST_CASES_FULL = [
    {"input": "nums = [2,7,11,15], target = 9", "expected_output": "[0,1]", "is_sample": True},
    {"input": "nums = [3,2,4], target = 6", "expected_output": "[1,2]", "is_sample": True},
    {"input": "nums = [3,3], target = 6", "expected_output": "[0,1]", "is_sample": True},
    {"input": "nums = [1,5,3,7,9], target = 12", "expected_output": "[2,4]", "is_sample": False},
    {"input": "nums = [0,4,3,0], target = 0", "expected_output": "[0,3]", "is_sample": False},
]

def execute_request(lang: str, code: str, mode: str = "RUN", exec_id: str = "test"):
    tc = TEST_CASES_SAMPLE if mode == "RUN" else TEST_CASES_FULL
    payload = json.dumps({
        "execution_id": exec_id,
        "language": lang,
        "source_code": code,
        "mode": mode,
        "is_custom_run": mode == "RUN",
        "test_cases": tc,
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{JUDGE_URL}/execute",
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=25.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            total_duration = (time.perf_counter() - t0) * 1000
            tel = data.get("telemetry") or {}
            return {
                "success": True,
                "total_ms": total_duration,
                "compile_ms": tel.get("compile_ms", 0),
                "execution_ms": tel.get("execution_ms", 0),
                "cached": tel.get("cached_compilation", False),
                "verdict": data.get("verdict"),
                "runtime_ms": data.get("runtime_ms", 0),
            }
    except Exception as e:
        total_duration = (time.perf_counter() - t0) * 1000
        return {
            "success": False,
            "total_ms": total_duration,
            "error": str(e),
            "verdict": "error",
        }

def run_concurrency_batch(concurrency: int, language: str = "python", mode: str = "RUN"):
    code_map = {"python": PYTHON_CODE, "java": JAVA_CODE, "cpp": CPP_CODE}
    code = code_map[language]

    print(f"\n--- Testing Concurrency = {concurrency} ({language.upper()} {mode}) ---")
    start_wall = time.perf_counter()

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [
            pool.submit(execute_request, language, code, mode, f"load-{concurrency}-{i}")
            for i in range(concurrency)
        ]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    total_wall_sec = time.perf_counter() - start_wall

    latencies = [r["total_ms"] for r in results]
    successes = [r for r in results if r["success"]]
    failures = len(results) - len(successes)
    cache_hits = sum(1 for r in successes if r.get("cached"))

    latencies.sort()
    p50 = statistics.median(latencies)
    p90 = latencies[int(len(latencies) * 0.90)] if len(latencies) > 1 else latencies[0]
    p95 = latencies[int(len(latencies) * 0.95)] if len(latencies) > 1 else latencies[0]
    p99 = latencies[-1]

    throughput = round(concurrency / total_wall_sec, 1)

    summary = {
        "concurrency": concurrency,
        "total_requests": concurrency,
        "successful": len(successes),
        "failed": failures,
        "failure_rate_pct": round((failures / concurrency) * 100, 1),
        "cache_hit_pct": round((cache_hits / max(1, len(successes))) * 100, 1),
        "wall_time_sec": round(total_wall_sec, 2),
        "throughput_req_per_sec": throughput,
        "p50_ms": round(p50, 1),
        "p90_ms": round(p90, 1),
        "p95_ms": round(p95, 1),
        "p99_ms": round(p99, 1),
    }

    print(json.dumps(summary, indent=2))
    return summary

def run_full_suite():
    print("==================================================")
    print("VERNIQ ONLINE JUDGE POST-OPTIMIZATION BENCHMARK")
    print("==================================================")

    # 1. Warm-up and cache priming
    print("\n[Warmup / Cache Priming]")
    for lang in ("python", "java", "cpp"):
        execute_request(lang, {"python": PYTHON_CODE, "java": JAVA_CODE, "cpp": CPP_CODE}[lang], "RUN", f"warm-{lang}")

    # 2. Concurrency Tests across 1, 5, 10, 25
    suite_results = {}
    for concurrency in [1, 5, 10, 25]:
        suite_results[f"c_{concurrency}_python"] = run_concurrency_batch(concurrency, "python", "RUN")
        suite_results[f"c_{concurrency}_java"] = run_concurrency_batch(concurrency, "java", "RUN")

    # 3. Submit full test suite
    print("\n[Submit Benchmark (5 Test Cases)]")
    for lang in ("python", "java", "cpp"):
        res = execute_request(lang, {"python": PYTHON_CODE, "java": JAVA_CODE, "cpp": CPP_CODE}[lang], "SUBMIT", f"submit-{lang}")
        print(f"Submit {lang.upper()}: Total {res['total_ms']:.1f}ms | Verdict: {res['verdict']} | Cached: {res.get('cached')}")

    print("\n==================================================")
    print("LOAD TEST COMPLETE")
    print("==================================================")

if __name__ == "__main__":
    run_full_suite()
