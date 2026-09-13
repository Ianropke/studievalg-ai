import unittest

from etl.fetch_authoritative_sources import extract_distributions, validate_lons11_schema


class AuthoritativeSourceTests(unittest.TestCase):
    def test_extracts_dcat_distribution_without_treating_it_as_downloaded_data(self):
        payload = {
            "@graph": [
                {
                    "@type": "dcat:Distribution",
                    "dct:format": "CSV",
                    "dct:title": "Kommasepareret fil",
                    "dcat:accessURL": {"@id": "https://example.test/report"},
                }
            ]
        }
        self.assertEqual(
            extract_distributions(payload),
            [{"format": "CSV", "access_url": "https://example.test/report", "title": "Kommasepareret fil"}],
        )

    def test_current_lons11_education_dimension_is_accepted(self):
        self.assertEqual(validate_lons11_schema({"variables": [{"id": "UDDANNELSE"}]}), "UDDANNELSE")

    def test_missing_lons11_education_dimension_fails_closed(self):
        with self.assertRaisesRegex(RuntimeError, "education variable"):
            validate_lons11_schema({"variables": [{"id": "Tid"}]})


if __name__ == "__main__":
    unittest.main()
