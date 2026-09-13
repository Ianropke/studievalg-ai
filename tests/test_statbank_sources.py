import unittest

from etl.fetch_official_statbank_sources import build_lons11_query, validate_ufm_csv_payload


def variable(identifier, values, *, time=False):
    return {"id": identifier, "values": [{"id": value} for value in values], "time": time}


class StatbankSourceTests(unittest.TestCase):
    def test_lons11_query_is_bounded_and_keeps_six_years(self):
        info = {
            "variables": [
                variable("UDDANNELSE", ["TOT", "H50", "H60"]),
                variable("SEKTOR", ["1000", "1032"]),
                variable("AFLOEN", ["TIFA", "FAST"]),
                variable("LONGRP", ["LTOT", "VOK"]),
                variable("LØNMÅL", ["FORINKL", "GENE"]),
                variable("KØN", ["MOK", "M", "K"]),
                variable("Tid", [str(year) for year in range(2015, 2025)], time=True),
            ]
        }
        query = build_lons11_query(info)
        selections = {item["code"]: item["values"] for item in query["variables"]}
        self.assertEqual(selections["UDDANNELSE"], ["*"])
        self.assertEqual(selections["SEKTOR"], ["1000"])
        self.assertEqual(selections["LONGRP"], ["VOK"])
        self.assertEqual(selections["LØNMÅL"], ["FORINKL"])
        self.assertEqual(selections["Tid"], ["2019", "2020", "2021", "2022", "2023", "2024"])

    def test_schema_drift_fails_closed(self):
        with self.assertRaisesRegex(RuntimeError, "lacks reviewed dimensions"):
            build_lons11_query({"variables": [variable("Tid", [str(year) for year in range(2019, 2025)])]})

    def test_ufm_html_with_csv_filename_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "content-type"):
            validate_ufm_csv_payload(
                b"<html><body>not,csv</body></html>",
                "text/html",
                ("uddannelseskode", "beskæftigelsesgrad"),
            )

    def test_ufm_csv_requires_reviewed_schema_and_data_row(self):
        validate_ufm_csv_payload(
            "uddannelseskode;beskæftigelsesgrad\nU1;0,91\n".encode(),
            "text/csv; charset=utf-8",
            ("uddannelseskode", "beskæftigelsesgrad"),
        )
        with self.assertRaisesRegex(RuntimeError, "lacks reviewed columns"):
            validate_ufm_csv_payload(
                b"other;value\nU1;0.91\n",
                "text/csv",
                ("uddannelseskode", "beskæftigelsesgrad"),
            )


if __name__ == "__main__":
    unittest.main()
