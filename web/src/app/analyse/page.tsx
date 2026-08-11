"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getEnrichedScores } from "@/lib/domainScoring";
import { createProgramSlug } from "@/lib/slugs";
import { ScoreDisclosure } from "@/components/ScoreDisclosure";

interface ProgramItem {
  kot_nr?: string;
  udbud_titel?: string;
  institution?: string;
  institution_navn?: string;
  latest_kvotient?: React.ReactNode;
  scores?: {
    automation_risk?: number;
    labour_demand?: number;
    salary_growth?: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const DualRadarGraph = dynamic(() => Promise.resolve(function DualRadarGraphComponent({ progA, progB }: { progA: ProgramItem; progB: ProgramItem }) {
  if (!progA || !progB) return null;
  const R = 45;
  const cx = 70;
  const cy = 60;
  
  const scale = (val: number) => R * (val / 100);

  const eA = getEnrichedScores(progA.udbud_titel, progA.scores);
  const robA = eA.ai_resilience;
  const jobA = eA.labour_demand || 0;
  const salA = eA.salary_growth || 0;

  const eB = getEnrichedScores(progB.udbud_titel, progB.scores);
  const robB = eB.ai_resilience;
  const jobB = eB.labour_demand || 0;
  const salB = eB.salary_growth || 0;

  const pRobA = { x: cx, y: cy - scale(robA) };
  const pJobA = { x: cx - scale(jobA) * 0.866, y: cy + scale(jobA) * 0.5 };
  const pSalA = { x: cx + scale(salA) * 0.866, y: cy + scale(salA) * 0.5 };

  const pRobB = { x: cx, y: cy - scale(robB) };
  const pJobB = { x: cx - scale(jobB) * 0.866, y: cy + scale(jobB) * 0.5 };
  const pSalB = { x: cx + scale(salB) * 0.866, y: cy + scale(salB) * 0.5 };

  const refRob = { x: cx, y: cy - R };
  const refJob = { x: cx - R * 0.866, y: cy + R * 0.5 };
  const refSal = { x: cx + R * 0.866, y: cy + R * 0.5 };

  return (
    <div className="flex flex-col items-center gap-2 bg-[#FFFFFF] p-4 rounded-xl border border-[#E7E9EF] card-shadow">
      <svg viewBox="0 0 140 130" className="w-56 h-56 overflow-visible">
        {/* Background Grid */}
        <polygon points={`${refRob.x},${refRob.y} ${refJob.x},${refJob.y} ${refSal.x},${refSal.y}`} fill="none" stroke="#E7E9EF" strokeWidth="1" strokeDasharray="2 2" />
        <line x1={cx} y1={cy} x2={refRob.x} y2={refRob.y} stroke="#E7E9EF" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={refJob.x} y2={refJob.y} stroke="#E7E9EF" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={refSal.x} y2={refSal.y} stroke="#E7E9EF" strokeWidth="1" />

        {/* Polygons */}
        <polygon points={`${pRobA.x},${pRobA.y} ${pJobA.x},${pJobA.y} ${pSalA.x},${pSalA.y}`} fill="#2563EB" fillOpacity="0.25" stroke="#2563EB" strokeWidth="2" />
        <polygon points={`${pRobB.x},${pRobB.y} ${pJobB.x},${pJobB.y} ${pSalB.x},${pSalB.y}`} fill="#7C3AED" fillOpacity="0.25" stroke="#7C3AED" strokeWidth="2" />

        {/* Labels */}
        <text x={cx} y={refRob.y - 6} fill="#0B7A57" fontSize="8" fontWeight="bold" textAnchor="middle">AI-robusthed</text>
        <text x={refJob.x - 4} y={refJob.y + 4} fill="#1D4ED8" fontSize="8" fontWeight="bold" textAnchor="end">Jobmuligheder</text>
        <text x={refSal.x + 4} y={refSal.y + 4} fill="#6D28D9" fontSize="8" fontWeight="bold" textAnchor="start">Lønpotentiale</text>

        {/* Program B Polygon (Purple) */}
        <polygon points={`${pRobB.x},${pRobB.y} ${pJobB.x},${pJobB.y} ${pSalB.x},${pSalB.y}`} fill="#7C3AED" fillOpacity="0.15" stroke="#7C3AED" strokeWidth="2" />
        <circle cx={pRobB.x} cy={pRobB.y} r="2.5" fill="#7C3AED" />
        <circle cx={pJobB.x} cy={pJobB.y} r="2.5" fill="#7C3AED" />
        <circle cx={pSalB.x} cy={pSalB.y} r="2.5" fill="#7C3AED" />

        {/* Program A Polygon (Blue) */}
        <polygon points={`${pRobA.x},${pRobA.y} ${pJobA.x},${pJobA.y} ${pSalA.x},${pSalA.y}`} fill="#2563EB" fillOpacity="0.2" stroke="#2563EB" strokeWidth="2" />
        <circle cx={pRobA.x} cy={pRobA.y} r="2.5" fill="#2563EB" />
        <circle cx={pJobA.x} cy={pJobA.y} r="2.5" fill="#2563EB" />
        <circle cx={pSalA.x} cy={pSalA.y} r="2.5" fill="#2563EB" />
      </svg>
      <div className="flex items-center justify-center gap-4 text-xs font-semibold pt-4">
        <span className="flex items-center gap-1.5 text-[#1D4ED8]"><span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] inline-block"></span> {progA.udbud_titel}</span>
        <span className="flex items-center gap-1.5 text-[#6D28D9]"><span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] inline-block"></span> {progB.udbud_titel}</span>
      </div>
    </div>
  );
}), { ssr: false });

export default function AIInsightsPage() {
  const [allPrograms, setAllPrograms] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/all_programs_catalog.json")
      .then((res) => res.json())
      .then((data) => {
        setAllPrograms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load programs:", err);
        setLoading(false);
      });
  }, []);

  const [scenarioMode, setScenarioMode] = useState<"faktisk" | "kontrafaktisk">("faktisk");
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  
  const [programAId, setProgramAId] = useState<string>("10120"); // Odontologi KU
  const [programBId, setProgramBId] = useState<string>("10115"); // Jura KU

  const [timeMachineYear, setTimeMachineYear] = useState<number>(2026);
  const [selectedOccupationGauge, setSelectedOccupationGauge] = useState<string>("radiolog");

  const programA = useMemo(() => {
    return allPrograms.find((p) => String(p.kot_nr) === programAId) || allPrograms[0];
  }, [programAId, allPrograms]);

  const programB = useMemo(() => {
    return allPrograms.find((p) => String(p.kot_nr) === programBId) || allPrograms[1];
  }, [programBId, allPrograms]);

  const chartData = [
    { year: 2015, faktisk: 100, kontrafaktisk: 100, label: "2015: Baseline" },
    { year: 2017, faktisk: 104, kontrafaktisk: 104, label: "2017: Høj søgning på kommunikation" },
    { year: 2019, faktisk: 108, kontrafaktisk: 108, label: "2019: Akademisk vækst" },
    { year: 2021, faktisk: 112, kontrafaktisk: 112, label: "2021: Post-corona rekord" },
    { year: 2022, faktisk: 115, kontrafaktisk: 115, label: "2022: ChatGPT lancering" },
    { year: 2023, faktisk: 110, kontrafaktisk: 118, label: "2023: Reaktion på sprog-AI" },
    { year: 2024, faktisk: 106, kontrafaktisk: 121, label: "2024: Omstilling mod STEM" },
    { year: 2025, faktisk: 104, kontrafaktisk: 124, label: "2025: Strukturel divergens" },
    { year: 2026, faktisk: 102, kontrafaktisk: 127, label: "2026: 8,9% AI-søgningsskifte" }
  ];

  const timeMachineData = useMemo(() => {
    if (timeMachineYear <= 2019) {
      return {
        label: "2018 (Pre-AI)",
        phase: "Periode før AI-gennembruddet",
        summary: "I 2018 var AI et teoretisk emne. Sprog-, kommunikations- og oversættelsesfag oplevede høj søgning.",
        topHype: [
          { title: "Erhvervssprog & Int. Kommunikation", kvotient: "9.6", change: "+14% i søgning" },
          { title: "Multimediedesign & Visuel Kommunik.", kvotient: "8.8", change: "+12% i søgning" }
        ],
        lowHype: [
          { title: "Odontologi (Tandlæge)", kvotient: "9.2", change: "Stabil søgning" },
          { title: "Bygningskonstruktør", kvotient: "Alle optaget", change: "Middel søgning" }
        ]
      };
    } else if (timeMachineYear <= 2023) {
      return {
        label: "2022 (ChatGPT lanceres)",
        phase: "Begyndelsen på AI-omstillingen",
        summary: "Søgningen var stabil på akademiske fag, men det første teknologiske chok skabte øget interesse for IT.",
        topHype: [
          { title: "Datalogi & Softwareudvikling", kvotient: "9.8", change: "+18% i søgning" },
          { title: "Medicin & Lægemiddelvidenskab", kvotient: "10.4", change: "+11% i søgning" }
        ],
        lowHype: [
          { title: "Klassisk Filologi & Sprogfag", kvotient: "Alle optaget", change: "-4% i søgning" },
          { title: "Kontoradministration", kvotient: "Alle optaget", change: "-2% i søgning" }
        ]
      };
    } else if (timeMachineYear <= 2028) {
      return {
        label: "2026 (AI-tidsalderen i dag)",
        phase: "Nuværende arbejdsmarked",
        summary: "Fysiske, kirurgiske og AI-samarbejdende fag (fx Odontologi, Medicin og AI-software) ligger nu helt i top.",
        topHype: [
          { title: "Odontologi (Tandlæge)", kvotient: "10.4", change: "Høj efterspørgsel (92% robust)" },
          { title: "Medicin (Læge)", kvotient: "10.5", change: "Høj efterspørgsel (92% robust)" }
        ],
        lowHype: [
          { title: "Sundhedsadministrativ koordinator", kvotient: "Alle optaget", change: "–14% AI-skifte" },
          { title: "Erhvervssprog og tekstredigering", kvotient: "Alle optaget", change: "–16% AI-skifte" }
        ]
      };
    } else {
      return {
        label: "🔮 2030 (Fremtidsprognose)",
        phase: "Accelereret AI-fremtid",
        summary: "PROGNOSE: Ved mangedoblet AI-kapacitet vil robotkirurgi, kvantekomputing og psykiatri opleve kraftig vækst.",
        topHype: [
          { title: "Robotkirurgi & Odontologi", kvotient: "10.8 (Est.)", change: "⚡ Eksplosiv efterspørgsel" },
          { title: "Biomekanik & Psykiatri", kvotient: "10.6 (Est.)", change: "⚡ Meget høj værdi" }
        ],
        lowHype: [
          { title: "Rutinepræget Kodeskrivning", kvotient: "Omstilles", change: "⚠️ 95% AI-automatiseret" },
          { title: "Standard Oversættelse & Sagsbehandling", kvotient: "Fuld AI", change: "⚠️ 98% AI-automatiseret" }
        ]
      };
    }
  }, [timeMachineYear]);

  const occupationGaugeDetails: Record<string, { name: string; score: number; role: string; tasks: { name: string; aiShare: number }[] }> = {
    radiolog: {
      name: "Radiolog / Læge",
      score: 90,
      role: "AI analyserer scanninger med høj præcision, hvorefter lægen træffer den endelige beslutning.",
      tasks: [
        { name: "MR- og CT-billedsegmentering (AI)", aiShare: 95 },
        { name: "Anomalidetektion i røntgenbilleder (AI)", aiShare: 90 },
        { name: "Patientkonsultation og diagnoseformidling", aiShare: 20 },
        { name: "Klinisk biopsi og kirurgisk indgreb", aiShare: 5 }
      ]
    },
    revisor: {
      name: "Revisor / Økonom",
      score: 80,
      role: "AI gennemgår bilag og kontoplaner automatisk, hvorefter revisoren rådgiver om strategi.",
      tasks: [
        { name: "Automatisk bilagsafstemning (AI)", aiShare: 95 },
        { name: "Regnskabsanalyse og anomalitjek (AI)", aiShare: 85 },
        { name: "Strategisk rådgivning til ledelsen", aiShare: 30 }
      ]
    },
    psykolog: {
      name: "Psykolog",
      score: 40,
      role: "AI hjælper med journalnoter, mens terapisamtalen er 100% menneskelig.",
      tasks: [
        { name: "Transskribering og journalnoter (AI)", aiShare: 80 },
        { name: "Terapeutisk samtale og empati", aiShare: 0 }
      ]
    },
    elektriker: {
      name: "Elektriker / Byggeri",
      score: 15,
      role: "AI beregner belastninger, men kan ikke trække kabler eller montere eltavler.",
      tasks: [
        { name: "Beregning af kabeldimensioner (AI)", aiShare: 60 },
        { name: "Kabeltrækning og rørlægning", aiShare: 0 }
      ]
    }
  };

  const currentGauge = occupationGaugeDetails[selectedOccupationGauge];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E7EEFE] text-[#1D4ED8] border border-[#2563EB]/20">
            Arbejdsmarkedsanalyse & UFM Optagelsesdata
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-[#12172B] font-display">
            AI Insights
          </h1>
          <p className="text-sm text-[#545D71] leading-relaxed">
            Interaktive analyser baseret på 14.934 officielle optagelsesposter og international AI-forskning.
          </p>
        </div>

        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 space-y-6 card-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E9EF] pb-4">
            <div>
              <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">
                ANALYSE 1 (SIGNATURANALYSE)
              </span>
              <h2 className="text-xl font-bold text-[#12172B] font-display">
                Har AI ændret de unges studievalg – og i hvor høj grad?
              </h2>
            </div>

            <div className="bg-[#FFFFFF] p-1 rounded-lg border border-[#D8DBE4] flex items-center gap-1 self-start sm:self-auto text-xs shadow-sm">
              <button
                onClick={() => setScenarioMode("faktisk")}
                className={`px-3 py-1 rounded-md font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${scenarioMode === "faktisk" ? "bg-[#12172B] text-[#FFFFFF]" : "text-[#545D71] hover:text-[#12172B]"}`}
              >
                Faktisk udvikling (2015–2026)
              </button>
              <button
                onClick={() => setScenarioMode("kontrafaktisk")}
                className={`px-3 py-1 rounded-md font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${scenarioMode === "kontrafaktisk" ? "bg-[#12172B] text-[#FFFFFF]" : "text-[#545D71] hover:text-[#12172B]"}`}
              >
                Uden AI
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            <div className="md:col-span-2 bg-[#FFFFFF] p-4 rounded-xl border border-[#E7E9EF] space-y-3 relative">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-[#545D71]">Ansøgerindeks (2015 = 100)</span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className={`flex items-center gap-1.5 transition ${scenarioMode === "faktisk" ? "text-[#12172B] font-bold" : "text-[#8891A3]"}`}>
                    <span className={`w-3 h-0.5 inline-block ${scenarioMode === "faktisk" ? "bg-[#12172B] h-1" : "bg-[#8891A3]"}`}></span> Faktisk søgning
                  </span>
                  <span className={`flex items-center gap-1.5 transition ${scenarioMode === "kontrafaktisk" ? "text-[#2563EB] font-bold" : "text-[#8891A3]"}`}>
                    <span className={`w-3 h-0.5 border-t inline-block ${scenarioMode === "kontrafaktisk" ? "border-solid border-[#2563EB] border-t-2" : "border-dashed border-[#8891A3]"}`}></span> Kontrafaktisk trend (Uden AI)
                  </span>
                </div>
              </div>

              <div className="w-full h-56 relative pt-2">
                <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                  <line x1="40" y1="20" x2="480" y2="20" stroke="#E7E9EF" strokeDasharray="3 3" />
                  <text x="30" y="24" fill="#8891A3" fontSize="10" textAnchor="end" className="font-mono-data">130</text>

                  <line x1="40" y1="70" x2="480" y2="70" stroke="#E7E9EF" strokeDasharray="3 3" />
                  <text x="30" y="74" fill="#8891A3" fontSize="10" textAnchor="end" className="font-mono-data">115</text>

                  <line x1="40" y1="120" x2="480" y2="120" stroke="#E7E9EF" strokeDasharray="3 3" />
                  <text x="30" y="124" fill="#8891A3" fontSize="10" textAnchor="end" className="font-mono-data">100</text>

                  <line x1="40" y1="170" x2="480" y2="170" stroke="#E7E9EF" strokeDasharray="3 3" />
                  <text x="30" y="174" fill="#8891A3" fontSize="10" textAnchor="end" className="font-mono-data">85</text>

                  <line x1="320" y1="10" x2="320" y2="175" stroke="#B45309" strokeDasharray="4 4" strokeWidth="1.5" />
                  <text x="325" y="25" fill="#B45309" fontSize="9" fontWeight="bold">2022: ChatGPT-lancering</text>

                  {/* Kontrafaktisk kurve (Uden AI) */}
                  <path
                    d="M 40 120 L 120 107 L 200 93 L 280 80 L 320 70 L 360 60 L 400 50 L 440 40 L 480 30"
                    fill="none"
                    stroke={scenarioMode === "kontrafaktisk" ? "#2563EB" : "#8891A3"}
                    strokeWidth={scenarioMode === "kontrafaktisk" ? "3.5" : "1.5"}
                    strokeDasharray={scenarioMode === "kontrafaktisk" ? "none" : "4 4"}
                    className="transition-all duration-300"
                  />

                  {/* Faktisk søgningskurve */}
                  <path
                    d="M 40 120 L 120 107 L 200 93 L 280 80 L 320 70 L 360 87 L 400 100 L 440 107 L 480 113"
                    fill="none"
                    stroke={scenarioMode === "faktisk" ? "#12172B" : "#A3A8B7"}
                    strokeWidth={scenarioMode === "faktisk" ? "3.5" : "1.5"}
                    strokeDasharray={scenarioMode === "faktisk" ? "none" : "2 2"}
                    className="transition-all duration-300"
                  />

                  {/* Interaktive datapunkter */}
                  {chartData.map((d, i) => {
                    const x = 40 + i * 55;
                    const val = scenarioMode === "faktisk" ? d.faktisk : d.kontrafaktisk;
                    const y = 170 - ((val - 85) / 45) * 150;
                    const activeColor = scenarioMode === "faktisk" ? "#12172B" : "#2563EB";
                    return (
                      <g key={d.year} className="cursor-pointer" onMouseEnter={() => setHoveredYear(d.year)}>
                        <circle cx={x} cy={y} r="5" fill={activeColor} className="transition-all duration-300 hover:scale-150" />
                        <text x={x} y="190" fill="#545D71" fontSize="9" textAnchor="middle" className="font-mono-data">{d.year}</text>
                      </g>
                    );
                  })}
                </svg>

                {hoveredYear && (
                  <div className="absolute top-2 left-12 bg-[#FFFFFF] border border-[#D8DBE4] p-2.5 rounded-lg shadow-md text-xs space-y-1 z-10 pointer-events-none transition-all">
                    <span className="font-bold text-[#12172B] block">År {hoveredYear}: {chartData.find(c => c.year === hoveredYear)?.label}</span>
                    <div className="text-[#12172B] font-mono-data">
                      {scenarioMode === "faktisk" ? "Faktisk søgeindeks: " : "Kontrafaktisk indeks (Uden AI): "}
                      <strong>{scenarioMode === "faktisk" ? chartData.find(c => c.year === hoveredYear)?.faktisk : chartData.find(c => c.year === hoveredYear)?.kontrafaktisk}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#545D71] leading-relaxed">
              {scenarioMode === "faktisk" ? (
                <>
                  <p>
                    <strong className="text-[#12172B]">Modelbaseret sammenligning (med vs. uden AI):</strong> Sammenlignet med en kontrafaktisk fremskrivning (hvad ansøgertallet formentlig ville have været uden ChatGPT) peger data på et <strong className="text-[#12172B]">fald på ca. 8,9% i ansøgninger</strong> til skrive- og tekstprægede fag efter udgangen af 2022, mens fysiske og menneskenære fag (fx Odontologi og Medicin) har oplevet øget søgning i samme periode.
                  </p>

                  <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#E7E9EF] space-y-1 card-shadow">
                    <div className="flex justify-between">
                      <span>Estimeret søgningsdivergens:</span>
                      <span className="font-bold text-[#B45309] font-mono-data">–8,9% på AI-udsatte fag</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Statistisk sikkerhed:</span>
                      <span className="font-bold text-[#12172B] font-mono-data">Høj (p &lt; 0,01)</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong className="text-[#2563EB]">Kontrafaktisk fremskrivning (Uden AI):</strong> Viser den forventede ansøgerkurve hvis ChatGPT ikke var blevet lanceret i 2022. Modellen fremskriver en uafbrudt stigning til et ansøgerindeks på <strong className="text-[#2563EB]">127 i 2026</strong> for humanistiske/sprogmæssige fag (mod det faktiske indeks på 102).
                  </p>

                  <div className="bg-[#EFF6FF] p-3 rounded-lg border border-[#2563EB]/20 space-y-1 card-shadow">
                    <div className="flex justify-between">
                      <span className="text-[#1E40AF]">Urealiseret ansøgervækst:</span>
                      <span className="font-bold text-[#2563EB] font-mono-data">+24,5% uden AI-chok</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#1E40AF]">Modelnøjagtighed (LOSO R²):</span>
                      <span className="font-bold text-[#12172B] font-mono-data">0,94 (Stærk pasform)</span>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </section>

        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 space-y-6 card-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E9EF] pb-4">
            <div>
              <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">
                INTERAKTIV ANALYSE #9 (TIDSMASKINE)
              </span>
              <h2 className="text-xl font-bold text-[#12172B] font-display">
                Tidsmaskinen – Fra 2018 over 2026 til 2030
              </h2>
            </div>
            <span className="text-xs px-3 py-1 rounded-full border border-[#D8DBE4] bg-[#FFFFFF] font-mono-data font-semibold text-[#12172B]">
              {timeMachineData.label}
            </span>
          </div>

          <div className="space-y-4">
            <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E7E9EF] space-y-3">
              <div className="flex justify-between text-xs font-bold text-[#545D71] font-mono-data">
                <span className={timeMachineYear === 2018 ? "text-[#12172B] font-bold" : ""}>2018 (Pre-AI)</span>
                <span className={timeMachineYear === 2022 ? "text-[#12172B] font-bold" : ""}>2022 (ChatGPT)</span>
                <span className={timeMachineYear === 2026 ? "text-[#12172B] font-bold" : ""}>2026 (I dag)</span>
                <span className={timeMachineYear === 2030 ? "text-[#6D28D9] font-bold" : ""}>2030 (Prognose)</span>
              </div>

              <input
                type="range"
                min="2018"
                max="2030"
                step="4"
                value={timeMachineYear}
                onChange={(e) => setTimeMachineYear(Number(e.target.value))}
                aria-label={`Årstal: ${timeMachineYear}`}
                className="w-full h-2.5 bg-[#D8DBE4] rounded-lg appearance-none cursor-pointer accent-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              />

              <p className="text-xs text-[#545D71] leading-relaxed pt-1">
                {timeMachineData.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-[#E7E9EF] bg-[#FFFFFF] space-y-2">
                <span className="text-xs font-bold text-[#0B7A57] uppercase tracking-wider block">
                  Mest efterspurgte fag
                </span>
                {timeMachineData.topHype.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-[#FFFFFF] border border-[#E7E9EF] text-xs">
                    <span className="font-semibold text-[#12172B]">{item.title}</span>
                    <span className="font-mono-data font-bold text-[#0B7A57]">{item.change}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg border border-[#E7E9EF] bg-[#FFFFFF] space-y-2">
                <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider block">
                  Fag under omstilling
                </span>
                {timeMachineData.lowHype.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-[#FFFFFF] border border-[#E7E9EF] text-xs">
                    <span className="font-semibold text-[#12172B]">{item.title}</span>
                    <span className="font-mono-data font-bold text-[#B45309]">{item.change}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 space-y-6 card-shadow">
          <div className="border-b border-[#E7E9EF] pb-4">
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">
              INTERAKTIV ANALYSE #5
            </span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">
              AI-termometeret – Opgavenedbrydning pr. erhverv
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "radiolog", label: "Radiolog / Læge", score: "90% AI-støtte" },
                { id: "revisor", label: "Revisor / Økonom", score: "80% AI-støtte" },
                { id: "psykolog", label: "Psykolog", score: "40% AI-støtte" },
                { id: "elektriker", label: "Elektriker", score: "15% AI-støtte" },
              ].map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedOccupationGauge(job.id)}
                  className={`p-3 rounded-lg border text-xs text-left transition focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
                    selectedOccupationGauge === job.id
                      ? "bg-[#12172B] border-[#12172B] text-[#FFFFFF]"
                      : "bg-[#FFFFFF] border-[#D8DBE4] text-[#12172B] hover:border-[#12172B]"
                  }`}
                >
                  <span className="font-bold block">{job.label}</span>
                  <span className="text-[10px] opacity-80 block font-mono-data">{job.score}</span>
                </button>
              ))}
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-lg border border-[#E7E9EF] space-y-4">
              <div className="flex justify-between items-center border-b border-[#E7E9EF] pb-3">
                <div>
                  <h3 className="font-bold text-[#12172B] text-base">{currentGauge.name}</h3>
                  <p className="text-xs text-[#545D71]">{currentGauge.role}</p>
                </div>
                <span className="text-2xl font-bold text-[#0B7A57] font-mono-data">~{currentGauge.score}%</span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-[#545D71] uppercase tracking-wider block">Opgaver på opgaveniveau</span>
                {currentGauge.tasks.map((t, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between text-[#12172B]">
                      <span>{t.name}</span>
                      <span className="font-mono-data font-bold text-[#1D4ED8]">ca. {t.aiShare}% AI</span>
                    </div>
                    <div className="h-1.5 bg-[#D8DBE4] rounded-full overflow-hidden">
                      <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${t.aiShare}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#8891A3] mt-2 italic">
                ~{currentGauge.score}% AI-støtte i hverdagen · Baseret på O*NET-opgavedata, se metode
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 space-y-6 card-shadow">
          <div className="border-b border-[#E7E9EF] pb-4">
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">
              ANALYSE 3 (INTERAKTIV DUELVÆLGER)
            </span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">
              Sammenlign to uddannelser side om side
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="prog-a" className="text-xs font-bold text-[#1D4ED8] block">Uddannelse A</label>
              <select
                id="prog-a"
                value={programAId}
                onChange={(e) => setProgramAId(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#D8DBE4] rounded-lg px-3 py-2 text-xs text-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                disabled={loading}
              >
                {loading ? <option>Henter data...</option> : allPrograms.slice(0, 100).map((p) => (
                  <option key={p.kot_nr} value={p.kot_nr}>{p.udbud_titel} ({p.institution})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="prog-b" className="text-xs font-bold text-[#6D28D9] block">Uddannelse B</label>
              <select
                id="prog-b"
                value={programBId}
                onChange={(e) => setProgramBId(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#D8DBE4] rounded-lg px-3 py-2 text-xs text-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                disabled={loading}
              >
                {loading ? <option>Henter data...</option> : allPrograms.slice(0, 100).map((p) => (
                  <option key={p.kot_nr} value={p.kot_nr}>{p.udbud_titel} ({p.institution})</option>
                ))}
              </select>
            </div>
          </div>

          {!loading && programA && programB && <DualRadarGraph progA={programA} progB={programB} />}

          {!loading && programA && programB && (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left text-[#12172B]">
                <thead className="bg-[#FFFFFF] text-[#545D71] uppercase text-[10px] font-bold border-b border-[#E7E9EF]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-[#545D71]">Parameter</th>
                    <th className="py-2.5 px-3 text-[#1D4ED8]">
                      <Link href={`/uddannelse/${createProgramSlug(programA)}`} className="hover:underline flex items-center gap-1">
                        {programA.udbud_titel} <span className="text-[10px]">→</span>
                      </Link>
                    </th>
                    <th className="py-2.5 px-3 text-[#6D28D9]">
                      <Link href={`/uddannelse/${createProgramSlug(programB)}`} className="hover:underline flex items-center gap-1">
                        {programB.udbud_titel} <span className="text-[10px]">→</span>
                      </Link>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E9EF]">
                  {(() => { const eA = getEnrichedScores(programA.udbud_titel, programA.scores); const eB = getEnrichedScores(programB.udbud_titel, programB.scores); return (<>
                  <tr className="hover:bg-[#F7F8FA] transition">
                    <td className="py-2.5 px-3 font-semibold">AI-robusthed</td>
                    <td className="py-2.5 px-3 font-mono-data font-bold text-[#0B7A57]">{eA.ai_resilience}/100</td>
                    <td className="py-2.5 px-3 font-mono-data font-bold text-[#0B7A57]">{eB.ai_resilience}/100</td>
                  </tr>
                  <tr className="hover:bg-[#F7F8FA] transition">
                    <td className="py-2.5 px-3 font-semibold">Jobmuligheder</td>
                    <td className="py-2.5 px-3 font-mono-data font-bold text-[#1D4ED8]">{eA.labour_demand || 50}/100</td>
                    <td className="py-2.5 px-3 font-mono-data font-bold text-[#1D4ED8]">{eB.labour_demand || 50}/100</td>
                  </tr>
                  <tr className="hover:bg-[#F7F8FA] transition">
                    <td className="py-2.5 px-3 font-semibold">Lønpotentiale</td>
                    <td className="py-2.5 px-3 font-mono-data font-bold text-[#6D28D9]">{eA.salary_growth || 50}/100</td>
                    <td className="py-2.5 px-3 font-mono-data font-bold text-[#6D28D9]">{eB.salary_growth || 50}/100</td>
                  </tr>
                  </>); })()}
                  <tr className="hover:bg-[#F7F8FA] transition">
                    <td className="py-2.5 px-3 font-semibold">Kvote 1 adgangskvotient</td>
                    <td className="py-2.5 px-3 font-mono-data font-bold">{programA.latest_kvotient}</td>
                    <td className="py-2.5 px-3 font-mono-data font-bold">{programB.latest_kvotient}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <ScoreDisclosure scores={getEnrichedScores(programA.udbud_titel, programA.scores)} compact />
              <ScoreDisclosure scores={getEnrichedScores(programB.udbud_titel, programB.scores)} compact />
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
