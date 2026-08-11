"use client";

import React, { useState, useMemo, useEffect, useDeferredValue } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Header } from "@/components/Header";
import { createProgramSlug } from "@/lib/slugs";
import { getEnrichedScores } from "@/lib/domainScoring";
import { normalizeProgramName } from "@/lib/programName";
import { formatProgramTitle, formatCityName } from "@/lib/textUtils";
import initialProgramsCatalog from "@public/data/all_programs_catalog.json";

// Synonymer for søgning & udvidet erhvervssprog
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
  "dyrlæge": ["veterinær", "veterinærmedicin"],
  "veterinær": ["veterinær", "dyrlæge"],
  "sygeplejerske": ["sygeplejerske", "sygepleje"],
  "sygepleje": ["sygeplejerske", "sygepleje"],
  "jordemoder": ["jordemoder"],
  "fysioterapeut": ["fysioterapi", "fysioterapeut"],
  "ergoterapeut": ["ergoterapi", "ergoterapeut"],
  "bioanalytiker": ["bioanalyse", "laborant", "biomedicin"],
  "radiograf": ["radiografi", "diagnostik"],
  "advokat": ["jura", "erhvervsjura"],
  "jurist": ["jura", "erhvervsjura"],
  "jura": ["jura", "juridisk"],
  "ingeniør": ["ingeniør", "teknisk videnskab", "bygningsdesign", "computer engineering", "maskinteknik", "kemi"],
  "civilingeniør": ["ingeniør", "teknisk videnskab"],
  "diplomingeniør": ["ingeniør", "diplom"],
  "arkitekt": ["arkitektur", "bygningsdesign", "byggeri", "design"],
  "skovingeniør": ["skov", "landskab", "naturressourcer"],
  "programmør": ["datalogi", "softwareudvikling", "software", "computer", "kunstig intelligens"],
  "kodning": ["datalogi", "softwareudvikling", "software", "computer engineering"],
  "datalog": ["datalogi"],
  "software": ["softwareudvikling", "software", "datalogi", "computer engineering"],
  "skolelærer": ["lærer", "folkeskolelærer"],
  "lærer": ["lærer", "pædagog", "folkeskolelærer"],
  "pædagog": ["pædagog", "pædagogik", "børnepædagog"],
  "vuggestue": ["pædagog"],
  "børnehave": ["pædagog"],
  "revisor": ["revision", "erhvervsøkonomi", "økonomi", "ha"],
  "økonomi": ["erhvervsøkonomi", "økonomi", "ha", "cbs"],
  "finans": ["finansbachelor", "erhvervsøkonomi", "økonomi"],
  "bank": ["finansbachelor", "erhvervsøkonomi"],
  "markedsføring": ["erhvervsøkonomi", "ha", "marketing", "salg"],
  "salg": ["erhvervsøkonomi", "ha", "salg"],
  "branding": ["erhvervsøkonomi", "ha", "kommunikation"],
  "journalistik": ["journalistik", "presse", "medier", "kommunikation"],
  "journalist": ["journalistik", "presse", "medier"],
  "psykolog": ["psykologi", "psykoterapeut"],
  "psykoterapeut": ["psykologi"],
  "terapeut": ["psykologi", "fysioterapi", "ergoterapi"],
  "politiker": ["statskundskab", "politik", "samfundsfag"],
  "statskundskab": ["statskundskab", "politik", "samfundsfag"],
  "politi": ["politibetjent", "jura", "kriminologi"],
  "politibetjent": ["jura", "kriminologi"],
  "skuespiller": ["teater", "performancestudier", "musik", "film"],
  "grafisk design": ["multimediedesigner", "visuel kommunikation", "design"],
  "multimedie": ["multimediedesigner", "visuel kommunikation", "webudvikling"],
  "webudvikling": ["multimediedesigner", "datalogi", "software"],
  "miljø": ["miljøteknologi", "bæredygtighed", "biologi"],
  "klima": ["miljøteknologi", "bæredygtig design", "geografi"],
  "bæredygtighed": ["bæredygtig design", "miljøteknologi"],
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
  "kodning": ["datalogi", "softwareudvikling"],
  "psykolog": ["psykologi"],
  "sygeplejerske": ["sygeplejerske"],
  "journalistik": ["journalistik"],
  "journalist": ["journalistik"],
  "revisor": ["erhvervsøkonomi", "revision"],
  "økonomi": ["erhvervsøkonomi", "økonomi"]
};

function normalizeSearchText(text: string): string {
  let cleaned = text
    .toLowerCase()
    .replace(/tændlæge/g, "tandlæge")
    .replace(/ordontologi/g, "odontologi")
    .replace(/naestved/g, "næstved")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .trim();

  // Dansk stammafskæring (Suffix Stemming for pluralis og verber)
  if (cleaned.length > 5) {
    cleaned = cleaned
      .replace(/erne$/g, "")
      .replace(/erne$/g, "")
      .replace(/ing$/g, "")
      .replace(/erne$/g, "")
      .replace(/er$/g, "")
      .replace(/et$/g, "")
      .replace(/en$/g, "");
  }
  return cleaned;
}

// Lazy load signature elements for better initial load performance
const CompactTriangleRadar = dynamic(() => Promise.resolve(function CompactTriangleRadarComponent({ robust, job, salary }: { robust: number; job: number; salary: number }) {
  const R = 34;
  const cx = 50;
  const cy = 48;
  
  const rRob = R * (robust / 100);
  const rJob = R * (job / 100);
  const rSal = R * (salary / 100);
  
  const pRob = { x: cx, y: cy - rRob };
  const pJob = { x: cx - rJob * 0.866, y: cy + rJob * 0.5 };
  const pSal = { x: cx + rSal * 0.866, y: cy + rSal * 0.5 };

  // Reference 100% outer triangle
  const refRob100 = { x: cx, y: cy - R };
  const refJob100 = { x: cx - R * 0.866, y: cy + R * 0.5 };
  const refSal100 = { x: cx + R * 0.866, y: cy + R * 0.5 };

  // Reference 50% benchmark inner triangle
  const R50 = R * 0.5;
  const refRob50 = { x: cx, y: cy - R50 };
  const refJob50 = { x: cx - R50 * 0.866, y: cy + R50 * 0.5 };
  const refSal50 = { x: cx + R50 * 0.866, y: cy + R50 * 0.5 };

  // Color & status evaluation based on average composite score
  const avg = Math.round((robust + job + salary) / 3);
  let strokeColor = "#0F9D6E";
  let fillColor = "#0F9D6E";
  let badgeBg = "bg-[#E3F6EE]";
  let badgeText = "text-[#0B7A57]";
  let badgeBorder = "border-[#0F9D6E]/30";
  let statusLabel = "Stærk";

  if (avg < 65) {
    strokeColor = "#D97706";
    fillColor = "#D97706";
    badgeBg = "bg-[#FEF3C7]";
    badgeText = "text-[#B45309]";
    badgeBorder = "border-[#B45309]/30";
    statusLabel = "Lavere";
  } else if (avg < 78) {
    strokeColor = "#2563EB";
    fillColor = "#2563EB";
    badgeBg = "bg-[#EFF6FF]";
    badgeText = "text-[#1D4ED8]";
    badgeBorder = "border-[#2563EB]/30";
    statusLabel = "Moderat";
  }

  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      <svg viewBox="0 0 100 92" className="w-24 h-22 overflow-visible">
        {/* 100% Outer reference triangle */}
        <polygon points={`${refRob100.x},${refRob100.y} ${refJob100.x},${refJob100.y} ${refSal100.x},${refSal100.y}`} fill="none" stroke="#D8DBE4" strokeWidth="1" strokeDasharray="2 2" />
        
        {/* 50% Benchmark inner triangle */}
        <polygon points={`${refRob50.x},${refRob50.y} ${refJob50.x},${refJob50.y} ${refSal50.x},${refSal50.y}`} fill="none" stroke="#E7E9EF" strokeWidth="1" strokeDasharray="2 2" />

        {/* Center axes to 100% vertices */}
        <line x1={cx} y1={cy} x2={refRob100.x} y2={refRob100.y} stroke="#F0F2F5" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={refJob100.x} y2={refJob100.y} stroke="#F0F2F5" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={refSal100.x} y2={refSal100.y} stroke="#F0F2F5" strokeWidth="1" />
        
        {/* Color-coded actual score polygon */}
        <polygon points={`${pRob.x},${pRob.y} ${pJob.x},${pJob.y} ${pSal.x},${pSal.y}`} fill={fillColor} fillOpacity="0.2" stroke={strokeColor} strokeWidth="2" />
        
        {/* Corner dots */}
        <circle cx={pRob.x} cy={pRob.y} r="3.5" fill="#0F9D6E" />
        <circle cx={pJob.x} cy={pJob.y} r="3.5" fill="#2563EB" />
        <circle cx={pSal.x} cy={pSal.y} r="3.5" fill="#7C3AED" />

        {/* Mini score labels near vertices */}
        <text x={cx} y={refRob100.y - 4} fill="#0F9D6E" fontSize="7.5" fontWeight="bold" textAnchor="middle">AI: {robust}</text>
        <text x={refJob100.x - 2} y={refJob100.y + 10} fill="#2563EB" fontSize="7.5" fontWeight="bold" textAnchor="end">Job: {job}</text>
        <text x={refSal100.x + 2} y={refSal100.y + 10} fill="#7C3AED" fontSize="7.5" fontWeight="bold" textAnchor="start">Løn: {salary}</text>
      </svg>

      {/* Clear Status Badge */}
      <span className={`text-[10px] font-bold font-mono-data px-2 py-0.5 rounded-full border ${badgeBg} ${badgeText} ${badgeBorder}`}>
        Trekant-profil ({avg} · {statusLabel})
      </span>
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



interface ProgramItem {
  kot_nr?: string;
  udbud_titel?: string;
  institution_navn?: string;
  adgangskvotient_kvote1?: string;
  scores?: {
    automation_risk?: number;
    labour_demand?: number;
    salary_growth?: number;
  };
  skills_hierarchy?: { courses?: string[] };
  rag_evidence?: Array<{ quote: string; source: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export default function Dashboard() {
  const [allPrograms] = useState<ProgramItem[]>(
    initialProgramsCatalog as unknown as ProgramItem[]
  );
  const loading = false;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [gpa, setGpa] = useState(9.5);
  
  const [aiRobustnessWeight, setAiRobustnessWeight] = useState(80);
  const [jobOpportunitiesWeight, setJobOpportunitiesWeight] = useState(70);
  const [salaryWeight, setSalaryWeight] = useState(60);

  const [expandedProgram, setExpandedProgram] = useState<ProgramItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlGpa = params.get("gpa");
      const urlAi = params.get("wAi");
      const urlJob = params.get("wJob");
      const urlSal = params.get("wSal");
      const urlQ = params.get("q");

      if (urlGpa || urlAi || urlJob || urlSal || urlQ) {
        requestAnimationFrame(() => {
          if (urlGpa && !isNaN(Number(urlGpa))) setGpa(Number(urlGpa));
          if (urlAi && !isNaN(Number(urlAi))) setAiRobustnessWeight(Number(urlAi));
          if (urlJob && !isNaN(Number(urlJob))) setJobOpportunitiesWeight(Number(urlJob));
          if (urlSal && !isNaN(Number(urlSal))) setSalaryWeight(Number(urlSal));
          if (urlQ) setSearchQuery(urlQ);
        });
      }
    }
  }, []);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredSelectedUniversity = useDeferredValue(selectedUniversity);

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
    const totalWeight = Math.max(1, aiRobustnessWeight + jobOpportunitiesWeight + salaryWeight);

    let list = allPrograms.map((prog) => {
      const latestKv = prog.latest_kvotient;
      const kvNum = typeof latestKv === "number" ? latestKv : null;
      const meetsGpa = kvNum !== null ? gpa >= kvNum : true;
      
      const enriched = getEnrichedScores(prog.udbud_titel, prog.scores);
      const robustScore = 100 - (enriched.automation_risk || 0);
      const jobScore = enriched.labour_demand || 50;
      const salScore = enriched.salary_growth || 50;

      const weightedComposite = (
        (robustScore * aiRobustnessWeight) +
        (jobScore * jobOpportunitiesWeight) +
        (salScore * salaryWeight)
      ) / totalWeight;

      let score = Math.round(weightedComposite);
      if (meetsGpa) score = Math.min(99, score + 2);
      // Keep the score interpretable: do not inflate low scores to an artificial 50% floor.

      let relevanceBoost = 0;
      const pTitle = prog.udbud_titel || "";
      if (deferredSearchQuery.trim()) {
        const pTitleLow = pTitle.toLowerCase();
        const pNormTitle = normalizeSearchText(pTitleLow);
        const pDisco = (prog.disco_titel || "").toLowerCase();
        const pKot = (prog.kot_nr || "").toLowerCase();

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

      const gpaEligibilityBonus = (kvNum !== null && meetsGpa) ? 15 : 0;
      const totalSortScore = weightedComposite + relevanceBoost + gpaEligibilityBonus;

      prog.udbud_titel = formatProgramTitle(prog.udbud_titel || "Uddannelsen");

      let whyText = "";
      let qual = "stabil arbejdsmarkeds-efterspørgsel";
      if (jobScore >= 85) qual = "meget stærk efterspørgsel";
      else if (jobScore >= 70) qual = "stærk efterspørgsel";
      else if (jobScore < 40) qual = "lavere efterspørgsel";

      let robustQual = "moderat";
      if (robustScore >= 88) robustQual = "meget høj";
      else if (robustScore >= 75) robustQual = "høj";
      else if (robustScore < 50) robustQual = "lavere";

      if (kvNum !== null) {
        if (meetsGpa) {
          whyText = `Med et snit på ${gpa.toFixed(1)} opfylder du Kvote 1-kravet på ${kvNum}. AI-robustheden er ${robustQual} (${robustScore}/100), og feltet har ${qual}.`;
        } else {
          whyText = `Kvote 1-kvotienten var senest ${kvNum} — med et snit på ${gpa.toFixed(1)} anbefales ansøgning via Kvote 2. AI-robustheden er ${robustQual} (${robustScore}/100).`;
        }
      } else {
        whyText = `Alle opfyldende ansøgere blev optaget i 2026. Uddannelsen har ${robustQual} AI-robusthed (${robustScore}/100) og ${qual}.`;
      }

      const institutionName = (prog.institution || prog.institution_navn || "") as string;
      const latestKvotientVal = (prog.latest_kvotient || "Alle optaget") as React.ReactNode;
      const cityName = (prog.by || "") as string;
      return { ...prog, by: cityName, institution: institutionName, latest_kvotient: latestKvotientVal, skills_hierarchy: prog.skills_hierarchy, rag_evidence: prog.rag_evidence, matchScore: score, weightedComposite, totalSortScore, whyText, meetsGpa, kvNum, robustScore, jobScore, salScore, locationsCount: 1, locationsList: [formatCityName(cityName)] };
    });

    list = list.filter((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = p as Record<string, any>;
      if (deferredSearchQuery.trim()) {
        const pTitle = (item.udbud_titel || "").toLowerCase();
        const pDisco = (item.disco_titel || "").toLowerCase();
        const pKot = (item.kot_nr || "").toLowerCase();
        const pCity = (item.by || "").toLowerCase();
        const pInst = (item.institution || item.institution_navn || "").toLowerCase();

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

      if (deferredSelectedUniversity !== "all") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = p as Record<string, any>;
        const kot = String(item.kot_nr || "");
        const inst = (item.institution || item.institution_navn || "").toLowerCase();
        const title = (item.udbud_titel || "").toLowerCase();

        const isUniv = kot.length === 5 && parseInt(kot, 10) >= 10000 && parseInt(kot, 10) < 30000;

        if (deferredSelectedUniversity === "cbs") {
          return kot.startsWith("13") || inst.includes("cbs") || inst.includes("copenhagen business school") || title.includes("copenhagen business school");
        }
        if (deferredSelectedUniversity === "ku") {
          return kot.startsWith("10") || inst.includes("københavns universitet") || inst.includes("ku,") || inst === "ku";
        }
        if (deferredSelectedUniversity === "dtu") {
          return kot.startsWith("14") || kot.startsWith("15") || kot.startsWith("23") || inst.includes("dtu") || inst.includes("danmarks tekniske");
        }
        if (deferredSelectedUniversity === "au") {
          return kot.startsWith("20") || kot.startsWith("21") || kot.startsWith("22") || inst.includes("aarhus universitet") || inst.includes("au,");
        }
        if (deferredSelectedUniversity === "sdu") {
          return kot.startsWith("17") || kot.startsWith("18") || kot.startsWith("19") || inst.includes("syddansk") || inst.includes("sdu,");
        }
        if (deferredSelectedUniversity === "aau") {
          return kot.startsWith("25") || kot.startsWith("26") || inst.includes("aalborg universitet") || inst.includes("aau,");
        }
        if (deferredSelectedUniversity === "ruc") {
          return kot.startsWith("16") || inst.includes("roskilde universitet") || inst.includes("ruc,");
        }
        if (deferredSelectedUniversity === "itu") {
          return kot.startsWith("24") || inst.includes("it-universitet") || inst.includes("itu,") || title.includes("it-universitet");
        }
        if (deferredSelectedUniversity === "professionshojskole") {
          if (isUniv) return false;
          return (kot.length === 5 && parseInt(kot, 10) >= 30000) || title.includes("professionsbachelor") || title.includes("erhvervsakademi") || inst.includes("professionshøjskole") || inst.includes("erhvervsakademi");
        }
      }

      return true;
    });

    const sorted = list.sort((a, b) => b.totalSortScore - a.totalSortScore);

    // If no search query is active, group program types by canonical key so top recommendations show diverse degrees
    if (!deferredSearchQuery.trim()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const groups = new Map<string, any[]>();
      for (const item of sorted) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const key = normalizeProgramName((item as any).udbud_titel || "");
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(item);
      }

      const deduplicated = [];
      for (const groupItems of groups.values()) {
        const rep = { ...groupItems[0] };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cities = Array.from(new Set(groupItems.map((p: any) => formatCityName(p.by || "")))).filter(Boolean);
        rep.locationsCount = cities.length;
        rep.locationsList = cities;
        deduplicated.push(rep);
      }
      return deduplicated;
    }

    return sorted;
  }, [deferredSearchQuery, deferredSelectedUniversity, gpa, aiRobustnessWeight, jobOpportunitiesWeight, salaryWeight, allPrograms]);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Uddannelsesindsigt",
    "url": "https://uddannelsesindsigt.dk",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://uddannelsesindsigt.dk/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const topMatches = matchedPrograms.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Header />

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
            Justér de tre skydere nedenfor, og få dine personlige anbefalinger — baseret på de nyeste officielle optagelsestal.
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
          <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
            AI-robusthed er et modelestimat baseret på opgaveeksponering og augmentationspotentiale — ikke en prognose for arbejdsløshed eller en garanti for job.
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#545D71] uppercase tracking-wider flex items-center gap-1.5">
                <SlidersIcon /> Hvad betyder mest for dig?
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#12172B] hover:bg-[#1E293B] text-[#FFFFFF] font-bold rounded-xl text-xs transition card-shadow focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              >
                <span>✨</span>
                <span>Del dit match</span>
              </button>
              <span className="text-xs text-[#545D71] font-mono-data font-semibold hidden sm:inline">
                {loading ? "Henter..." : `${matchedPrograms.length} matchede uddannelser`}
              </span>
            </div>
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
                const isExpanded = expandedProgram?.kot_nr === prog.kot_nr;
                return (
                  <article
                    key={prog.kot_nr}
                    className="border border-[#E7E9EF] bg-[#FFFFFF] rounded-xl p-5 card-shadow hover:border-[#D8DBE4] transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-1.5 text-xs text-[#545D71]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#0B7A57]">#{index + 1} Modelscore ({prog.matchScore}%)</span>
                            <span>•</span>
                            <span>{prog.institution}</span>
                            <span>•</span>
                            <span className="font-mono-data text-[#8891A3]">KOT {prog.kot_nr}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowShareModal(true);
                            }}
                            title="Del dette match"
                            className="p-1.5 text-[#8891A3] hover:text-[#12172B] hover:bg-[#F7F8FA] rounded transition flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-5.999 3 3 0 000 5.999zm0 11.998a3 3 0 100-5.999 3 3 0 000 5.999" />
                            </svg>
                            <span className="text-[10px] font-semibold hidden sm:inline">Del</span>
                          </button>
                        </div>
                        <h3 className="text-xl font-bold text-[#12172B] tracking-tight font-display hover:text-[#2563EB] transition">
                          <Link href={`/uddannelse/${createProgramSlug(prog)}`}>
                            {prog.udbud_titel}
                          </Link>
                        </h3>
                        {prog.locationsCount && prog.locationsCount > 1 ? (
                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
                              Findes {prog.locationsCount} steder ({prog.locationsList.slice(0, 3).join(", ")}{prog.locationsList.length > 3 ? `, +${prog.locationsList.length - 3}` : ""})
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="text-left sm:text-right space-y-1 w-full sm:w-auto border-t sm:border-t-0 border-[#E7E9EF] pt-2 sm:pt-0">
                        <span className="text-[11px] text-[#8891A3] block">Kvote 1 adgangskvotient (2026)</span>
                        {prog.kvNum !== null ? (
                          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1">
                            <span className="text-xl font-bold text-[#12172B] font-mono-data">{prog.latest_kvotient}</span>
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                              prog.meetsGpa 
                                ? "bg-[#E6F4ED] text-[#0B7A57] border-[#0F9D6E]/20"
                                : "bg-[#FDF1E3] text-[#B45309] border-[#B45309]/20"
                            }`}>
                              {prog.meetsGpa ? <CheckCircleIcon /> : <AlertTriangleIcon />}
                              {prog.meetsGpa ? "Kvote 1 opfyldt" : `Søg Kvote 2 (Kvote 1: ${prog.kvNum})`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1">
                            <span className="text-xl font-bold text-[#12172B] font-mono-data">Alle optaget</span>
                            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#E6F4ED] text-[#0B7A57] border border-[#0F9D6E]/20">
                              <CheckCircleIcon /> Alle optaget
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Triangle Radar + 3 Horizontal Progress Bars */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#FFFFFF] p-4 rounded-xl border border-[#E7E9EF]">
                      <div className="bg-[#F7F8FA] p-3 rounded-lg border border-[#E7E9EF] flex flex-col items-center justify-center shrink-0 w-36">
                        <CompactTriangleRadar robust={prog.robustScore} job={prog.jobScore} salary={prog.salScore} />
                      </div>
                      <div className="flex-1 space-y-2.5 w-full">
                        {/* Bar 1: AI-robusthed */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-[#12172B]">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#0F9D6E]"></span> AI-robusthed
                            </span>
                            <span className="font-mono-data font-bold text-[#0F9D6E]">{prog.robustScore}/100</span>
                          </div>
                          <div className="h-2 bg-[#E7E9EF] rounded-full overflow-hidden">
                            <div className="h-full bg-[#0F9D6E] rounded-full" style={{ width: `${prog.robustScore}%` }}></div>
                          </div>
                        </div>

                        {/* Bar 2: Jobmuligheder */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-[#12172B]">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span> Jobmuligheder
                            </span>
                            <span className="font-mono-data font-bold text-[#2563EB]">{prog.jobScore}/100</span>
                          </div>
                          <div className="h-2 bg-[#E7E9EF] rounded-full overflow-hidden">
                            <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${prog.jobScore}%` }}></div>
                          </div>
                        </div>

                        {/* Bar 3: Lønpotentiale */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-[#12172B]">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]"></span> Lønpotentiale
                            </span>
                            <span className="font-mono-data font-bold text-[#7C3AED]">{prog.salScore}/100</span>
                          </div>
                          <div className="h-2 bg-[#E7E9EF] rounded-full overflow-hidden">
                            <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: `${prog.salScore}%` }}></div>
                          </div>
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
                        {isExpanded ? "Skjul detaljer" : "Se fuld analyse →"}
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
                          {prog.rag_evidence?.map((ev: { quote: string; source: string }, i: number) => (
                            <div key={i} className="bg-[#F7F8FA] p-3 rounded-lg border border-[#E7E9EF] space-y-1">
                              <p className="text-[#12172B] italic">&quot;{ev.quote}&quot;</p>
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

      {/* Share Match Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-[#12172B]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-2xl p-6 sm:p-8 max-w-lg w-full card-shadow space-y-6 relative animate-in fade-in zoom-in-95 duration-150 text-left">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F7F8FA] hover:bg-[#E7E9EF] text-[#545D71] font-bold flex items-center justify-center transition"
              aria-label="Luk modal"
            >
              ✕
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F6EE] text-[#0B7A57] border border-[#0F9D6E]/20">
                <span>🎯 Dit Personlige Uddannelsesmatch</span>
              </div>
              <h3 className="text-2xl font-bold text-[#12172B] tracking-tight font-display">
                Del dit resultat
              </h3>
              <p className="text-xs text-[#545D71]">
                Generér et direkte link eller kopiér dit top-match til Instagram Stories, Facebook eller gruppechats.
              </p>
            </div>

            {/* Social Card Preview */}
            {matchedPrograms.length > 0 && (
              <div className="bg-gradient-to-br from-[#12172B] to-[#1E293B] text-[#FFFFFF] rounded-xl p-5 space-y-4 shadow-md">
                <div className="flex justify-between items-center text-[11px] text-[#A1A1AA] border-b border-[#3F3F46] pb-3">
                  <span className="font-bold text-[#38BDF8]">UDDANNELSESINDSIGT.DK</span>
                  <span className="bg-[#0F9D6E] text-white font-mono-data px-2 py-0.5 rounded text-[10px] font-bold">
                    {matchedPrograms[0].matchScore}% MATCH
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#10B981] uppercase tracking-wider">#1 Top Anbefaling</span>
                  <h4 className="text-xl font-bold tracking-tight text-white font-display">
                    {matchedPrograms[0].udbud_titel}
                  </h4>
                  <p className="text-xs text-[#D4D4D8]">
                    {matchedPrograms[0].institution} • KOT {matchedPrograms[0].kot_nr}
                  </p>
                </div>
                <div className="bg-[#27272A] p-3 rounded-lg flex flex-wrap justify-between text-[11px] text-[#A1A1AA] gap-2 font-mono-data">
                  <span>Snit: {gpa.toFixed(1)}</span>
                  <span>AI-vægt: {aiRobustnessWeight}%</span>
                  <span>Job: {jobOpportunitiesWeight}%</span>
                  <span>Løn: {salaryWeight}%</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}/?gpa=${gpa.toFixed(1)}&wAi=${aiRobustnessWeight}&wJob=${jobOpportunitiesWeight}&wSal=${salaryWeight}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`;
                  navigator.clipboard.writeText(shareUrl);
                  setCopiedToast(true);
                  setTimeout(() => setCopiedToast(false), 3000);
                }}
                className="w-full py-3 bg-[#12172B] hover:bg-[#1E293B] text-[#FFFFFF] font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition card-shadow focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <span>📋</span>
                <span>Kopiér direkte match-link</span>
              </button>

              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/?gpa=${gpa.toFixed(1)}&wAi=${aiRobustnessWeight}&wJob=${jobOpportunitiesWeight}&wSal=${salaryWeight}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`;
                    const topTitle = matchedPrograms.length > 0 ? matchedPrograms[0].udbud_titel : "Uddannelse";
                    const topScore = matchedPrograms.length > 0 ? matchedPrograms[0].matchScore : "89";
                    navigator.share({
                      title: `Mit match: ${topTitle} (${topScore}%)`,
                      text: `Min modelscore er ${topScore}% for ${topTitle} på Uddannelsesindsigt! Se hvad du matcher med:`,
                      url: shareUrl,
                    }).catch(() => {});
                  }}
                  className="w-full py-3 bg-[#E3F6EE] hover:bg-[#D2F1E4] text-[#0B7A57] border border-[#0F9D6E]/30 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-[#0F9D6E]"
                >
                  <span>📱</span>
                  <span>Del via apps (Instagram, Beskeder, Messenger)</span>
                </button>
              )}

              <button
                onClick={() => {
                  const topTitle = matchedPrograms.length > 0 ? matchedPrograms[0].udbud_titel : "Uddannelse";
                  const topScore = matchedPrograms.length > 0 ? matchedPrograms[0].matchScore : "89";
                  const shareUrl = `${window.location.origin}/?gpa=${gpa.toFixed(1)}&wAi=${aiRobustnessWeight}&wJob=${jobOpportunitiesWeight}&wSal=${salaryWeight}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`;
                  const storyText = `🎯 Min top-modelscore er ${topTitle} (${topScore}%) på Uddannelsesindsigt!\n\nFind dit eget match her: ${shareUrl}`;
                  navigator.clipboard.writeText(storyText);
                  setCopiedToast(true);
                  setTimeout(() => setCopiedToast(false), 3000);
                }}
                className="w-full py-3 bg-[#F7F8FA] hover:bg-[#E7E9EF] text-[#12172B] border border-[#E7E9EF] font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <span>💬</span>
                <span>Kopiér teksten til Socials / Chat</span>
              </button>
            </div>

            {copiedToast && (
              <div className="p-3 bg-[#E3F6EE] border border-[#0F9D6E]/30 text-[#0B7A57] text-xs font-bold rounded-xl text-center animate-in fade-in">
                ✅ Kopieret til udklipsholder! Klar til at dele.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
