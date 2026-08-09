"""Run the non-negotiable data integrity gates for Studievalg-AI."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "data" / "sources" / "data_quality_gate_report.json"


def run(script: str) -> dict:
    p = subprocess.run([sys.executable, str(ROOT / "etl" / script)], cwd=ROOT, text=True, capture_output=True)
    return {"script": script, "returncode": p.returncode, "stdout": p.stdout[-4000:], "stderr": p.stderr[-4000:]}


def main() -> int:
    steps = [run("build_education_crosswalk.py")]
    status = "PASS" if all(x["returncode"] == 0 for x in steps) else "FAIL"
    report = {
        "status": status,
        "steps": steps,
        "policy": {
            "no_fuzzy_mapping": True,
            "no_default_education_mapping": True,
            "no_score_without_observation": True,
            "unmapped_programmes_have_no_labour_or_salary_score": True,
        },
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
