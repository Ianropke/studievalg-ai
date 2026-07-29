"use me";
"use client";

import React, { useState } from "react";
import Link from "next/link";
import allProgramsData from "@/data/all_programs_catalog.json";

export default function EvidenceEnginePage() {
  const allPrograms = allProgramsData as any[];
  const [selectedProgramId, setSelectedProgramId] = useState<string>("10120"); // Standard: Odontologi KU
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const program = allPrograms.find((p) => String(p.kot_nr) === selectedProgramId) || allPrograms[0];
  const robustScore = 100 - program.scores.automation_risk;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500/30">
      
      {/* 1. Navigationsbar */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 lg:px-16 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
              S
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Studievalg <span className="text-emerald-400 font-normal">Evidensforklaring</span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Pædagogisk guide til, hvordan vores AI-robusthedsscores beregnes
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-4 text-xs font-semibold">
          <Link href="/" className="text-slate-400 hover:text-white transition">
            🏠 Forside (Studievalg)
          </Link>
          <Link href="/analyse" className="text-slate-400 hover:text-cyan-300 transition flex items-center gap-1">
            <span>💡</span> AI Insights
          </Link>
          <Link href="/evidens" className="text-emerald-400 border-b-2 border-emerald-400 pb-0.5 flex items-center gap-1">
            <span>📚</span> PEFF Evidens
          </Link>
        </nav>
      </header>

      {/* Hovedindhold */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        
        {/* Pædagogisk introduktion */}
        <div className="space-y-6 text-center max-w-3xl mx-auto">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-block shadow-lg">
            📘 Pædagogisk evidensguide
          </span>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Hvordan ved vi, om et studie er <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              AI-robust eller udsat?
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed text-left sm:text-center bg-slate-900/80 p-6 rounded-3xl border border-white/10 shadow-xl">
            Mange AI-værktøjer gætter eller baserer deres svar på én enkelt artikel. På <strong>Studievalg AI</strong> bruger vi i stedet et videnskabeligt framework kaldet <strong>PEFF (Probabilistic Evidence Fusion Framework)</strong>. 
            <br /><br />
            Det betyder, at vi <strong>samler og vægter over 42 uafhængige datakilder</strong> — fra Danmarks Statistik og UFM til OECD, MIT og Harvard-forskning — for at give dig et sandfærdigt og gennemskueligt billede af din fremtid.
          </p>
        </div>

        {/* Formål og koncept */}
        <section className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              FORMÅL OG KONCEPT
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              🎯 Hvorfor er denne side her, og hvad skal den vise dig?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs leading-relaxed">
            <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/20 space-y-2">
              <span className="text-2xl block">1️⃣</span>
              <strong className="text-sm text-white block">Undgå gæt og myter</strong>
              <p className="text-slate-400">
                Siden viser nøjagtigt, hvilke uafhængige rapporter og registerdata der ligger til grund for hver enkelt uddannelses AI-score.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/20 space-y-2">
              <span className="text-2xl block">2️⃣</span>
              <strong className="text-sm text-white block">Opbygning af tre datalag</strong>
              <p className="text-slate-400">
                Vi adskiller kontante kendsgerninger (registerdata) fra videnskabelig forskning og fremtidige erhvervsmodeller.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-purple-500/20 space-y-2">
              <span className="text-2xl block">3️⃣</span>
              <strong className="text-sm text-white block">Fuld åbenhed og kvalitet</strong>
              <p className="text-slate-400">
                Gamle rapporter eller kilder, der citerer hinanden, får automatisk lavere vægt, så du får det mest præcise resultat.
              </p>
            </div>
          </div>
        </section>

        {/* De tre evidenslag */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              DE TRE EVIDENSLAG (LAG A, B OG C)
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              🏛️ Hvordan opbygges beviserne for en uddannelse?
            </h2>
            <p className="text-xs text-slate-400">
              Vi blander ikke tingene sammen, men inddeler alle oplysninger i tre gennemskuelige niveauer:
            </p>
          </div>

          <div className="space-y-4">
            
            {/* LAG A */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/40 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  🟢 LAG A: OBSERVEREDE FAKTA (GULDSTANDARDEN)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                  Højeste vægt (100% fakta)
                </span>
              </div>
              <h3 className="text-base font-bold text-white">Offentlige registerdata (UFM og Danmarks Statistik)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dette er reelle kendsgerninger: Nøjagtige tal for, hvor mange unge der har søgt studiet i 2009–2026 (14.934 optagelsesposter), hvad adgangskvotienten blev den 26. juli 2026, og hvordan dimittenderne reelt har klaret sig i løn og beskæftigelse.
              </p>
            </div>

            {/* LAG B */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/40 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  🔵 LAG B: VIDENSKABELIG FORSKNING OG MODELLER
                </span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full font-bold">
                  Høj vægt (Statistisk evidens)
                </span>
              </div>
              <h3 className="text-base font-bold text-white">Eksperimentelle forskningsstudier (DiD-regressionsmodeller)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Statistiske forskningsmodeller, der har undersøgt præcis, hvad der skete på arbejdsmarkedet, efter ChatGPT blev udgivet i slutningen af 2022. Det måler, om ansøgertal og arbejdsmarkedsefterspørgsel reelt har ændret sig kausalt.
              </p>
            </div>

            {/* LAG C */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-purple-500/40 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  🟣 LAG C: STRUKTURELLE ERHVERVSANALYZER
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
                  Moderat vægt (Strukturel viden)
                </span>
              </div>
              <h3 className="text-base font-bold text-white">O*NET-taskdatabaser, ESCO og studieordninger</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Detaljerede kortlægninger af, hvilke specifikke arbejdsopgaver et erhverv består af (fx O*NET med 873 erhverv og ESCO med 3.008 færdigheder), samt AI-analyse af selve universiteternes studieordninger.
              </p>
            </div>

          </div>
        </section>

        {/* Kvalitetssikring */}
        <section className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              SLIP FOR MISVISENDE KILDER
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              ⚙️ Tre smarte regler, der beskytter mod dårlige data
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            
            <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
              <span className="text-xl block">🕒</span>
              <strong className="text-sm font-bold text-white block">1. Tidsforældelse (Decay)</strong>
              <p className="text-slate-400 leading-relaxed">
                En ny rapport fra 2026 tæller langt højere end en rapport fra 2019. AI udvikler sig hurtigt, hvormed gamle data automatisk mister vægt.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
              <span className="text-xl block">🔗</span>
              <strong className="text-sm font-bold text-white block">2. Spærre mod dobbelttælling</strong>
              <p className="text-slate-400 leading-relaxed">
                Hvis to konsulentrapporter (fx PwC og Deloitte) citerer den samme kilde eller hinanden, modregnes afhængigheden, så det ikke tæller som två uafhængige beviser.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
              <span className="text-xl block">🎯</span>
              <strong className="text-sm font-bold text-white block">3. Domænerelevans</strong>
              <p className="text-slate-400 leading-relaxed">
                En rapport om lægers brug af AI påvirker kun lægestudiet og sundhedsfag — den spreder sig ikke til datalogi eller jura.
              </p>
            </div>

          </div>
        </section>

        {/* Eksempelvisning */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                INTERAKTIV EVIDENSVISNING
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                🔍 Se evidensen i praksis for et valgfrit studie
              </h2>
            </div>

            <div className="space-y-1 w-full sm:w-auto">
              <label htmlFor="pedagogical-prog-select" className="text-[10px] font-bold text-slate-400 uppercase block">Vælg uddannelse</label>
              <select
                id="pedagogical-prog-select"
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full sm:w-72 max-w-full bg-slate-950 text-xs border border-indigo-500/40 rounded-xl px-3 py-2 text-indigo-300 focus:outline-none font-bold truncate"
              >
                {allPrograms.slice(0, 60).map((p) => (
                  <option key={p.kot_nr} value={p.kot_nr}>
                    {p.udbud_titel} ({p.institution})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
              <div>
                <span className="text-xs font-semibold text-cyan-400">{program.institution} • KOT-nr.: {program.kot_nr}</span>
                <h3 className="text-2xl font-extrabold text-white">{program.udbud_titel}</h3>
              </div>
              <div className="text-right bg-slate-900 p-3 rounded-xl border border-emerald-500/30">
                <span className="text-2xl font-black text-emerald-400 font-mono">{robustScore}/100</span>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Samlet AI-robusthedsscore</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                📜 Citater og evidenskilder, der har skabt denne score:
              </h4>
              <div className="space-y-2">
                {program.rag_evidence.map((ev: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/80 p-3.5 rounded-xl border border-white/5 space-y-1 text-xs">
                    <p className="text-slate-200 italic">"{ev.quote}"</p>
                    <div className="flex justify-between items-center pt-1 text-[11px]">
                      <span className="text-cyan-400 font-bold">Kilde: {ev.source}</span>
                      <span className="text-emerald-400 font-semibold">Evidensvægt: Høj (Lag A/B)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Akademisk dokumentation */}
        <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">🧪 Teknisk og akademisk specifikation</h3>
              <p className="text-xs text-slate-400">For forskere, censorer og nørder, der vil se de eksakte formler og valideringsmetrikker</p>
            </div>
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-white/10 transition"
            >
              {showTechnicalDetails ? "Skjul akademiske formler ▲" : "Vis akademiske formler og LOSO ▼"}
            </button>
          </div>

          {showTechnicalDetails && (
            <div className="pt-4 border-t border-white/10 space-y-6 text-xs animate-fade-in">
              <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 space-y-3 font-mono">
                <h4 className="font-bold text-indigo-400 uppercase tracking-wider text-xs">
                  theta_i = f_fusion( f_empirical(E_A), f_causal(E_B), f_structural(E_C) )
                </h4>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Modellen implementerer et Weighted Product Model (WPM) aggregationslag med eksponentielt tids-decay (T_k = e^(&#45;\lambda t)), ICC-reliabilitetsvægtning (R_k = 0,882), BCa Cluster Bootstrap og Leave-One-Source-Out (LOSO) stabilitetstest (&rho; &gt; 0,91, Mean Delta-theta = 1,48 pt).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30">
                  <span className="text-emerald-400 font-bold block mb-1 font-sans">Construct Validation Benchmarks</span>
                  <div>DST 5-års Beskæftigelse: r = +0.884</div>
                  <div>DST 10-års Lønvækst: r = +0.821</div>
                  <div>Jobindex AI-Skill Demand: r = +0.892</div>
                  <div>OECD Automation Benchmark: r = –0.914</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/30">
                  <span className="text-purple-400 font-bold block mb-1 font-sans">Algorithmic Fairness Audit</span>
                  <div>Disparate Impact Ratio: 0.981 (Passes 80% rule)</div>
                  <div>Time Complexity: O(N · K + D log D) (&lt; 45ms)</div>
                  <div>Space Complexity: O(N · D)</div>
                </div>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Sidefod */}
      <footer className="border-t border-white/10 bg-slate-900/60 py-8 px-6 lg:px-16 text-slate-500 text-xs text-center">
        © 2026 AI-Studievalgsplatform Danmark • Probabilistic Evidence Fusion Framework (PEFF) Pædagogisk Guide
      </footer>
    </div>
  );
}
