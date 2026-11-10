import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from openpyxl import Workbook

from etl.import_kot_2026 import (
    EXPECTED_HEADERS,
    KotImportError,
    build_snapshot,
    parse_kvote1,
    write_snapshot,
)


class Kot2026ImportTests(unittest.TestCase):
    def test_numeric_kvote1_is_normalized_and_exposes_threshold(self):
        self.assertEqual(parse_kvote1("10,50", row_number=4), ("10.5", 10.5))
        self.assertEqual(parse_kvote1(11, row_number=4), ("11", 11.0))

    def test_all_official_nonnumeric_statuses_are_preserved_verbatim(self):
        statuses = (
            "Alle optaget",
            "Alle optaget, ledige pladser",
            "Ikke oprettet",
            "Ingen optaget, ledige pladser",
            "Kun kvote 2",
            "Kun kvote 2, ledige pladser",
            "Uden for kvotesystem",
            "Uden for kvotesystem, ledige pladser",
        )
        for status in statuses:
            with self.subTest(status=status):
                self.assertEqual(parse_kvote1(status, row_number=4), (status, None))

    def test_unknown_blank_and_out_of_range_kvote1_values_fail_closed(self):
        for value, expected_message in (
            ("Ukendt status", "invalid Kvote 1 value"),
            ("", "blank Kvote 1 value"),
            ("1,9", "out of range"),
            ("12,1", "out of range"),
        ):
            with self.subTest(value=value):
                with self.assertRaisesRegex(KotImportError, expected_message):
                    parse_kvote1(value, row_number=4)

    def test_schema_mismatch_is_rejected(self):
        path = self.create_workbook(headers=("unexpected",))
        with self.assertRaisesRegex(KotImportError, "unexpected row 2 schema"):
            self.build_with_authorized_hash(path)

    def test_unrecognized_workbook_hash_is_rejected(self):
        path = self.create_workbook(rows=[self.row(10110)])
        with self.assertRaisesRegex(KotImportError, "source hash mismatch"):
            build_snapshot(path)

    def test_duplicate_kot_number_is_rejected(self):
        path = self.create_workbook(rows=[self.row(10110), self.row(10110)])
        with self.assertRaisesRegex(KotImportError, "duplicate OptOmrNr 10110"):
            self.build_with_authorized_hash(path)

    def test_out_of_range_kot_number_is_rejected(self):
        path = self.create_workbook(rows=[self.row(9999)])
        with self.assertRaisesRegex(KotImportError, "out of five-digit range"):
            self.build_with_authorized_hash(path, expected_records=1)

    def test_snapshot_uses_exact_schema_and_is_deterministically_serialized(self):
        path = self.create_workbook(rows=[self.row(10111, "10,50"), self.row(10110, "Alle optaget")])
        snapshot = self.build_with_authorized_hash(path)
        self.assertEqual(list(snapshot), ["source_url", "source_sha256", "dataset_year", "sheet", "records"])
        self.assertEqual([record["kot_nr"] for record in snapshot["records"]], ["10110", "10111"])
        self.assertEqual(snapshot["records"][1]["kvote1_raw"], "10.5")
        with tempfile.TemporaryDirectory() as temporary_directory:
            output = Path(temporary_directory) / "kot2026.json"
            write_snapshot(snapshot, output)
            self.assertEqual(json.loads(output.read_text(encoding="utf-8")), snapshot)

    @staticmethod
    def row(kot_nr, kvote1="10,5"):
        return (None, kot_nr, "Institution", "Titel", 1, 0, 1, 1, kvote1, None)

    def create_workbook(self, *, headers=EXPECTED_HEADERS, rows=()):
        temporary_file = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
        temporary_file.close()
        self.addCleanup(Path(temporary_file.name).unlink, missing_ok=True)
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = "hovedtal med filter"
        worksheet.append([None] * len(EXPECTED_HEADERS))
        worksheet.append(headers)
        for row in rows:
            worksheet.append(row)
        workbook.save(temporary_file.name)
        return Path(temporary_file.name)

    @staticmethod
    def build_with_authorized_hash(path, expected_records=2):
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        with patch("etl.import_kot_2026.SOURCE_SHA256", digest), patch(
            "etl.import_kot_2026.EXPECTED_RECORD_COUNT", expected_records
        ):
            return build_snapshot(path)


if __name__ == "__main__":
    unittest.main()
