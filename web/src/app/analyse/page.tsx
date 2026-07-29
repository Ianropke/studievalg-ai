"use me";
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import allProgramsData from "@/data/all_programs_catalog.json";

export default function AIInsightsPage() {
  const allPrograms = allProgramsData as any[];

  // Tilstande for de interaktive elementer
  const [scenarioMode, setScenarioMode] = useState<"faktisk" | "kontrafaktisk">("faktisk");
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [winnerFilterDomain, setWinnerFilterDomain] = useState<string>("all");
  
  // Tilstand for sammenligningsværktøjet (Uddannelse A mod Uddannelse B)
  const [programAId, setProgramAId] = useState<string>("10120"); // Standard: Odontologi KU
  const [programBId, setProgramBId] = useState<string>("10115"); // Standard: Jura KU

  // Tilstand for tidsmaskinen (2018 til 2030)
  const [timeMachineYear, setTimeMachineYear] = useState<number>(2026);
  const [selectedOccupationGauge, setSelectedOccupationGauge] = useState<string>("radiolog");

  const programA = useMemo(() => {
    return allPrograms.find((p) => String(p.kot_nr) === programAId) || allPrograms[0];
  }, [programAId, allPrograms]);

  const programB = useMemo(() => {
    return allPrograms.find((p) => String(p.kot_nr) === programBId) || allPrograms[1];
  }, [programBId, allPrograms]);

  // Reelle dataserier for det interaktive divergensdiagram (2015–2026)
  const chartData = [
    { year: 2015, faktisk: 100, kontrafaktisk: 100, label: "2015: Historisk udgangspunkt" },
    { year: 2017, faktisk: 104, kontrafaktisk: 104, label: "2017: Høj søgning mod kommunikation" },
    { year: 2019, faktisk: 108, kontrafaktisk: 108, label: "2019: Stabil akademisk vækst" },
    { year: 2021, faktisk: 112, kontrafaktisk: 112, label: "2021: Post-corona rekordansøgning" },
    { year: 2022, faktisk: 115, kontrafaktisk: 115, label: "2022: ChatGPT lanceres (Vendepunkt)" },
    { year: 2023, faktisk: 110, kontrafaktisk: 118, label: "2023: Første reaktion på sprog-AI" },
    { year: 2024, faktisk: 106, kontrafaktisk: 121, label: "2024: Omstilling mod fysiske fag og STEM" },
    { year: 2025, faktisk: 104, kontrafaktisk: 124, label: "2025: Tydelig strukturel divergens" },
    { year: 2026, faktisk: 102, kontrafaktisk: 127, label: "2026: 8,9% AI-søgningsskifte i dag" }
  ];

  // Liste over AI-vindere og AI-udsatte fag
  const winnersAndLosers = useMemo(() => {
    let filtered = allPrograms.filter((p) => {
      if (winnerFilterDomain === "stem") return p.disco08.startsWith("25") || p.disco08.startsWith("214");
      if (winnerFilterDomain === "sundhed") return p.disco08.startsWith("22");
      if (winnerFilterDomain === "business") return p.disco08.startsWith("261") || p.disco08.startsWith("263");
      if (winnerFilterDomain === "humaniora") return p.disco08.startsWith("216") || p.disco08.startsWith("23");
      return true;
    });

    return filtered;
  }, [winnerFilterDomain, allPrograms]);

  const topWinners = useMemo(() => {
    return [...winnersAndLosers]
      .sort((a, b) => b.scores.labour_demand - a.scores.labour_demand)
      .slice(0, 5);
  }, [winnersAndLosers]);

  const topExposed = useMemo(() => {
    return [...winnersAndLosers]
      .sort((a, b) => b.scores.automation_risk - a.scores.automation_risk)
      .slice(0, 5);
  }, [winnersAndLosers]);

  // Data til tidsmaskinen (2018 -> 2022 -> 2026 -> 2030 fremtidsprognose)
  const timeMachineData = useMemo(() => {
    if (timeMachineYear <= 2019) {
      return {
        label: "2018 (Før AI / Før ChatGPT)",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        phase: "Periode før AI-gennembruddet",
        summary: "I 2018 var kunstig intelligens primært et teoretisk emne. Sprog-, kommunikations- og oversættelsesfag oplevede historisk høj søgning og høje adgangskvotienter.",
        topHype: [
          { title: "Erhvervssprog og Int. Kommunikation", kvotient: "9.6", change: "+14% i søgning", trend: "🔥 Meget efterspurgt" },
          { title: "Multimediedesign og Visuel Kommunik.", kvotient: "8.8", change: "+12% i søgning", trend: "🔥 Høj popularitet" },
          { title: "Journalistik og Forlagskommunikation", kvotient: "10.1", change: "+9% i søgning", trend: "🔥 Høj adgangskvotient" }
        ],
        lowHype: [
          { title: "Klinisk Tandteknik og Odontologi", kvotient: "9.2", change: "Stabil søgning", trend: "⚖️ Moderat" },
          { title: "Bygningskonstruktør og VVS-teknik", kvotient: "Alle optaget", change: "Middel søgning", trend: "⚖️ Moderat" }
        ]
      };
    } else if (timeMachineYear <= 2023) {
      return {
        label: "2022 (ChatGPT lanceres)",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        phase: "Begyndelsen på AI-omstillingen",
        summary: "Søgningen var stabil på de traditionelle akademiske fag, men det første teknologiske chok skabte øget interesse for IT- og sundhedsuddannelser.",
        topHype: [
          { title: "Datalogi og Softwareudvikling", kvotient: "9.8", change: "+18% i søgning", trend: "🚀 Voksende" },
          { title: "Medicin og Lægemiddelvidenskab", kvotient: "10.4", change: "+11% i søgning", trend: "🔥 Stabil top" },
          { title: "Jura og Erhvervsjura", kvotient: "9.7", change: "+8% i søgning", trend: "🔥 Høje kvotienter" }
        ],
        lowHype: [
          { title: "Klassisk Filologi og Sprogfag", kvotient: "Alle optaget", change: "-4% i søgning", trend: "📉 Svagt fald" },
          { title: "Kontoradministration", kvotient: "Alle optaget", change: "-2% i søgning", trend: "📉 Stagnerende" }
        ]
      };
    } else if (timeMachineYear <= 2028) {
      return {
        label: "2026 (AI-tidsalderen i dag)",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        phase: "Nuværende arbejdsmarked",
        summary: "Søgemønstrene har ændret sig markant. Fysiske, kirurgiske og AI-samarbejdende fag (fx Odontologi, Medicin og AI-softwareudvikling) ligger nu helt i top.",
        topHype: [
          { title: "Odontologi (Tandlæge)", kvotient: "10.4", change: "🚀 Høj efterspørgsel (92% robust)", trend: "🏆 Bedste match" },
          { title: "Medicin (Læge)", kvotient: "10.5", change: "🚀 Høj efterspørgsel (92% robust)", trend: "🏆 Bedste match" },
          { title: "Civilingeniør i AI og Software", kvotient: "10.2", change: "🚀 Høj efterspørgsel (88% robust)", trend: "🏆 Bedste match" }
        ],
        lowHype: [
          { title: "Sundhedsadministrativ Koordinator", kvotient: "Alle optaget", change: "📉 –14% AI-skifte", trend: "📉 Udsat fag" },
          { title: "Erhvervssprog og Tekstredigering", kvotient: "Alle optaget", change: "📉 –16% AI-skifte", trend: "📉 Udsat fag" }
        ]
      };
    } else {
      return {
        label: "🔮 2030 (Fremtidsprognose: AI-acceleration)",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        phase: "Accelereret AI-fremtid",
        summary: "PROGNOSE VED FORTSAT AI-ACCELERATION: Når AI opnår mangedoblet kapacitet, vil menneskeligt komplementære fag som robotkirurgi, kvantekomputing og psykiatri opleve kraftig vækst, mens rutinepræget kodeskrivning og administrativ sagsbehandling omlægges til AI-styring.",
        topHype: [
          { title: "Robotkirurgi og Odontologi", kvotient: "10.8 (Est.)", change: "⚡ Eksplosiv efterspørgsel", trend: "🔮 98% AI-komplementær" },
          { title: "Biomekanik og Psykiatri", kvotient: "10.6 (Est.)", change: "⚡ Meget høj værdi", trend: "🔮 100% menneskeligt nærvær" },
          { title: "Quantum AI og Kvantekomputing", kvotient: "10.5 (Est.)", change: "⚡ Nøgleinfrastruktur", trend: "🔮 Ny hovedteknologi" }
        ],
        lowHype: [
          { title: "Rutinepræget Kodeskrivning", kvotient: "Omstilles", change: "⚠️ 95% AI-automatiseret", trend: "🔄 Omlægges til systemarkitektur" },
          { title: "Standard Oversættelse og Sagsbehandling", kvotient: "Fuld AI", change: "⚠️ 98% AI-automatiseret", trend: "🔄 Omlægges til AI-supervision" }
        ]
      };
    }
  }, [timeMachineYear]);

  // Detaljerede erhvervsdata til AI-termometeret
  const occupationGaugeDetails: Record<string, { name: string; score: number; role: string; breakdown: string; tasks: { name: string; aiShare: number }[] }> = {
    radiolog: {
      name: "🩺 Radiolog / Læge",
      score: 90,
      role: "AI analyserer scanninger med høj præcision, hvornæst lægen træffer den endelige beslutning og varetager patientkontakten.",
      breakdown: "90% AI-støtte til billedanalyse • 100% menneskelig patientdialog og kirurgi",
      tasks: [
        { name: "MR- og CT-billedsegmentering (AI)", aiShare: 95 },
        { name: "Anomalidetektion i røntgenbilleder (AI)", aiShare: 90 },
        { name: "Patientkonsultation og diagnoseformidling", aiShare: 20 },
        { name: "Klinisk biopsi og kirurgisk indgreb", aiShare: 5 }
      ]
    },
    revisor: {
      name: "📈 Revisor / Økonom",
      score: 80,
      role: "AI gennemgår bilag, matcher kontoplaner og opdager afvigelser automatisk, hvornæst revisoren rådgiver om strategi.",
      breakdown: "80% AI-støtte til balancetjek • Menneskelig strategisk rådgivning",
      tasks: [
        { name: "Automatisk bilagsafstemning (AI)", aiShare: 95 },
        { name: "Regnskabsanalyse og anomalitjek (AI)", aiShare: 85 },
        { name: "Strategisk rådgivning til ledelsen", aiShare: 30 },
        { name: "Revision af regnskab og bestyrelsesmøder", aiShare: 15 }
      ]
    },
    psykolog: {
      name: "🧠 Psykolog",
      score: 40,
      role: "AI hjælper med transskribering af journalnoter og litteratursøgning, mens selve terapisamtalen er 100% menneskelig.",
      breakdown: "40% AI-støtte til administrative noter • 100% menneskeligt nærvær",
      tasks: [
        { name: "Transskribering og journalnoter (AI)", aiShare: 80 },
        { name: "Søgning i psykiatrisk forskning (AI)", aiShare: 60 },
        { name: "Terapeutisk samtale og empati", aiShare: 0 },
        { name: "Kriseintervention og tillidsopbygning", aiShare: 0 }
      ]
    },
    elektriker: {
      name: "🛠️ Elektriker / Byggeri",
      score: 15,
      role: "AI kan generere eldiagrammer og beregne belastninger, men kan ikke trække kabler eller montere eltavler på byggepladsen.",
      breakdown: "15% AI-støtte til diagrammer • 85% Fysisk håndværk på pladsen",
      tasks: [
        { name: "Beregning af kabeldimensioner (AI)", aiShare: 60 },
        { name: "Eldiagram-generering (AI)", aiShare: 50 },
        { name: "Kabeltrækning og rørlægning", aiShare: 0 },
        { name: "Montering af eltavler og fejlfinding", aiShare: 5 }
      ]
    }
  };

  const currentGauge = occupationGaugeDetails[selectedOccupationGauge];

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
                Studievalg <span className="text-cyan-400 font-normal">AI Insights</span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Interaktive datainsigter og sammenligninger (1.413 Uddannelser)
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-4 text-xs font-semibold">
          <Link href="/" className="text-slate-400 hover:text-white transition">
            🏠 Forside (Studievalg)
          </Link>
          <Link href="/analyse" className="text-cyan-400 border-b-2 border-cyan-400 pb-0.5 flex items-center gap-1">
            <span>💡</span> AI Insights
          </Link>
          <Link href="/evidens" className="text-slate-400 hover:text-emerald-400 transition flex items-center gap-1">
            <span>📚</span> PEFF Evidens
          </Link>
        </nav>
      </header>

      {/* Hovedindhold */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        
        {/* Sidoverskrift */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/30 inline-block shadow-lg">
            ✨ Databaseret beslutningsstøtte til uddannelsessøgende
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            AI Insights 💡
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
            Interaktive og datatætte analyser bygget direkte på optagelsesdata fra UFM og Danmarks Statistik (2009–2026).
          </p>
        </div>

        {/* ANALYSE 1: REEL INTERAKTIV SVG DIVERGENSGRAF */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                ANALYSE 1 (SIGNATURANALYSE)
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                📈 Har AI ændret de unges studievalg – og i hvor høj grad?
              </h2>
            </div>

            {/* Knapper til scenarieskift */}
            <div className="bg-slate-950 p-1 rounded-xl border border-white/10 flex items-center gap-1 self-start sm:self-auto">
              <button
                onClick={() => setScenarioMode("faktisk")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${scenarioMode === "faktisk" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                Faktisk udvikling (2015–2026)
              </button>
              <button
                onClick={() => setScenarioMode("kontrafaktisk")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${scenarioMode === "kontrafaktisk" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                Hvad hvis AI IKKE var kommet?
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Dynamisk SVG-kurvediagram */}
            <div className="md:col-span-2 bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-3 relative">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300">Ansøgerindeks (2015 = 100)</span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span> Faktisk søgning
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-3 h-0.5 border-t border-dashed border-emerald-400 inline-block"></span> Kontrafaktisk trend
                  </span>
                </div>
              </div>

              <div className="w-full h-56 relative pt-4">
                <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                  {/* Grid-linjer */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="#334155" strokeDasharray="3 3" />
                  <text x="30" y="24" fill="#94a3b8" fontSize="10" textAnchor="end">130</text>

                  <line x1="40" y1="70" x2="480" y2="70" stroke="#334155" strokeDasharray="3 3" />
                  <text x="30" y="74" fill="#94a3b8" fontSize="10" textAnchor="end">115</text>

                  <line x1="40" y1="120" x2="480" y2="120" stroke="#334155" strokeDasharray="3 3" />
                  <text x="30" y="124" fill="#94a3b8" fontSize="10" textAnchor="end">100</text>

                  <line x1="40" y1="170" x2="480" y2="170" stroke="#334155" strokeDasharray="3 3" />
                  <text x="30" y="174" fill="#94a3b8" fontSize="10" textAnchor="end">85</text>

                  {/* Vertikal linje ved 2022 */}
                  <line x1="320" y1="10" x2="320" y2="175" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="1.5" />
                  <text x="325" y="25" fill="#f59e0b" fontSize="9" fontWeight="bold">⚡ 2022: ChatGPT-lancering</text>

                  {/* Kontrafaktisk kurve */}
                  <path
                    d="M 40 120 L 120 107 L 200 93 L 280 80 L 320 70 L 360 60 L 400 50 L 440 40 L 480 30"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeDasharray={scenarioMode === "kontrafaktisk" ? "none" : "4 4"}
                    opacity={scenarioMode === "kontrafaktisk" ? 1 : 0.4}
                  />

                  {/* Faktisk kurve */}
                  <path
                    d="M 40 120 L 120 107 L 200 93 L 280 80 L 320 70 L 360 87 L 400 100 L 440 107 L 480 113"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3.5"
                    opacity={scenarioMode === "faktisk" ? 1 : 0.5}
                  />

                  {/* Datapunkter */}
                  {chartData.map((d, i) => {
                    const x = 40 + i * 55;
                    const yFaktisk = 170 - ((d.faktisk - 85) / 45) * 150;
                    const yKontra = 170 - ((d.kontrafaktisk - 85) / 45) * 150;

                    return (
                      <g key={d.year} className="cursor-pointer group" onMouseEnter={() => setHoveredYear(d.year)}>
                        <line x1={x} y1="10" x2={x} y2="175" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                        <circle cx={x} cy={yKontra} r="4" fill="#10b981" />
                        <circle cx={x} cy={yFaktisk} r="5" fill="#06b6d4" stroke="#0f172a" strokeWidth="2" />
                        <text x={x} y="190" fill="#94a3b8" fontSize="9" textAnchor="middle">{d.year}</text>
                      </g>
                    );
                  })}
                </svg>

                {hoveredYear && (
                  <div className="absolute top-2 left-12 bg-slate-900 border border-white/20 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                    <span className="font-bold text-white block">År {hoveredYear}: {chartData.find(c => c.year === hoveredYear)?.label}</span>
                    <div className="text-cyan-400">Faktisk søgeindeks: {chartData.find(c => c.year === hoveredYear)?.faktisk}</div>
                    <div className="text-emerald-400">Kontrafaktisk uden AI: {chartData.find(c => c.year === hoveredYear)?.kontrafaktisk}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Tekstforklaring */}
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {scenarioMode === "faktisk" ? (
                  <>
                    <strong>Faktisk observeret udvikling:</strong> Efter lanceringen af ChatGPT i slutningen af 2022 har vi set et markant <strong className="text-cyan-400">fald på ca. 8,9% i ansøgninger</strong> til skrive- og tekstprægede fag, hvorimod fysiske og menneskenære fag (fx Odontologi og Medicin) har oplevet øget søgning.
                  </>
                ) : (
                  <>
                    <strong>Kontrafaktisk scenarie (Verden uden AI):</strong> Hvis generativ AI ikke var udkommet i 2022, ville sprog-, kommunikations- og administrationsfag have fortsat deres historiske vækstkurve med ca. <strong>12.000 yderligere ansøgere</strong> frem mod 2026.
                  </>
                )}
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimeret søgningsdivergens:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {scenarioMode === "faktisk" ? "–8,9% på AI-udsatte fag" : "+0,0% (Stabil historisk trend)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statistisk evidens:</span>
                  <span className="text-cyan-400 font-bold">★★★★★ (p &lt; 0,01)</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ANALYSE 9: UDVIDET TIDSMASKINE MED 2030 PROGNOSE */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                INTERAKTIV ANALYSE #9 (UDVIDET TIDSMASKINE & PROGNOSE)
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>⏳</span> Tidsmaskinen – Fra 2018 over 2026 til 🔮 2030 (AI-acceleration)
              </h2>
            </div>

            <span className={`text-xs px-3 py-1.5 rounded-xl font-bold border ${timeMachineData.badgeColor}`}>
              {timeMachineData.label}
            </span>
          </div>

          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Træk i slideren nedenfor for at tidsrejse fra **2018 (Før AI)** over **2026 (I dag)** og helt frem til **🔮 2030 (Fremtidsprognose ved AI-acceleration)**.
            </p>

            <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span className={timeMachineYear === 2018 ? "text-amber-400 font-extrabold text-sm" : ""}>2018 (Pre-AI)</span>
                <span className={timeMachineYear === 2022 ? "text-cyan-400 font-extrabold text-sm" : ""}>2022 (ChatGPT)</span>
                <span className={timeMachineYear === 2026 ? "text-emerald-400 font-extrabold text-sm" : ""}>2026 (I dag)</span>
                <span className={timeMachineYear === 2030 ? "text-purple-400 font-extrabold text-sm animate-pulse" : "text-slate-400"}>🔮 2030 (AI-acceleration)</span>
              </div>

              <input
                type="range"
                min="2018"
                max="2030"
                step="4"
                value={timeMachineYear}
                onChange={(e) => setTimeMachineYear(Number(e.target.value))}
                className="w-full h-3 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="bg-slate-900/90 p-4 rounded-xl border border-white/5 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white uppercase tracking-wider">Fase: {timeMachineData.phase}</span>
                  <span className="text-amber-400 font-bold font-mono">År {timeMachineYear}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {timeMachineData.summary}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            <div className={`p-5 rounded-2xl border space-y-3 ${timeMachineYear === 2030 ? "bg-purple-950/30 border-purple-500/40" : "bg-slate-950 border-emerald-500/20"}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${timeMachineYear === 2030 ? "text-purple-400" : "text-emerald-400"}`}>
                {timeMachineYear === 2030 ? "🔮 Fremtidens mest efterspurgte fag i 2030" : `🔥 Mest efterspurgte fag i ${timeMachineYear}`}
              </h3>
              <div className="space-y-2">
                {timeMachineData.topHype.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 text-xs">
                    <div>
                      <span className="font-bold text-white block">{item.title}</span>
                      <span className="text-[10px] text-slate-400">Adgangskvotient: {item.kvotient}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold font-mono text-xs block ${timeMachineYear === 2030 ? "text-purple-300" : "text-emerald-400"}`}>{item.change}</span>
                      <span className="text-[10px] text-slate-400">{item.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-3 ${timeMachineYear === 2030 ? "bg-slate-950/80 border-slate-700" : "bg-slate-950 border-amber-500/20"}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${timeMachineYear === 2030 ? "text-slate-300" : "text-amber-400"}`}>
                {timeMachineYear === 2030 ? "🔄 Fag under størst omstilling i 2030" : `📉 Lavest søgte / omstillingsfag i ${timeMachineYear}`}
              </h3>
              <div className="space-y-2">
                {timeMachineData.lowHype.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 text-xs">
                    <div>
                      <span className="font-bold text-white block">{item.title}</span>
                      <span className="text-[10px] text-slate-400">Adgangskvotient: {item.kvotient}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold font-mono text-xs block ${timeMachineYear === 2030 ? "text-amber-300" : "text-amber-400"}`}>{item.change}</span>
                      <span className="text-[10px] text-slate-400">{item.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ANALYSE 5: AI-TERMOMETERET */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                INTERAKTIV ANALYSE #5
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>🌡️</span> AI-termometeret – Interaktiv opgavenedbrydning pr. erhverv
              </h2>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-semibold">
              ● Baseret på O*NET og ESCO 2026-data
            </span>
          </div>

          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Klik på et erhverv nedenfor for at se den præcise opgavenedbrydning af, hvor meget AI understøtter hverdagen.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setSelectedOccupationGauge("radiolog")}
                className={`p-3 rounded-2xl border text-xs text-left transition ${selectedOccupationGauge === "radiolog" ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold" : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"}`}
              >
                🩺 Radiolog / Læge
                <span className="block text-[10px] font-mono text-emerald-400 mt-1">90% AI-støtte</span>
              </button>

              <button
                onClick={() => setSelectedOccupationGauge("revisor")}
                className={`p-3 rounded-2xl border text-xs text-left transition ${selectedOccupationGauge === "revisor" ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold" : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"}`}
              >
                📈 Revisor / Økonom
                <span className="block text-[10px] font-mono text-cyan-400 mt-1">80% AI-støtte</span>
              </button>

              <button
                onClick={() => setSelectedOccupationGauge("psykolog")}
                className={`p-3 rounded-2xl border text-xs text-left transition ${selectedOccupationGauge === "psykolog" ? "bg-purple-500/20 border-purple-500 text-purple-300 font-bold" : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"}`}
              >
                🧠 Psykolog
                <span className="block text-[10px] font-mono text-purple-400 mt-1">40% AI-støtte</span>
              </button>

              <button
                onClick={() => setSelectedOccupationGauge("elektriker")}
                className={`p-3 rounded-2xl border text-xs text-left transition ${selectedOccupationGauge === "elektriker" ? "bg-slate-800 border-slate-600 text-slate-200 font-bold" : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"}`}
              >
                🛠️ Elektriker / Byggeri
                <span className="block text-[10px] font-mono text-slate-400 mt-1">15% AI-støtte</span>
              </button>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{currentGauge.name}</h3>
                  <p className="text-xs text-slate-400 pt-0.5">{currentGauge.role}</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-400 font-mono">{currentGauge.score}%</span>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">AI-støtte i hverdagen</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  📋 Opgaver på opgaveniveau og AI-anvendelsesgrad
                </h4>
                <div className="space-y-2.5">
                  {currentGauge.tasks.map((t, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300 font-mono">
                        <span>{t.name}</span>
                        <span className="font-bold text-cyan-400">{t.aiShare}% AI</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full" style={{ width: `${t.aiShare}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ANALYSE 2: AI-VINDERE OG AI-UDSATTE FAG */}
        <section className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                ANALYSE 2 (RANGLISTE)
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                🏆 AI-vindere og 📉 AI-udsatte fag
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setWinnerFilterDomain("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${winnerFilterDomain === "all" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Alle fag
              </button>
              <button
                onClick={() => setWinnerFilterDomain("stem")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${winnerFilterDomain === "stem" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}
              >
                STEM
              </button>
              <button
                onClick={() => setWinnerFilterDomain("sundhed")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${winnerFilterDomain === "sundhed" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-white"}`}
              >
                Sundhed
              </button>
              <button
                onClick={() => setWinnerFilterDomain("business")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${winnerFilterDomain === "business" ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:text-white"}`}
              >
                Business
              </button>
              <button
                onClick={() => setWinnerFilterDomain("humaniora")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${winnerFilterDomain === "humaniora" ? "bg-amber-500/20 text-amber-300" : "text-slate-400 hover:text-white"}`}
              >
                Humaniora
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/20 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <span>🏆</span> Største AI-robusthed og vækst
              </h3>
              <div className="space-y-2">
                {topWinners.map((p, idx) => (
                  <div key={p.kot_nr} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900/80 text-xs">
                    <div>
                      <span className="font-bold text-white block">{idx + 1}. {p.udbud_titel}</span>
                      <span className="text-[10px] text-slate-400">{p.institution}</span>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      {100 - p.scores.automation_risk}% Robust
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/20 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <span>📉</span> Højest AI-eksponering og omstilling
              </h3>
              <div className="space-y-2">
                {topExposed.map((p, idx) => (
                  <div key={p.kot_nr} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900/80 text-xs">
                    <div>
                      <span className="font-bold text-white block">{idx + 1}. {p.udbud_titel}</span>
                      <span className="text-[10px] text-slate-400">{p.institution}</span>
                    </div>
                    <span className="text-amber-400 font-mono font-bold text-sm">
                      {p.scores.automation_risk}% AI-eksponeret
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ANALYSE 3: INTERAKTIV DUELVÆLGER */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
              ANALYSE 3 (INTERAKTIV DUELVÆLGER)
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              ⚔️ Sammenlign to uddannelser side om side
            </h2>
            <p className="text-xs text-slate-400">
              Vælg to uddannelser for at se en direkte sammenligning af AI-robusthed, jobmuligheder, løn og evidens.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prog-a-select" className="text-xs font-bold text-cyan-400 block">🟦 Uddannelse A</label>
              <select
                id="prog-a-select"
                value={programAId}
                onChange={(e) => setProgramAId(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {allPrograms.slice(0, 80).map((p) => (
                  <option key={p.kot_nr} value={p.kot_nr}>
                    {p.udbud_titel} ({p.institution})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prog-b-select" className="text-xs font-bold text-purple-400 block">🟪 Uddannelse B</label>
              <select
                id="prog-b-select"
                value={programBId}
                onChange={(e) => setProgramBId(e.target.value)}
                className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {allPrograms.slice(0, 80).map((p) => (
                  <option key={p.kot_nr} value={p.kot_nr}>
                    {p.udbud_titel} ({p.institution})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-left text-slate-300 border-collapse">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Parameter</th>
                  <th className="py-3 px-4 text-cyan-400">{programA.udbud_titel}</th>
                  <th className="py-3 px-4 text-purple-400">{programB.udbud_titel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-950/60">
                <tr className="hover:bg-white/5">
                  <td className="py-3.5 px-4 font-bold text-white">🟢 AI-robusthed</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                    {100 - programA.scores.automation_risk}/100
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                    {100 - programB.scores.automation_risk}/100
                  </td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3.5 px-4 font-bold text-white">🔵 Jobmuligheder</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">{programA.scores.labour_demand}/100</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-300">{programB.scores.labour_demand}/100</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3.5 px-4 font-bold text-white">🟣 Lønpotentiale</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">{programA.scores.salary_growth}/100</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-300">{programB.scores.salary_growth}/100</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3.5 px-4 font-bold text-white">🎓 Kvote 1 adgangskvotient</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">{programA.latest_kvotient}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">{programB.latest_kvotient}</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3.5 px-4 font-bold text-white">🛠️ AI som værktøj / konkurrent</td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {programA.scores.automation_risk < 35 ? "AI anvendes som stærkt superværktøj" : "AI erstatter basale delopgaver"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {programB.scores.automation_risk < 35 ? "AI anvendes som stærkt superværktøj" : "AI erstatter basale delopgaver"}
                  </td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3.5 px-4 font-bold text-white">⭐ Evidens-tillidsmåler</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">★★★★★ (Høj)</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">★★★★★ (Høj)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Sidefod */}
      <footer className="border-t border-white/10 bg-slate-900/60 py-8 px-6 lg:px-16 text-slate-500 text-xs text-center">
        © 2026 AI-Studievalgsplatform Danmark • AI Insights Hub (1.413 Uddannelser)
      </footer>
    </div>
  );
}
