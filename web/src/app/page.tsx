"use client";

import React, { useState, useMemo, useEffect, useDeferredValue, useRef } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics/react";
import { Header } from "@/components/Header";
import { createProgramSlug } from "@/lib/slugs";
import { getEnrichedScores } from "@/lib/domainScoring";
import type { NormalizedScores, RawProgramScores } from "@/lib/domainScoring";
import { normalizeProgramName } from "@/lib/programName";
import { formatProgramTitle, formatCityName } from "@/lib/textUtils";
import { DATA_STATUS } from "@/lib/dataStatus";
import { aiBand, roundAiScore } from "@/lib/aiPresentation";
import { buildMatchSharePath, parseMatchShareParams, type ShareableUniversity } from "@/lib/shareMatch";
import { admission2026Institution, admission2026Label, admission2026Threshold, getAdmission2026 } from "@/lib/admissions2026";
import { admissionGroup, compareResults, formatDanishNumber, marginLabel, parseGpaInput, type ResultSort } from "@/lib/resultSorting";
import { getBrowserStorageAdapter, readSavedPrograms, removeProgram, saveProgram } from "@/lib/savedPrograms";
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

const UNIVERSITY_LABELS: Record<string, string> = {
  ku: "KU", dtu: "DTU", au: "AU", cbs: "CBS", sdu: "SDU", aau: "AAU", ruc: "RUC", itu: "ITU", professionshojskole: "Professionshøjskoler og erhvervsakademier",
};
const UNIVERSITY_OPTIONS = [
  ["all", "Alle universiteter og uddannelsessteder"], ["ku", "Københavns Universitet (KU)"],
  ["dtu", "Danmarks Tekniske Universitet (DTU)"], ["au", "Aarhus Universitet (AU)"],
  ["cbs", "Copenhagen Business School (CBS)"], ["sdu", "Syddansk Universitet (SDU)"],
  ["aau", "Aalborg Universitet (AAU)"], ["ruc", "Roskilde Universitet (RUC)"],
  ["itu", "IT-Universitetet i København (ITU)"], ["professionshojskole", "Professionshøjskoler og erhvervsakademier (delvis dækning)"],
] as const;

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
        Vi mangler et tilstrækkeligt grundlag for at koble uddannelsen til arbejdsopgaver i O*NET 31.0.
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
      <p className="mt-2 text-[11px] leading-relaxed text-[#545D71]">Modelestimat baseret på arbejdsopgaver og koblinger mellem fag — ikke en jobprognose eller garanti.</p>
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
  const [gpaInput, setGpaInput] = useState("");
  const gpa = parseGpaInput(gpaInput);
  const gpaInvalid = gpaInput.trim() !== "" && gpa === null;
  const [sort, setSort] = useState<ResultSort>("closest");
  const effectiveSort = sort === "closest" && gpa === null ? "alphabetical" : sort;
  const [includeAiModels, setIncludeAiModels] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<readonly string[]>([]);
  const [savedError, setSavedError] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [cardMessage, setCardMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [sectionLimits, setSectionLimits] = useState({ at_or_above: 5, near_above: 3, further_above: 2, unknown: 2 });
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [urlReady, setUrlReady] = useState(false);
  const [urlRevision, setUrlRevision] = useState(0);
  const restoringUrl = useRef(false);
  const pendingUrlTimer = useRef<number | null>(null);
  const filterDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let frame = 0;
    const restore = () => {
      if (pendingUrlTimer.current !== null) window.clearTimeout(pendingUrlTimer.current);
      const shared = parseMatchShareParams(window.location.search);
      restoringUrl.current = true;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setGpaInput(shared.gpa === undefined ? "" : formatDanishNumber(shared.gpa));
        setIncludeAiModels(shared.includeAiModels ?? false);
        setSelectedUniversity(shared.university ?? "all");
        setSearchQuery(shared.query ?? "");
        setSort(shared.sort ?? "closest");
        setVisibleCount(10);
        setUrlReady(true);
        setUrlRevision((current) => current + 1);
      });
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("popstate", restore); };
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    if (restoringUrl.current) { restoringUrl.current = false; return; }
    const nextPath = buildMatchSharePath({ gpa: gpa ?? undefined, includeAiModels, university: selectedUniversity as ShareableUniversity, query: searchQuery, sort });
    const timeout = window.setTimeout(() => {
      pendingUrlTimer.current = null;
      if (`${window.location.pathname}${window.location.search}` !== nextPath) window.history.pushState(null, "", `${nextPath}${window.location.hash}`);
    }, 400);
    pendingUrlTimer.current = timeout;
    return () => { window.clearTimeout(timeout); if (pendingUrlTimer.current === timeout) pendingUrlTimer.current = null; };
  }, [gpa, includeAiModels, selectedUniversity, searchQuery, sort, urlReady, urlRevision]);

  useEffect(() => {
    const syncSaved = () => {
      const result = readSavedPrograms(getBrowserStorageAdapter());
      if (result.ok) { setSavedIds(result.kotIds); setSavedError(""); }
      else setSavedError("Min liste er ikke tilgængelig i denne browser. Kontrollér browserens lagringsindstillinger.");
    };
    const frame = requestAnimationFrame(syncSaved);
    window.addEventListener("storage", syncSaved);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("storage", syncSaved); };
  }, []);

  const toggleSaved = (kot: string) => {
    const storage = getBrowserStorageAdapter();
    const result = savedIds.includes(kot) ? removeProgram(storage, kot) : saveProgram(storage, kot);
    if (result.ok) { setSavedIds(result.kotIds); setSavedError(""); }
    else setSavedError(result.reason === "limit_reached" ? "Min liste kan højst indeholde 100 uddannelser." : "Kunne ikke gemme ændringen på denne enhed. Kontrollér browserens lagringsindstillinger.");
  };

  const toggleComparison = (slug: string) => setSelectedForComparison((current) =>
    current.includes(slug) ? current.filter((item) => item !== slug) : current.length < 3 ? [...current, slug] : current
  );

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
      const admission = getAdmission2026(prog);
      const kvNum = admission2026Threshold(admission);
      const meetsGpa = kvNum !== null && gpa !== null && gpa >= kvNum;
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
        const isExactMajor = exactMajors.some((major) => pTitleLow.startsWith(major));
        const isNamedMajor = exactMajors.some((major) => pTitleLow === major || pTitleLow.startsWith(`${major},`));
        if (isNamedMajor) {
          relevanceBoost = 1100;
        } else if (isExactMajor) {
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

      const formattedTitle = formatProgramTitle(prog.udbud_titel || "Uddannelsen");
      const startMatch = formattedTitle.match(/,\s*Studiestart:\s*(.+)$/i);
      const displayTitle = startMatch ? formattedTitle.slice(0, startMatch.index) : formattedTitle;
      const startDetails = startMatch && /vinter/i.test(startMatch[1]) ? startMatch[1] : null;

      const institutionName = admission2026Institution(prog);
      const cityName = (prog.by || "") as string;
      return { ...prog, udbud_titel: formattedTitle, displayTitle, startDetails, by: cityName, institution: institutionName, admissionLabel: admission2026Label(admission), skills_hierarchy: prog.skills_hierarchy, rag_evidence: prog.rag_evidence, scoreDetails: enriched, relevanceBoost, meetsGpa, kvNum, robustScore, aiEligible, locationsCount: 1, locationsList: [formatCityName(cityName)] };
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
        const inst = (item.institution || item.institution_navn || "").toLowerCase();
        if (deferredSelectedUniversity === "cbs") return inst.includes("copenhagen business school");
        if (deferredSelectedUniversity === "ku") return inst.includes("københavns universitet");
        if (deferredSelectedUniversity === "dtu") return inst.includes("danmarks tekniske universitet");
        if (deferredSelectedUniversity === "au") return inst.includes("aarhus universitet");
        if (deferredSelectedUniversity === "sdu") return inst.includes("syddansk universitet");
        if (deferredSelectedUniversity === "aau") return inst.includes("aalborg universitet");
        if (deferredSelectedUniversity === "ruc") return inst.includes("roskilde universitet");
        if (deferredSelectedUniversity === "itu") return inst.includes("it-universitet");
        if (deferredSelectedUniversity === "professionshojskole") {
          return /professionshøjskol|erhvervsakademi|university college|universitetscollege|uc syd/.test(inst);
        }
      }
      return true;
    });

    const sorted = list.sort((a, b) => compareResults(a, b, sort, gpa, Boolean(deferredSearchQuery.trim())));
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
        rep.locationsCount = groupItems.length;
        deduplicated.push(rep);
      }
      return deduplicated;
    }
    return sorted;
  }, [deferredSearchQuery, deferredSelectedUniversity, gpa, includeAiModels, allPrograms, sort]);

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

  const groupLabels = {
    at_or_above: "På eller over kvotienten i 2026",
    near_above: "Lige uden for rækkevidde · op til 1,0 over dit snit",
    further_above: "Mere end 1,0 over dit snit",
    unknown: "Uden numerisk kvotient i 2026",
    all: "Alle resultater",
  } as const;
  const showGroups = sort === "closest" && gpa !== null && !deferredSearchQuery.trim();
  const sections = showGroups
    ? (["at_or_above", "near_above", "further_above", "unknown"] as const).map((key) => {
        const items = matchedPrograms.filter((program) => admissionGroup(program.kvNum, gpa) === key);
        return { key, items, shown: items.slice(0, sectionLimits[key]) };
      }).filter((section) => section.items.length > 0)
    : [{ key: "all" as const, items: matchedPrograms, shown: matchedPrograms.slice(0, visibleCount) }];
  const topMatches = sections.flatMap((section) => section.shown);
  const sortDescription = sort === "closest" && gpa === null ? "A–Å indtil du indtaster et gyldigt snit" : ({ closest: "Tættest på dit snit, opdelt efter kvotient", highest: "Højeste kvotient først", alphabetical: "A–Å", ai: "Højeste AI-modelestimat først" } as const)[sort];
  const createShareUrl = () => `${window.location.origin}${buildMatchSharePath({
    gpa: gpa ?? undefined,
    includeAiModels,
    university: selectedUniversity as ShareableUniversity,
    query: searchQuery,
    sort: effectiveSort,
  })}`;
  const comparisonParams = new URLSearchParams();
  selectedForComparison.forEach((slug, index) => comparisonParams.set(["a", "b", "c"][index], slug));
  if (includeAiModels) comparisonParams.set("ai", "1");
  if (gpa !== null) comparisonParams.set("gpa", String(gpa));

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <Header />
      <main id="main-content" tabIndex={-1} className={`max-w-5xl mx-auto px-6 py-10 space-y-10 ${selectedForComparison.length > 0 ? "pb-32" : ""}`}>
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F6EE] text-[#0B7A57] border border-[#0F9D6E]/20">
            <span className="w-2 h-2 rounded-full bg-[#0F9D6E]"></span>
            <span>Optagelsesdata {DATA_STATUS.catalogue.admissionsUpdatedLabel} • {DATA_STATUS.catalogue.programmeCount.toLocaleString("da-DK")} uddannelser</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#12172B] leading-tight font-display">
            Hvilken uddannelse <br className="hidden sm:inline" />
            vil du <span className="border-b-4 border-[#0F9D6E] pb-1">undersøge?</span>
          </h1>
          <p className="text-sm text-[#545D71] max-w-lg mx-auto font-normal leading-relaxed">
            Søg i uddannelseskataloget, sammenlign kvotienter fra optaget i 2026, og vælg selv om tydeligt markerede AI-modelestimater skal indgå.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 card-shadow space-y-6 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-[#E7E9EF] pb-5">
            <div className="space-y-2">
              <label htmlFor="gpa-input" className="block text-xs font-semibold text-[#12172B]">Dit gymnasiale gennemsnit (kvote 1)</label>
              <input id="gpa-input" type="text" inputMode="decimal" placeholder="Fx 9,5" value={gpaInput} onChange={(event) => { setGpaInput(event.target.value); setVisibleCount(10); }} onBlur={() => { if (gpa !== null) setGpaInput(formatDanishNumber(gpa)); }} aria-invalid={gpaInvalid} aria-describedby="gpa-help" className="w-full min-h-11 bg-white border border-[#D8DBE4] rounded-lg px-3 py-2 text-sm text-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
              <p id="gpa-help" className={`text-xs leading-relaxed ${gpaInvalid ? "text-[#B45309]" : "text-[#545D71]"}`}>{gpaInvalid ? "Skriv et snit mellem 2,0 og 12,0 med komma eller punktum." : "Indtast dit eget snit for at sammenligne med optaget i 2026."}</p>
              {gpa !== null && <><label htmlFor="gpa-slider" className="block text-xs text-[#545D71]">Justér dit snit: {formatDanishNumber(gpa)}</label><input id="gpa-slider" type="range" min="2" max="12" step="0.1" value={gpa} onChange={(event) => { setGpaInput(formatDanishNumber(Number(event.target.value))); setVisibleCount(10); }} aria-label={`Gennemsnit: ${formatDanishNumber(gpa)}`} className="w-full h-6 bg-transparent cursor-pointer accent-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" /></>}
            </div>
            <div className="hidden space-y-2 sm:block">
              <label htmlFor="university-select" className="text-xs font-semibold text-[#12172B] block">Vælg universitet eller uddannelsessted</label>
              <select id="university-select" value={selectedUniversity} onChange={(e) => { setSelectedUniversity(e.target.value); setVisibleCount(10); }} className="w-full min-h-11 bg-[#FFFFFF] border border-[#D8DBE4] rounded-lg px-3 py-2 text-xs text-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]">
                {UNIVERSITY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}{value === "all" && !loading ? ` (${allPrograms.length})` : ""}</option>)}
              </select>
              <p className="text-[11px] text-[#545D71]">Ved filter vises kun uddannelser med et verificeret uddannelsessted i 2026-kilden. Professions- og akademifilteret er ikke nødvendigvis komplet.</p>
            </div>
            <div className="sm:hidden"><button type="button" onClick={() => filterDialog.current?.showModal()} className="min-h-11 w-full rounded-lg border border-[#D8DBE4] px-3 text-left text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]">Uddannelsessted: {selectedUniversity === "all" ? "Alle" : UNIVERSITY_LABELS[selectedUniversity] || selectedUniversity} · Vælg filter</button>
              <dialog ref={filterDialog} aria-labelledby="mobile-filter-title" className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-2xl border border-[#D8DBE4] bg-white p-6 text-[#12172B] shadow-xl backdrop:bg-[#12172B]/60 sm:hidden">
                <div className="flex items-center justify-between gap-3"><h2 id="mobile-filter-title" className="text-lg font-bold">Filtrér efter uddannelsessted</h2><button type="button" onClick={() => filterDialog.current?.close()} aria-label="Luk filtre" className="min-h-11 min-w-11 rounded focus:outline-none focus:ring-2 focus:ring-[#2563EB]">✕</button></div>
                <label htmlFor="mobile-university-select" className="mt-4 block text-xs font-semibold">Vælg uddannelsessted på mobil</label>
                <select id="mobile-university-select" value={selectedUniversity} onChange={(event) => { setSelectedUniversity(event.target.value); setVisibleCount(10); }} className="mt-2 min-h-11 w-full rounded-lg border border-[#D8DBE4] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]">{UNIVERSITY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                <p className="mt-3 text-xs leading-relaxed text-[#545D71]">Ved filter vises kun uddannelser med et verificeret uddannelsessted i 2026-kilden. Professions- og akademifilteret er ikke nødvendigvis komplet. AI-tilvalget findes på forsiden.</p>
                <button type="button" onClick={() => filterDialog.current?.close()} className="mt-5 min-h-11 w-full rounded-xl bg-[#12172B] px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2">Vis {matchedPrograms.length} uddannelser</button>
              </dialog>
            </div>
          </div>
          <details className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
            <summary className="cursor-pointer font-semibold">Sådan læser du tallene</summary>
            <p className="mt-2"><strong>Kvote 1</strong> er den del af optaget, hvor karaktergennemsnittet bruges i udvælgelsen. En adgangskvotient beskriver et tidligere optag, ikke et fast krav eller en garanti. <strong>KOT-nummeret</strong> er optagelsesområdets nummer i den officielle opgørelse.</p>
            <p className="mt-2">Optagelsestal gælder optaget i 2026 og vises kun, hvor KOT-nummer og uddannelsesnavn matcher. Oplysninger om ledige pladser er historiske og siger ikke, om der er plads nu. Kontrollér aktuelle oplysninger hos <a href="https://www.ug.dk/artikel/aarets-optagelsestal" className="font-semibold underline">UddannelsesGuiden</a> og uddannelsesstedet.</p>
            <p className="mt-2"><strong>AI-modelestimatet</strong> er en beregnet vurdering, ikke et observeret resultat. Det bygger på amerikanske O*NET-opgavedata og usikre koblinger mellem uddannelser og arbejdsopgaver. AI-robusthed er ikke en automatiseringssandsynlighed, jobprognose eller anbefaling om at vælge uddannelsen.</p>
            <span className="mt-1 block">Se <Link href="/evidens" className="font-semibold underline">kilde- og metodeforklaringen</Link> for status og begrænsninger.</span>
          </details>
          <div data-testid="ai-model-toggle-panel" className={`rounded-xl border p-4 ${includeAiModels ? "border-[#0F9D6E]/35 bg-[#E3F6EE]" : "border-[#D8DBE4] bg-[#F7F8FA]"}`}>
            <label htmlFor="include-ai-models" className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <strong className="flex items-center gap-2 text-sm text-[#12172B]"><SlidersIcon /> Inddrag AI-modelestimater</strong>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#545D71]">
                  Viser kun de {DATA_STATUS.scoring.mappedProgrammeCount.toLocaleString("da-DK")} uddannelser med O*NET 31.0-modeldata. Du kan vælge AI som sortering nedenfor. Standardvisningen søger i hele kataloget.
                </span>
              </span>
              <input
                id="include-ai-models"
                data-testid="include-ai-models"
                type="checkbox"
                role="switch"
                checked={includeAiModels}
                onChange={(event) => { setIncludeAiModels(event.currentTarget.checked); if (!event.currentTarget.checked && sort === "ai") setSort("closest"); setVisibleCount(10); }}
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
            <input type="text" maxLength={120} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(10); }} aria-label="Søg efter uddannelse eller erhverv" placeholder="Søg efter uddannelse eller erhverv (fx 'odontologi', 'læge', 'jura')..." className="w-full min-h-11 bg-[#F7F8FA] border border-[#D8DBE4] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#12172B] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]" />
          </div>
          {(selectedUniversity !== "all" || searchQuery.trim() || includeAiModels) && <div className="flex flex-wrap items-center gap-2 text-xs" aria-label="Aktive filtre"><span className="font-semibold text-[#545D71]">Aktive filtre:</span>{selectedUniversity !== "all" && <button type="button" onClick={() => setSelectedUniversity("all")} className="min-h-11 rounded-full border border-[#D8DBE4] px-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]" aria-label="Fjern filter for uddannelsessted">Uddannelsessted: {UNIVERSITY_LABELS[selectedUniversity] || selectedUniversity} ×</button>}{searchQuery.trim() && <button type="button" onClick={() => setSearchQuery("")} className="min-h-11 rounded-full border border-[#D8DBE4] px-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]" aria-label="Fjern søgning">Søgning: {searchQuery} ×</button>}{includeAiModels && <button type="button" onClick={() => { setIncludeAiModels(false); if (sort === "ai") setSort("closest"); }} className="min-h-11 rounded-full border border-[#D8DBE4] px-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]" aria-label="Fjern AI-filter">AI-modeldata ×</button>}<button type="button" onClick={() => { setSelectedUniversity("all"); setSearchQuery(""); setIncludeAiModels(false); if (sort === "ai") setSort("closest"); setVisibleCount(10); }} className="min-h-11 rounded px-2 font-semibold text-[#1D4ED8] underline focus:outline-none focus:ring-2 focus:ring-[#2563EB]">Nulstil alle filtre</button></div>}
          <p className="text-[11px] leading-relaxed text-[#545D71]">Snit, søgning og filtre vises i adresselinjen, så de kan deles og gendannes. Adressen kan gemmes i browserhistorik og sendes ved sideindlæsning. Del kun linket, hvis du vil dele disse valg.</p>
          <div className="border-t border-[#E7E9EF] pt-3">
            <button type="button" onClick={() => setShowSaved(!showSaved)} aria-expanded={showSaved} aria-controls="saved-programs" className="min-h-11 text-sm font-semibold text-[#1D4ED8] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2563EB]">Min liste ({savedIds.length}) {showSaved ? "↑" : "↓"}</button>
            {savedError && <p role="status" className="text-xs text-[#B45309]">{savedError}</p>}
            {showSaved && <div id="saved-programs" className="space-y-2 text-xs text-[#545D71]">
              <p>Listen gemmes kun i denne browser på denne enhed; den kræver ingen konto og kan forsvinde, hvis browserdata ryddes.</p>
              {savedIds.length === 0 ? <p>Du har ikke gemt nogen uddannelser endnu. Brug “Gem” på et uddannelseskort.</p> : <ul className="space-y-1">{savedIds.map((id) => {
                const program = allPrograms.find((item) => String(item.kot_nr) === id);
                return <li key={id} className="flex items-center justify-between gap-2">{program ? <Link href={`/uddannelse/${createProgramSlug(program)}`} className="font-semibold text-[#1D4ED8] hover:underline">{formatProgramTitle(program.udbud_titel || id)}</Link> : <span>Uddannelse {id} er ikke i kataloget</span>}<button type="button" onClick={() => toggleSaved(id)} aria-label={`Fjern ${program?.udbud_titel || id} fra Min liste`} className="min-h-11 px-2 text-[#545D71] hover:text-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">Fjern</button></li>;
              })}</ul>}
            </div>}
          </div>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-[#E7E9EF] pb-3">
            <div>
              <h2 className="text-xl font-bold text-[#12172B] font-display">Uddannelser at undersøge</h2>
              <p className="text-xs text-[#545D71]">{deferredSearchQuery.trim() ? "Søgerelevans først · derefter " : "Sorteret: "}{sortDescription}{includeAiModels ? " · kun uddannelser med AI-modeldata" : " · AI fravalgt"}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowShareModal(true)} className="inline-flex min-h-11 items-center gap-2 px-3.5 py-1.5 bg-[#12172B] hover:bg-[#1E293B] text-[#FFFFFF] font-bold rounded-xl text-xs transition card-shadow focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"><svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 0L8 7m4-4 4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg><span>Del din søgning</span></button>
              <span className="text-xs text-[#545D71] font-mono-data font-semibold hidden sm:inline">{loading ? "Henter..." : `${matchedPrograms.length} uddannelser i visningen`}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="result-sort" className="text-xs font-semibold text-[#12172B]">Sortér resultater</label>
            <select id="result-sort" value={effectiveSort} onChange={(event) => { setSort(event.target.value as ResultSort); setVisibleCount(10); }} className="min-h-11 rounded-lg border border-[#D8DBE4] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
              <option value="closest" disabled={gpa === null}>Tættest på dit snit</option>
              <option value="highest">Højeste kvotient</option>
              <option value="alphabetical">A–Å</option>
              {includeAiModels && <option value="ai">AI-robusthed</option>}
            </select>
          </div>
          <p className="text-xs leading-relaxed text-[#545D71]">Kvotienter er fra optaget i 2026 og kan ændre sig. Dit snit er ingen garanti for optagelse; kontrollér også fagkrav og øvrige adgangskrav.</p>
          {cardMessage && <p role="status" className="text-xs text-[#1D4ED8]">{cardMessage}</p>}

          {loading ? (
            <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 text-center space-y-3 card-shadow animate-pulse">
              <div className="w-12 h-12 border-4 border-[#0F9D6E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-base font-bold text-[#12172B]">Indlæser uddannelseskataloget...</h3>
              <p className="text-xs text-[#545D71]">Analyserer kataloget og markerer model-/provenansstatus.</p>
            </div>
          ) : topMatches.length > 0 ? (
            <div className="space-y-4" data-testid="ranked-program-results">
              <p aria-live="polite" className="text-xs text-[#545D71]">{matchedPrograms.length} uddannelser i visningen. {gpa === null ? "Indtast dit snit for at sammenligne kvotienter." : "Resultaterne opdateres, når du ændrer dine valg."}</p>
              {sections.map((section) => <section key={section.key} className="space-y-4" aria-label={groupLabels[section.key]}>
              {showGroups && <div><h3 className="text-sm font-bold text-[#12172B]">{groupLabels[section.key]}</h3>{section.key === "near_above" && <p className="text-xs text-[#545D71]">Kvotienten kan ændre sig fra år til år. Dette er ikke en prognose for optagelse.</p>}</div>}
              {section.shown.map((prog) => {
                const slug = createProgramSlug(prog);
                const selected = selectedForComparison.includes(slug);
                const saved = savedIds.includes(String(prog.kot_nr));
                return (
                  <article key={prog.kot_nr} data-testid="program-card" data-program-id={prog.kot_nr} className="relative border border-[#E7E9EF] bg-[#FFFFFF] rounded-xl p-5 card-shadow hover:border-[#D8DBE4] focus-within:ring-2 focus-within:ring-[#2563EB] transition space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-1.5 text-xs text-[#545D71]">
                          <div className="flex items-center gap-1.5">
                            <span>{prog.institution}</span><span>•</span><span className="font-mono-data text-[#667085]">KOT {prog.kot_nr}</span>
                          </div>
                          <details className="relative z-10 text-left"><summary aria-label={`Flere handlinger for ${prog.udbud_titel}, KOT ${prog.kot_nr}`} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded text-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]">⋯</summary><div className="absolute right-0 z-20 w-44 rounded-lg border border-[#D8DBE4] bg-white p-2 shadow-lg"><button type="button" onClick={() => { const url = `${window.location.origin}/uddannelse/${slug}`; if (!navigator.clipboard?.writeText) { setCardMessage("Linket kunne ikke kopieres. Åbn uddannelsen og kopiér adressen fra browseren."); return; } navigator.clipboard.writeText(url).then(() => setCardMessage(`Link til ${prog.displayTitle} er kopieret.`)).catch(() => setCardMessage("Linket kunne ikke kopieres. Åbn uddannelsen og kopiér adressen fra browseren.")); }} aria-label={`Kopiér link til ${prog.udbud_titel}, KOT ${prog.kot_nr}`} className="min-h-11 w-full rounded px-2 text-left text-xs text-[#1D4ED8] hover:bg-[#EFF6FF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">Kopiér link til uddannelsen</button></div></details>
                        </div>
                        <h3 data-testid="program-title" className="text-xl font-bold text-[#12172B] tracking-tight font-display hover:text-[#2563EB] transition"><Link href={`/uddannelse/${slug}`} className="after:absolute after:inset-0 after:rounded-xl focus:outline-none">{prog.displayTitle}</Link></h3>
                        {prog.startDetails && <p className="text-xs text-[#545D71]">Studiestart: {prog.startDetails}</p>}
                        {prog.locationsCount > 1 ? (
                          <div className="pt-1"><span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">Flere katalogopslag · kontrollér studiested</span></div>
                        ) : null}
                      </div>
                      <div className="text-left sm:text-right space-y-1 w-full sm:w-auto border-t sm:border-t-0 border-[#E7E9EF] pt-2 sm:pt-0">
                        <span className="text-[11px] text-[#667085] block">Kvote 1 ved optaget i 2026</span>
                        {prog.kvNum !== null ? (
                          <span className="text-xl font-bold text-[#12172B] font-mono-data">{prog.admissionLabel}</span>
                        ) : (
                          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1"><span className="text-sm font-semibold text-[#545D71]">{prog.admissionLabel}</span><span className="text-[11px] text-[#545D71]">Status ved optaget i 2026 · kontrollér aktuelle oplysninger</span></div>
                        )}
                      </div>
                    </div>

                    {includeAiModels && <AiModelIndicator score={prog.robustScore} eligible={prog.aiEligible} />}

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[#545D71] pt-1">
                      {gpa !== null && prog.kvNum !== null && <p className="leading-relaxed flex-1">{`Dit snit ${formatDanishNumber(gpa)} · kvotient ${formatDanishNumber(prog.kvNum)} · ${marginLabel(prog.kvNum, gpa)}`}</p>}
                    </div>
                    <div className="relative z-10 flex flex-wrap items-center gap-3 border-t border-[#E7E9EF] pt-2 text-xs">
                      <label className="flex min-h-11 cursor-pointer items-center gap-2"><input type="checkbox" checked={selected} disabled={!selected && selectedForComparison.length >= 3} onChange={() => toggleComparison(slug)} aria-label={`Sammenlign ${prog.udbud_titel}, KOT ${prog.kot_nr}`} className="h-5 w-5 accent-[#2563EB]" /><span>Sammenlign</span></label>
                      <button type="button" onClick={() => toggleSaved(String(prog.kot_nr))} aria-pressed={saved} aria-label={`${saved ? "Fjern" : "Gem"} ${prog.udbud_titel}, KOT ${prog.kot_nr} ${saved ? "fra" : "i"} Min liste`} className="min-h-11 rounded px-2 font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">{saved ? "★ Gemt" : "☆ Gem"}</button>
                    </div>
                  </article>
                );
              })}
              {showGroups && section.shown.length < section.items.length && <button type="button" onClick={() => { if (section.key !== "all") setSectionLimits((current) => ({ ...current, [section.key]: current[section.key] + 10 })); }} className="min-h-11 rounded-lg border border-[#D8DBE4] bg-white px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]">Vis flere: {groupLabels[section.key]} (viser {section.shown.length} af {section.items.length})</button>}
              </section>)}
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 text-center space-y-3 card-shadow"><h3 className="text-base font-bold text-[#12172B]">Ingen matchende uddannelser fundet</h3><p className="text-xs text-[#545D71]">{includeAiModels ? "Din søgning gav ingen resultater blandt de 569 uddannelser med AI-modeldata. Slå AI fra for at søge i alle 1.413 uddannelser." : "Prøv at vælge et andet uddannelsessted eller ryd dit søgefelt."}</p><button onClick={() => { setSearchQuery(""); setSelectedUniversity("all"); setIncludeAiModels(false); if (sort === "ai") setSort("closest"); setVisibleCount(10); }} className="min-h-11 px-4 py-2 bg-[#12172B] text-[#FFFFFF] rounded-lg text-xs font-semibold hover:bg-[#545D71] transition focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2">Nulstil og vis alle uddannelser</button></div>
          )}

          {!showGroups && topMatches.length < matchedPrograms.length && (
            <div className="text-center pt-4"><button onClick={() => setVisibleCount((prev) => prev + 10)} className="px-6 py-2.5 bg-[#FFFFFF] border border-[#D8DBE4] hover:border-[#12172B] text-[#12172B] font-semibold rounded-lg text-xs transition card-shadow focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2">Vis flere uddannelser (viser {topMatches.length} af {matchedPrograms.length})</button></div>
          )}
        </div>

        <section data-testid="guide-links" aria-labelledby="guide-links-heading" className="rounded-2xl border border-[#D8DBE4] bg-[#FFFFFF] p-6 sm:p-8 card-shadow space-y-5">
          <div className="max-w-2xl"><p className="text-[11px] font-bold uppercase tracking-wider text-[#0B7A57]">Gå et niveau dybere</p><h2 id="guide-links-heading" className="mt-1 text-xl font-bold font-display">Guides til dit næste valg</h2><p className="mt-2 text-xs leading-relaxed text-[#545D71]">Brug matchresultatet som startpunkt, og få hjælp til at forstå adgangskvotienter, AI-modelestimater og forskellene mellem uddannelser.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: "/guides/hvad-kan-jeg-laese-med-mit-snit", title: "Hvad kan jeg læse med mit snit?", text: "Forstå Kvote 1-tal og find relevante alternativer." },
              { href: "/guides/ai-og-uddannelsesvalg", title: "AI og uddannelsesvalg", text: "Brug AI-estimatet uden at læse det som en garanti." },
              { href: "/guides/saadan-sammenligner-du-uddannelser", title: "Sammenlign uddannelser", text: "En enkel tjekliste til adgang, indhold, sted og AI-perspektiv." },
            ].map((guide) => (
              <Link key={guide.href} href={guide.href} onClick={() => track("guide_open", { guide: guide.href.replace("/guides/", ""), source: "homepage" })} className="rounded-xl border border-[#E7E9EF] bg-[#F7F8FA] p-4 hover:bg-[#EFF6FF] hover:border-[#2563EB]/30 transition"><span className="block text-sm font-bold text-[#12172B]">{guide.title}</span><span className="mt-1 block text-[11px] leading-relaxed text-[#545D71]">{guide.text}</span><span className="mt-3 block text-xs font-bold text-[#2563EB]">Læs guiden →</span></Link>
            ))}
          </div>
          <Link href="/guides" className="inline-flex text-xs font-bold text-[#12172B] hover:underline">Se alle guides og datadrevne toplister →</Link>
        </section>
      </main>

      {selectedForComparison.length > 0 && <aside aria-label="Valgte uddannelser til sammenligning" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D8DBE4] bg-white p-3 shadow-[0_-4px_16px_rgba(18,23,43,0.12)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3"><p className="text-xs text-[#12172B]"><strong>{selectedForComparison.length} af 3 valgt</strong><span className="block text-[#545D71]">{selectedForComparison.length < 2 ? "Vælg mindst én mere for at sammenligne." : "Klar til sammenligning."}</span></p>{selectedForComparison.length >= 2 ? <Link href={`/sammenlign?${comparisonParams}`} className="inline-flex min-h-11 items-center rounded-xl bg-[#12172B] px-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2">Sammenlign ({selectedForComparison.length})</Link> : <span className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-xs text-[#667085]">Sammenlign (1)</span>}</div>
      </aside>}

      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-[#12172B]/60 backdrop-blur-sm flex items-center justify-center p-4" onKeyDown={(event) => { if (event.key === "Escape") setShowShareModal(false); }}>
          <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-2xl p-6 sm:p-8 max-w-lg w-full card-shadow space-y-6 relative animate-in fade-in zoom-in-95 duration-150 text-left" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
            <button autoFocus onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F7F8FA] hover:bg-[#E7E9EF] text-[#545D71] font-bold flex items-center justify-center transition" aria-label="Luk deling">✕</button>
            <div className="space-y-2"><div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F6EE] text-[#0B7A57] border border-[#0F9D6E]/20"><span>🎯 Dit uddannelsesvalg</span></div><h3 id="share-dialog-title" className="text-2xl font-bold text-[#12172B] tracking-tight font-display">Del din søgning</h3><p className="text-xs text-[#545D71]">Linket gemmer dit gennemsnit, uddannelsessted, søgning og om AI-modelestimater er slået til.</p></div>
            {matchedPrograms.length > 0 && (
              <div className="bg-gradient-to-br from-[#12172B] to-[#1E293B] text-[#FFFFFF] rounded-xl p-5 space-y-4 shadow-md">
                <div className="flex justify-between items-center text-[11px] text-[#A1A1AA] border-b border-[#3F3F46] pb-3"><span className="font-bold text-[#38BDF8]">UDDANNELSESINDSIGT.COM</span><span className="bg-[#0F9D6E] text-white px-2 py-0.5 rounded text-[10px] font-bold">{includeAiModels ? "AI TILVALGT" : "ALLE UDDANNELSER"}</span></div>
                <div className="space-y-1"><span className="text-xs font-bold text-[#10B981] uppercase tracking-wider">Første resultat</span><h4 className="text-xl font-bold tracking-tight text-white font-display">{matchedPrograms[0].udbud_titel}</h4><p className="text-xs text-[#D4D4D8]">{matchedPrograms[0].institution} • KOT {matchedPrograms[0].kot_nr}</p></div>
                <div className="bg-[#27272A] p-3 rounded-lg flex flex-wrap justify-between text-[11px] text-[#A1A1AA] gap-2 font-mono-data"><span>Snit: {gpa === null ? "ikke indtastet" : formatDanishNumber(gpa)}</span><span>AI-model: {includeAiModels ? "til" : "fra"}</span></div>
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
