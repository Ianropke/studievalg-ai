"use client";

import { useState } from "react";
import type { FormEvent } from "react";

interface AnalysisCitation {
  source?: string;
  url?: string;
  quote?: string;
  source_authority?: string;
  supports_claim?: boolean;
}

interface AnalysisProgram {
  kot_nr: string;
  udbud_titel: string;
  match_score: number;
  automation_risk: number;
  augmentation_potential: number;
  labour_demand: number;
  salary_growth: number;
  ai_resilience: number;
  score_components: Record<string, number>;
  top_positive_factors: string[];
  main_risks: string[];
  evidence_quality?: string;
}

interface AnalysisResponse {
  status: string;
  validation_status?: string;
  message?: string;
  error_code?: string;
  recommended_programs?: AnalysisProgram[];
  evidence_citations?: AnalysisCitation[];
}

function asPercent(value: number): number {
  return Math.round(value * 100);
}

export function LiveAnalysisPanel() {
  const [query, setQuery] = useState("");
  const [riskTolerance, setRiskTolerance] = useState(0.3);
  const [salaryPriority, setSalaryPriority] = useState(0.5);
  const [location, setLocation] = useState("");
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function runAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setResponse(null);

    try {
      const result = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          riskTolerance,
          salaryPriority,
          location: location.trim(),
        }),
      });

      const payload = await result.json().catch(() => ({
        status: "unavailable",
        message: "Analyse-servicen returnerede ikke et læsbart svar.",
      })) as AnalysisResponse;

      setResponse(payload);
    } catch {
      setResponse({
        status: "unavailable",
        message: "Analyse-servicen kunne ikke kontaktes. Prøv igen om et øjeblik.",
      });
    } finally {
      setLoading(false);
    }
  }

  const programs = response?.recommended_programs ?? [];
  const citations = response?.evidence_citations?.filter((citation) => citation.supports_claim) ?? [];

  return (
    <section className="bg-[#FFFFFF] border border-[#2563EB]/30 rounded-xl p-6 space-y-5 card-shadow">
      <div className="border-b border-[#E7E9EF] pb-4 space-y-2">
        <span className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-wider block">
          Live modelanalyse
        </span>
        <h2 className="text-xl font-bold text-[#12172B] font-display">
          Få en kildebevidst analyse af dine interesser
        </h2>
        <p className="text-xs text-[#545D71] leading-relaxed">
          Denne analyse kører den samme validerede anbefalingsmotor som API&apos;et.
          AI-robusthed er et modelestimat; job og løn er model-/registerafledte
          indikatorer og ikke garantier for den enkelte.
        </p>
      </div>

      <form onSubmit={runAnalysis} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#12172B]">Hvad interesserer dig?</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={300}
            placeholder="Fx sundhed, teknologi og København"
            className="w-full rounded-lg border border-[#D8DBE4] bg-[#FFFFFF] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="space-y-1">
            <span className="flex justify-between text-xs font-bold text-[#12172B]">
              AI-omstilling <span>{asPercent(riskTolerance)}%</span>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={riskTolerance}
              onChange={(event) => setRiskTolerance(Number(event.target.value))}
              className="w-full accent-[#0F9D6E]"
            />
            <span className="block text-[10px] text-[#8891A3]">Lavere betyder mere vægt på AI-robusthed.</span>
          </label>

          <label className="space-y-1">
            <span className="flex justify-between text-xs font-bold text-[#12172B]">
              Lønprioritet <span>{asPercent(salaryPriority)}%</span>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={salaryPriority}
              onChange={(event) => setSalaryPriority(Number(event.target.value))}
              className="w-full accent-[#7C3AED]"
            />
            <span className="block text-[10px] text-[#8891A3]">Balanceres med interesse, job og AI.</span>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold text-[#12172B]">Foretrukken studieby</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={100}
              placeholder="Valgfrit, fx Aarhus"
              className="w-full rounded-lg border border-[#D8DBE4] bg-[#FFFFFF] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            <span className="block text-[10px] text-[#8891A3]">Bruges kun som et eksplicit matchkriterium.</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="rounded-lg bg-[#12172B] px-4 py-2 text-sm font-bold text-[#FFFFFF] transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyserer…" : "Kør liveanalyse"}
        </button>
      </form>

      {response && response.status !== "success" && (
        <p role="status" className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-xs text-[#92400E]">
          {response.message || "Analysen kunne ikke gennemføres lige nu."}
        </p>
      )}

      {response?.status === "success" && (
        <div className="space-y-4" aria-live="polite">
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-[#2563EB]/20 bg-[#EFF6FF] px-2 py-1 font-bold text-[#1D4ED8]">
              Validering: {response.validation_status || "ukendt"}
            </span>
            <span className="rounded-full border border-[#D8DBE4] bg-[#F7F8FA] px-2 py-1 font-semibold text-[#545D71]">
              Resultater er model-/registerafledte
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {programs.slice(0, 3).map((program) => (
              <article key={program.kot_nr} className="rounded-lg border border-[#E7E9EF] bg-[#FFFFFF] p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8891A3]">
                    Match {asPercent(program.match_score)}%
                  </p>
                  <h3 className="font-bold text-[#12172B]">{program.udbud_titel}</h3>
                </div>

                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-[#8891A3]">AI-robusthed</dt><dd className="font-bold text-[#0B7A57]">{asPercent(program.ai_resilience)}/100</dd></div>
                  <div><dt className="text-[#8891A3]">Jobindikator</dt><dd className="font-bold text-[#1D4ED8]">{asPercent(program.labour_demand)}/100</dd></div>
                  <div><dt className="text-[#8891A3]">Lønindikator</dt><dd className="font-bold text-[#6D28D9]">{asPercent(program.salary_growth)}/100</dd></div>
                  <div><dt className="text-[#8891A3]">Evidens</dt><dd className="font-bold">{program.evidence_quality || "ukendt"}</dd></div>
                </dl>

                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-[#12172B]">Hvorfor matcher den?</p>
                  <ul className="list-disc pl-4 text-[#545D71]">
                    {program.top_positive_factors.slice(0, 2).map((factor) => <li key={factor}>{factor}</li>)}
                  </ul>
                  <p className="pt-1 font-semibold text-[#12172B]">Vigtige forbehold</p>
                  <ul className="list-disc pl-4 text-[#545D71]">
                    {program.main_risks.slice(0, 2).map((risk) => <li key={risk}>{risk}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-lg border border-[#E7E9EF] bg-[#F7F8FA] p-3 text-xs text-[#545D71]">
            <p className="font-bold text-[#12172B]">Kilde- og datastatus</p>
            <p className="mt-1">
              AI-indekset er et O*NET/DISCO-08-crosswalk-estimat. Job- og lønindikatorer
              vises med forbehold, indtil der findes fuld uddannelsesspecifik proveniens.
            </p>
            {citations.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {citations.slice(0, 3).map((citation, index) => (
                  <li key={citation.url || citation.source || index}>
                    {citation.url ? <a href={citation.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#2563EB] hover:underline">{citation.source || "Kilde"} ↗</a> : (citation.source || "Kilde")}
                    {citation.source_authority ? ` (${citation.source_authority})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
