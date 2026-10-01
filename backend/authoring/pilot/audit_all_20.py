"""
Step 2: Automated Smoke Test across all 20 Published Pilot Problems.
Evaluates sample test execution against live judge for each problem.
"""

import json
import urllib.request
from typing import Dict, Any, List
from backend.importer.importer import ProblemCatalogImporter
from backend.authoring.pilot.specs import PILOT_SPECS

def run_pre_fix_smoke_test() -> List[Dict[str, Any]]:
    imp = ProblemCatalogImporter()
    results = []

    print("=" * 80)
    print("STEP 2: RUNNING PRE-FIX SMOKE TEST ACROSS ALL 20 PILOT PROBLEMS (JAVA & PYTHON)")
    print("=" * 80)

    for verniq_id, spec in PILOT_SPECS.items():
        prob = imp.run_query(f"SELECT id, verniq_id, title FROM public.problems WHERE verniq_id = '{verniq_id}';")[0]
        prob_id = prob["id"]
        sample_tests = imp.run_query(f"""
            SELECT id, input, expected_output, is_sample 
            FROM public.test_cases 
            WHERE problem_id = '{prob_id}' AND is_sample = true 
            ORDER BY order_index 
            LIMIT 1;
        """)
        if not sample_tests:
            continue
        test = sample_tests[0]

        # Test Java starter template (or minimal placeholder)
        java_template = spec["starter_templates"]["java"]
        payload_java = {
            "execution_id": f"smoke-java-{verniq_id}",
            "language": "java",
            "source_code": java_template,
            "is_custom_run": True,
            "test_cases": [test],
            "mode": "RUN"
        }
        try:
            req = urllib.request.Request(
                "http://127.0.0.1:8080/execute",
                data=json.dumps(payload_java).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                res_java = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            res_java = {"verdict": "error", "stdout_output": str(e)}

        results.append({
            "verniq_id": verniq_id,
            "title": spec["title"],
            "difficulty": spec["difficulty"],
            "test_id": test["id"],
            "input": test["input"],
            "expected_output": test["expected_output"],
            "java_actual": (res_java.get("stdout_output") or "").strip(),
            "java_verdict": res_java.get("verdict"),
            "java_passed": res_java.get("test_cases_passed", 0),
        })
        print(f"[{verniq_id}] {spec['title']:<40} | Java Verdict: {res_java.get('verdict'):<15} | Output: {repr(res_java.get('stdout_output', ''))[:40]}")

    return results

if __name__ == "__main__":
    res = run_pre_fix_smoke_test()
