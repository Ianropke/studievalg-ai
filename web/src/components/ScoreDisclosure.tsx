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
};

function statusLabel(status?: EvidenceStatus): string {
  return status ? STATUS_LABELS[status] : STATUS_LABELS.UNKNOWN;
}

function qualityLabel(scores: NormalizedScores): string {
  if (!scores.ranking_eligible.ai) return "Ikke tilgængelig";
  if (scores.data_quality === "HIGH") return "Høj";
  if (scores.data_quality === "MEDIUM") return "Mellem";
  return "Lav";
}

function metricStatus(scores: NormalizedScores, metric: string): EvidenceStatus {
  return scores.provenance[metric]?.status || scores.overall_status || "UNKNOWN";
}

function metricStatusNote(status: EvidenceStatus): string {
  if (status === "PROVENANCE_REQUIRED") return "Intet offentligt estimat; udelukket fra AI-ranking";
  if (status === "CROSSWALK") return "US occupational data via dokumenteret crosswalk/model";
  if (status === "MODEL") return "Modelbaseret indikator";
  if (status === "DERIVED") return "Afledt af dokumenterede observationer";
  if (status === "OBSERVED") return "Observeret datakilde";
  return statusLabel(status);
}

export function ScoreDisclosure({ scores, compact = false }: ScoreDisclosureProps) {
  const sources = Array.from(
    new Set([scores.provenance.automation_risk, scores.provenance.augmentation_potential].map((item) => item?.source).filter(Boolean))
  );
  const metricStatuses = Object.entries(scores.provenance)
    .filter(([metric]) => metric === "automation_risk" || metric === "augmentation_potential")
    .map(([metric, item]) => (METRIC_LABELS[metric] || metric) + ": " + statusLabel(item.status))
    .join(" · ");
  const aiStatus = metricStatus(scores, "automation_risk");
  const metricRows = [
    { key: "automation_risk", label: "AI-opgaveeksponering" },
    { key: "augmentation_potential", label: "AI-augmentationspotentiale" },
  ];

  return (
    <section aria-label="Model- og kilde-status" className="rounded-lg border border-[#D8DBE4] bg-[#F7F8FA] px-3 py-2 text-[11px] text-[#545D71]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-[#2563EB]/20 bg-[#EFF6FF] px-2 py-0.5 font-bold text-[#1D4ED8]">
          {scores.is_baseline_estimate ? "Ingen O*NET-programkobling" : statusLabel(aiStatus)}
        </span>
        <span className="font-semibold">Datakvalitet: {qualityLabel(scores)}</span>
        <span className="font-semibold">AI-ranking: {scores.ranking_eligible.ai ? "kan tilvælges" : "ikke tilgængelig"}</span>
        <span className="text-[#667085]">Model opdateret: {DATA_STATUS.scoring.updatedLabel}</span>
      </div>
      <p className="mt-1 leading-relaxed">
        AI-resiliens er et model-/crosswalkindeks, ikke en sandsynlighed for automatisering eller en prognose for arbejdsløshed.
        {scores.provenance.automation_risk.dataset_version === "O*NET 31.0" && scores.ranking_eligible.ai
          ? " Denne uddannelse bruger amerikanske O*NET 31.0 Work Activities via O*NET–ESCO/ISCO/DISCO og en programkobling; det er ikke dansk observeret jobdata."
          : " Denne uddannelse mangler en defensibel O*NET 31.0-programkobling; der vises derfor intet AI-estimat, og uddannelsen kan ikke indgå i AI-ranking."}
      </p>
      {!compact && (
        <>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2" aria-label="Status for AI-modelinput">
            {metricRows.map((row) => {
              const status = metricStatus(scores, row.key);
              return (
                <div key={row.key} className="rounded-md border border-[#E7E9EF] bg-[#FFFFFF] px-2 py-1.5">
                  <span className="block font-semibold text-[#12172B]">{row.label}</span>
                  <span className="block text-[10px]">{statusLabel(status)}</span>
                  <span className="block text-[10px] text-[#667085]">{metricStatusNote(status)}</span>
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
