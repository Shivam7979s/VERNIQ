"""
Unit & Integration Tests for VERNIQ Problem Catalog Validator & Pipeline
========================================================================
Phase 3.0: Contract Verification & Scaffolding.
"""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from backend.importer.pipeline import ProblemImportPipeline
from backend.importer.validator import ProblemValidator, REQUIRED_COLUMNS


class TestProblemValidator(unittest.TestCase):
    def setUp(self):
        self.validator = ProblemValidator(strict_mode=True)
        self.temp_dir = tempfile.TemporaryDirectory()
        self.test_dir = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def _write_csv(self, filename: str, content: str) -> Path:
        file_path = self.test_dir / filename
        with open(file_path, "w", encoding="utf-8", newline="") as f:
            f.write(content)
        return file_path

    def test_valid_csv(self):
        csv_data = (
            "Verniq_ID,Title,difficulty,Topics,companies,records\n"
            "1,Two Sum,Easy,\"Array, Hash Table\",145,2400\n"
            "2,Add Two Numbers,Medium,\"Linked List, Math\",89,1500\n"
            "3,Median of Two Sorted Arrays,Hard,\"Array, Binary Search\",67,900\n"
        )
        file_path = self._write_csv("valid.csv", csv_data)
        report = self.validator.validate_file(file_path)

        self.assertTrue(report.is_valid)
        self.assertEqual(report.total_rows, 3)
        self.assertEqual(report.valid_rows, 3)
        self.assertEqual(report.error_count, 0)
        self.assertEqual(report.difficulty_counts["easy"], 1)
        self.assertEqual(report.difficulty_counts["medium"], 1)
        self.assertEqual(report.difficulty_counts["hard"], 1)
        self.assertEqual(report.unique_verniq_ids, 3)
        self.assertEqual(report.unique_titles, 3)

    def test_missing_required_column(self):
        # Missing 'Verniq_ID'
        csv_data = (
            "Title,difficulty,Topics,companies,records\n"
            "Two Sum,Easy,\"Array, Hash Table\",145,2400\n"
        )
        file_path = self._write_csv("missing_col.csv", csv_data)
        report = self.validator.validate_file(file_path)

        self.assertFalse(report.is_valid)
        self.assertTrue(any(e.error_type == "missing_column" and e.column == "Verniq_ID" for e in report.errors))

    def test_empty_title(self):
        csv_data = (
            "Verniq_ID,Title,difficulty,Topics,companies,records\n"
            "1,,Easy,\"Array, Hash Table\",145,2400\n"
        )
        file_path = self._write_csv("empty_title.csv", csv_data)
        report = self.validator.validate_file(file_path)

        self.assertFalse(report.is_valid)
        self.assertTrue(any(e.column == "Title" and e.error_type == "missing_value" for e in report.errors))

    def test_duplicate_verniq_id(self):
        csv_data = (
            "Verniq_ID,Title,difficulty,Topics,companies,records\n"
            "100,Problem Alpha,Easy,Array,10,20\n"
            "101,Problem Beta,Medium,String,15,30\n"
            "100,Problem Gamma,Hard,DP,20,40\n"
        )
        file_path = self._write_csv("dup_id.csv", csv_data)
        report = self.validator.validate_file(file_path)

        self.assertFalse(report.is_valid)
        dup_errs = [e for e in report.errors if e.error_type == "duplicate_value" and e.column == "Verniq_ID"]
        self.assertEqual(len(dup_errs), 1)
        self.assertEqual(dup_errs[0].row_number, 4)  # Duplicate occurs on row 4
        self.assertIn("100", report.duplicate_verniq_ids)

    def test_duplicate_title_warning(self):
        csv_data = (
            "Verniq_ID,Title,difficulty,Topics,companies,records\n"
            "100,Problem Alpha,Easy,Array,10,20\n"
            "101,Problem Alpha,Medium,String,15,30\n"
        )
        file_path = self._write_csv("dup_title.csv", csv_data)
        report = self.validator.validate_file(file_path)

        # Duplicate title generates a warning
        self.assertTrue(any("duplicate title" in w.lower() for w in report.warnings))

    def test_invalid_difficulty(self):
        csv_data = (
            "Verniq_ID,Title,difficulty,Topics,companies,records\n"
            "1,Problem One,Expert,Array,10,20\n"
        )
        file_path = self._write_csv("invalid_diff.csv", csv_data)
        report = self.validator.validate_file(file_path)

        self.assertFalse(report.is_valid)
        diff_errs = [e for e in report.errors if e.error_type == "invalid_enum"]
        self.assertEqual(len(diff_errs), 1)
        self.assertEqual(diff_errs[0].offending_value, "Expert")

    def test_malformed_topic_syntax(self):
        csv_data = (
            "Verniq_ID,Title,difficulty,Topics,companies,records\n"
            "1,Problem One,Easy,\"Array, [Two Pointers\",10,20\n"
        )
        file_path = self._write_csv("malformed_topics.csv", csv_data)
        report = self.validator.validate_file(file_path)

        self.assertFalse(report.is_valid)
        self.assertTrue(any(e.column == "Topics" and "unbalanced" in e.message.lower() for e in report.errors))

    def test_raw_fields_preserved_without_assumption(self):
        # companies and records have arbitrary numeric or string values
        csv_data = (
            "Verniq_ID,Title,difficulty,Topics,companies,records\n"
            "1,Problem One,Easy,Array,9999,0\n"
            "2,Problem Two,Medium,Math,alpha_comp,beta_rec\n"
        )
        file_path = self._write_csv("raw_fields.csv", csv_data)
        report = self.validator.validate_file(file_path)

        self.assertTrue(report.is_valid)
        self.assertEqual(report.total_rows, 2)


class TestProblemImportPipeline(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.temp_dir.name)
        self.pipeline = ProblemImportPipeline(base_dir=self.base_dir)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_directory_hierarchy_created(self):
        self.assertTrue(self.pipeline.raw_dir.exists())
        self.assertTrue(self.pipeline.staging_dir.exists())
        self.assertTrue(self.pipeline.processed_dir.exists())

    def test_stage_dataset_success(self):
        csv_data = (
            "Verniq_ID,Title,difficulty,Topics,companies,records\n"
            "1,Problem A,Easy,Array,5,10\n"
        )
        source_path = self.pipeline.raw_dir / "test_source.csv"
        with open(source_path, "w", encoding="utf-8") as f:
            f.write(csv_data)

        res = self.pipeline.stage_dataset(source_path)
        self.assertTrue(res["success"])
        staged_path = Path(res["staged_path"])
        manifest_path = Path(res["manifest_path"])

        self.assertTrue(staged_path.exists())
        self.assertTrue(manifest_path.exists())
        # Source must be untouched
        self.assertTrue(source_path.exists())

    def test_phase_guard_blocks_database_import(self):
        with self.assertRaises(NotImplementedError) as ctx:
            self.pipeline.execute_import()
        self.assertIn("PHASE 3.0 SAFETY GUARD", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
