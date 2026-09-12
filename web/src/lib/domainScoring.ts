/**
 * Canonical Domain Scoring & Provenance Engine.
 *
 * Display values use a 0..100 scale. Provenance and ranking eligibility are
 * kept separate so missing/unsupported evidence cannot create false precision
 * in the client-side ranking.
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
  labour_evidence_status?: EvidenceStatus;
  salary_evidence_status?: EvidenceStatus;
  labour_source?: string;
  salary_source?: string;
  labour_period?: string;
  salary_period?: string;
  [key: string]: unknown;
}

export interface RankingEligibility {
  ai: boolean;
  job: boolean;
  salary: boolean;
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
  ranking_eligible: RankingEligibility;
  provenance: Record<string, ScoreProvenance>;
}

const NEUTRAL_UNAVAILABLE_SCORE = 50;

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
  if (Number.isNaN(num) || !Number.isFinite(num)) return fallback;

  if (num >= 0 && num <= 1.0) {
    return Math.round(num * 100);
  }

  return Math.min(100, Math.max(0, Math.round(num)));
}

function hasFiniteMetric(val: unknown): boolean {
  if (val === null || val === undefined || val === "") return false;
  const num = Number(val);
  return Number.isFinite(num);
}

function canonicalAiResilience(autoRisk: number, augPot: number): number {
  const riskResilience = 100 - autoRisk;
  return Math.min(100, Math.max(10, Math.round(riskResilience * 0.75 + augPot * 0.25)));
}

function evidenceBackedClientMetric(status: EvidenceStatus | undefined, source: unknown): boolean {
  return (status === "OBSERVED" || status === "DERIVED") && String(source ?? "").trim().length > 0;
}

function neutralProvenance(metric: string, source: string, datasetVersion: string, lastUpdated: string): ScoreProvenance {
  return {
    metric,
    source,
    dataset_version: datasetVersion,
    methodology: "Neutral 50-placeholder i klientrangering; ikke et estimat af den sande uddannelsesværdi",
    confidence: "UNKNOWN",
    is_baseline_estimate: true,
    last_updated: lastUpdated,
    status: "PROVENANCE_REQUIRED",
  };
}

/**
 * Returns canonical client-side scores and provenance.
 *
 * Important: unsupported legacy/default values are neutralised to 50. This
 * prevents missing programme-level evidence from rewarding or penalising a
 * programme relative to another programme while keeping the existing numeric
 * UI contract stable.
 */
export function getEnrichedScores(title?: string, rawScores?: RawProgramScores): NormalizedScores {
  void title;
  const datasetVersion = DATA_STATUS.scoring.datasetVersion;
  const lastUpdated = DATA_STATUS.scoring.updatedAt;
  const hasProgramScores = Boolean(
    rawScores &&
      ["automation_risk", "augmentation_potential", "labour_demand", "salary_growth"]
        .some((metric) => rawScores[metric] !== undefined)
  );

  if (hasProgramScores && rawScores) {
    const aiDatasetVersion = String(rawScores.ai_dataset_version || "Katalogværdi uden indlejret kildeversion");
    const isAiBaseline = rawScores.ai_is_baseline_estimate === true;
    const aiConfidence = rawScores.ai_mapping_confidence || (isAiBaseline ? "LOW" : "UNKNOWN");
    const hasAiInputs = hasFiniteMetric(rawScores.automation_risk) && hasFiniteMetric(rawScores.augmentation_potential);
    const aiRankingEligible = aiDatasetVersion === "O*NET 31.0" && !isAiBaseline && hasAiInputs;

    const rawAutoRisk = normalizeMetricValue(rawScores.automation_risk, NEUTRAL_UNAVAILABLE_SCORE);
    const rawAugPot = normalizeMetricValue(rawScores.augmentation_potential, NEUTRAL_UNAVAILABLE_SCORE);
    const autoRisk = aiRankingEligible ? rawAutoRisk : NEUTRAL_UNAVAILABLE_SCORE;
    const augPot = aiRankingEligible ? rawAugPot : NEUTRAL_UNAVAILABLE_SCORE;

    const labourStatus = rawScores.labour_evidence_status;
    const salaryStatus = rawScores.salary_evidence_status;
    const jobRankingEligible = evidenceBackedClientMetric(labourStatus, rawScores.labour_source) && hasFiniteMetric(rawScores.labour_demand);
    const salaryRankingEligible = evidenceBackedClientMetric(salaryStatus, rawScores.salary_source) && hasFiniteMetric(rawScores.salary_growth);

    const labDemand = jobRankingEligible
      ? normalizeMetricValue(rawScores.labour_demand, NEUTRAL_UNAVAILABLE_SCORE)
      : NEUTRAL_UNAVAILABLE_SCORE;
    const salGrowth = salaryRankingEligible
      ? normalizeMetricValue(rawScores.salary_growth, NEUTRAL_UNAVAILABLE_SCORE)
      : NEUTRAL_UNAVAILABLE_SCORE;

    const aiStatus: EvidenceStatus = aiRankingEligible ? "CROSSWALK" : "PROVENANCE_REQUIRED";
    const crosswalkSource = aiRankingEligible
      ? "O*NET 31.0 Work Activities via O*NET-ESCO/ISCO/DISCO og programkobling (model/crosswalk)"
      : "Ingen valideret O*NET 31.0-kobling på uddannelsesniveau; neutral ranking-placeholder";

    const rankingEligibility: RankingEligibility = {
      ai: aiRankingEligible,
      job: jobRankingEligible,
      salary: salaryRankingEligible,
    };
    const allRankable = Object.values(rankingEligibility).every(Boolean);
    const anyRankable = Object.values(rankingEligibility).some(Boolean);

    return {
      automation_risk: autoRisk,
      automation_exposure: autoRisk,
      augmentation_potential: augPot,
      labour_demand: labDemand,
      salary_growth: salGrowth,
      ai_resilience: aiRankingEligible
        ? canonicalAiResilience(autoRisk, augPot)
        : NEUTRAL_UNAVAILABLE_SCORE,
      data_quality: allRankable ? "HIGH" : anyRankable ? "MEDIUM" : "LOW",
      is_baseline_estimate: isAiBaseline,
      overall_status: allRankable ? "DERIVED" : "PROVENANCE_REQUIRED",
      ranking_eligible: rankingEligibility,
      provenance: {
        automation_risk: {
          metric: "automation_risk",
          source: crosswalkSource,
          dataset_version: aiDatasetVersion,
          methodology: aiRankingEligible
            ? "US O*NET Work Activities-model aggregeret via O*NET-ESCO/ISCO/DISCO og den dokumenterede programkobling"
            : "Neutral 50-placeholder; legacy/default AI-værdi skaber ingen relativ rankingfordel",
          confidence: aiRankingEligible ? aiConfidence : "UNKNOWN",
          is_baseline_estimate: !aiRankingEligible,
          last_updated: lastUpdated,
          status: aiStatus,
        },
        augmentation_potential: {
          metric: "augmentation_potential",
          source: crosswalkSource,
          dataset_version: aiDatasetVersion,
          methodology: aiRankingEligible
            ? "US O*NET Work Activities-model aggregeret via O*NET-ESCO/ISCO/DISCO og den dokumenterede programkobling"
            : "Neutral 50-placeholder; legacy/default AI-værdi skaber ingen relativ rankingfordel",
          confidence: aiRankingEligible ? aiConfidence : "UNKNOWN",
          is_baseline_estimate: !aiRankingEligible,
          last_updated: lastUpdated,
          status: aiStatus,
        },
        labour_demand: jobRankingEligible
          ? {
              metric: "labour_demand",
              source: String(rawScores.labour_source),
              dataset_version: datasetVersion,
              methodology: `Afledt klientindikator med dokumenteret kilde${rawScores.labour_period ? `, periode ${rawScores.labour_period}` : ""}`,
              confidence: "MEDIUM",
              is_baseline_estimate: false,
              last_updated: lastUpdated,
              status: labourStatus,
            }
          : neutralProvenance(
              "labour_demand",
              "Uddannelsesspecifik kilde/population/periode/transformation er ikke etableret i klientkataloget",
              datasetVersion,
              lastUpdated,
            ),
        salary_growth: salaryRankingEligible
          ? {
              metric: "salary_growth",
              source: String(rawScores.salary_source),
              dataset_version: datasetVersion,
              methodology: `Afledt klientindikator med dokumenteret kilde${rawScores.salary_period ? `, periode ${rawScores.salary_period}` : ""}`,
              confidence: "MEDIUM",
              is_baseline_estimate: false,
              last_updated: lastUpdated,
              status: salaryStatus,
            }
          : neutralProvenance(
              "salary_growth",
              "Uddannelsesspecifik kilde/population/periode/transformation er ikke etableret i klientkataloget",
              datasetVersion,
              lastUpdated,
            ),
      },
    };
  }

  const rankingEligibility: RankingEligibility = { ai: false, job: false, salary: false };
  return {
    automation_risk: NEUTRAL_UNAVAILABLE_SCORE,
    automation_exposure: NEUTRAL_UNAVAILABLE_SCORE,
    augmentation_potential: NEUTRAL_UNAVAILABLE_SCORE,
    labour_demand: NEUTRAL_UNAVAILABLE_SCORE,
    salary_growth: NEUTRAL_UNAVAILABLE_SCORE,
    ai_resilience: NEUTRAL_UNAVAILABLE_SCORE,
    data_quality: "LOW",
    is_baseline_estimate: true,
    overall_status: "PROVENANCE_REQUIRED",
    ranking_eligible: rankingEligibility,
    provenance: {
      automation_risk: neutralProvenance("automation_risk", "Ingen program-specifik AI-kobling", datasetVersion, lastUpdated),
      augmentation_potential: neutralProvenance("augmentation_potential", "Ingen program-specifik AI-kobling", datasetVersion, lastUpdated),
      labour_demand: neutralProvenance("labour_demand", "Ingen program-specifik arbejdsmarkedskilde", datasetVersion, lastUpdated),
      salary_growth: neutralProvenance("salary_growth", "Ingen program-specifik lønkilde", datasetVersion, lastUpdated),
    },
  };
}
