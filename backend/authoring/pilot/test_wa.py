"""
Test WA verdict on intentionally incorrect code.
"""
import urllib.request, json
from backend.importer.importer import ProblemCatalogImporter

def test_wa():
    imp = ProblemCatalogImporter()
    prob = imp.run_query("SELECT id FROM public.problems WHERE verniq_id = 'VRQ-000004';")[0]
    tests = imp.run_query(f"SELECT id, input, expected_output, is_sample FROM public.test_cases WHERE problem_id = '{prob['id']}' AND is_sample = true ORDER BY order_index;")

    bad_code = """class Solution {
    public boolean isValid(String s) {
        return true; // Intentional WA for s = '(]'
    }
}"""

    payload = {
        "execution_id": "audit-wa-test",
        "language": "java",
        "source_code": bad_code,
        "is_custom_run": True,
        "test_cases": tests,
        "mode": "RUN"
    }

    req = urllib.request.Request("http://127.0.0.1:8080/execute", data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10.0) as resp:
        res = json.loads(resp.read().decode("utf-8"))
    print(f"Buggy Code Verdict: {res.get('verdict')} | Passed: {res.get('test_cases_passed')}/{res.get('total_test_cases')}")

if __name__ == "__main__":
    test_wa()
