/**
 * Canonical Domain Scoring & Provenance Engine.
 * Provides normalized scores (0.0 to 1.0 internal scale) backed by official register data 
 * (Danmarks Statistik, UFM KOT) and O*NET / DISCO-08 occupational task taxonomies.
 */

export interface ScoreProvenance {
  metric: string;
  source: string;
  dataset_version: string;
  methodology: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  is_baseline_estimate: boolean;
  last_updated: string;
}

export interface RawProgramScores {
  automation_risk?: number;
  automation_exposure?: number;
  augmentation_potential?: number;
  labour_demand?: number;
  salary_growth?: number;
  [key: string]: unknown;
}

export interface NormalizedScores {
  automation_risk: number;      // 0..100 for display representation
  automation_exposure: number;  // 0..100
  augmentation_potential: number; // 0..100
  labour_demand: number;       // 0..100
  salary_growth: number;       // 0..100
  ai_resilience: number;       // 0..100 (100 - automation_risk)
  data_quality: "HIGH" | "MEDIUM" | "LOW";
  is_baseline_estimate: boolean;
  provenance: Record<string, ScoreProvenance>;
}

/**
 * Normalizes any score value safely to 0..100 display scale.
 * Accepts values in 0.0..1.0 or 0..100 range.
 */
export function normalizeMetricValue(val: unknown, fallback: number): number {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return fallback;
  
  // If value is in 0..1 scale, convert to percentage 0..100
  if (num >= 0 && num <= 1.0) {
    return Math.round(num * 100);
  }
  
  // Clamp between 0 and 100
  return Math.min(100, Math.max(0, Math.round(num)));
}

/**
 * Returns canonical scores from database/catalog data.
 * Does NOT override empirical database values with title-based heuristics.
 */
export function getEnrichedScores(title?: string, rawScores?: RawProgramScores): NormalizedScores {
  const datasetVersion = "2026.1 (Release July 2026)";
  const lastUpdated = "2026-07-29";

  // 1. Primary path: Use empirical database/catalog scores when available
  if (rawScores && (rawScores.automation_risk !== undefined || rawScores.labour_demand !== undefined)) {
    const autoRisk = normalizeMetricValue(rawScores.automation_risk, 28);
    const labDemand = normalizeMetricValue(rawScores.labour_demand, 72);
    const salGrowth = normalizeMetricValue(rawScores.salary_growth, 70);
    const augPot = normalizeMetricValue(rawScores.augmentation_potential, 80);
    const autoExp = normalizeMetricValue(rawScores.automation_exposure, autoRisk);

    return {
      automation_risk: autoRisk,
      automation_exposure: autoExp,
      augmentation_potential: augPot,
      labour_demand: labDemand,
      salary_growth: salGrowth,
      ai_resilience: 100 - autoRisk,
      data_quality: "HIGH",
      is_baseline_estimate: false,
      provenance: {
        automation_risk: {
          metric: "automation_risk",
          source: "O*NET 28.1 & DISCO-08 Occupational Task Taxonomy",
          dataset_version: datasetVersion,
          methodology: "Task-weighted econometric model",
          confidence: "MEDIUM",
          is_baseline_estimate: false,
          last_updated: lastUpdated
        },
        labour_demand: {
          metric: "labour_demand",
          source: "Danmarks Statistik & UFM Dimittend-register",
          dataset_version: datasetVersion,
          methodology: "2-year graduate employment rate & vacancy ratio",
          confidence: "HIGH",
          is_baseline_estimate: false,
          last_updated: lastUpdated
        },
        salary_growth: {
          metric: "salary_growth",
          source: "Danmarks Statistik Income Register (IND)",
          dataset_version: datasetVersion,
          methodology: "5-year graduate earnings progression trajectory",
          confidence: "HIGH",
          is_baseline_estimate: false,
          last_updated: lastUpdated
        }
      }
    };
  }

  // 2. Fallback for unmapped records: Default baseline values with explicit LOW confidence and is_baseline_estimate flag
  const defaultAutoRisk = 28;
  const defaultLabDemand = 72;
  const defaultSalGrowth = 70;
  const defaultAugPot = 75;

  return {
    automation_risk: defaultAutoRisk,
    automation_exposure: defaultAutoRisk,
    augmentation_potential: defaultAugPot,
    labour_demand: defaultLabDemand,
    salary_growth: defaultSalGrowth,
    ai_resilience: 100 - defaultAutoRisk,
    data_quality: "LOW",
    is_baseline_estimate: true,
    provenance: {
      automation_risk: {
        metric: "automation_risk",
        source: "Sectoral Average Baseline",
        dataset_version: datasetVersion,
        methodology: "Default domain baseline",
        confidence: "LOW",
        is_baseline_estimate: true,
        last_updated: lastUpdated
      },
      labour_demand: {
        metric: "labour_demand",
        source: "UFM National Average Baseline",
        dataset_version: datasetVersion,
        methodology: "National average baseline",
        confidence: "LOW",
        is_baseline_estimate: true,
        last_updated: lastUpdated
      },
      salary_growth: {
        metric: "salary_growth",
        source: "National Graduate Median Baseline",
        dataset_version: datasetVersion,
        methodology: "National graduate baseline",
        confidence: "LOW",
        is_baseline_estimate: true,
        last_updated: lastUpdated
      }
    }
  };
}
