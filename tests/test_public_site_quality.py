import unittest

from etl.check_public_site_quality import canonical_from_html, canonical_matches_page, sample_evenly


class PublicSiteQualityTests(unittest.TestCase):
    def test_even_sample_includes_both_ends(self):
        self.assertEqual(sample_evenly(["a", "b", "c", "d", "e"], 3), ["a", "c", "e"])

    def test_canonical_is_extracted_regardless_of_attribute_order(self):
        self.assertEqual(
            canonical_from_html('<link rel="canonical" href="https://uddannelsesindsigt.com/evidens">'),
            "https://uddannelsesindsigt.com/evidens",
        )

    def test_canonical_must_match_the_page_path(self):
        self.assertTrue(canonical_matches_page(
            "https://uddannelsesindsigt.com/evidens/",
            "https://uddannelsesindsigt.com/evidens",
        ))
        self.assertFalse(canonical_matches_page(
            "https://uddannelsesindsigt.com",
            "https://uddannelsesindsigt.com/evidens",
        ))
        self.assertFalse(canonical_matches_page(
            "https://uddannelsesindsigt.com/evidens?duplicate=1",
            "https://uddannelsesindsigt.com/evidens",
        ))
        self.assertEqual(
            canonical_from_html('<link href="https://uddannelsesindsigt.com/evidens" rel="canonical">'),
            "https://uddannelsesindsigt.com/evidens",
        )


if __name__ == "__main__":
    unittest.main()
