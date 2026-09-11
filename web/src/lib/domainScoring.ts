/**
 * Canonical Domain Scoring & Provenance Engine.
 * All display values use a 0..100 scale, while provenance describes how
 * each metric should be interpreted.
 */

import { DATA_STATUS } from "./dataStatus";

export type EvidenceStatus =
  | "OBSERVED"
  | "DERIVED"
  | "CROSSWALK"
  | "MODEL"
  | "PROVENANCE_REQUIRED"
  | "UNKNOWN";

export interface ScoreProvenance {
  metric: string;
  source: string;
  dataset_version: string;
  methodology: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  is_baseline_estimate: boolean;
  last_updated: string;
  status?: EvidenceStatus;
}

export interface RawProgramScores {
  automation_risk?: number;
  automation_exposure?: number;
  augmentation_potential?: number;
  labour_demand?: number;
  salary_growth?: number;
  ai_dataset_version?: string;
  ai_model_status?: string;
  ai_mapping_confidence?: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  ai_is_baseline_estimate?: boolean;
  [key: string]: unknown;
}

export interface NormalizedScores {
  automation_risk: number;
  automation_exposure: number;
  augmentation_potential: number;
  labour_demand: number;
  salary_growth: number;
  ai_resilience: number;
  data_quality: "HIGH" | "MEDIUM" | "LOW";
  is_baseline_estimate: boolean;
  overall_status?: EvidenceStatus;
  provenance: Record<string, ScoreProvenance>;
}

/** Returns whether an admission value means all qualified applicants were admitted. */
export function isAllAdmitted(value: unknown): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "" || normalized.includes("alle optaget");
}

/**
 * Normalizes any score value safely to 0..100 display scale.
 * Accepts values in 0.0..1.0 or 0..100 range.
 */
export function normalizeMetricValue(val: unknown, fallback: number): number {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return fallback;

  if (num >= 0 && num <= 1.0) {
    return Math.round(num * 100);
  }

  return Math.min(100, Math.max(0, Math.round(num)));
}

function canonicalAiResilience(autoRisk: number, augPot: number): number {
  // Keep risk as the primary signal while using augmentation as a bounded
  // secondary signal. A weighted average avoids the old formula saturating
  // large parts of the catalogue at 100/100.
  const riskResilience = 100 - autoRisk;
  return Math.min(100, Math.max(10, Math.round(riskResilience * 0.75 + augPot * 0.25)));
}

/**
 * Returns canonical scores from database/catalog data.
 * Raw catalog values are not automatically treated as observed programme
 * outcomes: AI values are crosswalk/model estimates and labour/salary
 * provenance still requires an explicit programme-level source mapping.
 */
export function getEnrichedScores(title?: string, rawScores?: RawProgramScores): NormalizedScores {
  const datasetVersion = DATA_STATUS.scoring.datasetVersion;
  const lastUpdated = DATA_STATUS.scoring.updatedAt;
  const hasProgramScores = Boolean(
    rawScores &&
      ["automation_risk", "augmentation_potential", "labour_demand", "salary_growth"]
        .some((metric) => rawScores[metric] !== undefined)
  );

  if (hasProgramScores && rawScores) {
    const autoRisk = normalizeMetricValue(rawScores.automation_risk, 28);
    const labDemand = normalizeMetricValue(rawScores.labour_demand, 72);
    const salGrowth = normalizeMetricValue(rawScores.salary_growth, 70);
    const augPot = normalizeMetricValue(rawScores.augmentation_potential, 80);
    const aiDatasetVersion = String(rawScores.ai_dataset_version || "Katalogværdi uden indlejret kildeversion");
    const isAiBaseline = rawScores.ai_is_baseline_estimate === true;
    const aiConfidence = rawScores.ai_mapping_confidence || (isAiBaseline ? "LOW" : "UNKNOWN");
    const aiStatus: EvidenceStatus = rawScores.ai_model_status === "PROVENANCE_REQUIRED"
      ? "PROVENANCE_REQUIRED"
      : rawScores.ai_model_status === "MODEL"
        ? "MODEL"
        : "CROSSWALK";
    const crosswalkSource = aiDatasetVersion === "O*NET 31.0"
      ? "O*NET 31.0 Work Activities via O*NET-ESCO og DISCO-08 (modelestimat)"
      : isAiBaseline
        ? "Legacy-baseline uden valideret O*NET 31.0-kobling"
        : aiDatasetVersion;

    return {
      automation_risk: autoRisk,
      automation_exposure: autoRisk,
      augmentation_potential: augPot,
      labour_demand: labDemand,
      salary_growth: salGrowth,
      ai_resilience: canonicalAiResilience(autoRisk, augPot),
      data_quality: isAiBaseline ? "LOW" : "MEDIUM",
      is_baseline_estimate: isAiBaseline,
      overall_status: "PROVENANCE_REQUIRED",
      provenance: {
        automation_risk: {
          metric: "automation_risk",
          source: crosswalkSource,
          dataset_version: aiDatasetVersion,
          methodology: aiDatasetVersion === "O*NET 31.0"
            ? "O*NET-aktivitetsmodel aggregeret via O*NET-ESCO/ISCO og den tilgængelige DISCO-kobling"
            : "Katalogets modelestimat uden valideret O*NET 31.0-kobling på uddannelsesniveau",
          confidence: aiConfidence,
          is_baseline_estimate: isAiBaseline,
          last_updated: lastUpdated,
          status: aiStatus
        },
        augmentation_potential: {
          metric: "augmentation_potential",
          source: crosswalkSource,
          dataset_version: aiDatasetVersion,
          methodology: aiDatasetVersion === "O*NET 31.0"
            ? "O*NET-aktivitetsmodel aggregeret via O*NET-ESCO/ISCO og den tilgængelige DISCO-kobling"
            : "Katalogets modelestimat uden valideret O*NET 31.0-kobling på uddannelsesniveau",
          confidence: aiConfidence,
          is_baseline_estimate: isAiBaseline,
          last_updated: lastUpdated,
          status: aiStatus
        },
        labour_demand: {
          metric: "labour_demand",
          source: "Uddannelsesspecifik kildekobling er ikke etableret i klientkataloget",
          dataset_version: datasetVersion,
          methodology: "Rå katalogværdi kræver dokumenteret population, periode og transformation",
          confidence: "UNKNOWN",
          is_baseline_estimate: false,
          last_updated: lastUpdated,
          status: "PROVENANCE_REQUIRED"
        },
        salary_growth: {
          metric: "salary_growth",
          source: "Uddannelsesspecifik kildekobling er ikke etableret i klientkataloget",
          dataset_version: datasetVersion,
          methodology: "Rå katalogværdi kræver dokumenteret population, periode og transformation",
          confidence: "UNKNOWN",
          is_baseline_estimate: false,
          last_updated: lastUpdated,
          status: "PROVENANCE_REQUIRED"
        }
      }
    };
  }

  const defaultAutoRisk = 28;
  const defaultLabDemand = 72;
  const defaultSalGrowth = 70;
  const defaultAugPot = 75;

  const baselineProvenance = (metric: string, source: string): ScoreProvenance => ({
    metric,
    source,
    dataset_version: datasetVersion,
    methodology: "National/domain baseline assumption",
    confidence: "LOW",
    is_baseline_estimate: true,
    last_updated: lastUpdated,
    status: "MODEL"
  });

  return {
    automation_risk: defaultAutoRisk,
    automation_exposure: defaultAutoRisk,
    augmentation_potential: defaultAugPot,
    labour_demand: defaultLabDemand,
    salary_growth: defaultSalGrowth,
    ai_resilience: canonicalAiResilience(defaultAutoRisk, defaultAugPot),
    data_quality: "LOW",
    is_baseline_estimate: true,
    overall_status: "MODEL",
    provenance: {
      automation_risk: baselineProvenance("automation_risk", "Sectoral average baseline"),
      augmentation_potential: baselineProvenance("augmentation_potential", "Sectoral average baseline"),
      labour_demand: baselineProvenance("labour_demand", "UFM national average baseline"),
      salary_growth: baselineProvenance("salary_growth", "National graduate median baseline")
    }
  };
}
