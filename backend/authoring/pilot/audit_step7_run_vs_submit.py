"""
Step 7: Explicitly test RUN CODE vs SUBMIT on VRQ-000004.
"""
import json
import urllib.request
from backend.importer.importer import ProblemCatalogImporter

def test_run_vs_submit():
    imp = ProblemCatalogImporter()
    prob = imp.run_query("SELECT id, verniq_id, title FROM public.problems WHERE verniq_id = 'VRQ-000004';")[0]
    prob_id = prob["id"]

    sample_tests = imp.run_query(f"SELECT id, input, expected_output, is_sample FROM public.test_cases WHERE problem_id = '{prob_id}' AND is_sample = true ORDER BY order_index;")
    all_tests = imp.run_query(f"SELECT id, input, expected_output, is_sample FROM public.test_cases WHERE problem_id = '{prob_id}' ORDER BY order_index;")

    canonical_java = """class Solution {
    public boolean isValid(String s) {
        java.util.Stack<Character> stack = new java.util.Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}"""

    # 1. RUN CODE mode (samples only)
    payload_run = {
        "execution_id": "test-run-mode-vrq-000004",
        "language": "java",
        "source_code": canonical_java,
        "is_custom_run": True,
        "test_cases": sample_tests,
        "mode": "RUN"
    }

    req1 = urllib.request.Request("http://127.0.0.1:8080/execute", data=json.dumps(payload_run).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req1, timeout=15.0) as resp1:
        res_run = json.loads(resp1.read().decode("utf-8"))

    # 2. SUBMIT mode (all 215 tests)
    payload_submit = {
        "execution_id": "test-submit-mode-vrq-000004",
        "language": "java",
        "source_code": canonical_java,
        "is_custom_run": False,
        "test_cases": all_tests,
        "mode": "SUBMIT"
    }

    req2 = urllib.request.Request("http://127.0.0.1:8080/execute", data=json.dumps(payload_submit).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req2, timeout=60.0) as resp2:
        res_submit = json.loads(resp2.read().decode("utf-8"))

    print("=" * 60)
    print("RUN CODE RESULTS:")
    print(f"  Verdict: {res_run.get('verdict')}")
    print(f"  Passed: {res_run.get('test_cases_passed')} / {res_run.get('total_test_cases')}")
    print(f"  Runtime: {res_run.get('runtime_ms')} ms")
    tel_run = res_run.get('telemetry') or {}
    print(f"  Cached Compilation: {tel_run.get('cached_compilation')}")

    print("=" * 60)
    print("SUBMIT RESULTS:")
    print(f"  Verdict: {res_submit.get('verdict')}")
    print(f"  Passed: {res_submit.get('test_cases_passed')} / {res_submit.get('total_test_cases')}")
    print(f"  Runtime: {res_submit.get('runtime_ms')} ms")
    tel_submit = res_submit.get('telemetry') or {}
    print(f"  Cached Compilation: {tel_submit.get('cached_compilation')}")
    print("=" * 60)

if __name__ == "__main__":
    test_run_vs_submit()
