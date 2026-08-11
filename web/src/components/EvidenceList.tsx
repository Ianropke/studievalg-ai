interface EvidenceListProps {
  evidence?: readonly unknown[];
  compact?: boolean;
}

function readField(item: unknown, keys: string[]): string {
  if (!item || typeof item !== "object") return "";
  const record = item as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function EvidenceList({ evidence = [], compact = false }: EvidenceListProps) {
  const usable = evidence
    .map((item) => ({
      quote: readField(item, ["quote", "excerpt", "chunk_text"]),
      source: readField(item, ["source", "source_title", "report_title"]),
      page: readField(item, ["page"]),
      relevance: readField(item, ["relevance"]),
    }))
    .filter((item) => item.quote || item.source);

  if (usable.length === 0) {
    return (
      <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[11px] leading-relaxed text-[#92400E]">
        Ingen uddannelsesspecifik evidenskilde er tilknyttet denne score endnu. Resultatet bør derfor læses som modelbaseret beslutningsstøtte.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {usable.slice(0, compact ? 2 : 5).map((item, index) => (
        <div key={index} className="rounded-lg border border-[#E7E9EF] bg-[#F7F8FA] p-3">
          {item.quote && <p className="italic leading-relaxed text-[#12172B]">&quot;{item.quote}&quot;</p>}
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] font-semibold text-[#545D71]">
            {item.source && <span>Kilde: {item.source}</span>}
            {item.page && <span>Side: {item.page}</span>}
            {item.relevance && <span>Relevans: {item.relevance}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
