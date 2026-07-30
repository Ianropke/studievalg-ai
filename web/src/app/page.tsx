"use client";

import React, { useState, useMemo, useEffect, useDeferredValue } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Synonymer for søgning
const SYNONYM_MAP: Record<string, string[]> = {
  "tandlæge": ["odontologi", "tandpleje", "tandteknik"],
  "tændlæge": ["odontologi", "tandpleje", "tandteknik"],
  "ordontologi": ["odontologi", "tandlæge"],
  "odontologi": ["odontologi", "tandlæge"],
  "tandplejer": ["tandpleje", "odontologi"],
  "dentist": ["odontologi", "tandlæge"],
  "læge": ["medicin", "lægemiddelvidenskab", "kirurgi"],
  "doktor": ["medicin"],
  "medicin": ["medicin", "læge"],
  "dyrlæge": ["veterinær"],
  "veterinær": ["veterinær", "dyrlæge"],
  "sygeplejerske": ["sygeplejerske", "sygepleje"],
  "jordemoder": ["jordemoder"],
  "fysioterapeut": ["fysioterapi"],
  "ergoterapeut": ["ergoterapi"],
  "advokat": ["jura", "erhvervsjura"],
  "jurist": ["jura", "erhvervsjura"],
  "jura": ["jura", "juridisk"],
  "ingeniør": ["ingeniør", "teknisk videnskab", "bygningsdesign", "computer engineering"],
  "civilingeniør": ["ingeniør", "teknisk videnskab"],
  "diplomingeniør": ["ingeniør", "diplom"],
  "arkitekt": ["arkitektur", "bygningsdesign", "byggeri"],
  "skovingeniør": ["skov", "landskab", "naturressourcer"],
  "programmør": ["datalogi", "software", "computer", "kunstig intelligens"],
  "kodning": ["datalogi", "software", "computer engineering"],
  "datalog": ["datalogi"],
  "software": ["software", "datalogi", "computer engineering"],
  "skolelærer": ["lærer", "folkeskolelærer"],
  "lærer": ["lærer", "pædagog"],
  "pædagog": ["pædagog"],
  "revisor": ["revision", "erhvervsøkonomi", "økonomi"],
  "politiker": ["statskundskab", "politik"],
  "skuespiller": ["teater", "performancestudier", "musik", "film"],
  "grafisk design": ["multimediedesigner", "visuel kommunikation", "design"],
  "dtu": ["kgs. lyngby", "teknisk videnskab", "lyngby", "ballerup"],
  "cbs": ["frederiksberg", "business", "shipping", "erhvervsøkonomi"],
  "aau": ["aalborg"],
  "itu": ["it-universitetet", "datalogi", "software"],
  "erhvervsakademi": ["professionsbachelor", "erhvervsakademi"]
};

const EXACT_MAJOR_MAP: Record<string, string[]> = {
  "tandlæge": ["odontologi"],
  "tændlæge": ["odontologi"],
  "ordontologi": ["odontologi"],
  "odontologi": ["odontologi"],
  "læge": ["medicin"],
  "doktor": ["medicin"],
  "medicin": ["medicin"],
  "advokat": ["jura"],
  "jurist": ["jura"],
  "jura": ["jura"],
  "dyrlæge": ["veterinærmedicin", "veterinær"],
  "programmør": ["datalogi", "softwareudvikling"],
  "kodning": ["datalogi", "softwareudvikling"]
};

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/tændlæge/g, "tandlæge")
    .replace(/ordontologi/g, "odontologi")
    .replace(/naestved/g, "næstved")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .trim();
}

// Lazy load signature elements for better initial load performance
const CompactTriangleRadar = dynamic(() => Promise.resolve(function CompactTriangleRadarComponent({ robust, job, salary }: { robust: number; job: number; salary: number }) {
  const R = 32;
  const cx = 40;
  const cy = 40;
  
  const rRob = R * (robust / 100);
  const rJob = R * (job / 100);
  const rSal = R * (salary / 100);
  
  const pRob = { x: cx, y: cy - rRob };
  const pJob = { x: cx - rJob * 0.866, y: cy + rJob * 0.5 };
  const pSal = { x: cx + rSal * 0.866, y: cy + rSal * 0.5 };

  // Reference points (R=100)
  const refRob = { x: cx, y: cy - R };
  const refJob = { x: cx - R * 0.866, y: cy + R * 0.5 };
  const refSal = { x: cx + R * 0.866, y: cy + R * 0.5 };

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 80 80" className="w-16 h-16 overflow-visible">
        {/* Reference dotted triangle */}
        <polygon points={`${refRob.x},${refRob.y} ${refJob.x},${refJob.y} ${refSal.x},${refSal.y}`} fill="none" stroke="#8891A3" strokeWidth="1" strokeDasharray="2 2" />
        
        {/* Center to vertices */}
        <line x1={cx} y1={cy} x2={refRob.x} y2={refRob.y} stroke="#E7E9EF" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={refJob.x} y2={refJob.y} stroke="#E7E9EF" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={refSal.x} y2={refSal.y} stroke="#E7E9EF" strokeWidth="1" />
        
        {/* Actual polygon: neutral teal fill per spec */}
        <polygon points={`${pRob.x},${pRob.y} ${pJob.x},${pJob.y} ${pSal.x},${pSal.y}`} fill="#0e7490" fillOpacity="0.15" stroke="#0891b2" strokeWidth="1.5" />
        
        {/* 3px corner dots in signature colors */}
        <circle cx={pRob.x} cy={pRob.y} r="3" fill="#0F9D6E" />
        <circle cx={pJob.x} cy={pJob.y} r="3" fill="#2563EB" />
        <circle cx={pSal.x} cy={pSal.y} r="3" fill="#7C3AED" />
      </svg>
      <span className="text-[10px] text-[#545D71] font-mono-data font-semibold">Din matchprofil</span>
    </div>
  );
}), { ssr: false });

const SearchIcon = () => (
  <svg className="w-4 h-4 text-[#545D71]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const SlidersIcon = () => (
  <svg className="w-4 h-4 text-[#545D71]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5M3.75 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m3.75 0h6.75" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-4 h-4 text-[#0B7A57]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg className="w-4 h-4 text-[#B45309]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

export default function Dashboard() {
  const [allPrograms, setAllPrograms] = useState<any[]>([]);
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [gpa, setGpa] = useState(9.5);
  
  const [aiRobustnessWeight, setAiRobustnessWeight] = useState(80);
  const [jobOpportunitiesWeight, setJobOpportunitiesWeight] = useState(70);
  const [salaryWeight, setSalaryWeight] = useState(60);

  const [expandedProgram, setExpandedProgram] = useState<any | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredSelectedDomain = useDeferredValue(selectedDomain);
  const deferredSelectedUniversity = useDeferredValue(selectedUniversity);
  const deferredGpa = useDeferredValue(gpa);
  const deferredAiWeight = useDeferredValue(aiRobustnessWeight);
  const deferredJobWeight = useDeferredValue(jobOpportunitiesWeight);
  const deferredSalWeight = useDeferredValue(salaryWeight);

  const matchedPrograms = useMemo(() => {
    if (allPrograms.length === 0) return [];
    
    const rawQuery = deferredSearchQuery.trim().toLowerCase();
    const normalizedQuery = normalizeSearchText(deferredSearchQuery);

    const expandedTerms: string[] = [rawQuery, normalizedQuery];
    Object.keys(SYNONYM_MAP).forEach((key) => {
      if (rawQuery.includes(key) || normalizedQuery.includes(normalizeSearchText(key))) {
        expandedTerms.push(...SYNONYM_MAP[key]);
      }
    });

    const exactMajors = EXACT_MAJOR_MAP[rawQuery] || EXACT_MAJOR_MAP[normalizedQuery] || [];
    const totalWeight = Math.max(1, deferredAiWeight + deferredJobWeight + deferredSalWeight);

    let list = allPrograms.map((prog) => {
      const latestKv = prog.latest_kvotient;
      const kvNum = typeof latestKv === "number" ? latestKv : null;
      const meetsGpa = kvNum !== null ? deferredGpa >= kvNum : true;
      
      const robustScore = 100 - prog.scores.automation_risk;
      const jobScore = prog.scores.labour_demand;
      const salScore = prog.scores.salary_growth;

      const weightedComposite = (
        (robustScore * deferredAiWeight) +
        (jobScore * deferredJobWeight) +
        (salScore * deferredSalWeight)
      ) / totalWeight;

      let score = Math.round(weightedComposite);
      if (meetsGpa) score = Math.min(99, score + 2);
      score = Math.max(50, score);

      let relevanceBoost = 0;
      const pTitle = prog.udbud_titel;
      if (deferredSearchQuery.trim()) {
        const pTitleLow = pTitle.toLowerCase();
        const pNormTitle = normalizeSearchText(pTitleLow);
        const pDisco = prog.disco_titel.toLowerCase();
        const pKot = prog.kot_nr.toLowerCase();

        const isExactMajor = exactMajors.some((major) => pTitleLow.startsWith(major) || pTitleLow.includes(major));

        if (isExactMajor) {
          relevanceBoost = 1000;
        } else {
          const directTitleMatch = expandedTerms.some((term) => term && (pTitleLow.includes(term) || pNormTitle.includes(normalizeSearchText(term))));
          const directKotMatch = expandedTerms.some((term) => term && pKot.includes(term));
          const discoMatch = expandedTerms.some((term) => term && pDisco.includes(term));

          if (directTitleMatch || directKotMatch) {
            relevanceBoost = 300;
          } else if (discoMatch) {
            relevanceBoost = 100;
          } else {
            relevanceBoost = 20;
          }
        }
      }

      const totalSortScore = weightedComposite + relevanceBoost;

      const normalizeTitle = (t: string) => {
        if (!t) return t;
        return t.split(' ').map((word, i) => {
          if (word === word.toUpperCase() && word.length > 1) return word;
          if (i === 0) return word;
          return word.toLowerCase();
        }).join(' ');
      };
      const normalizedTitle = normalizeTitle(prog.udbud_titel || "Uddannelsen");
      prog.udbud_titel = normalizedTitle;

      let whyText = "";
      let qual = "moderat efterspørgsel";
      if (jobScore > 80) qual = "stærke jobmuligheder";
      else if (jobScore > 60) qual = "historisk stabil efterspørgsel";
      else if (jobScore < 40) qual = "svagere jobmuligheder";

      const aiQual = robustScore >= 75 ? "høj" : "mere moderat";
      let aiSection = "";
      if (robustScore >= 75) {
        aiSection = `AI-robustheden er ${aiQual} (${robustScore}/100), og feltet har ${qual}.`;
      } else {
        aiSection = `${normalizedTitle} har en ${aiQual} AI-robusthedsscore (${robustScore}/100) — det betyder større usikkerhed om hvordan feltet udvikler sig, men jobmulighederne er fortsat stærke (${jobScore}/100).`;
      }

      if (kvNum !== null) {
        if (meetsGpa) {
          whyText = `Med et snit på ${deferredGpa.toFixed(1)} er du sikkert inde på ${normalizedTitle}s Kvote 1-krav på ${kvNum.toFixed(1)}. ${aiSection}`;
        } else {
          whyText = `Kvote 1-kvotienten var senest ${kvNum.toFixed(1)} — med et snit på ${deferredGpa.toFixed(1)} anbefales ansøgning via Kvote 2. ${aiSection}`;
        }
      } else {
        whyText = `Alle ansøgere blev optaget senest (ingen grænsekvotient). ${aiSection}`;
      }

      return { ...prog, matchScore: score, weightedComposite, totalSortScore, whyText, meetsGpa, kvNum, robustScore, jobScore, salScore };
    });

    list = list.filter((p) => {
      if (deferredSearchQuery.trim()) {
        const pTitle = p.udbud_titel.toLowerCase();
        const pDisco = p.disco_titel.toLowerCase();
        const pKot = p.kot_nr.toLowerCase();
        const pCity = p.by.toLowerCase();
        const pInst = p.institution.toLowerCase();

        const matchesSearch = expandedTerms.some((term) => {
          if (!term) return false;
          const normTerm = normalizeSearchText(term);
          return (
            pTitle.includes(term) ||
            pTitle.includes(normTerm) ||
            pDisco.includes(term) ||
            pKot.includes(term) ||
            pCity.includes(term) ||
            pInst.includes(term)
          );
        });

        if (!matchesSearch) return false;
      }

      let matchesDomain = true;
      if (deferredSelectedDomain === "it") matchesDomain = p.disco08.startsWith("25");
      else if (deferredSelectedDomain === "sundhed") matchesDomain = p.disco08.startsWith("22");
      else if (deferredSelectedDomain === "jura") matchesDomain = p.disco08.startsWith("261") || p.disco08.startsWith("263");
      else if (deferredSelectedDomain === "ingenioer") matchesDomain = p.disco08.startsWith("214");

      if (!matchesDomain) return false;

      if (deferredSelectedUniversity !== "all") {
        const city = p.by.toLowerCase();
        const inst = p.institution.toLowerCase();
        const title = p.udbud_titel.toLowerCase();

        if (deferredSelectedUniversity === "ku") return city.includes("københavn") || inst.includes("københavns universitet");
        if (deferredSelectedUniversity === "dtu") return city.includes("lyngby") || inst.includes("dtu") || title.includes("teknisk videnskab");
        if (deferredSelectedUniversity === "au") return city.includes("aarhus") || inst.includes("aarhus universitet");
        if (deferredSelectedUniversity === "cbs") return city.includes("frederiksberg") || inst.includes("cbs");
        if (deferredSelectedUniversity === "sdu") return city.includes("odense") || city.includes("esbjerg") || city.includes("kolding");
        if (deferredSelectedUniversity === "aau") return city.includes("aalborg") || inst.includes("aalborg universitet");
        if (deferredSelectedUniversity === "ruc") return city.includes("roskilde") || inst.includes("roskilde universitet");
        if (deferredSelectedUniversity === "itu") return title.includes("it-universitetet") || (city.includes("københavn") && p.disco08.startsWith("25"));
        if (deferredSelectedUniversity === "professionshojskole") return title.includes("professionsbachelor") || title.includes("erhvervsakademi");
      }

      return true;
    });

    return list.sort((a, b) => b.totalSortScore - a.totalSortScore);
  }, [deferredSearchQuery, deferredSelectedDomain, deferredSelectedUniversity, deferredGpa, deferredAiWeight, deferredJobWeight, deferredSalWeight, allPrograms]);

  const topMatches = matchedPrograms.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      <header className="border-b border-[#E7E9EF] bg-[#FFFFFF] sticky top-0 z-50 px-6 lg:px-16 py-4 flex justify-between items-center card-shadow">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#12172B] flex items-center justify-center font-bold text-[#FFFFFF] text-sm focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 transition">
            S
          </div>
          <div>
            <h1 className="text-base font-bold text-[#12172B] tracking-tight font-display">
              Studievalg <span className="text-[#545D71] font-normal">AI</span>
            </h1>
            <p className="text-[11px] text-[#545D71]">
              Statistisk beslutningsstøtte baseret på UFM og Danmarks Statistik
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-xs font-semibold">
          <Link href="/" className="text-[#12172B] border-b-2 border-[#12172B] pb-1 font-bold focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded">
            Studievalg
          </Link>
          <Link href="/analyse" className="text-[#545D71] hover:text-[#12172B] transition focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded">
            AI Insights
          </Link>
          <Link href="/evidens" className="text-[#545D71] hover:text-[#12172B] transition focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded">
            PEFF Evidens
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F6EE] text-[#0B7A57] border border-[#0F9D6E]/20">
            <span className="w-2 h-2 rounded-full bg-[#0F9D6E]"></span>
            <span>Seneste Optagelsesdata 26. juli 2026 • 1.413 Uddannelser</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#12172B] leading-tight font-display">
            Hvilken uddannelse <br className="hidden sm:inline" />
            passer <span className="border-b-4 border-[#0F9D6E] pb-1">bedst til dig?</span>
          </h1>
          <p className="text-sm text-[#545D71] max-w-lg mx-auto font-normal leading-relaxed">
            Tilpas de tre vægtfaktorer nedenfor for at beregne dine personlige anbefalinger ud fra UFM-registerdata.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 card-shadow space-y-6 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-[#E7E9EF] pb-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <label htmlFor="gpa-slider" className="text-[#12172B]">Dit gymnasiale gennemsnit (Kvote 1)</label>
                <span className="text-[#12172B] font-mono-data font-bold text-sm">{gpa.toFixed(1)}</span>
              </div>
              <input
                id="gpa-slider"
                type="range"
                min="2.0"
                max="12.0"
                step="0.1"
                value={gpa}
                onChange={(e) => setGpa(Number(e.target.value))}
                aria-label={`Gennemsnit: ${gpa.toFixed(1)}`}
                className="w-full h-2 bg-[#E7E9EF] rounded-lg appearance-none cursor-pointer accent-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="university-select" className="text-xs font-semibold text-[#12172B] block">
                Vælg universitet eller uddannelsessted
              </label>
              <select
                id="university-select"
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#D8DBE4] rounded-lg px-3 py-2 text-xs text-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
              >
                <option value="all">Alle universiteter og uddannelsessteder {loading ? "..." : `(${allPrograms.length})`}</option>
                <option value="ku">Københavns Universitet (KU)</option>
                <option value="dtu">Danmarks Tekniske Universitet (DTU)</option>
                <option value="au">Aarhus Universitet (AU)</option>
                <option value="cbs">Copenhagen Business School (CBS)</option>
                <option value="sdu">Syddansk Universitet (SDU)</option>
                <option value="aau">Aalborg Universitet (AAU)</option>
                <option value="ruc">Roskilde Universitet (RUC)</option>
                <option value="itu">IT-Universitetet i København (ITU)</option>
                <option value="professionshojskole">Professionshøjskoler og erhvervsakademier</option>
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#545D71] uppercase tracking-wider flex items-center gap-1.5">
                <SlidersIcon /> Prioriter de tre kernemetrics
              </span>
              <span className="text-[11px] text-[#545D71] font-mono-data">
                Sorterer i realtid
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg border border-[#E7E9EF] bg-[#F7F8FA] space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#0B7A57]">AI-robusthed</span>
                  <span className="text-[#0B7A57] font-mono-data font-bold">{aiRobustnessWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aiRobustnessWeight}
                  onChange={(e) => setAiRobustnessWeight(Number(e.target.value))}
                  aria-label={`AI-robusthed vægt: ${aiRobustnessWeight}%`}
                  className="w-full h-2 bg-[#D8DBE4] rounded-lg appearance-none cursor-pointer accent-[#0F9D6E] focus:outline-none focus:ring-2 focus:ring-[#0F9D6E] focus:ring-offset-2"
                />
              </div>
              <div className="p-3.5 rounded-lg border border-[#E7E9EF] bg-[#F7F8FA] space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#1D4ED8]">Jobmuligheder</span>
                  <span className="text-[#1D4ED8] font-mono-data font-bold">{jobOpportunitiesWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={jobOpportunitiesWeight}
                  onChange={(e) => setJobOpportunitiesWeight(Number(e.target.value))}
                  aria-label={`Jobmuligheder vægt: ${jobOpportunitiesWeight}%`}
                  className="w-full h-2 bg-[#D8DBE4] rounded-lg appearance-none cursor-pointer accent-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                />
              </div>
              <div className="p-3.5 rounded-lg border border-[#E7E9EF] bg-[#F7F8FA] space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#6D28D9]">Lønpotentiale</span>
                  <span className="text-[#6D28D9] font-mono-data font-bold">{salaryWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={salaryWeight}
                  onChange={(e) => setSalaryWeight(Number(e.target.value))}
                  aria-label={`Lønpotentiale vægt: ${salaryWeight}%`}
                  className="w-full h-2 bg-[#D8DBE4] rounded-lg appearance-none cursor-pointer accent-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2"
                />
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-[#E7E9EF] relative">
            <div className="absolute inset-y-0 left-3 pl-1 flex items-center pointer-events-none pt-2">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søg efter uddannelse eller erhverv (fx 'odontologi', 'læge', 'jura')..."
              className="w-full bg-[#F7F8FA] border border-[#D8DBE4] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#12172B] placeholder-[#8891A3] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E7E9EF] text-xs">
            <span className="text-[#545D71] self-center font-medium">Filtrer:</span>
            {[
              { id: "all", label: "Alle" },
              { id: "ku", label: "KU" },
              { id: "dtu", label: "DTU" },
              { id: "au", label: "AU" },
              { id: "cbs", label: "CBS" },
              { id: "sdu", label: "SDU" },
              { id: "aau", label: "AAU" },
              { id: "ruc", label: "RUC" },
              { id: "professionshojskole", label: "Professionshøjskoler" },
            ].map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUniversity(u.id)}
                className={`px-3 py-1 rounded-full border transition font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-1 ${
                  selectedUniversity === u.id
                    ? "bg-[#12172B] border-[#12172B] text-[#FFFFFF]"
                    : "bg-[#FFFFFF] border-[#D8DBE4] text-[#545D71] hover:border-[#12172B] hover:text-[#12172B]"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-[#E7E9EF] pb-3">
            <div>
              <h2 className="text-xl font-bold text-[#12172B] font-display">
                Dine anbefalinger
              </h2>
              <p className="text-xs text-[#545D71] font-mono-data">
                Vægtet sortering (AI: {aiRobustnessWeight}% · Job: {jobOpportunitiesWeight}% · Løn: {salaryWeight}%)
              </p>
            </div>
            <span className="text-xs text-[#545D71] font-mono-data font-semibold">
              {loading ? "Henter..." : `${matchedPrograms.length} matchede uddannelser`}
            </span>
          </div>

          {loading ? (
            <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 text-center space-y-3 card-shadow animate-pulse">
               <div className="w-12 h-12 border-4 border-[#0F9D6E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <h3 className="text-base font-bold text-[#12172B]">Downloader nyeste optagelsesdata...</h3>
               <p className="text-xs text-[#545D71]">Analyserer 1.413 uddannelser over 42 parametre.</p>
            </div>
          ) : topMatches.length > 0 ? (
            <div className="space-y-4">
              {topMatches.map((prog, index) => {
                const isTopMatch = index === 0;
                const isExpanded = expandedProgram?.kot_nr === prog.kot_nr;
                return (
                  <article
                    key={prog.kot_nr}
                    className={`border rounded-xl p-5 transition duration-200 space-y-4 ${
                      isTopMatch ? "border-[#0F9D6E] bg-[#E3F6EE]/30 card-shadow" : "border-[#E7E9EF] bg-[#FFFFFF] card-shadow card-shadow-hover"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono-data font-bold text-[#12172B]">#{index + 1} Match ({prog.matchScore}%)</span>
                          <span className="text-[#D8DBE4]">|</span>
                          <span className="text-[#545D71] font-semibold">{prog.institution}</span>
                          <span className="text-[#D8DBE4]">|</span>
                          <span className="text-[#8891A3] font-mono-data">KOT {prog.kot_nr}</span>
                        </div>
                        <h3 className="text-xl font-bold text-[#12172B] tracking-tight font-display">
                          {prog.udbud_titel}
                        </h3>
                      </div>
                      <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-1 border-t sm:border-t-0 border-[#E7E9EF] pt-2 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[11px] text-[#545D71] uppercase tracking-wider font-bold block">Adgangskvotient (2026)</span>
                          <span className="text-lg font-bold text-[#12172B] font-mono-data">
                            {prog.latest_kvotient}
                          </span>
                        </div>
                        {prog.kvNum !== null ? (
                          <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                            prog.meetsGpa 
                              ? "bg-[#E3F6EE] text-[#0B7A57] border-[#0F9D6E]/30"
                              : "bg-[#FDF1E3] text-[#B45309] border-[#B45309]/30"
                          }`}>
                            {prog.meetsGpa ? <CheckCircleIcon /> : <AlertTriangleIcon />}
                            {prog.meetsGpa ? "Kvote 1" : `Søg Kvote 2 (Krav: ${prog.kvNum})`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-[#E3F6EE] text-[#0B7A57] border border-[#0F9D6E]/30">
                            <CheckCircleIcon /> Alle optaget
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#FFFFFF] p-3 rounded-lg border border-[#E7E9EF]">
                      <div className="flex justify-center shrink-0 border-b sm:border-b-0 sm:border-r border-[#E7E9EF] pb-3 sm:pb-0 sm:pr-4">
                        <CompactTriangleRadar robust={prog.robustScore} job={prog.jobScore} salary={prog.salScore} />
                      </div>
                      <div className="flex-1 text-xs text-[#12172B] font-mono-data flex flex-col justify-center">
                        <div className="flex gap-4">
                           <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0F9D6E]"></span>AI: {prog.robustScore}</div>
                           <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>Job: {prog.jobScore}</div>
                           <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]"></span>Løn: {prog.salScore}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[#545D71] pt-1">
                      <p className="leading-relaxed flex-1">
                        <strong className="text-[#12172B]">Begrundelse:</strong> {prog.whyText}
                      </p>
                      <button
                        onClick={() => setExpandedProgram(isExpanded ? null : prog)}
                        className="text-[#2563EB] font-semibold hover:underline text-xs whitespace-nowrap self-end sm:self-auto flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded"
                      >
                        {isExpanded ? "Skjul detaljer" : "Se fuld analyse"} <ArrowRightIcon />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="pt-4 border-t border-[#E7E9EF] space-y-4 text-xs">
                        <div className="space-y-2">
                          <span className="font-bold text-[#12172B] uppercase tracking-wider text-[11px] block">
                            Kurser og fagindhold
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {prog.skills_hierarchy?.courses?.map((c: string, i: number) => (
                              <span key={i} className="bg-[#F7F8FA] text-[#12172B] border border-[#D8DBE4] px-2.5 py-1 rounded-md text-[11px] font-semibold">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-[#E7E9EF]">
                          <span className="font-bold text-[#12172B] uppercase tracking-wider text-[11px] block">
                            PEFF Evidenskilder og citater
                          </span>
                          {prog.rag_evidence?.map((ev: any, i: number) => (
                            <div key={i} className="bg-[#F7F8FA] p-3 rounded-lg border border-[#E7E9EF] space-y-1">
                              <p className="text-[#12172B] italic">"{ev.quote}"</p>
                              <span className="text-[#545D71] font-semibold text-[11px] block">Kilde: {ev.source}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 text-center space-y-3 card-shadow">
              <h3 className="text-base font-bold text-[#12172B]">Ingen matchende uddannelser fundet</h3>
              <p className="text-xs text-[#545D71]">Prøv at vælge et andet universitet eller ryd dit søgefelt.</p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedUniversity("all"); }}
                className="px-4 py-2 bg-[#12172B] text-[#FFFFFF] rounded-lg text-xs font-semibold hover:bg-[#545D71] transition focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              >
                Nulstil søgning og vis alle
              </button>
            </div>
          )}

          {visibleCount < matchedPrograms.length && (
            <div className="text-center pt-4">
              <button
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="px-6 py-2.5 bg-[#FFFFFF] border border-[#D8DBE4] hover:border-[#12172B] text-[#12172B] font-semibold rounded-lg text-xs transition card-shadow focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              >
                Vis flere anbefalinger (Viser {visibleCount} af {matchedPrograms.length})
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[#E7E9EF] bg-[#FFFFFF] py-8 px-6 lg:px-16 text-[#545D71] text-xs text-center mt-16 space-y-2">
        <p>© 2026 AI-Studievalgsplatform Danmark • Officiel UFM & Danmarks Statistik registerdata</p>
        <p className="max-w-2xl mx-auto">Vi anbefaler desuden at tale med en studievejleder om dit konkrete valg — denne platform er ét godt input blandt flere, ikke en erstatning for personlig vejledning.</p>
      </footer>
    </div>
  );
}
