import { getEnrichedScores } from "../lib/domainScoring";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

console.log("🧪 Kører evidens-/ranking-regressionstests...");

const legacy = getEnrichedScores("Legacy programme", {
  automation_risk: 12,
  augmentation_potential: 95,
  labour_demand: 93,
  salary_growth: 91,
  ai_dataset_version: "Legacy baseline (not O*NET 31.0-derived)",
  ai_model_status: "PROVENANCE_REQUIRED",
  ai_mapping_confidence: "LOW",
  ai_is_baseline_estimate: true,
});

assert(legacy.ai_resilience === 50, "Legacy AI must be neutralised to 50");
assert(legacy.labour_demand === 50, "Unproven client labour demand must be neutralised to 50");
assert(legacy.salary_growth === 50, "Unproven client salary growth must be neutralised to 50");
assert(!legacy.ranking_eligible.ai && !legacy.ranking_eligible.job && !legacy.ranking_eligible.salary,
  "Unsupported dimensions must not be marked ranking-eligible");

const onet = getEnrichedScores("Mapped programme", {
  automation_risk: 36,
  augmentation_potential: 81,
  labour_demand: 93,
  salary_growth: 91,
  ai_dataset_version: "O*NET 31.0",
  ai_model_status: "CROSSWALK_OR_MODEL",
  ai_mapping_confidence: "LOW",
  ai_is_baseline_estimate: false,
});

assert(onet.ai_resilience !== 50, "Mapped O*NET AI may remain differentiating");
assert(onet.ranking_eligible.ai, "Mapped O*NET AI should be ranking-eligible");
assert(onet.labour_demand === 50 && onet.salary_growth === 50,
  "Client job/salary values without explicit programme provenance must stay neutral");
assert(!onet.ranking_eligible.job && !onet.ranking_eligible.salary,
  "Unproven client job/salary dimensions must not be ranking-eligible");
assert(onet.provenance.automation_risk.status === "CROSSWALK",
  "O*NET AI must remain labelled CROSSWALK");

const sourced = getEnrichedScores("Sourced programme", {
  automation_risk: 36,
  augmentation_potential: 81,
  labour_demand: 0.82,
  salary_growth: 0.67,
  ai_dataset_version: "O*NET 31.0",
  ai_is_baseline_estimate: false,
  ai_mapping_confidence: "LOW",
  labour_evidence_status: "DERIVED",
  salary_evidence_status: "DERIVED",
  labour_source: "Documented education-group employment series",
  salary_source: "Documented education-group salary series",
  labour_period: "2025",
  salary_period: "2025",
});

assert(sourced.labour_demand === 82 && sourced.salary_growth === 67,
  "Explicitly sourced derived client metrics may retain their values");
assert(sourced.ranking_eligible.job && sourced.ranking_eligible.salary,
  "Explicitly sourced derived client metrics may be ranking-eligible");

console.log("  ✅ Unsupported ranking dimensions are neutral, mapped/sourced dimensions remain explicit");
