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
  automation_risk: "AI-risiko",
  augmentation_potential: "Augmentation",
  labour_demand: "Job",
  salary_growth: "Løn"
};

function statusLabel(status?: EvidenceStatus): string {
  return status ? STATUS_LABELS[status] : STATUS_LABELS.UNKNOWN;
}

function qualityLabel(scores: NormalizedScores): string {
  if (scores.is_baseline_estimate) return "Lav";
  if (scores.data_quality === "HIGH") return "Høj";
  if (scores.data_quality === "MEDIUM") return "Mellem";
  return "Lav";
}

function metricStatus(scores: NormalizedScores, metric: string): EvidenceStatus {
  return scores.provenance[metric]?.status || scores.overall_status || "UNKNOWN";
}

function metricStatusNote(status: EvidenceStatus): string {
  if (status === "PROVENANCE_REQUIRED") return "Uddannelsesspecifik kildekobling mangler";
  if (status === "CROSSWALK") return "Crosswalk-/modelestimat";
  if (status === "MODEL") return "Modelbaseret baseline";
  if (status === "OBSERVED") return "Observeret datakilde";
  return statusLabel(status);
}

export function ScoreDisclosure({ scores, compact = false }: ScoreDisclosureProps) {
  const sources = Array.from(
    new Set(Object.values(scores.provenance).map((item) => item.source).filter(Boolean))
  );
  const metricStatuses = Object.entries(scores.provenance)
    .map(([metric, item]) => (METRIC_LABELS[metric] || metric) + ": " + statusLabel(item.status))
    .join(" · ");
  const overallStatus = scores.overall_status || (scores.is_baseline_estimate ? "MODEL" : "UNKNOWN");
  const metricRows = [
    { key: "automation_risk", label: "AI-robusthed" },
    { key: "labour_demand", label: "Jobmuligheder" },
    { key: "salary_growth", label: "Lønpotentiale" },
  ];

  return (
    <section aria-label="Model- og kilde-status" className="rounded-lg border border-[#D8DBE4] bg-[#F7F8FA] px-3 py-2 text-[11px] text-[#545D71]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-[#2563EB]/20 bg-[#EFF6FF] px-2 py-0.5 font-bold text-[#1D4ED8]">
          {scores.is_baseline_estimate ? "Baselineestimat" : statusLabel(overallStatus)}
        </span>
        <span className="font-semibold">Datakvalitet: {qualityLabel(scores)}</span>
        <span className="text-[#8891A3]">Model opdateret: {DATA_STATUS.scoring.updatedLabel}</span>
      </div>
      <p className="mt-1 leading-relaxed">
        AI-robusthed er et crosswalk-/modelestimat baseret på opgaveeksponering og augmentationspotentiale — ikke en prognose for arbejdsløshed eller en jobgaranti.
        {!compact && " Job- og lønscorer skal læses som model-/registerafledte indikatorer, ikke som sikre udfald for den enkelte."}
        {!compact && overallStatus === "PROVENANCE_REQUIRED" && " Den aktuelle katalogversion mangler dokumenteret uddannelsesspecifik kildekobling for mindst én metrik."}
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
                  <span className="block text-[10px] text-[#8891A3]">{metricStatusNote(status)}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-1 leading-relaxed">Metrikstatus: {metricStatuses}</p>
          <p className="mt-1 leading-relaxed text-[#8891A3]">
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
