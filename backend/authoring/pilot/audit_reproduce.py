"""
Step 1: Reproduce production judge failure for VRQ-000004 — Valid Parentheses.
"""

import json
import urllib.request
from backend.importer.importer import ProblemCatalogImporter

def reproduce_vrq_000004():
    imp = ProblemCatalogImporter()
    prob = imp.run_query("SELECT id, verniq_id, title FROM public.problems WHERE verniq_id = 'VRQ-000004';")[0]
    prob_id = prob["id"]
    tests = imp.run_query(f"SELECT id, input, expected_output, is_sample FROM public.test_cases WHERE problem_id = '{prob_id}' AND is_sample = true ORDER BY order_index;")

    print(f"Loaded problem: {prob['verniq_id']} ({prob['title']}) with {len(tests)} sample tests.")
    for t in tests:
        print(f"  Test ID: {t['id']} | Input: {repr(t['input'])} | Expected: {repr(t['expected_output'])}")

    java_code = """class Solution {
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

    payload = {
        "execution_id": "audit-step-1-reproduce",
        "language": "java",
        "source_code": java_code,
        "is_custom_run": True,
        "test_cases": tests,
        "mode": "RUN"
    }

    req = urllib.request.Request(
        "http://127.0.0.1:8080/execute",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=15.0) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    print("\n--- JUDGE RESPONSE ---")
    print(json.dumps(result, indent=2))
    return result

def test_python_vrq_000004():
    imp = ProblemCatalogImporter()
    prob = imp.run_query("SELECT id, verniq_id, title FROM public.problems WHERE verniq_id = 'VRQ-000004';")[0]
    prob_id = prob["id"]
    tests = imp.run_query(f"SELECT id, input, expected_output, is_sample FROM public.test_cases WHERE problem_id = '{prob_id}' AND is_sample = true ORDER BY order_index;")

    py_code = """class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        for c in s:
            if c in mapping:
                if not stack or stack.pop() != mapping[c]:
                    return False
            else:
                stack.append(c)
        return len(stack) == 0
"""
    payload = {
        "execution_id": "audit-step-1-py",
        "language": "python",
        "source_code": py_code,
        "is_custom_run": True,
        "test_cases": tests,
        "mode": "RUN"
    }

    req = urllib.request.Request(
        "http://127.0.0.1:8080/execute",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=15.0) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    print("\n--- PYTHON JUDGE RESPONSE ---")
    print(f"Verdict: {result.get('verdict')} | Passed: {result.get('test_cases_passed')}/{result.get('total_test_cases')}")
    print(f"Stdout: {repr(result.get('stdout_output'))}")
    return result

if __name__ == "__main__":
    reproduce_vrq_000004()
    test_python_vrq_000004()
