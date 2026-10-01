"""
Verification script for Phase 4.1 Pilot Authoring.
Checks database invariants, catalog stability, test counts, and judge readiness.
"""

from backend.importer.importer import ProblemCatalogImporter
from backend.authoring.pipeline import ContentAuthoringPipeline
from backend.authoring.pilot.specs import PILOT_SPECS
from backend.judge.src.runner.harness import inject_harness

def main():
    importer = ProblemCatalogImporter()
    pipeline = ContentAuthoringPipeline(importer)

    print("=" * 80)
    print("VERIFYING PHASE 4.1 PILOT DATA INTEGRITY & WORKFLOW GATES")
    print("=" * 80)

    # 1. Total Problems
    total_probs = importer.run_query("SELECT count(*) as cnt FROM public.problems;")[0]["cnt"]
    print(f"Total catalog problems in database: {total_probs} (Expected: 3392)")
    assert total_probs == 3392, f"Total problems count mismatch: {total_probs} != 3392"

    # 2. Published Count (6 canonical + 20 pilot = 26)
    pub_probs = importer.run_query("SELECT count(*) as cnt FROM public.problems WHERE is_published = true;")[0]["cnt"]
    print(f"Total published problems: {pub_probs} (Expected: 26)")
    assert pub_probs == 26, f"Published problems count mismatch: {pub_probs} != 26"

    # 3. Quarantined Draft Problems (3,392 - 26 = 3366)
    draft_probs = importer.run_query("SELECT count(*) as cnt FROM public.problems WHERE workflow_status = 'draft';")[0]["cnt"]
    print(f"Total quarantined draft problems: {draft_probs} (Expected: 3366)")
    assert draft_probs == 3366, f"Draft problems count mismatch: {draft_probs} != 3366"

    # 4. Verify the 3,366 draft problems were strictly UNTOUCHED
    untouched_res = importer.run_query("""
        SELECT count(*) as cnt
        FROM public.problems
        WHERE workflow_status = 'draft'
          AND judge_readiness_status = 'NOT_READY'
          AND provenance_status = 'PROVENANCE_REVIEW_REQUIRED'
          AND human_reviewed = false
          AND is_published = false;
    """)[0]["cnt"]
    print(f"Strictly untouched quarantined catalog problems: {untouched_res} (Expected: 3366)")
    assert untouched_res == 3366, f"Untouched count mismatch: {untouched_res} != 3366"

    # 5. Verify all 20 pilot problems
    print("\nVerifying all 20 approved pilot problems:")
    total_pilot_tests = 0
    for verniq_id, spec in PILOT_SPECS.items():
        prob = pipeline.get_problem(verniq_id)
        assert prob is not None, f"Problem {verniq_id} missing!"
        assert prob["workflow_status"] == "published", f"{verniq_id} workflow_status is {prob['workflow_status']} != published"
        assert prob["judge_readiness_status"] == "JUDGE_READY", f"{verniq_id} judge status is {prob['judge_readiness_status']}"
        assert prob["provenance_status"] == "VERIFIED_VALID", f"{verniq_id} provenance status is {prob['provenance_status']}"
        assert prob["is_published"] is True, f"{verniq_id} is_published is not True"
        assert prob["human_reviewed"] is True, f"{verniq_id} human_reviewed is not True"

        # Check tests
        tests = pipeline.get_test_cases(prob["id"])
        total_pilot_tests += len(tests)
        difficulty = spec["difficulty"]
        min_req = 200 if difficulty == "easy" else (250 if difficulty == "medium" else 300)
        assert len(tests) >= min_req, f"{verniq_id} test count {len(tests)} < required {min_req}"
        print(f"  [OK] {verniq_id} | {prob['title']} | {difficulty.upper()} | Tests: {len(tests)} (min: {min_req}) | PUBLISHED")

    print(f"\nTotal canonical test vectors verified across 20 pilot problems: {total_pilot_tests} (Mandatory min: 5000)")
    assert total_pilot_tests >= 5000, f"Total test vectors {total_pilot_tests} < 5000"

    # 6. Verify Judge Harness injection on pilot templates
    print("\nVerifying Judge Driver Harness on pilot starter templates:")
    for verniq_id, spec in PILOT_SPECS.items():
        py_template = spec["starter_templates"]["python"]
        injected = inject_harness("python", py_template)
        assert "__main__" in injected, f"Python harness injection failed for {verniq_id}"
    print("  [OK] All 20 pilot methods successfully detected and injected in Judge Harness.")

    print("\n" + "=" * 80)
    print("ALL INTEGRITY CHECKS PASSED PERFECTLY!")
    print("=" * 80)

if __name__ == "__main__":
    main()
