import tempfile
import unittest
from pathlib import Path

from etl.transform_lons11_salary import education_category, file_sha256, parse_number, transform


class Lons11SalaryTests(unittest.TestCase):
    def test_category_and_danish_decimal_are_parsed(self):
        self.assertEqual(education_category("H5030 Mellemlange videregående uddannelser"), "H5030")
        self.assertIsNone(education_category("I alt"))
        self.assertEqual(parse_number("330,35"), 330.35)

    def test_transform_excludes_total_and_preserves_period(self):
        content = (
            "UDDANNELSE;SEKTOR;AFLOEN;LONGRP;LØNMÅL;KØN;TID;INDHOLD\n"
            "I alt;Sektorer i alt;I alt;VOK;FORTJENESTE PR. PRÆSTERET TIME;Mænd og kvinder;2024;400,00\n"
            "H5020 Kort;Sektorer i alt;I alt;VOK;FORTJENESTE PR. PRÆSTERET TIME;Mænd og kvinder;2024;\n"
            "H5030 Mellemlang;Sektorer i alt;I alt;VOK;FORTJENESTE PR. PRÆSTERET TIME;Mænd og kvinder;2024;350,25\n"
        )
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "LONS11.csv"
            path.write_text(content, encoding="utf-8")
            rows = transform(path)
            source_hash = file_sha256(path)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["education_code"], "H5030")
        self.assertEqual(rows[0]["period"], "2024")
        self.assertEqual(rows[0]["salary_value"], "350.25")
        self.assertEqual(len(source_hash), 64)


if __name__ == "__main__":
    unittest.main()
