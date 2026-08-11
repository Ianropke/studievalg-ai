import type { NormalizedScores } from "@/lib/domainScoring";

interface ScoreDisclosureProps {
  scores: NormalizedScores;
  compact?: boolean;
}

function qualityLabel(scores: NormalizedScores): string {
  if (scores.is_baseline_estimate) return "Lav · baselineestimat";
  if (scores.data_quality === "HIGH") return "Høj · modelberegnet";
  if (scores.data_quality === "MEDIUM") return "Mellem · modelberegnet";
  return "Lav · modelberegnet";
}

export function ScoreDisclosure({ scores, compact = false }: ScoreDisclosureProps) {
  const sources = Array.from(
    new Set(Object.values(scores.provenance).map((item) => item.source).filter(Boolean))
  );

  return (
    <div className="rounded-lg border border-[#D8DBE4] bg-[#F7F8FA] px-3 py-2 text-[11px] text-[#545D71]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-[#2563EB]/20 bg-[#EFF6FF] px-2 py-0.5 font-bold text-[#1D4ED8]">
          {scores.is_baseline_estimate ? "Baselineestimat" : "Modelberegnet"}
        </span>
        <span className="font-semibold">Datakvalitet: {qualityLabel(scores)}</span>
      </div>
      <p className="mt-1 leading-relaxed">
        AI-robusthed er et modelestimat baseret på opgaveeksponering og augmentationspotentiale — ikke en prognose for arbejdsløshed eller en jobgaranti.
        {!compact && " Job- og lønscorer skal læses som model-/registerafledte indikatorer, ikke som sikre udfald for den enkelte."}
      </p>
      {!compact && sources.length > 0 && (
        <p className="mt-1 leading-relaxed">
          Kildegrundlag: {sources.join(" · ")}
        </p>
      )}
    </div>
  );
}
