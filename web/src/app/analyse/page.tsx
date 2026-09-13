import Link from "next/link";
import { Header } from "@/components/Header";
import { LiveAnalysisPanel } from "@/components/LiveAnalysisPanel";
import {
  AI_RESEARCH_INSIGHTS,
  AI_RESEARCH_UPDATED_AT,
  STATUS_LABELS,
  type ResearchStatus,
} from "@/lib/aiResearch";
import { DATA_STATUS } from "@/lib/dataStatus";

const statusStyles: Record<ResearchStatus, string> = {
  OBSERVERET: "border-[#0F9D6E]/25 bg-[#E3F6EE] text-[#0B7A57]",
  FORSKNINGSRESULTAT: "border-[#2563EB]/25 bg-[#EFF6FF] text-[#1D4ED8]",
  MODELINDIKATOR: "border-[#7C3AED]/25 bg-[#F5F3FF] text-[#6D28D9]",
};

const decisionQuestions = [
  {
    number: "1",
    title: "Vil jeg lære faget — også når værktøjerne ændrer sig?",
    text: "Interesse og vedholdenhed betyder noget over et langt studie. Brug AI-scoren som et ekstra perspektiv, ikke som erstatning for faglig nysgerrighed.",
  },
  {
    number: "2",
    title: "Hvilke opgaver vil jeg gerne være god til?",
    text: "Se efter menneskelig kontakt, fysisk udførelse, kreativ retning, dømmekraft og ansvar. AI påvirker opgaver forskelligt inden for samme job.",
  },
  {
    number: "3",
    title: "Hvordan kommer jeg godt ind på arbejdsmarkedet?",
    text: "Undersøg praktik, studiejob, portfolio og branchesamarbejde. Ny forskning peger på, at overgangen til det første job kan være mere udsat end erfarne roller.",
  },
  {
    number: "4",
    title: "Hvilke oplysninger mangler jeg stadig?",
    text: "Kontrollér studieordning, adgangskrav og studiemiljø hos uddannelsesstedet. Tal med studerende eller en vejleder, før du træffer den endelige beslutning.",
  },
];

export default function AIInsightsPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      <Header />

      <main className="mx-auto max-w-5xl space-y-10 px-5 py-10 sm:px-6">
        <header className="mx-auto max-w-3xl space-y-4 text-center">
          <span className="inline-flex rounded-full border border-[#2563EB]/20 bg-[#E7EEFE] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
            Ny forskning · opdateret {AI_RESEARCH_UPDATED_AT}
          </span>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#12172B]">
            AI Insights til dit uddannelsesvalg
          </h1>
          <p className="text-sm leading-relaxed text-[#545D71]">
            Hvad ved vi faktisk om AI og arbejde — og hvad betyder det for dig? Her får du nye tal med
            kilde, geografi og forbehold, så du kan stille bedre spørgsmål uden at lade én prognose vælge for dig.
          </p>
        </header>

        <section aria-labelledby="short-answer-heading" className="rounded-2xl border border-[#12172B] bg-[#12172B] p-6 text-white sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9FB7FF]">Det korte svar</p>
          <h2 id="short-answer-heading" className="mt-2 font-display text-2xl font-bold">
            Vælg ikke den uddannelse, AI påvirker mindst. Vælg et fag, hvor du kan lære, tilpasse dig og skabe værdi med nye værktøjer.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Faglig interesse", "Kan du se dig selv fordybe dig i faget i flere år?"],
              ["Reelle muligheder", "Se snit, indhold, praktik, jobindikatorer og datakvalitet sammen."],
              ["Omstillingsevne", "Lær både dit fag og at bruge AI kritisk, sikkert og ansvarligt."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-xl border border-white/15 bg-white/5 p-4">
                <h3 className="text-sm font-bold">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#D8E0F5]">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-[#12172B] hover:bg-[#EFF6FF]">
              Find uddannelser →
            </Link>
            <Link href="/sammenlign" className="rounded-lg border border-white/30 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10">
              Sammenlign dine favoritter
            </Link>
          </div>
        </section>

        <section aria-labelledby="latest-research-heading" className="space-y-5">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#545D71]">Nye tal i kontekst</p>
            <h2 id="latest-research-heading" className="mt-1 font-display text-2xl font-bold">Det vigtigste at vide lige nu</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#545D71]">
              Kortene er baggrundsviden. De ændrer ikke automatisk en uddannelses placering i matchværktøjet,
              fordi virksomheds-, lande- og erhvervstal ikke er det samme som dokumenterede udfald for én uddannelse.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {AI_RESEARCH_INSIGHTS.map((insight) => (
              <article key={insight.id} className="flex flex-col rounded-xl border border-[#E7E9EF] bg-white p-5 card-shadow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-mono-data text-3xl font-bold text-[#12172B]">{insight.value}</div>
                    <h3 className="mt-1 max-w-md text-sm font-bold leading-snug">{insight.title}</h3>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles[insight.status]}`}>
                    {STATUS_LABELS[insight.status]}
                  </span>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-[#545D71]">{insight.summary}</p>
                <div className="mt-4 rounded-lg border border-[#2563EB]/15 bg-[#EFF6FF] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#1D4ED8]">Hvad betyder det for dig?</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#334A75]">{insight.meaningForStudents}</p>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-[#7C5A16]"><strong>Begrænsning:</strong> {insight.caution}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#E7E9EF] pt-4 text-[10px] text-[#667085]">
                  <span>{insight.geography} · {insight.published}</span>
                  <a href={insight.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-[#1D4ED8] hover:underline">
                    {insight.sourceLabel} ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="decision-heading" className="rounded-xl border border-[#E7E9EF] bg-white p-6 card-shadow sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#0B7A57]">Fra tal til valg</p>
          <h2 id="decision-heading" className="mt-1 font-display text-2xl font-bold">Fire spørgsmål før du vælger</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {decisionQuestions.map((item) => (
              <div key={item.number} className="flex gap-4 rounded-xl border border-[#E7E9EF] bg-[#F7F8FA] p-4">
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#12172B] text-xs font-bold text-white">{item.number}</span>
                <div>
                  <h3 className="text-sm font-bold">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#545D71]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-[#545D71]">
            Brug gerne værktøjet til at lave en kortliste. Brug derefter åbent hus, studieordninger og vejledning til at undersøge de ting, en score ikke kan se.
          </p>
        </section>

        <section aria-labelledby="model-heading" className="space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#545D71]">Uddannelsesanalyse</p>
            <h2 id="model-heading" className="mt-1 font-display text-2xl font-bold">Gå dybere i en uddannelse</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#545D71]">
              Analysen nedenfor bruger platformens model og skal læses som inspiration til spørgsmål — ikke som et facit eller en personlig karriereprognose.
            </p>
          </div>
          <LiveAnalysisPanel />
        </section>

        <section className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-5 text-xs leading-relaxed text-[#7C5A16]">
          <h2 className="font-bold text-[#78350F]">Modelstatus: O*NET 31.0 er delvist aktiveret</h2>
          <p className="mt-2">
            De publicerede AI-scorer bruger nu {DATA_STATUS.scoring.source} for {DATA_STATUS.scoring.mappedProgrammeCount} uddannelser
            ({Math.round(DATA_STATUS.scoring.mappedProgrammeShare * 100)}%). De resterende {DATA_STATUS.scoring.baselineProgrammeCount} uddannelser mangler en ikke-standard
            program→DISCO-kobling og beholder derfor en tydeligt markeret legacy-baseline. Det er bedre end at kalde en ukendt mapping for O*NET-data.
            Nye forskningskort ovenfor indgår ikke skjult i rangeringen.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/evidens" className="font-bold text-[#1D4ED8] hover:underline">Se metode og datastatus →</Link>
            <Link href="/guides/ai-og-uddannelsesvalg" className="font-bold text-[#1D4ED8] hover:underline">Læs guiden til AI og studievalg →</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
