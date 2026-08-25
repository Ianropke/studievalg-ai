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

function readUrl(item: unknown): string {
  const value = readField(item, ["url", "source_url", "sourceUrl", "link"]);
  return /^https?:\/\//i.test(value) ? value : "";
}

export function EvidenceList({ evidence = [], compact = false }: EvidenceListProps) {
  const usable = evidence
    .map((item) => ({
      quote: readField(item, ["quote", "excerpt", "chunk_text"]),
      source: readField(item, ["source", "source_title", "report_title"]),
      url: readUrl(item),
      page: readField(item, ["page"]),
      relevance: readField(item, ["relevance"]),
      dataset: readField(item, ["dataset", "table", "dataset_version"]),
      period: readField(item, ["period", "observation_period", "year"]),
      method: readField(item, ["method", "methodology", "transformation"]),
    }))
    .filter((item) => item.quote || item.source || item.url);

  if (usable.length === 0) {
    return (
      <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[11px] leading-relaxed text-[#92400E]">
        Ingen uddannelsesspecifik evidenskilde er tilknyttet denne score endnu. Resultatet bør derfor læses som modelbaseret beslutningsstøtte.
      </div>
    );
  }

  return (
    <ol aria-label="Evidens og kilder" className="space-y-2">
      {usable.slice(0, compact ? 2 : 5).map((item, index) => (
        <li key={index} className="rounded-lg border border-[#E7E9EF] bg-[#F7F8FA] p-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-[#545D71]">
            {item.url ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-1 rounded">
                {item.source || "Åbn kildelink"} ↗
              </a>
            ) : item.source && <span>{item.source}</span>}
            {item.page && <span>Side: {item.page}</span>}
          </div>
          {item.quote && <p className="italic leading-relaxed text-[#12172B]">&quot;{item.quote}&quot;</p>}
          <dl className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-[#8891A3]">
            {item.dataset && <div><dt className="inline font-semibold">Datasæt: </dt><dd className="inline">{item.dataset}</dd></div>}
            {item.period && <div><dt className="inline font-semibold">Periode: </dt><dd className="inline">{item.period}</dd></div>}
            {item.method && <div><dt className="inline font-semibold">Metode: </dt><dd className="inline">{item.method}</dd></div>}
            {item.relevance && <span>Relevans: {item.relevance}</span>}
          </dl>
        </li>
      ))}
    </ol>
  );
}
