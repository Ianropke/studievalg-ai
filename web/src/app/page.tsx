"use client";

import React, { useState, useMemo, useEffect, useDeferredValue } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics/react";
import { Header } from "@/components/Header";
import { createProgramSlug } from "@/lib/slugs";
import { getEnrichedScores } from "@/lib/domainScoring";
import type { NormalizedScores, RawProgramScores } from "@/lib/domainScoring";
import { normalizeProgramName } from "@/lib/programName";
import { formatProgramTitle, formatCityName } from "@/lib/textUtils";
import { ScoreDisclosure } from "@/components/ScoreDisclosure";
import { EvidenceList } from "@/components/EvidenceList";
import { DATA_STATUS } from "@/lib/dataStatus";
import { aiBand, roundAiScore } from "@/lib/aiPresentation";
import { buildMatchSharePath, parseMatchShareParams, type ShareableUniversity } from "@/lib/shareMatch";
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

function AiModelIndicator({ score, eligible }: { score: number; eligible: boolean }) {
  if (!eligible) {
    return (
      <div className="rounded-lg border border-[#D8DBE4] bg-[#F7F8FA] p-4 text-xs text-[#545D71]">
        <strong className="block text-[#12172B]">AI-perspektiv ikke tilgængeligt</strong>
        Denne uddannelse har endnu ikke en defensibel programkobling til O*NET 31.0.
      </div>
    );
  }

  const band = aiBand(score);
  return (
    <div className="rounded-lg border border-[#0F9D6E]/25 bg-[#E3F6EE] p-4" data-testid="ai-model-indicator">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#0B7A57]">AI-modelestimat</span>
          <strong className="block text-base text-[#12172B]">{band} AI-robusthed</strong>
        </div>
        <span className="rounded-full border border-[#0F9D6E]/30 bg-white px-3 py-1 text-xs font-bold text-[#0B7A57]">ca. {roundAiScore(score)}/100</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-[#545D71]">Opgavebaseret crosswalk-estimat — ikke en jobprognose eller garanti.</p>
    </div>
  );
}

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
  scores?: RawProgramScores;
  skills_hierarchy?: { courses?: string[] };
  rag_evidence?: Array<{ quote: string; source: string }>;
  scoreDetails?: NormalizedScores;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function Dashboard() {
  const [allPrograms] = useState<ProgramItem[]>(initialProgramsCatalog as unknown as ProgramItem[]);
  const loading = false;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [gpa, setGpa] = useState(9.5);
  const [includeAiModels, setIncludeAiModels] = useState(false);
  const [expandedProgram, setExpandedProgram] = useState<ProgramItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const shared = parseMatchShareParams(window.location.search);
      if (Object.keys(shared).length > 0) {
        requestAnimationFrame(() => {
          if (shared.gpa !== undefined) setGpa(shared.gpa);
          if (shared.includeAiModels !== undefined) setIncludeAiModels(shared.includeAiModels);
          if (shared.university) setSelectedUniversity(shared.university);
          if (shared.query) setSearchQuery(shared.query);
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
    let list = allPrograms.map((prog) => {
      const latestKv = prog.latest_kvotient;
      const kvNum = typeof latestKv === "number" ? latestKv : null;
      const meetsGpa = kvNum !== null ? gpa >= kvNum : true;
      const enriched = getEnrichedScores(prog.udbud_titel, prog.scores);
      const robustScore = enriched.ai_resilience;
      const aiEligible = enriched.ranking_eligible.ai;

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
          if (directTitleMatch || directKotMatch) relevanceBoost = 300;
          else if (discoMatch) relevanceBoost = 100;
          else relevanceBoost = 20;
        }
      }

      const gpaEligibilityBonus = (kvNum !== null && meetsGpa) ? 15 : 0;
      const aiSortScore = includeAiModels && aiEligible ? robustScore : 0;
      const totalSortScore = relevanceBoost + gpaEligibilityBonus + aiSortScore;
      prog.udbud_titel = formatProgramTitle(prog.udbud_titel || "Uddannelsen");

      const aiPhrase = includeAiModels
        ? `AI-modelestimatet er ${aiBand(robustScore)} (ca. ${roundAiScore(robustScore)}/100)`
        : "";
      let whyText = "";
      if (kvNum !== null) {
        if (meetsGpa) {
          whyText = `Med et snit på ${gpa.toFixed(1)} opfylder du den seneste Kvote 1-kvotient på ${kvNum}.${aiPhrase ? ` ${aiPhrase}.` : ""}`;
        } else {
          whyText = `Den seneste Kvote 1-kvotient var ${kvNum}, så et snit på ${gpa.toFixed(1)} ligger under den observerede grænse.${aiPhrase ? ` ${aiPhrase}.` : ""}`;
        }
      } else {
        whyText = `KOT-data angiver “Alle optaget” for den seneste optagelse.${aiPhrase ? ` ${aiPhrase}.` : ""}`;
      }

      const institutionName = (prog.institution || prog.institution_navn || "") as string;
      const latestKvotientVal = (prog.latest_kvotient || "Alle optaget") as React.ReactNode;
      const cityName = (prog.by || "") as string;
      return { ...prog, by: cityName, institution: institutionName, latest_kvotient: latestKvotientVal, skills_hierarchy: prog.skills_hierarchy, rag_evidence: prog.rag_evidence, scoreDetails: enriched, totalSortScore, whyText, meetsGpa, kvNum, robustScore, aiEligible, locationsCount: 1, locationsList: [formatCityName(cityName)] };
    });

    list = list.filter((p) => {
      const item = p as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (includeAiModels && !item.aiEligible) return false;
      if (deferredSearchQuery.trim()) {
        const pTitle = (item.udbud_titel || "").toLowerCase();
        const pDisco = (item.disco_titel || "").toLowerCase();
        const pKot = (item.kot_nr || "").toLowerCase();
        const pCity = (item.by || "").toLowerCase();
        const pInst = (item.institution || item.institution_navn || "").toLowerCase();
        const matchesSearch = expandedTerms.some((term) => {
          if (!term) return false;
          const normTerm = normalizeSearchText(term);
          return pTitle.includes(term) || pTitle.includes(normTerm) || pDisco.includes(term) || pKot.includes(term) || pCity.includes(term) || pInst.includes(term);
        });
        if (!matchesSearch) return false;
      }

      if (deferredSelectedUniversity !== "all") {
        const item = p as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        const kot = String(item.kot_nr || "");
        const inst = (item.institution || item.institution_navn || "").toLowerCase();
        const title = (item.udbud_titel || "").toLowerCase();
        const isUniv = kot.length === 5 && parseInt(kot, 10) >= 10000 && parseInt(kot, 10) < 30000;
        if (deferredSelectedUniversity === "cbs") return kot.startsWith("13") || inst.includes("cbs") || inst.includes("copenhagen business school") || title.includes("copenhagen business school");
        if (deferredSelectedUniversity === "ku") return kot.startsWith("10") || inst.includes("københavns universitet") || inst.includes("ku,") || inst === "ku";
        if (deferredSelectedUniversity === "dtu") return kot.startsWith("14") || kot.startsWith("15") || kot.startsWith("23") || inst.includes("dtu") || inst.includes("danmarks tekniske");
        if (deferredSelectedUniversity === "au") return kot.startsWith("20") || kot.startsWith("21") || kot.startsWith("22") || inst.includes("aarhus universitet") || inst.includes("au,");
        if (deferredSelectedUniversity === "sdu") return kot.startsWith("17") || kot.startsWith("18") || kot.startsWith("19") || inst.includes("syddansk") || inst.includes("sdu,");
        if (deferredSelectedUniversity === "aau") return kot.startsWith("25") || kot.startsWith("26") || inst.includes("aalborg universitet") || inst.includes("aau,");
        if (deferredSelectedUniversity === "ruc") return kot.startsWith("16") || inst.includes("roskilde universitet") || inst.includes("ruc,");
        if (deferredSelectedUniversity === "itu") return kot.startsWith("24") || inst.includes("it-universitet") || inst.includes("itu,") || title.includes("it-universitet");
        if (deferredSelectedUniversity === "professionshojskole") {
          if (isUniv) return false;
          return (kot.length === 5 && parseInt(kot, 10) >= 30000) || title.includes("professionsbachelor") || title.includes("erhvervsakademi") || inst.includes("professionshøjskole") || inst.includes("erhvervsakademi");
        }
      }
      return true;
    });

    const sorted = list.sort((a, b) => b.totalSortScore - a.totalSortScore || String(a.udbud_titel).localeCompare(String(b.udbud_titel), "da"));
    if (!deferredSearchQuery.trim()) {
      const groups = new Map<string, any[]>(); // eslint-disable-line @typescript-eslint/no-explicit-any
      for (const item of sorted) {
        const key = normalizeProgramName((item as any).udbud_titel || ""); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
      }
      const deduplicated = [];
      for (const groupItems of groups.values()) {
        const rep = { ...groupItems[0] };
        const cities = Array.from(new Set(groupItems.map((p: any) => formatCityName(p.by || "")))).filter(Boolean); // eslint-disable-line @typescript-eslint/no-explicit-any
        rep.locationsCount = cities.length;
        rep.locationsList = cities;
        deduplicated.push(rep);
      }
      return deduplicated;
    }
    return sorted;
  }, [deferredSearchQuery, deferredSelectedUniversity, gpa, includeAiModels, allPrograms]);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Uddannelsesindsigt",
    "url": "https://uddannelsesindsigt.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://uddannelsesindsigt.com/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const topMatches = matchedPrograms.slice(0, visibleCount);
  const createShareUrl = () => `${window.location.origin}${buildMatchSharePath({
    gpa,
    includeAiModels,
    university: selectedUniversity as ShareableUniversity,
    query: searchQuery,
  })}`;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <Header />
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F6EE] text-[#0B7A57] border border-[#0F9D6E]/20">
            <span className="w-2 h-2 rounded-full bg-[#0F9D6E]"></span>
            <span>Optagelsesdata {DATA_STATUS.catalogue.admissionsUpdatedLabel} • {DATA_STATUS.catalogue.programmeCount.toLocaleString("da-DK")} uddannelser</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#12172B] leading-tight font-display">
            Hvilken uddannelse <br className="hidden sm:inline" />
            passer <span className="border-b-4 border-[#0F9D6E] pb-1">bedst til dig?</span>
          </h1>
          <p className="text-sm text-[#545D71] max-w-lg mx-auto font-normal leading-relaxed">
            Søg blandt alle danske videregående uddannelser, sammenlign observerede KOT-optagelsesdata, og vælg selv om tydeligt markerede AI-modelestimater skal indgå.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 card-shadow space-y-6 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-[#E7E9EF] pb-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <label htmlFor="gpa-slider" className="text-[#12172B]">Dit gymnasiale gennemsnit (Kvote 1)</label>
                <span className="text-[#12172B] font-mono-data font-bold text-sm">{gpa.toFixed(1)}</span>
              </div>
              <input id="gpa-slider" type="range" min="2.0" max="12.0" step="0.1" value={gpa} onChange={(e) => setGpa(Number(e.target.value))} aria-label={`Gennemsnit: ${gpa.toFixed(1)}`} className="w-full h-2 bg-[#E7E9EF] rounded-lg appearance-none cursor-pointer accent-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" />
            </div>
            <div className="space-y-2">
              <label htmlFor="university-select" className="text-xs font-semibold text-[#12172B] block">Vælg universitet eller uddannelsessted</label>
              <select id="university-select" value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)} className="w-full bg-[#FFFFFF] border border-[#D8DBE4] rounded-lg px-3 py-2 text-xs text-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]">
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
            KOT/adgangstal er observerede optagelsesdata. AI-robusthed er et O*NET-baseret model/crosswalkestimat, ikke en automatiseringssandsynlighed, jobprognose eller anbefaling om at vælge uddannelsen.
            <span className="mt-1 block">Se <Link href="/evidens" className="font-semibold underline">kilde- og metodeforklaringen</Link> for status og begrænsninger.</span>
          </div>
          <div data-testid="ai-model-toggle-panel" className={`rounded-xl border p-4 ${includeAiModels ? "border-[#0F9D6E]/35 bg-[#E3F6EE]" : "border-[#D8DBE4] bg-[#F7F8FA]"}`}>
            <label htmlFor="include-ai-models" className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <strong className="flex items-center gap-2 text-sm text-[#12172B]"><SlidersIcon /> Inddrag AI-modelestimater</strong>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#545D71]">
                  Slå til for at afgrænse og sortere efter de {DATA_STATUS.scoring.mappedProgrammeCount.toLocaleString("da-DK")} uddannelser med O*NET 31.0-modeldata. Standardvisningen søger i alle {DATA_STATUS.catalogue.programmeCount.toLocaleString("da-DK")} uddannelser.
                </span>
              </span>
              <input
                id="include-ai-models"
                data-testid="include-ai-models"
                type="checkbox"
                checked={includeAiModels}
                onChange={(event) => { setIncludeAiModels(event.currentTarget.checked); setVisibleCount(10); }}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#0F9D6E] focus:outline-none focus:ring-2 focus:ring-[#0F9D6E] focus:ring-offset-2"
              />
            </label>
            <p aria-live="polite" data-testid="ai-toggle-status" className="mt-3 border-t border-current/10 pt-3 text-xs font-semibold text-[#0B7A57]">
              {includeAiModels
                ? `AI er slået til · ${DATA_STATUS.scoring.mappedProgrammeCount.toLocaleString("da-DK")} af ${DATA_STATUS.catalogue.programmeCount.toLocaleString("da-DK")} uddannelser dækket`
                : `AI er slået fra · alle ${DATA_STATUS.catalogue.programmeCount.toLocaleString("da-DK")} uddannelser kan søges`}
            </p>
          </div>
          <div className="pt-2 border-t border-[#E7E9EF] relative">
            <div className="absolute inset-y-0 left-3 pl-1 flex items-center pointer-events-none pt-2"><SearchIcon /></div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Søg efter uddannelse eller erhverv" placeholder="Søg efter uddannelse eller erhverv (fx 'odontologi', 'læge', 'jura')..." className="w-full bg-[#F7F8FA] border border-[#D8DBE4] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#12172B] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]" />
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E7E9EF] text-xs">
            <span className="text-[#545D71] self-center font-medium">Filtrer:</span>
            {[
              { id: "all", label: "Alle" }, { id: "ku", label: "KU" }, { id: "dtu", label: "DTU" }, { id: "au", label: "AU" }, { id: "cbs", label: "CBS" }, { id: "sdu", label: "SDU" }, { id: "aau", label: "AAU" }, { id: "ruc", label: "RUC" }, { id: "professionshojskole", label: "Professionshøjskoler" },
            ].map((u) => (
              <button key={u.id} onClick={() => setSelectedUniversity(u.id)} className={`px-3 py-1 rounded-full border transition font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-1 ${selectedUniversity === u.id ? "bg-[#12172B] border-[#12172B] text-[#FFFFFF]" : "bg-[#FFFFFF] border-[#D8DBE4] text-[#545D71] hover:border-[#12172B] hover:text-[#12172B]"}`}>{u.label}</button>
            ))}
          </div>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-[#E7E9EF] pb-3">
            <div>
              <h2 className="text-xl font-bold text-[#12172B] font-display">Uddannelser at undersøge</h2>
              <p className="text-xs text-[#545D71]">{includeAiModels ? "AI-modelestimat indgår · kun uddannelser med O*NET 31.0-dækning" : "Sorteret efter søgerelevans og seneste Kvote 1-data · AI indgår ikke"}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowShareModal(true)} className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#12172B] hover:bg-[#1E293B] text-[#FFFFFF] font-bold rounded-xl text-xs transition card-shadow focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"><span>✨</span><span>Del dit match</span></button>
              <span className="text-xs text-[#545D71] font-mono-data font-semibold hidden sm:inline">{loading ? "Henter..." : `${matchedPrograms.length} matchede uddannelser`}</span>
            </div>
          </div>

          {loading ? (
            <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 text-center space-y-3 card-shadow animate-pulse">
              <div className="w-12 h-12 border-4 border-[#0F9D6E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-base font-bold text-[#12172B]">Downloader nyeste optagelsesdata...</h3>
              <p className="text-xs text-[#545D71]">Analyserer kataloget og markerer model-/provenansstatus.</p>
            </div>
          ) : topMatches.length > 0 ? (
            <div className="space-y-4" data-testid="ranked-program-results">
              <p aria-live="polite" className="text-xs text-[#545D71]">Resultaterne opdateres med det samme, når du søger, filtrerer, ændrer gennemsnittet eller slår AI til og fra.</p>
              {topMatches.map((prog, index) => {
                const isExpanded = expandedProgram?.kot_nr === prog.kot_nr;
                return (
                  <article key={prog.kot_nr} data-testid="program-card" data-program-id={prog.kot_nr} className="border border-[#E7E9EF] bg-[#FFFFFF] rounded-xl p-5 card-shadow hover:border-[#D8DBE4] transition space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-1.5 text-xs text-[#545D71]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#0B7A57]">#{index + 1}</span>
                            <span>{prog.institution}</span><span>•</span><span className="font-mono-data text-[#667085]">KOT {prog.kot_nr}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }} title="Del dette match" className="p-1.5 text-[#667085] hover:text-[#12172B] hover:bg-[#F7F8FA] rounded transition flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-5.999 3 3 0 000 5.999zm0 11.998a3 3 0 100-5.999 3 3 0 000 5.999" /></svg>
                            <span className="text-[10px] font-semibold hidden sm:inline">Del</span>
                          </button>
                        </div>
                        <h3 data-testid="program-title" className="text-xl font-bold text-[#12172B] tracking-tight font-display hover:text-[#2563EB] transition"><Link href={`/uddannelse/${createProgramSlug(prog)}`}>{prog.udbud_titel}</Link></h3>
                        {prog.locationsCount && prog.locationsCount > 1 ? (
                          <div className="pt-1"><span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">Findes {prog.locationsCount} steder ({prog.locationsList.slice(0, 3).join(", ")}{prog.locationsList.length > 3 ? `, +${prog.locationsList.length - 3}` : ""})</span></div>
                        ) : null}
                      </div>
                      <div className="text-left sm:text-right space-y-1 w-full sm:w-auto border-t sm:border-t-0 border-[#E7E9EF] pt-2 sm:pt-0">
                        <span className="text-[11px] text-[#667085] block">Kvote 1 adgangskvotient (seneste KOT-data)</span>
                        {prog.kvNum !== null ? (
                          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1"><span className="text-xl font-bold text-[#12172B] font-mono-data">{prog.latest_kvotient}</span><span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${prog.meetsGpa ? "bg-[#E6F4ED] text-[#0B7A57] border-[#0F9D6E]/20" : "bg-[#FDF1E3] text-[#B45309] border-[#B45309]/20"}`}>{prog.meetsGpa ? <CheckCircleIcon /> : <AlertTriangleIcon />}{prog.meetsGpa ? "Kvote 1 opfyldt" : `Under seneste Kvote 1 (${prog.kvNum})`}</span></div>
                        ) : (
                          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1"><span className="text-xl font-bold text-[#12172B] font-mono-data">Alle optaget</span><span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#E6F4ED] text-[#0B7A57] border border-[#0F9D6E]/20"><CheckCircleIcon /> Seneste KOT: Alle optaget</span></div>
                        )}
                      </div>
                    </div>

                    {includeAiModels && <AiModelIndicator score={prog.robustScore} eligible={prog.aiEligible} />}

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[#545D71] pt-1">
                      <p className="leading-relaxed flex-1"><strong className="text-[#12172B]">Begrundelse:</strong> {prog.whyText}</p>
                      <button onClick={() => setExpandedProgram(isExpanded ? null : prog)} className="text-[#2563EB] font-semibold hover:underline text-xs whitespace-nowrap self-end sm:self-auto flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded">{isExpanded ? "Skjul detaljer" : "Se fuld analyse →"}</button>
                    </div>
                    {isExpanded && (
                      <div className="pt-4 border-t border-[#E7E9EF] space-y-4 text-xs">
                        <div className="space-y-2"><span className="font-bold text-[#12172B] uppercase tracking-wider text-[11px] block">Kurser og fagindhold</span><div className="flex flex-wrap gap-1.5">{prog.skills_hierarchy?.courses?.map((c: string, i: number) => (<span key={i} className="bg-[#F7F8FA] text-[#12172B] border border-[#D8DBE4] px-2.5 py-1 rounded-md text-[11px] font-semibold">{c}</span>))}</div></div>
                        <div className="space-y-2 pt-2 border-t border-[#E7E9EF]"><span className="font-bold text-[#12172B] uppercase tracking-wider text-[11px] block">Evidenskilder</span>{includeAiModels && <ScoreDisclosure scores={prog.scoreDetails!} />}<EvidenceList evidence={prog.rag_evidence} /></div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 text-center space-y-3 card-shadow"><h3 className="text-base font-bold text-[#12172B]">Ingen matchende uddannelser fundet</h3><p className="text-xs text-[#545D71]">{includeAiModels ? "Din søgning gav ingen resultater blandt de 569 uddannelser med AI-modeldata. Slå AI fra for at søge i alle 1.413 uddannelser." : "Prøv at vælge et andet uddannelsessted eller ryd dit søgefelt."}</p><button onClick={() => { setSearchQuery(""); setSelectedUniversity("all"); setIncludeAiModels(false); }} className="px-4 py-2 bg-[#12172B] text-[#FFFFFF] rounded-lg text-xs font-semibold hover:bg-[#545D71] transition focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2">Nulstil og vis alle uddannelser</button></div>
          )}

          {visibleCount < matchedPrograms.length && (
            <div className="text-center pt-4"><button onClick={() => setVisibleCount((prev) => prev + 10)} className="px-6 py-2.5 bg-[#FFFFFF] border border-[#D8DBE4] hover:border-[#12172B] text-[#12172B] font-semibold rounded-lg text-xs transition card-shadow focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2">Vis flere anbefalinger (Viser {visibleCount} af {matchedPrograms.length})</button></div>
          )}
        </div>

        <section data-testid="guide-links" aria-labelledby="guide-links-heading" className="rounded-2xl border border-[#D8DBE4] bg-[#FFFFFF] p-6 sm:p-8 card-shadow space-y-5">
          <div className="max-w-2xl"><p className="text-[11px] font-bold uppercase tracking-wider text-[#0B7A57]">Gå et niveau dybere</p><h2 id="guide-links-heading" className="mt-1 text-xl font-bold font-display">Guides til dit næste valg</h2><p className="mt-2 text-xs leading-relaxed text-[#545D71]">Brug matchresultatet som startpunkt, og få hjælp til at forstå adgangskvotienter, AI-modelestimater og forskellene mellem uddannelser.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: "/guides/hvad-kan-jeg-laese-med-mit-snit", title: "Hvad kan jeg læse med mit snit?", text: "Forstå Kvote 1-tal og find relevante alternativer." },
              { href: "/guides/ai-og-uddannelsesvalg", title: "AI og uddannelsesvalg", text: "Brug AI-resiliens uden at læse modellen som en garanti." },
              { href: "/guides/saadan-sammenligner-du-uddannelser", title: "Sammenlign uddannelser", text: "En enkel tjekliste til adgang, indhold, sted og AI-perspektiv." },
            ].map((guide) => (
              <Link key={guide.href} href={guide.href} onClick={() => track("guide_open", { guide: guide.href.replace("/guides/", ""), source: "homepage" })} className="rounded-xl border border-[#E7E9EF] bg-[#F7F8FA] p-4 hover:bg-[#EFF6FF] hover:border-[#2563EB]/30 transition"><span className="block text-sm font-bold text-[#12172B]">{guide.title}</span><span className="mt-1 block text-[11px] leading-relaxed text-[#545D71]">{guide.text}</span><span className="mt-3 block text-xs font-bold text-[#2563EB]">Læs guiden →</span></Link>
            ))}
          </div>
          <Link href="/guides" className="inline-flex text-xs font-bold text-[#12172B] hover:underline">Se alle guides og datadrevne toplister →</Link>
        </section>
      </main>

      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-[#12172B]/60 backdrop-blur-sm flex items-center justify-center p-4" onKeyDown={(event) => { if (event.key === "Escape") setShowShareModal(false); }}>
          <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-2xl p-6 sm:p-8 max-w-lg w-full card-shadow space-y-6 relative animate-in fade-in zoom-in-95 duration-150 text-left" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
            <button autoFocus onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F7F8FA] hover:bg-[#E7E9EF] text-[#545D71] font-bold flex items-center justify-center transition" aria-label="Luk deling">✕</button>
            <div className="space-y-2"><div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F6EE] text-[#0B7A57] border border-[#0F9D6E]/20"><span>🎯 Dit uddannelsesvalg</span></div><h3 id="share-dialog-title" className="text-2xl font-bold text-[#12172B] tracking-tight font-display">Del din søgning</h3><p className="text-xs text-[#545D71]">Linket gemmer dit gennemsnit, uddannelsessted, søgning og om AI-modelestimater er slået til.</p></div>
            {matchedPrograms.length > 0 && (
              <div className="bg-gradient-to-br from-[#12172B] to-[#1E293B] text-[#FFFFFF] rounded-xl p-5 space-y-4 shadow-md">
                <div className="flex justify-between items-center text-[11px] text-[#A1A1AA] border-b border-[#3F3F46] pb-3"><span className="font-bold text-[#38BDF8]">UDDANNELSESINDSIGT.COM</span><span className="bg-[#0F9D6E] text-white px-2 py-0.5 rounded text-[10px] font-bold">{includeAiModels ? "AI TILVALGT" : "ALLE UDDANNELSER"}</span></div>
                <div className="space-y-1"><span className="text-xs font-bold text-[#10B981] uppercase tracking-wider">Første resultat</span><h4 className="text-xl font-bold tracking-tight text-white font-display">{matchedPrograms[0].udbud_titel}</h4><p className="text-xs text-[#D4D4D8]">{matchedPrograms[0].institution} • KOT {matchedPrograms[0].kot_nr}</p></div>
                <div className="bg-[#27272A] p-3 rounded-lg flex flex-wrap justify-between text-[11px] text-[#A1A1AA] gap-2 font-mono-data"><span>Snit: {gpa.toFixed(1)}</span><span>AI-model: {includeAiModels ? "til" : "fra"}</span></div>
              </div>
            )}
            <div className="space-y-3">
              <button onClick={() => { const shareUrl = createShareUrl(); navigator.clipboard.writeText(shareUrl).then(() => { track("match_share", { method: "copy_link", aiIncluded: includeAiModels }); setCopiedToast(true); setTimeout(() => setCopiedToast(false), 3000); }).catch(() => {}); }} className="w-full py-3 bg-[#12172B] hover:bg-[#1E293B] text-[#FFFFFF] font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition card-shadow focus:outline-none focus:ring-2 focus:ring-[#2563EB]"><span>📋</span><span>Kopiér direkte link</span></button>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button onClick={() => { const shareUrl = createShareUrl(); const topTitle = matchedPrograms.length > 0 ? matchedPrograms[0].udbud_titel : "Uddannelse"; navigator.share({ title: "Mit uddannelsesvalg på Uddannelsesindsigt", text: `Jeg undersøger ${topTitle} på Uddannelsesindsigt. Se søgningen og de valgte filtre:`, url: shareUrl }).then(() => { track("match_share", { method: "native", aiIncluded: includeAiModels }); }).catch(() => {}); }} className="w-full py-3 bg-[#E3F6EE] hover:bg-[#D2F1E4] text-[#0B7A57] border border-[#0F9D6E]/30 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-[#0F9D6E]"><span>📱</span><span>Del via apps</span></button>
              )}
              <button onClick={() => { const topTitle = matchedPrograms.length > 0 ? matchedPrograms[0].udbud_titel : "uddannelser"; const shareUrl = createShareUrl(); const storyText = `🎓 Jeg undersøger ${topTitle} på Uddannelsesindsigt. ${includeAiModels ? "Jeg har aktivt valgt at inddrage AI-modelestimater." : "AI-modelestimater indgår ikke i sorteringen."}\n\nSe søgningen her: ${shareUrl}`; navigator.clipboard.writeText(storyText).then(() => { track("match_share", { method: "copy_text", aiIncluded: includeAiModels }); setCopiedToast(true); setTimeout(() => setCopiedToast(false), 3000); }).catch(() => {}); }} className="w-full py-3 bg-[#F7F8FA] hover:bg-[#E7E9EF] text-[#12172B] border border-[#E7E9EF] font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-[#2563EB]"><span>💬</span><span>Kopiér teksten til deling</span></button>
            </div>
            {copiedToast && <div className="p-3 bg-[#E3F6EE] border border-[#0F9D6E]/30 text-[#0B7A57] text-xs font-bold rounded-xl text-center animate-in fade-in">✅ Kopieret til udklipsholder! Klar til at dele.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
