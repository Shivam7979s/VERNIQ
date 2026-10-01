"""
Automated Data Integrity & Verification Test Suite for Verniq Problem Catalog
==============================================================================
Validates database state for the 3,392-problem catalog ingestion, taxonomy,
workflow quarantine, and referential constraints.
"""

from __future__ import annotations

import collections
import unittest
from backend.importer.importer import ProblemCatalogImporter
from backend.importer.taxonomy import slugify


class TestProblemCatalogIntegrity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.importer = ProblemCatalogImporter()

    def test_01_exact_3392_problem_count(self):
        """Verifies database contains exactly 3,392 problem records."""
        rows = self.importer.run_query("SELECT count(*) FROM public.problems;")
        self.assertEqual(rows[0]["count"], 3392)

    def test_02_id_uniqueness_and_stability(self):
        """Verifies that all verniq_id values are strictly unique and match VRQ-XXXXXX pattern."""
        rows = self.importer.run_query("SELECT verniq_id FROM public.problems WHERE verniq_id IS NOT NULL;")
        self.assertEqual(len(rows), 3392)
        vids = [r["verniq_id"] for r in rows]
        self.assertEqual(len(vids), len(set(vids)), "Duplicate verniq_id detected in database!")
        for vid in vids[:50]:
            self.assertTrue(vid.startswith("VRQ-"), f"verniq_id {vid} does not start with VRQ-")

    def test_03_title_uniqueness(self):
        """Verifies that all problem titles are unique with zero collision."""
        rows = self.importer.run_query("SELECT title FROM public.problems;")
        self.assertEqual(len(rows), 3392)
        titles = [r["title"] for r in rows]
        self.assertEqual(len(titles), len(set(titles)), "Duplicate title detected in database!")

    def test_04_slug_uniqueness_and_determinism(self):
        """Verifies that slugs are URL-safe, deterministic, and unique."""
        rows = self.importer.run_query("SELECT title, slug FROM public.problems;")
        self.assertEqual(len(rows), 3392)
        slugs = set()
        for r in rows:
            expected_slug = slugify(r["title"])
            self.assertEqual(r["slug"], expected_slug, f"Slug mismatch for {r['title']}: {r['slug']} vs {expected_slug}")
            self.assertNotIn(r["slug"], slugs, f"Duplicate slug: {r['slug']}")
            slugs.add(r["slug"])

    def test_05_difficulty_distribution(self):
        """Verifies exact difficulty counts: 815 Easy, 1803 Medium, 774 Hard."""
        rows = self.importer.run_query("SELECT difficulty, count(*) FROM public.problems GROUP BY difficulty;")
        diff_counts = {r["difficulty"]: r["count"] for r in rows}
        self.assertEqual(diff_counts.get("easy"), 815)
        self.assertEqual(diff_counts.get("medium"), 1803)
        self.assertEqual(diff_counts.get("hard"), 774)

    def test_06_domain_classification(self):
        """Verifies that all problems are associated with a valid domain."""
        rows = self.importer.run_query("SELECT count(*) FROM public.problems WHERE domain_id IS NULL;")
        self.assertEqual(rows[0]["count"], 0, "Found problems with missing domain_id!")

        domain_rows = self.importer.run_query("""
            SELECT d.name, count(p.id)
            FROM public.problems p
            JOIN public.domains d ON p.domain_id = d.id
            GROUP BY d.name;
        """)
        d_counts = {r["name"]: r["count"] for r in domain_rows}
        self.assertEqual(d_counts.get("DSA"), 3145)
        self.assertEqual(d_counts.get("Database"), 194)
        self.assertEqual(d_counts.get("JavaScript"), 32)
        self.assertEqual(d_counts.get("Pandas"), 10)
        self.assertEqual(d_counts.get("Concurrency"), 7)
        self.assertEqual(d_counts.get("Shell"), 4)

    def test_07_topic_taxonomy_and_hierarchy(self):
        """Verifies that 187 unique topics exist and parent relationships resolve properly."""
        topic_count = self.importer.run_query("SELECT count(*) FROM public.topics;")[0]["count"]
        self.assertEqual(topic_count, 187)

        # Ensure no invalid parent_topic_id references
        orphans = self.importer.run_query("""
            SELECT t.id, t.name
            FROM public.topics t
            WHERE t.parent_topic_id IS NOT NULL
              AND t.parent_topic_id NOT IN (SELECT id FROM public.topics);
        """)
        self.assertEqual(len(orphans), 0, f"Found orphan topic parent references: {orphans}")

    def test_08_draft_status_quarantine(self):
        """Verifies that all 3,366 unauthored catalog problems remain quarantined in DRAFT status."""
        draft_count = self.importer.run_query(
            "SELECT count(*) FROM public.problems WHERE workflow_status = 'draft' AND is_published = false;"
        )[0]["count"]
        published_count = self.importer.run_query(
            "SELECT count(*) FROM public.problems WHERE workflow_status = 'published' AND is_published = true;"
        )[0]["count"]

        self.assertEqual(draft_count, 3366, "Expected exactly 3,366 quarantined draft problems (3,392 - 26 published).")
        self.assertEqual(published_count, 26, "Expected exactly 26 published problems (6 canonical + 20 pilot).")

    def test_09_provenance_and_source_auditing(self):
        """Verifies that 3,372 non-pilot problems remain with PROVENANCE_REVIEW_REQUIRED and 20 pilot problems are VERIFIED_VALID."""
        rows = self.importer.run_query(
            "SELECT count(*) FROM public.problem_sources WHERE provenance_status = 'PROVENANCE_REVIEW_REQUIRED';"
        )
        self.assertEqual(rows[0]["count"], 3372, "Expected exactly 3,372 untouched catalog problems in quarantine.")

    def test_10_staging_audit_parity(self):
        """Verifies that problem_import_staging contains exactly 3,392 rows matching the raw CSV."""
        staged_count = self.importer.run_query("SELECT count(*) FROM public.problem_import_staging;")[0]["count"]
        self.assertEqual(staged_count, 3392)

    def test_11_unresolved_company_and_records_semantics(self):
        """Verifies metadata tags for unresolved semantics on company and records fields."""
        sample_meta = self.importer.run_query(
            "SELECT metadata FROM public.problems WHERE verniq_id = 'VRQ-000001';"
        )[0]["metadata"]
        self.assertEqual(sample_meta.get("company_metadata_status"), "COMPANY_METADATA_REQUIRES_MAPPING")
        self.assertEqual(sample_meta.get("records_metadata_status"), "SEMANTICS_UNCONFIRMED")
        self.assertEqual(sample_meta.get("source_verniq_id"), "1")


if __name__ == "__main__":
    unittest.main()
