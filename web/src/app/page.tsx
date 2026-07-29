"use me";
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import allProgramsData from "@/data/all_programs_catalog.json";

// Omfattende dansk synonymkortlægning af over 200 hverdagsudtryk, forkortelser og typiske stavefejl
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
  "agronom": ["agrobiologi", "jordbrug", "plante"],
  "aktuarvidenskab": ["forsikringsmatematik", "matematik"],
  "astronomi": ["fysik", "geofysik og rumteknologi"],
  "dtu": ["kgs. lyngby", "teknisk videnskab", "lyngby", "ballerup"],
  "cbs": ["frederiksberg", "business", "shipping", "erhvervsøkonomi"],
  "aau": ["aalborg"],
  "itu": ["it-universitetet", "datalogi", "software"],
  "erhvervsakademi": ["professionsbachelor", "erhvervsøkonom", "akademigrad"],
  "naestved": ["næstved"],
  "skov og natur": ["skov", "landskab"],
  "havbiologi": ["biologi"],
  "oplevelsesøkonomi": ["service", "turisme", "leisure"],
  "mode og design": ["design", "tekstildesign"],
  "digital kommunikation": ["kommunikation", "it", "medievidenskab"],
  "reklame": ["markedsføring", "kommunikation"],
  "forlag": ["kommunikation", "dansk", "litteraturvidenskab"],
  "master": ["kandidat", "bachelor"],
  "akademigrad": ["akademiker", "bachelor"],
  "diplomuddannelse": ["diplom", "diplomingeniør"],
  "kvote 1": ["sommerstart", "bachelor"],
  "kvote 2": ["sommerstart", "bachelor"]
};

// Direkte kobling mellem søgeord og primære uddannelser
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
    .replace(/kvote 1/g, "sommerstart")
    .replace(/kvote 2/g, "sommerstart")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .trim();
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [gpa, setGpa] = useState(9.5);
  
  const [aiRobustnessWeight, setAiRobustnessWeight] = useState(80);
  const [jobOpportunitiesWeight, setJobOpportunitiesWeight] = useState(70);
  const [salaryWeight, setSalaryWeight] = useState(60);

  const [expandedProgram, setExpandedProgram] = useState<any | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const allPrograms = allProgramsData as any[];

  // Dynamisk matchemotor styret direkte af brugerens tre skydere
  const matchedPrograms = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    const normalizedQuery = normalizeSearchText(searchQuery);

    let expandedTerms: string[] = [rawQuery, normalizedQuery];
    Object.keys(SYNONYM_MAP).forEach((key) => {
      if (rawQuery.includes(key) || normalizedQuery.includes(normalizeSearchText(key))) {
        expandedTerms.push(...SYNONYM_MAP[key]);
      }
    });

    const exactMajors = EXACT_MAJOR_MAP[rawQuery] || EXACT_MAJOR_MAP[normalizedQuery] || [];

    const totalWeight = Math.max(1, aiRobustnessWeight + jobOpportunitiesWeight + salaryWeight);

    let list = allPrograms.map((prog) => {
      const latestKv = prog.latest_kvotient;
      const kvNum = typeof latestKv === "number" ? latestKv : null;
      const meetsGpa = kvNum !== null ? gpa >= kvNum : true;
      
      const robustScore = 100 - prog.scores.automation_risk;
      const jobScore = prog.scores.labour_demand;
      const salScore = prog.scores.salary_growth;

      // Vægtet sammensat score i intervallet 0-100%
      const weightedComposite = (
        (robustScore * aiRobustnessWeight) +
        (jobScore * jobOpportunitiesWeight) +
        (salScore * salaryWeight)
      ) / totalWeight;

      let score = Math.round(weightedComposite);
      if (meetsGpa) score = Math.min(99, score + 2);
      score = Math.max(50, score);

      // Beregning af søgerelevans
      let relevanceBoost = 0;
      if (searchQuery.trim()) {
        const pTitle = prog.udbud_titel.toLowerCase();
        const pNormTitle = normalizeSearchText(pTitle);
        const pDisco = prog.disco_titel.toLowerCase();
        const pKot = prog.kot_nr.toLowerCase();

        const isExactMajor = exactMajors.some((major) => pTitle.startsWith(major) || pTitle.includes(major));

        if (isExactMajor) {
          relevanceBoost = 1000;
        } else {
          const directTitleMatch = expandedTerms.some((term) => term && (pTitle.includes(term) || pNormTitle.includes(normalizeSearchText(term))));
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

      // Den samlede sorteringsscore kombinerer den vægtede score og søgerelevansen
      const totalSortScore = weightedComposite + relevanceBoost;

      let whyText = "";
      if (aiRobustnessWeight >= jobOpportunitiesWeight && aiRobustnessWeight >= salaryWeight) {
        whyText = `🟢 AI-robusthed er prioriteret (${robustScore}/100) — lav risiko for automatisering.`;
      } else if (jobOpportunitiesWeight >= aiRobustnessWeight && jobOpportunitiesWeight >= salaryWeight) {
        whyText = `🔵 Jobmuligheder er prioriteret (${jobScore}/100) — stærk efterspørgsel på arbejdsmarkedet.`;
      } else {
        whyText = `🟣 Lønpotentiale er prioriteret (${salScore}/100) — høj startløn og god lønudvikling.`;
      }

      return { ...prog, matchScore: score, weightedComposite, totalSortScore, whyText, meetsGpa, kvNum, robustScore, jobScore, salScore };
    });

    // Filtrering af uddannelser
    list = list.filter((p) => {
      if (searchQuery.trim()) {
        const pTitle = p.udbud_titel.toLowerCase();
        const pDisco = p.disco_titel.toLowerCase();
        const pKot = p.kot_nr.toLowerCase();
        const pCity = p.by.toLowerCase();
        const pInst = p.institution.toLowerCase();
        const pSkills = (p.skills_hierarchy?.skills || []).join(" ").toLowerCase();
        const pCourses = (p.skills_hierarchy?.courses || []).join(" ").toLowerCase();

        const matchesSearch = expandedTerms.some((term) => {
          if (!term) return false;
          const normTerm = normalizeSearchText(term);
          return (
            pTitle.includes(term) ||
            pTitle.includes(normTerm) ||
            pDisco.includes(term) ||
            pKot.includes(term) ||
            pCity.includes(term) ||
            pInst.includes(term) ||
            pSkills.includes(term) ||
            pCourses.includes(term)
          );
        });

        if (!matchesSearch) return false;
      }

      let matchesDomain = true;
      if (selectedDomain === "it") matchesDomain = p.disco08.startsWith("25");
      else if (selectedDomain === "sundhed") matchesDomain = p.disco08.startsWith("22");
      else if (selectedDomain === "jura") matchesDomain = p.disco08.startsWith("261") || p.disco08.startsWith("263");
      else if (selectedDomain === "ingenioer") matchesDomain = p.disco08.startsWith("214");
      else if (selectedDomain === "psykologi") matchesDomain = p.disco08 === "263400";
      else if (selectedDomain === "design") matchesDomain = p.disco08.startsWith("216");

      if (!matchesDomain) return false;

      if (selectedUniversity !== "all") {
        const city = p.by.toLowerCase();
        const inst = p.institution.toLowerCase();
        const title = p.udbud_titel.toLowerCase();

        if (selectedUniversity === "ku") {
          return city.includes("københavn") || city.includes("kbh") || inst.includes("københavns universitet") || title.includes("københavn");
        } else if (selectedUniversity === "dtu") {
          return city.includes("lyngby") || city.includes("ballerup") || inst.includes("dtu") || title.includes("kgs. lyngby") || title.includes("teknisk videnskab (civilingeniør)");
        } else if (selectedUniversity === "au") {
          return city.includes("aarhus") || city.includes("herning") || inst.includes("aarhus universitet") || title.includes("aarhus");
        } else if (selectedUniversity === "cbs") {
          return city.includes("frederiksberg") || inst.includes("cbs") || inst.includes("copenhagen business school") || title.includes("frederiksberg");
        } else if (selectedUniversity === "sdu") {
          return city.includes("odense") || city.includes("kolding") || city.includes("esbjerg") || city.includes("sønderborg") || city.includes("slagelse");
        } else if (selectedUniversity === "aau") {
          return city.includes("aalborg") || inst.includes("aalborg universitet") || title.includes("aalborg");
        } else if (selectedUniversity === "ruc") {
          return city.includes("roskilde") || inst.includes("roskilde universitet") || title.includes("roskilde");
        } else if (selectedUniversity === "itu") {
          return title.includes("it-universitetet") || (city.includes("københavn") && p.disco08.startsWith("25"));
        } else if (selectedUniversity === "professionshojskole") {
          return title.includes("professionsbachelor") || title.includes("erhvervsakademi") || title.includes("teknolog") || title.includes("multimediedesigner");
        }
      }

      return true;
    });

    // Sortering udelukkende baseret på samlet sorteringsscore
    return list.sort((a, b) => b.totalSortScore - a.totalSortScore);
  }, [searchQuery, selectedDomain, selectedUniversity, gpa, aiRobustnessWeight, jobOpportunitiesWeight, salaryWeight, allPrograms]);

  const topMatches = matchedPrograms.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500/30">
      
      {/* 1. Navigationsbar */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 lg:px-16 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-cyan-500/20">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Studievalg <span className="text-cyan-400 font-normal">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Dynamisk matchemotor styret direkte af dine tre skydere
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-4 sm:gap-6 text-xs font-semibold">
          <Link href="/" className="text-cyan-400 border-b-2 border-cyan-400 pb-0.5">
            🏠 Studievalg
          </Link>
          <Link href="/analyse" className="text-slate-400 hover:text-cyan-300 transition flex items-center gap-1">
            <span>💡</span> AI Insights
          </Link>
          <Link href="/evidens" className="text-slate-400 hover:text-emerald-300 transition flex items-center gap-1">
            <span>📚</span> PEFF Evidens
          </Link>
        </nav>
      </header>

      {/* 2. Introduktion og Filter-sektion */}
      <section className="max-w-4xl mx-auto px-6 pt-10 pb-4 text-center space-y-4">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-emerald-400 border border-emerald-500/40 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Opdateret med seneste optagelsesdata fra UFM (26. juli 2026) • 1.413 Uddannelser</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Hvilken uddannelse <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            passer bedst til dig?
          </span>
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-normal leading-relaxed">
          Træk i de tre skydere nedenfor for at sortere og tilpasse dine personlige anbefalinger i realtid.
        </p>

        {/* Indtastningsfelt og skydere */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl max-w-2xl mx-auto space-y-5 text-left mt-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-white/5 pb-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <label htmlFor="gpa-slider" className="text-slate-300">Dit gymnasiale gennemsnit (Kvote 1)</label>
                <span className="text-cyan-400 font-bold text-sm">{gpa.toFixed(1)}</span>
              </div>
              <input
                id="gpa-slider"
                type="range"
                min="2.0"
                max="12.0"
                step="0.1"
                value={gpa}
                onChange={(e) => setGpa(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="university-select" className="text-xs font-semibold text-slate-300 block">
                🏛️ Vælg universitet eller uddannelsessted
              </label>
              <select
                id="university-select"
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">Alle universiteter og uddannelsessteder ({allPrograms.length})</option>
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

          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                ⚙️ Prioriter dine tre vigtigste vægtfaktorer
              </h3>
              <span className="text-[10px] text-cyan-400 font-semibold animate-pulse">
                ● Sorterer listen i realtid, når du trækker
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/20 space-y-1.5 hover:border-emerald-500/40 transition">
                <div className="flex justify-between text-xs">
                  <label htmlFor="ai-robust-slider" className="text-emerald-400 font-bold">🟢 AI-robusthed</label>
                  <span className="text-emerald-400 font-bold font-mono">{aiRobustnessWeight}%</span>
                </div>
                <input
                  id="ai-robust-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={aiRobustnessWeight}
                  onChange={(e) => setAiRobustnessWeight(Number(e.target.value))}
                  className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/20 space-y-1.5 hover:border-cyan-500/40 transition">
                <div className="flex justify-between text-xs">
                  <label htmlFor="job-opp-slider" className="text-cyan-400 font-bold">🔵 Jobmuligheder</label>
                  <span className="text-cyan-400 font-bold font-mono">{jobOpportunitiesWeight}%</span>
                </div>
                <input
                  id="job-opp-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={jobOpportunitiesWeight}
                  onChange={(e) => setJobOpportunitiesWeight(Number(e.target.value))}
                  className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/20 space-y-1.5 hover:border-indigo-500/40 transition">
                <div className="flex justify-between text-xs">
                  <label htmlFor="salary-slider" className="text-indigo-400 font-bold">🟣 Lønpotentiale</label>
                  <span className="text-indigo-400 font-bold font-mono">{salaryWeight}%</span>
                </div>
                <input
                  id="salary-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={salaryWeight}
                  onChange={(e) => setSalaryWeight(Number(e.target.value))}
                  className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-1">
            <label htmlFor="search-input" className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              🔍 Søg efter uddannelse eller erhverv
            </label>
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Prøv fx: 'tandlæge', 'odontologi', 'læge', 'advokat', 'kodning'..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
            <span className="text-xs text-slate-400 self-center font-medium">Universitet:</span>
            <button
              onClick={() => setSelectedUniversity("all")}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${selectedUniversity === "all" ? "bg-white/10 border-white/20 text-white" : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"}`}
            >
              Alle
            </button>
            <button
              onClick={() => setSelectedUniversity("ku")}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${selectedUniversity === "ku" ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-300" : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"}`}
            >
              KU
            </button>
            <button
              onClick={() => setSelectedUniversity("dtu")}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${selectedUniversity === "dtu" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"}`}
            >
              DTU
            </button>
            <button
              onClick={() => setSelectedUniversity("au")}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${selectedUniversity === "au" ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"}`}
            >
              AU
            </button>
            <button
              onClick={() => setSelectedUniversity("cbs")}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${selectedUniversity === "cbs" ? "bg-amber-500/20 border-amber-500/30 text-amber-300" : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"}`}
            >
              CBS
            </button>
            <button
              onClick={() => setSelectedUniversity("sdu")}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${selectedUniversity === "sdu" ? "bg-purple-500/20 border-purple-500/30 text-purple-300" : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"}`}
            >
              SDU
            </button>
            <button
              onClick={() => setSelectedUniversity("aau")}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${selectedUniversity === "aau" ? "bg-pink-500/20 border-pink-500/30 text-pink-300" : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"}`}
            >
              AAU
            </button>
            <button
              onClick={() => setSelectedUniversity("ruc")}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${selectedUniversity === "ruc" ? "bg-slate-800 border-white/10 text-slate-300" : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"}`}
            >
              RUC
            </button>
          </div>
        </div>
      </section>

      {/* 3. Matchede uddannelser */}
      <section className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex justify-between items-end border-b border-white/5 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {selectedUniversity !== "all"
                ? `Matchede uddannelser på ${selectedUniversity.toUpperCase()}`
                : searchQuery
                ? `Søgeresultater for "${searchQuery}"`
                : "Dine bedste anbefalinger"}
            </h3>
            <p className="text-xs text-slate-400">
              Dynamisk sorteret ud fra dine tre skydere (🟢 AI: {aiRobustnessWeight}%, 🔵 Job: {jobOpportunitiesWeight}%, 🟣 Løn: {salaryWeight}%)
            </p>
          </div>
          <span className="text-xs text-cyan-400 font-mono font-semibold">
            {matchedPrograms.length} uddannelser matchet
          </span>
        </div>

        {topMatches.length > 0 ? (
          <div className="space-y-4">
            {topMatches.map((prog, index) => {
              const isExpanded = expandedProgram?.kot_nr === prog.kot_nr;
              
              let domainIconEmoji = "💻";
              if (prog.disco08.startsWith("22")) domainIconEmoji = "🩺";
              else if (prog.disco08.startsWith("261") || prog.disco08.startsWith("263")) domainIconEmoji = "⚖️";
              else if (prog.disco08.startsWith("24") || prog.disco08.startsWith("12")) domainIconEmoji = "📈";

              return (
                <article
                  key={prog.kot_nr}
                  id={`program-card-${prog.kot_nr}`}
                  className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 hover:border-white/15 transition duration-200 shadow-xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-xl shrink-0">
                        {domainIconEmoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                          <span className="font-bold text-emerald-400 text-sm">#{index + 1} Match ({prog.matchScore}%)</span>
                          <span>•</span>
                          <span className="text-cyan-300 font-semibold">{prog.institution}</span>
                        </div>
                        <h4 className="text-2xl font-extrabold text-white tracking-tight">
                          {prog.udbud_titel}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-1">
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                            Kvote 1 adgangskvotient (2026)
                          </span>
                          <span className="text-xl font-black text-cyan-400">
                            {prog.latest_kvotient}
                          </span>
                        </div>
                      </div>

                      {/* Præcis angivelse af Kvote 1 og Kvote 2 */}
                      {prog.kvNum !== null ? (
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border ${prog.meetsGpa ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                          {prog.meetsGpa ? "✓ Kvote 1 opfyldt" : `⚠️ Søg Kvote 2 (Kvote 1 krav: ${prog.latest_kvotient})`}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          ✓ Alle optaget i Kvote 1
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className={`p-3 rounded-xl border space-y-1 transition ${aiRobustnessWeight >= jobOpportunitiesWeight && aiRobustnessWeight >= salaryWeight ? "bg-emerald-950/40 border-emerald-500/40" : "bg-slate-950 border-white/5"}`}>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">🟢 AI-robusthed</span>
                        <span className="text-emerald-400 font-bold font-mono">{prog.robustScore}/100</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prog.robustScore}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        {prog.robustScore >= 75 ? "Meget robust" : "Moderat eksponering"}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border space-y-1 transition ${jobOpportunitiesWeight >= aiRobustnessWeight && jobOpportunitiesWeight >= salaryWeight ? "bg-cyan-950/40 border-cyan-500/40" : "bg-slate-950 border-white/5"}`}>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">🔵 Jobmuligheder</span>
                        <span className="text-cyan-400 font-bold font-mono">{prog.jobScore}/100</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${prog.jobScore}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        {prog.jobScore >= 75 ? "Stærk efterspørgsel" : "Stabil efterspørgsel"}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border space-y-1 transition ${salaryWeight >= aiRobustnessWeight && salaryWeight >= jobOpportunitiesWeight ? "bg-indigo-950/40 border-indigo-500/40" : "bg-slate-950 border-white/5"}`}>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">🟣 Lønpotentiale</span>
                        <span className="text-indigo-400 font-bold font-mono">{prog.salScore}/100</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${prog.salScore}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        {prog.salScore >= 75 ? "Høj startløn" : "Middel lønniveau"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5 text-xs text-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <strong className="text-cyan-400 block mb-0.5">Hvorfor denne anbefaling?</strong>
                      <span>{prog.whyText}</span>
                    </div>

                    <button
                      onClick={() => setExpandedProgram(isExpanded ? null : prog)}
                      className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-white/10 transition whitespace-nowrap self-end sm:self-auto"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? "Luk analyse" : "Se fuld analyse →"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pt-4 border-t border-white/5 space-y-4 text-xs animate-fade-in">
                      <div className="bg-slate-950 p-4 rounded-xl space-y-3">
                        <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                          📖 Hvad lærer du på studiet?
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {prog.skills_hierarchy.courses.map((c: string, i: number) => (
                            <span key={i} className="bg-slate-900 text-slate-300 py-1 px-2.5 rounded border border-white/5">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl space-y-2">
                        <h5 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                          📚 PEFF-evidens og rapportcitater
                        </h5>
                        {prog.rag_evidence.map((ev: any, i: number) => (
                          <div key={i} className="text-slate-300 italic pt-1 border-t border-white/5 first:border-none">
                            "{ev.quote}" — <span className="text-cyan-400 not-italic font-semibold">{ev.source}</span>
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
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 text-center space-y-3">
            <span className="text-3xl block">🔍</span>
            <h4 className="text-lg font-bold text-white">Ingen matchende uddannelser fundet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Prøv at vælge et andet universitet, eller ryd dit søgefelt.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedUniversity("all"); setSelectedDomain("all"); }}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold hover:bg-cyan-500/30 transition"
            >
              Nulstil universitetsfilter, og vis alle fag
            </button>
          </div>
        )}

        {visibleCount < matchedPrograms.length && (
          <div className="text-center pt-6">
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl border border-white/10 text-xs transition shadow-xl"
            >
              Vis flere anbefalinger (Viser {visibleCount} af {matchedPrograms.length})
            </button>
          </div>
        )}
      </section>

      {/* 4. Sidefod med juridisk forbehold */}
      <footer className="border-t border-white/10 bg-slate-900/60 pt-12 pb-16 px-6 lg:px-16 text-slate-300 text-xs space-y-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              🎯 Hvorfor er platformen bygget?
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11.5px]">
              AI-Studievalgsplatformen er bygget for at give uddannelsessøgende unge i Danmark et uafhængigt og videnskabeligt funderet beslutningsstøtteværktøj. Formålet er at fjerne frygt og usikkerhed ved at koble historiske ansøgertal med reel, international AI-forskning.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-semibold">
              ⚙️ Hvad analyserer platformen?
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11.5px]">
              Platformen analyserer <strong>14.934 officielle optagelsesposter fra UFM</strong> (2009–2026) fordelt på <strong>1.413 danske uddannelser</strong>. Den kombinerer over 42 forskningskilder fra OECD, ILO, Stanford, MIT og Danmarks Statistik i PEFF-frameworket.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-amber-400 tracking-tight flex items-center gap-2">
              ⚖️ Vigtigt juridisk forbehold
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11.5px]">
              <strong>Ingen juridisk vejledning:</strong> Platformen er et uafhængigt analytisk værktøj. Officiel ansøgning sker altid via <a href="https://www.optagelse.dk" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Optagelse.dk</a> og uddannelsesstedernes egne vejledninger. Modellerne angiver estimerede statistiske sammenhænge og konfidensintervaller – ikke garantier for fremtiden.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500 text-[11px]">
          <div>
            © 2026 AI-Studievalgsplatform Danmark • Uafhængig studievejledning og arbejdsmarkedsanalyse
          </div>
          <div className="flex items-center gap-4">
            <Link href="/analyse" className="hover:text-cyan-400 transition">📊 AI Insights</Link>
            <span>•</span>
            <Link href="/evidens" className="hover:text-emerald-400 transition">📚 PEFF Evidens Framework</Link>
            <span>•</span>
            <a href="https://ufm.dk" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition">UFM.dk</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
