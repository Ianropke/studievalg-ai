"""Strict CI gate for programme-level data provenance.

The application must not ship as a supposedly evidence-based recommendation
engine while programme metrics rely on DEFAULT occupation mappings or while a
large majority of programmes share one identical score vector.

This is deliberately a gate, not an automatic fixer: ambiguous data must be
fixed at the ETL/source layer rather than silently rewritten.
"""

try:
    from .build_data_provenance_report import build_report
except ImportError:  # Script execution from the etl directory / CI entrypoint.
    from build_data_provenance_report import build_report


def validate_report(report):
    summary = report["summary"]
    programmes = summary["programme_count"]
    default_share = summary["default_mapping_share"]
    repeated = summary["largest_repeated_score_vector"]

    errors = []

    # Any DEFAULT mapping is potentially dangerous, but allow a small number
    # temporarily while the source mapping is being completed. The production
    # threshold is intentionally strict.
    if default_share > 0.01:
        errors.append(
            f"DEFAULT occupation mapping share is {default_share:.1%}; maximum allowed is 1%."
        )

    if repeated and repeated["programme_count"] >= max(5, int(programmes * 0.05)):
        errors.append(
            "A repeated score vector covers "
            f"{repeated['programme_count']}/{programmes} programmes. "
            "Programme-specific metrics appear insufficiently populated."
        )

    # These metrics are not allowed to be represented as observed evidence by
    # the provenance layer until their source/transformations are attached.
    metric_counts = summary["metric_counts"]
    missing_provenance = metric_counts.get("PROVENANCE_REQUIRED", 0)
    if missing_provenance > 0:
        errors.append(f"{missing_provenance} metric values still lack documented raw provenance.")

    for metric, coverage in summary.get("metric_provenance_coverage", {}).items():
        value_count = coverage.get("value_count", 0)
        complete_count = coverage.get("complete_provenance_count", 0)
        if value_count and complete_count < value_count:
            errors.append(
                f"{metric} has {value_count - complete_count} values without complete source metadata."
            )

    return errors


def main():
    report = build_report()
    errors = validate_report(report)

    if errors:
        print("DATA PROVENANCE GATE: FAILED")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print("DATA PROVENANCE GATE: PASSED")


if __name__ == "__main__":
    main()
