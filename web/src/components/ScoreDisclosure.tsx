import type { EvidenceStatus, NormalizedScores } from "@/lib/domainScoring";
import { DATA_STATUS } from "@/lib/dataStatus";

interface ScoreDisclosureProps {
  scores: NormalizedScores;
  compact?: boolean;
}

const STATUS_LABELS: Record<EvidenceStatus, string> = {
  OBSERVED: "Observeret data",
  DERIVED: "Afledt indikator",
  CROSSWALK: "Crosswalk-estimat",
  MODEL: "Modelestimat",
  PROVENANCE_REQUIRED: "Kilde kræver dokumentation",
  UNKNOWN: "Ukendt datastatus"
};

const METRIC_LABELS: Record<string, string> = {
  automation_risk: "AI-opgaveeksponering",
  augmentation_potential: "AI-augmentationspotentiale",
  labour_demand: "Jobindikator",
  salary_growth: "Lønindikator"
};

function statusLabel(status?: EvidenceStatus): string {
  return status ? STATUS_LABELS[status] : STATUS_LABELS.UNKNOWN;
}

function qualityLabel(scores: NormalizedScores): string {
  if (!Object.values(scores.ranking_eligible).some(Boolean)) return "Lav / neutraliseret";
  if (scores.data_quality === "HIGH") return "Høj";
  if (scores.data_quality === "MEDIUM") return "Mellem";
  return "Lav";
}

function metricStatus(scores: NormalizedScores, metric: string): EvidenceStatus {
  return scores.provenance[metric]?.status || scores.overall_status || "UNKNOWN";
}

function metricStatusNote(status: EvidenceStatus): string {
  if (status === "PROVENANCE_REQUIRED") return "Neutral 50-placeholder; ingen relativ rankingfordel";
  if (status === "CROSSWALK") return "US occupational data via dokumenteret crosswalk/model";
  if (status === "MODEL") return "Modelbaseret indikator";
  if (status === "DERIVED") return "Afledt af dokumenterede observationer";
  if (status === "OBSERVED") return "Observeret datakilde";
  return statusLabel(status);
}

function rankingLabel(scores: NormalizedScores, metric: "ai" | "job" | "salary"): string {
  return scores.ranking_eligible[metric] ? "Aktivt rankingsignal" : "Neutraliseret i ranking";
}

export function ScoreDisclosure({ scores, compact = false }: ScoreDisclosureProps) {
  const sources = Array.from(
    new Set(Object.values(scores.provenance).map((item) => item.source).filter(Boolean))
  );
  const metricStatuses = Object.entries(scores.provenance)
    .map(([metric, item]) => (METRIC_LABELS[metric] || metric) + ": " + statusLabel(item.status))
    .join(" · ");
  const overallStatus = scores.overall_status || "UNKNOWN";
  const metricRows = [
    { key: "automation_risk", rankingKey: "ai" as const, label: "AI-resiliensindeks" },
    { key: "labour_demand", rankingKey: "job" as const, label: "Jobindikator" },
    { key: "salary_growth", rankingKey: "salary" as const, label: "Lønindikator" },
  ];
  const activeRankingSignals = Object.values(scores.ranking_eligible).filter(Boolean).length;

  return (
    <section aria-label="Model- og kilde-status" className="rounded-lg border border-[#D8DBE4] bg-[#F7F8FA] px-3 py-2 text-[11px] text-[#545D71]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-[#2563EB]/20 bg-[#EFF6FF] px-2 py-0.5 font-bold text-[#1D4ED8]">
          {scores.is_baseline_estimate ? "Manglende/legacy programmevidence" : statusLabel(overallStatus)}
        </span>
        <span className="font-semibold">Datakvalitet: {qualityLabel(scores)}</span>
        <span className="font-semibold">Aktive rankingsignaler: {activeRankingSignals}/3</span>
        <span className="text-[#667085]">Model opdateret: {DATA_STATUS.scoring.updatedLabel}</span>
      </div>
      <p className="mt-1 leading-relaxed">
        AI-resiliens er et model-/crosswalkindeks, ikke en sandsynlighed for automatisering eller en prognose for arbejdsløshed.
        {scores.provenance.automation_risk.dataset_version === "O*NET 31.0" && scores.ranking_eligible.ai
          ? " Denne uddannelse bruger amerikanske O*NET 31.0 Work Activities via O*NET–ESCO/ISCO/DISCO og en programkobling; det er ikke dansk observeret jobdata."
          : " Denne uddannelse mangler en defensibel O*NET 31.0-programkobling; AI-dimensionen er derfor neutraliseret til 50 og giver ingen relativ rankingfordel."}
        {!compact && " Job- og løndimensioner uden dokumenteret uddannelsesspecifik kilde, population, periode og transformation neutraliseres tilsvarende til 50 i klientrangeringen."}
      </p>
      {!compact && (
        <>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3" aria-label="Status for de viste metrikker">
            {metricRows.map((row) => {
              const status = metricStatus(scores, row.key);
              return (
                <div key={row.key} className="rounded-md border border-[#E7E9EF] bg-[#FFFFFF] px-2 py-1.5">
                  <span className="block font-semibold text-[#12172B]">{row.label}</span>
                  <span className="block text-[10px]">{statusLabel(status)}</span>
                  <span className="block text-[10px] text-[#667085]">{metricStatusNote(status)}</span>
                  <span className="block text-[10px] font-semibold text-[#545D71]">{rankingLabel(scores, row.rankingKey)}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-1 leading-relaxed">Metrikstatus: {metricStatuses}</p>
          <p className="mt-1 leading-relaxed text-[#667085]">
            Scoringsmodel: {DATA_STATUS.scoring.methodologyVersion} · Katalog: {DATA_STATUS.scoring.datasetVersion}
          </p>
        </>
      )}
      {!compact && sources.length > 0 && (
        <p className="mt-1 leading-relaxed">
          Kildegrundlag: {sources.join(" · ")}
        </p>
      )}
    </section>
  );
}
