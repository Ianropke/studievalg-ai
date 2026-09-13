import React from "react";
import { Header } from "@/components/Header";
import { getProgramCatalog } from "@/lib/programCatalog";
import { DATA_STATUS } from "@/lib/dataStatus";
import evidenceRegistry from "@/data/evidence_knowledge_base.json";
import { AI_RESEARCH_INSIGHTS, STATUS_LABELS } from "@/lib/aiResearch";

export default function EvidensPage() {
  const catalog = getProgramCatalog();
  const dataStats = {
    total: catalog.length,
    admissions: DATA_STATUS.catalogue.admissionsUpdatedLabel,
    model: DATA_STATUS.scoring.updatedLabel,
    sources: evidenceRegistry.total_sources,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Hvordan beregnes AI-robusthedsscorerne?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `AI-robusthed er et crosswalk-/modelestimat: 75% af indekset kommer fra lavere automatiseringsrisiko og 25% fra augmentationspotentiale. O*NET 31.0 er aktiv for ${DATA_STATUS.scoring.mappedProgrammeCount} af ${DATA_STATUS.catalogue.programmeCount} uddannelser; resten udelukkes fra AI-rangering.`
        }
      },
      {
        "@type": "Question",
        "name": "Hvad er datakilderne bag Uddannelsesindsigt?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Kilderegistret indeholder ${evidenceRegistry.total_sources} registrerede referencer fra blandt andet Uddannelses- og Forskningsministeriet (KOT), Danmarks Statistik, OECD, ESCO og O*NET. En registreret reference er ikke automatisk evidens for hvert uddannelsesudbud.`
        }
      }
    ]
  };
  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "Uddannelsesindsigt AI-robusthedsmodel 2026.6",
    "description": "Modelbaserede AI-robusthedsindikatorer for danske videregående uddannelser med eksplicit O*NET 31.0-dækning og provenance.",
    "url": "https://uddannelsesindsigt.com/evidens",
    "dateModified": DATA_STATUS.scoring.updatedAt,
    "version": DATA_STATUS.scoring.methodologyVersion,
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "isBasedOn": [
      "https://www.onetcenter.org/database.html",
      "https://www.onetcenter.org/crosswalks.html"
    ],
    "spatialCoverage": ["Danmark", "USA", "EU"],
    "measurementTechnique": "Deterministisk model af O*NET 31.0 Work Activities aggregeret via O*NET-ESCO/ISCO og tilgængelige DISCO-koblinger",
    "variableMeasured": ["automation_risk", "augmentation_potential", "ai_resilience"],
    "includedInDataCatalog": {
      "@type": "DataCatalog",
      "name": "Uddannelsesindsigt"
    },
    "distribution": {
      "@type": "DataDownload",
      "encodingFormat": "application/json",
      "contentUrl": "https://uddannelsesindsigt.com/data/all_programs_catalog.json"
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }} />
      <Header />
      <main id="main-content" tabIndex={-1} className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F6EE] text-[#0B7A57] border border-[#0F9D6E]/20">Sådan regner vi</span>
          <h1 className="text-4xl font-bold tracking-tight text-[#12172B] font-display">Bag om dine scorer</h1>
          <p className="text-sm text-[#545D71] leading-relaxed">Her kan du se, hvor tallene kommer fra, og hvordan vi regner dem ud — helt uden fagsprog.</p>
        </div>
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 card-shadow space-y-6">
          <div className="border-b border-[#E7E9EF] pb-4">
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">SÅDAN BYGGER VI SCOREN</span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">Sådan er dataene bygget op</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-[#FFFFFF] p-5 rounded-lg border-l-4 border-l-[#0F9D6E] border-y border-r border-[#E7E9EF] shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#12172B] text-xs uppercase tracking-wider">NIVEAU 1: OFFICIEL REGISTERDATA (HÅRDE TAL)</h3>
                <span className="font-mono-data text-[10px] text-[#0B7A57] bg-[#E3F6EE] px-2 py-0.5 rounded font-bold border border-[#0F9D6E]/20">Observeret / registerdata</span>
              </div>
              <p className="text-xs text-[#545D71] leading-relaxed">Danmarks Statistik og UFM (KOT) leverer observerede tal for blandt andet optagelse og adgangskvotienter. De beskriver historiske eller registrerede forhold — ikke nødvendigvis fremtidig efterspørgsel eller den enkeltes udfald.</p>
            </div>
            <div className="bg-[#FFFFFF] p-5 rounded-lg border-l-4 border-l-[#2563EB] border-y border-r border-[#E7E9EF] shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#12172B] text-xs uppercase tracking-wider">NIVEAU 2: OPGAVE- OG MODELDATA</h3>
                <span className="font-mono-data text-[10px] text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded font-bold border border-[#2563EB]/20">Modelleret</span>
              </div>
              <p className="text-xs text-[#545D71] leading-relaxed">O*NET-opgavedata og dokumenterede crosswalks bruges til at estimere AI-robusthed. Estimatet er et valgfrit perspektiv på opgavernes mulige forandring — ikke en prognose for uddannelsens værdi eller den enkeltes fremtid.</p>
            </div>
            <div className="bg-[#FFFFFF] p-5 rounded-lg border-l-4 border-l-[#7C3AED] border-y border-r border-[#E7E9EF] shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#12172B] text-xs uppercase tracking-wider">NIVEAU 3: AI-ANALYSE</h3>
                <span className="font-mono-data text-[10px] text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded font-bold border border-[#7C3AED]/20">Supplerende</span>
              </div>
              <p className="text-xs text-[#545D71] leading-relaxed">AI kan bruges til at strukturere og fortolke information, men må ikke fremstilles som den numeriske sandhed. Resultaterne bør kunne spores tilbage til kilde, metode og beregningsregel, og manglende program-evidens skal vises som usikkerhed.</p>
            </div>
          </div>
        </section>
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 card-shadow space-y-5">
          <div>
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">DATASTATUS</span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">Datagrundlag og opdatering</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-[#E7E9EF] p-4"><div className="text-xs text-[#667085]">Uddannelsesudbud</div><div className="text-2xl font-bold font-mono-data">{dataStats.total.toLocaleString("da-DK")}</div></div>
            <div className="rounded-lg border border-[#E7E9EF] p-4"><div className="text-xs text-[#667085]">Optagelsesdata</div><div className="text-lg font-bold">{dataStats.admissions}</div></div>
            <div className="rounded-lg border border-[#E7E9EF] p-4"><div className="text-xs text-[#667085]">Scoringsmodel</div><div className="text-lg font-bold">{dataStats.model}</div></div>
          </div>
          <p className="text-xs text-[#545D71] leading-relaxed">Kataloget og kilderegistret publiceres som versionsstyrede datafiler. Kildeantallet ovenfor læses direkte fra det genererede register, så siden ikke viser et separat, håndskrevet tal.</p>
          <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-4 text-xs leading-relaxed text-[#92400E]">
            <p className="font-bold text-[#78350F]">Vigtig dækningsstatus</p>
            <p className="mt-1">Kilderegistret har {dataStats.sources} registrerede referencer. AI-modeldækning: <strong>{DATA_STATUS.scoring.mappedProgrammeCount} af {DATA_STATUS.catalogue.programmeCount.toLocaleString("da-DK")} uddannelser</strong>. De øvrige {DATA_STATUS.scoring.baselineProgrammeCount} udelukkes fra AI-rangering og vises uden programspecifikt AI-estimat. En registreret reference tæller ikke automatisk som evidens for hvert uddannelsesudbud.</p>
          </div>
        </section>
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 card-shadow space-y-5">
          <div>
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">NYERE FORSKNING OG STATISTIK</span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">Kilder vist i AI Insights</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#545D71]">Disse kilder giver baggrund om AI, unge og arbejdsmarkedet. De indgår ikke automatisk i rangeringen, fordi geografi og måleenhed ikke svarer til et dansk uddannelsesudbud.</p>
          </div>
          <div className="divide-y divide-[#E7E9EF] rounded-lg border border-[#E7E9EF]">
            {AI_RESEARCH_INSIGHTS.map((source) => (
              <div key={source.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#12172B]">{source.sourceLabel}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#545D71]">{STATUS_LABELS[source.status]} · {source.geography} · {source.published}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#7C5A16]">Begrænsning: {source.caution}</p>
                </div>
                <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-bold text-[#1D4ED8] hover:underline">Åbn original kilde ↗</a>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 card-shadow space-y-4">
          <h2 className="text-xl font-bold text-[#12172B] font-display">Ofte stillede spørgsmål</h2>
          <div className="space-y-3 text-sm text-[#545D71]">
            <p><strong>Hvordan beregnes AI-robusthedsscorerne?</strong> AI-robusthed beregnes efter den fælles formel: 75% × (1 − automation_risk) + 25% × augmentation_potential, med værdier begrænset til 10–100. Fra modelversion 2026.6 bygger de migrerede værdier på O*NET 31.0-aktivitetsratings, aggregeret via O*NET-ESCO/ISCO og den tilgængelige DISCO-kobling. Det er stadig et crosswalk-/modelestimat — ikke en prognose for arbejdsløshed eller jobmuligheder.</p>
            <p><strong>Hvor stor er O*NET 31.0-dækningen?</strong> {DATA_STATUS.scoring.mappedProgrammeCount} af {DATA_STATUS.catalogue.programmeCount} uddannelser ({Math.round(DATA_STATUS.scoring.mappedProgrammeShare * 100)}%) har en ikke-standard DISCO-kobling og kan indgå i AI-rangering. De resterende {DATA_STATUS.scoring.baselineProgrammeCount} vises uden programspecifikt AI-estimat.</p>
            <p><strong>Hvor kommer dataene fra?</strong> Platformen anvender blandt andet UFM, Danmarks Statistik og internationale arbejdsmarkeds- og opgavedatasæt. O*NET 31.0-råfiler, source hashes, transformationsformel og migrationsrapport ligger i det offentlige repository.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
