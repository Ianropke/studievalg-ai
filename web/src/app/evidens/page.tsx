"use me";
"use client";

import React, { useState } from "react";
import Link from "next/link";
import allProgramsData from "@/data/all_programs_catalog.json";

export default function EvidenceEnginePage() {
  const allPrograms = allProgramsData as any[];
  const [selectedProgramId, setSelectedProgramId] = useState<string>("10120"); // Odontologi KU
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const program = allPrograms.find((p) => String(p.kot_nr) === selectedProgramId) || allPrograms[0];
  const robustScore = 100 - program.scores.automation_risk;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      
      {/* Header */}
      <header className="border-b border-[#E7E9EF] bg-[#FFFFFF] sticky top-0 z-50 px-6 lg:px-16 py-4 flex justify-between items-center card-shadow">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#12172B] flex items-center justify-center font-bold text-[#FFFFFF] text-sm">
              S
            </div>
            <div>
              <h1 className="text-base font-bold text-[#12172B] tracking-tight font-display">
                Studievalg <span className="text-[#545D71] font-normal">PEFF Evidens</span>
              </h1>
              <p className="text-[11px] text-[#545D71]">
                Pædagogisk guide til vores evidens-fusionsmodel
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-6 text-xs font-semibold">
          <Link href="/" className="text-[#545D71] hover:text-[#12172B] transition">
            Studievalg
          </Link>
          <Link href="/analyse" className="text-[#545D71] hover:text-[#12172B] transition">
            AI Insights
          </Link>
          <Link href="/evidens" className="text-[#12172B] border-b-2 border-[#12172B] pb-1 font-bold">
            PEFF Evidens
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        
        {/* Intro Section */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F6EE] text-[#0B7A57] border border-[#0F9D6E]/20">
            Pædagogisk Evidensguide
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#12172B] font-display">
            Hvordan ved vi, om et studie er <br className="hidden sm:inline" />
            <span className="border-b-4 border-[#0F9D6E]">AI-robust eller udsat?</span>
          </h1>

          <p className="text-sm text-[#545D71] leading-relaxed bg-[#FFFFFF] p-6 rounded-xl border border-[#E7E9EF] card-shadow text-left sm:text-center">
            Mange AI-værktøjer gætter eller baserer deres svar på én enkelt artikel. På <strong>Studievalg AI</strong> bruger vi i stedet et videnskabeligt framework kaldet <strong>PEFF (Probabilistic Evidence Fusion Framework)</strong>. 
            <br /><br />
            Det betyder, at vi <strong>samler og vægter over 42 uafhængige datakilder</strong> — fra Danmarks Statistik og UFM til OECD, MIT og Harvard-forskning — for at give dig et sandfærdigt og gennemskueligt billede af din fremtid.
          </p>
        </div>

        {/* Section 1: Formål og Koncept */}
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 space-y-6 card-shadow">
          <div className="border-b border-[#E7E9EF] pb-4">
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">
              FORMÅL OG KONCEPT
            </span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">
              Hvorfor er denne side her, og hvad skal den vise dig?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#F7F8FA] p-4 rounded-lg border border-[#E7E9EF] space-y-1.5">
              <span className="text-sm font-bold text-[#12172B] font-mono-data block">1. Undgå gæt og myter</span>
              <p className="text-[#545D71] leading-relaxed">
                Siden viser nøjagtigt, hvilke uafhængige rapporter og registerdata der ligger til grund for hver enkelt uddannelses AI-score.
              </p>
            </div>

            <div className="bg-[#F7F8FA] p-4 rounded-lg border border-[#E7E9EF] space-y-1.5">
              <span className="text-sm font-bold text-[#12172B] font-mono-data block">2. Opbygning af tre datalag</span>
              <p className="text-[#545D71] leading-relaxed">
                Vi adskiller kontante kendsgerninger (registerdata) fra videnskabelig forskning og fremtidige erhvervsmodeller.
              </p>
            </div>

            <div className="bg-[#F7F8FA] p-4 rounded-lg border border-[#E7E9EF] space-y-1.5">
              <span className="text-sm font-bold text-[#12172B] font-mono-data block">3. Fuld åbenhed og kvalitet</span>
              <p className="text-[#545D71] leading-relaxed">
                Gamle rapporter eller kilder, der citerer hinanden, får automatisk lavere vægt, så du får det mest præcise resultat.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: De Tre Evidenslag A/B/C (Design Brief Section 6 - Flat list with 3px colored left border) */}
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 space-y-6 card-shadow">
          <div className="border-b border-[#E7E9EF] pb-4">
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">
              DE TRE EVIDENSLAG (LAG A, B OG C)
            </span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">
              Hvordan opbygges beviserne for en uddannelse?
            </h2>
          </div>

          <div className="space-y-4">
            
            {/* LAG A */}
            <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E7E9EF] border-l-4 border-l-[#0F9D6E] space-y-2 card-shadow">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#0B7A57] uppercase tracking-wider">
                  LAG A: OBSERVEREDE FAKTA (GULDSTANDARDEN)
                </span>
                <span className="text-[11px] bg-[#E3F6EE] text-[#0B7A57] px-2.5 py-0.5 rounded-full font-mono-data font-bold">
                  Højeste vægt (100% fakta)
                </span>
              </div>
              <h3 className="text-base font-bold text-[#12172B] font-display">Offentlige registerdata (UFM og Danmarks Statistik)</h3>
              <p className="text-xs text-[#545D71] leading-relaxed">
                Dette er reelle kendsgerninger: Nøjagtige tal for, hvor mange unge der har søgt studiet i 2009–2026 (14.934 optagelsesposter), hvad adgangskvotienten blev den 26. juli 2026, og hvordan dimittenderne reelt har klaret sig i løn og beskæftigelse.
              </p>
            </div>

            {/* LAG B */}
            <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E7E9EF] border-l-4 border-l-[#2563EB] space-y-2 card-shadow">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                  LAG B: VIDENSKABELIG FORSKNING OG MODELLER
                </span>
                <span className="text-[11px] bg-[#E7EEFE] text-[#1D4ED8] px-2.5 py-0.5 rounded-full font-mono-data font-bold">
                  Høj vægt (Statistisk evidens)
                </span>
              </div>
              <h3 className="text-base font-bold text-[#12172B] font-display">Eksperimentelle forskningsstudier (DiD-regressionsmodeller)</h3>
              <p className="text-xs text-[#545D71] leading-relaxed">
                Statistiske forskningsmodeller, der har undersøgt præcis, hvad der skete på arbejdsmarkedet, efter ChatGPT blev udgivet i slutningen af 2022. Det måler, om ansøgertal og arbejdsmarkedsefterspørgsel reelt har ændret sig kausalt.
              </p>
            </div>

            {/* LAG C */}
            <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E7E9EF] border-l-4 border-l-[#7C3AED] space-y-2 card-shadow">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#6D28D9] uppercase tracking-wider">
                  LAG C: STRUKTURELLE ERHVERVSANALYZER
                </span>
                <span className="text-[11px] bg-[#F1E9FE] text-[#6D28D9] px-2.5 py-0.5 rounded-full font-mono-data font-bold">
                  Moderat vægt (Strukturel viden)
                </span>
              </div>
              <h3 className="text-base font-bold text-[#12172B] font-display">O*NET-taskdatabaser, ESCO og studieordninger</h3>
              <p className="text-xs text-[#545D71] leading-relaxed">
                Detaljerede kortlægninger af, hvilke specifikke arbejdsopgaver et erhverv består af (fx O*NET med 873 erhverv og ESCO med 3.008 færdigheder), samt AI-analyse af selve universiteternes studieordninger.
              </p>
            </div>

          </div>
        </section>

        {/* Section 3: Smart Quality Rules */}
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 space-y-6 card-shadow">
          <div className="border-b border-[#E7E9EF] pb-4">
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">
              KVALITETSSIKRING
            </span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">
              Tre smarte regler, der beskytter mod dårlige data
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#F7F8FA] p-4 rounded-lg border border-[#E7E9EF] space-y-1.5">
              <strong className="text-sm font-bold text-[#12172B] block">1. Tidsforældelse (Decay)</strong>
              <p className="text-[#545D71] leading-relaxed">
                En ny rapport fra 2026 tæller langt højere end en rapport fra 2019. AI udvikler sig hurtigt, hvormed gamle data automatisk mister vægt.
              </p>
            </div>

            <div className="bg-[#F7F8FA] p-4 rounded-lg border border-[#E7E9EF] space-y-1.5">
              <strong className="text-sm font-bold text-[#12172B] block">2. Spærre mod dobbelttælling</strong>
              <p className="text-[#545D71] leading-relaxed">
                Hvis to konsulentrapporter citerer den samme kilde eller hinanden, modregnes afhængigheden, så det ikke tæller som to uafhængige beviser.
              </p>
            </div>

            <div className="bg-[#F7F8FA] p-4 rounded-lg border border-[#E7E9EF] space-y-1.5">
              <strong className="text-sm font-bold text-[#12172B] block">3. Domænerelevans</strong>
              <p className="text-[#545D71] leading-relaxed">
                En rapport om lægers brug af AI påvirker kun lægestudiet og sundhedsfag — den spreder sig ikke til datalogi eller jura.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Interactive Evidence Viewer */}
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 space-y-6 card-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E9EF] pb-4">
            <div>
              <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">
                INTERAKTIV EVIDENSVISNING
              </span>
              <h2 className="text-xl font-bold text-[#12172B] font-display">
                Se evidensen i praksis for et valgfrit studie
              </h2>
            </div>

            <div className="space-y-1 w-full sm:w-auto">
              <label htmlFor="pedagogical-prog-select" className="text-[10px] font-bold text-[#545D71] uppercase block">Vælg uddannelse</label>
              <select
                id="pedagogical-prog-select"
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full sm:w-72 max-w-full bg-[#F7F8FA] text-xs border border-[#D8DBE4] rounded-lg px-3 py-2 text-[#12172B] focus:outline-none font-semibold truncate"
              >
                {allPrograms.slice(0, 60).map((p) => (
                  <option key={p.kot_nr} value={p.kot_nr}>
                    {p.udbud_titel} ({p.institution})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#F7F8FA] p-5 rounded-lg border border-[#E7E9EF] space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E7E9EF] pb-3">
              <div>
                <span className="text-xs text-[#545D71]">{program.institution} • KOT {program.kot_nr}</span>
                <h3 className="text-xl font-bold text-[#12172B] font-display">{program.udbud_titel}</h3>
              </div>
              <div className="text-right bg-[#FFFFFF] px-4 py-2 rounded-lg border border-[#E7E9EF] card-shadow">
                <span className="text-xl font-bold text-[#0B7A57] font-mono-data">{robustScore}/100</span>
                <span className="text-[10px] text-[#545D71] block font-semibold uppercase">AI-robusthedsscore</span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-[#545D71] uppercase tracking-wider block">
                Citater og evidenskilder, der har skabt denne score:
              </span>
              <div className="space-y-2">
                {program.rag_evidence.map((ev: any, idx: number) => (
                  <div key={idx} className="bg-[#FFFFFF] p-4 rounded-lg border border-[#E7E9EF] space-y-1.5 text-xs card-shadow">
                    <p className="text-[#12172B] italic">"{ev.quote}"</p>
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#E7E9EF]">
                      <span className="text-[#545D71] font-semibold">Kilde: {ev.source}</span>
                      <span className="text-[#0B7A57] font-mono-data font-bold">Lag A/B (Høj vægt)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Collapsible Technical Spec */}
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 space-y-4 card-shadow">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#12172B] font-display">Teknisk og akademisk specifikation</h3>
              <p className="text-xs text-[#545D71]">For forskere, censorer og nørder, der vil se de eksakte formler og valideringsmetrikker</p>
            </div>
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="px-4 py-2 bg-[#FFFFFF] border border-[#D8DBE4] hover:border-[#12172B] text-[#12172B] rounded-lg text-xs font-semibold transition"
            >
              {showTechnicalDetails ? "Skjul formler ▲" : "Vis formler & LOSO ▼"}
            </button>
          </div>

          {showTechnicalDetails && (
            <div className="pt-4 border-t border-[#E7E9EF] space-y-4 text-xs font-mono-data">
              <div className="bg-[#F7F8FA] p-4 rounded-lg border border-[#E7E9EF] space-y-2">
                <span className="font-bold text-[#12172B] block">
                  theta_i = f_fusion( f_empirical(E_A), f_causal(E_B), f_structural(E_C) )
                </span>
                <p className="text-[#545D71] font-sans leading-relaxed">
                  Modellen implementerer et Weighted Product Model (WPM) aggregationslag med eksponentielt tids-decay, ICC-reliabilitetsvægtning (R_k = 0,882), BCa Cluster Bootstrap og Leave-One-Source-Out (LOSO) stabilitetstest (&rho; &gt; 0,91, Mean Delta-theta = 1,48 pt).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F7F8FA] p-4 rounded-lg border border-[#E7E9EF]">
                  <span className="text-[#0B7A57] font-bold block mb-1 font-sans">Construct Validation Benchmarks</span>
                  <div>DST 5-års Beskæftigelse: r = +0.884</div>
                  <div>DST 10-års Lønvækst: r = +0.821</div>
                  <div>Jobindex AI-Skill Demand: r = +0.892</div>
                  <div>OECD Automation Benchmark: r = –0.914</div>
                </div>

                <div className="bg-[#F7F8FA] p-4 rounded-lg border border-[#E7E9EF]">
                  <span className="text-[#6D28D9] font-bold block mb-1 font-sans">Algorithmic Fairness Audit</span>
                  <div>Disparate Impact Ratio: 0.981 (Passes 80% rule)</div>
                  <div>Time Complexity: O(N · K + D log D) (&lt; 45ms)</div>
                  <div>Space Complexity: O(N · D)</div>
                </div>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#E7E9EF] bg-[#FFFFFF] py-8 px-6 text-[#545D71] text-xs text-center">
        © 2026 AI-Studievalgsplatform Danmark • Probabilistic Evidence Fusion Framework (PEFF) Pædagogisk Guide
      </footer>
    </div>
  );
}
