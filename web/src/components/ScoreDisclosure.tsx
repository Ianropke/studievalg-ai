import type { EvidenceStatus, NormalizedScores } from "@/lib/domainScoring";

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

export function ScoreDisclosure({ scores, compact = false }: ScoreDisclosureProps) {
  const sources = Array.from(
    new Set(Object.values(scores.provenance).map((item) => item.source).filter(Boolean))
  );
  const metricStatuses = Object.entries(scores.provenance)
    .map(([metric, item]) => (METRIC_LABELS[metric] || metric) + ": " + statusLabel(item.status))
    .join(" · ");
  const overallStatus = scores.overall_status || (scores.is_baseline_estimate ? "MODEL" : "UNKNOWN");

  return (
    <div className="rounded-lg border border-[#D8DBE4] bg-[#F7F8FA] px-3 py-2 text-[11px] text-[#545D71]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-[#2563EB]/20 bg-[#EFF6FF] px-2 py-0.5 font-bold text-[#1D4ED8]">
          {scores.is_baseline_estimate ? "Baselineestimat" : statusLabel(overallStatus)}
        </span>
        <span className="font-semibold">Datakvalitet: {qualityLabel(scores)}</span>
      </div>
      <p className="mt-1 leading-relaxed">
        AI-robusthed er et modelestimat baseret på opgaveeksponering og augmentationspotentiale — ikke en prognose for arbejdsløshed eller en jobgaranti.
        {!compact && " Job- og lønscorer skal læses som model-/registerafledte indikatorer, ikke som sikre udfald for den enkelte."}
      </p>
      {!compact && (
        <p className="mt-1 leading-relaxed">
          Metrikstatus: {metricStatuses}
        </p>
      )}
      {!compact && sources.length > 0 && (
        <p className="mt-1 leading-relaxed">
          Kildegrundlag: {sources.join(" · ")}
        </p>
      )}
    </div>
  );
}
