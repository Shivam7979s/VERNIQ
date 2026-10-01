"""
Step 3: Check Database Test Vectors.
Inspects actual test-case records used by the live judge for all published problems.
"""

from backend.importer.importer import ProblemCatalogImporter
import json

def inspect_db():
    imp = ProblemCatalogImporter()
    problems = imp.run_query("""
        SELECT p.id, p.verniq_id, p.title, p.difficulty, p.is_published, p.workflow_status,
               COUNT(t.id) as test_count,
               COUNT(CASE WHEN t.is_sample THEN 1 END) as sample_count
        FROM public.problems p
        LEFT JOIN public.test_cases t ON p.id = t.problem_id
        WHERE p.is_published = true
        GROUP BY p.id, p.verniq_id, p.title, p.difficulty, p.is_published, p.workflow_status
        ORDER BY p.verniq_id;
    """)

    print(f"Total published problems: {len(problems)}")
    print(f"{'Verniq ID':<12} | {'Title':<35} | {'Diff':<8} | {'Total':<6} | {'Samples':<8}")
    print("-" * 80)
    for p in problems:
        print(f"{p['verniq_id']:<12} | {p['title']:<35} | {p['difficulty']:<8} | {p['test_count']:<6} | {p['sample_count']:<8}")

    print("\n--- SAMPLE TEST CASE RECORD INSPECTION ---")
    for p in problems[:5]:
        sample = imp.run_query(f"""
            SELECT id, order_index, is_sample, input, expected_output
            FROM public.test_cases
            WHERE problem_id = '{p['id']}' AND is_sample = true
            ORDER BY order_index
            LIMIT 2;
        """)
        print(f"\nProblem: {p['verniq_id']} ({p['title']})")
        for s in sample:
            print(f"  Test {s['order_index']} ({s['id']}):")
            print(f"    input: {repr(s['input'])}")
            print(f"    expected_output: {repr(s['expected_output'])}")

if __name__ == "__main__":
    inspect_db()
