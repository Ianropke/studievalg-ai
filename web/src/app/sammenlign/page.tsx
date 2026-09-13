"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import initialProgramsCatalog from "../../../public/data/all_programs_catalog.json";
import { createProgramSlug, getProgramBySlug } from "@/lib/slugs";
import { ProgramItem } from "@/lib/lists";
import { Header } from "@/components/Header";
import { getEnrichedScores } from "@/lib/domainScoring";
import { ScoreDisclosure } from "@/components/ScoreDisclosure";
import { DATA_STATUS } from "@/lib/dataStatus";
import { aiBand, roundAiScore } from "@/lib/aiPresentation";

function ComparisonContent() {
  const searchParams = useSearchParams();
  const allPrograms = initialProgramsCatalog as unknown as ProgramItem[];

  const getInitialSlugs = () => {
    const paramA = searchParams.get("a");
    const paramB = searchParams.get("b");
    const paramC = searchParams.get("c");
    const slugs: string[] = [];
    if (paramA) slugs.push(paramA);
    if (paramB) slugs.push(paramB);
    if (paramC) slugs.push(paramC);
    return slugs.length > 0 ? slugs : ["10120-odontologi", "13030-ha-almen"];
  };

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(getInitialSlugs);
  const [userGpa, setUserGpa] = useState<number>(9.5);
  const [includeAiModels, setIncludeAiModels] = useState<boolean>(() => ["1", "true"].includes((searchParams.get("ai") || "").toLowerCase()));
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const selectedPrograms = useMemo(() => {
    const list = selectedSlugs
      .map((slug) => {
        const bySlug = getProgramBySlug(slug);
        if (bySlug) return bySlug;
        const kotPrefix = slug.split("-")[0];
        return allPrograms.find((p) => String(p.kot_nr) === kotPrefix || String(p.kot_nr) === slug);
      })
      .filter(Boolean) as ProgramItem[];
    if (list.length === 0 && allPrograms.length >= 2) return [allPrograms[0], allPrograms[1]];
    return list;
  }, [selectedSlugs, allPrograms]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return allPrograms.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return allPrograms.filter((p) => p.udbud_titel.toLowerCase().includes(q) || (p.institution && p.institution.toLowerCase().includes(q))).slice(0, 10);
  }, [searchQuery, allPrograms]);

  const addProgram = (prog: ProgramItem) => {
    const slug = createProgramSlug(prog);
    if (!selectedSlugs.includes(slug) && selectedSlugs.length < 3) setSelectedSlugs([...selectedSlugs, slug]);
    setShowSearchModal(false);
    setSearchQuery("");
  };

  const removeProgram = (index: number) => {
    if (selectedSlugs.length <= 1) return;
    const newSlugs = [...selectedSlugs];
    newSlugs.splice(index, 1);
    setSelectedSlugs(newSlugs);
  };

  const handleShare = () => {
    const url = new URL(window.location.origin + "/sammenlign");
    if (selectedSlugs[0]) url.searchParams.set("a", selectedSlugs[0]);
    if (selectedSlugs[1]) url.searchParams.set("b", selectedSlugs[1]);
    if (selectedSlugs[2]) url.searchParams.set("c", selectedSlugs[2]);
    if (includeAiModels) url.searchParams.set("ai", "1");
    if (navigator.share) {
      navigator.share({ title: "Sammenlign uddannelser på Uddannelsesindsigt", url: url.toString() }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const colors = [
    { border: "border-[#2563EB]", bg: "bg-[#EFF6FF]", text: "text-[#1D4ED8]", badge: "Uddannelse A" },
    { border: "border-[#0F9D6E]", bg: "bg-[#E6F4ED]", text: "text-[#0B7A57]", badge: "Uddannelse B" },
    { border: "border-[#7C3AED]", bg: "bg-[#F3E8FF]", text: "text-[#6D28D9]", badge: "Uddannelse C" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      <Header />
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="space-y-3 border-b border-[#E7E9EF] pb-6">
          <nav className="flex items-center gap-2 text-xs text-[#545D71]"><Link href="/" className="hover:underline">Forside</Link><span>/</span><span className="font-medium text-[#12172B]">Sammenlign</span></nav>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><h1 className="text-2xl lg:text-3xl font-bold text-[#12172B] tracking-tight font-display">Sammenlign uddannelser side om side</h1><p className="text-xs text-[#545D71] pt-1">Sammenlign op til tre uddannelser på adgangskvotient, studiested, fagligt indhold og et tydeligt markeret AI-perspektiv.</p></div>
            <button onClick={handleShare} className="px-4 py-2 bg-[#12172B] hover:bg-[#1E293B] text-[#FFFFFF] font-bold rounded-xl text-xs transition card-shadow shrink-0 flex items-center justify-center gap-2"><span>✨ Del sammenligning</span>{copied && <span className="text-[10px] bg-[#0F9D6E] px-1.5 py-0.5 rounded">Kopieret!</span>}</button>
          </div>
        </div>
        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E7E9EF] card-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 w-full sm:w-auto"><span className="text-xs font-bold text-[#12172B]">Dit Gymnasiale Gennemsnit (Kvote 1):</span><p className="text-[11px] text-[#545D71]">Brug slideren til at tjekke din adgangschance på alle valgte uddannelser:</p></div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0"><input type="range" min="2.0" max="12.0" step="0.1" value={userGpa} onChange={(e) => setUserGpa(parseFloat(e.target.value))} aria-label={`Gymnasialt gennemsnit: ${userGpa.toFixed(1)}`} aria-valuemin={2} aria-valuemax={12} aria-valuenow={userGpa} className="w-48 accent-[#2563EB] cursor-pointer"/><span className="text-lg font-bold font-mono-data text-[#2563EB] w-12 text-right">{userGpa.toFixed(1)}</span></div>
        </div>
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E7E9EF] card-shadow space-y-5">
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[#0F9D6E]/25 bg-[#E3F6EE] p-4 text-xs leading-relaxed text-[#315C4C]">
            <span><strong className="block text-[#0B7A57]">Inddrag AI-modelestimater</strong>O*NET 31.0-modellen dækker {DATA_STATUS.scoring.mappedProgrammeCount} af {DATA_STATUS.catalogue.programmeCount.toLocaleString("da-DK")} uddannelser. Manglende dækning vises som “ikke tilgængeligt” — aldrig som en standardsætning eller en skjult score.</span>
            <input type="checkbox" checked={includeAiModels} onChange={(event) => setIncludeAiModels(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#0F9D6E]" data-testid="compare-ai-toggle" />
          </label>
          <div className="space-y-4 w-full"><h3 className="text-sm font-bold text-[#12172B]">Sammenligningskonfiguration</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedPrograms.map((prog, idx) => { const style = colors[idx % colors.length]; const slug = createProgramSlug(prog); return <div key={slug} className={`p-3 rounded-xl border ${style.border} ${style.bg} space-y-2 relative`}><div className="flex justify-between items-center"><span className={`text-[10px] font-bold ${style.text}`}>{style.badge}</span>{selectedPrograms.length > 1 && <button onClick={() => removeProgram(idx)} className="text-xs text-[#667085] hover:text-[#EF4444] font-bold px-1" title="Fjern fra sammenligning">✕</button>}</div><Link href={`/uddannelse/${slug}`} className="font-bold text-xs text-[#12172B] hover:underline block truncate">{prog.udbud_titel}</Link><p className="text-[11px] text-[#545D71] truncate">{prog.institution || prog.institution_navn}</p></div>; })}
            {selectedPrograms.length < 3 && <button onClick={() => setShowSearchModal(true)} className="p-4 rounded-xl border border-dashed border-[#D8DBE4] hover:border-[#2563EB] bg-[#F7F8FA] hover:bg-[#EFF6FF] text-[#2563EB] font-bold text-xs transition flex flex-col items-center justify-center gap-1 h-full min-h-[90px]"><span>+ Tilføj uddannelse</span><span className="text-[10px] text-[#667085] font-normal">(Op til 3 samtidig)</span></button>}
          </div></div>
        </div>
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E7E9EF] card-shadow overflow-hidden">
          <div className="p-5 border-b border-[#E7E9EF] bg-[#F7F8FA] flex justify-between items-center"><h3 className="font-bold text-sm text-[#12172B]">Nøgletalsmatrix Side-om-Side</h3><span className="text-[11px] font-mono-data text-[#0B7A57] font-semibold">{includeAiModels ? `AI-model: ${DATA_STATUS.scoring.updatedLabel}` : "AI-model: fravalgt"}</span></div>
          <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead><tr className="border-b border-[#E7E9EF] bg-[#FFFFFF]"><th className="p-4 font-bold text-[#545D71] w-1/4">Parameter / Metric</th>{selectedPrograms.map((prog, idx) => { const style = colors[idx % colors.length]; return <th key={prog.id || idx} className="p-4 font-bold text-[#12172B] w-1/4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${style.bg} ${style.text} mr-1.5`}>{style.badge}</span><div className="pt-1 font-display">{prog.udbud_titel}</div></th>; })}</tr></thead>
            <tbody className="divide-y divide-[#E7E9EF]">
              <tr><td className="p-4 font-semibold text-[#545D71]">Institution &amp; By</td>{selectedPrograms.map((prog) => <td key={createProgramSlug(prog)} className="p-4 text-[#12172B]"><div className="font-medium">{prog.institution || prog.institution_navn}</div><div className="text-[11px] text-[#667085]">{prog.by || "Danmark"} • KOT {prog.kot_nr}</div></td>)}</tr>
              <tr><td className="p-4 font-semibold text-[#545D71]">Kvote 1 Adgangskvotient</td>{selectedPrograms.map((prog) => { const kv = String(prog.latest_kvotient || "Alle optaget"); const kvNum = parseFloat(kv.replace(",", ".")); const meets = isNaN(kvNum) || userGpa >= kvNum; return <td key={createProgramSlug(prog)} className="p-4"><span className="font-mono-data font-bold text-sm text-[#12172B] block">{kv}</span><span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${meets ? "bg-[#E6F4ED] text-[#0B7A57]" : "bg-[#FEE2E2] text-[#B91C1C]"}`}>{meets ? "✓ Adgangssnit opfyldt" : "⚠️ Kvote 2 anbefales"}</span></td>; })}</tr>
              {includeAiModels && <tr><td className="p-4 font-semibold text-[#545D71]">AI-perspektiv <span className="block text-[10px] font-normal text-[#667085]">O*NET 31.0-modelestimat</span></td>{selectedPrograms.map((prog) => { const enriched = getEnrichedScores(prog.udbud_titel, prog.scores); return <td key={createProgramSlug(prog)} className="p-4">{enriched.ranking_eligible.ai ? <><span className="font-bold text-sm text-[#087454] block">{aiBand(enriched.ai_resilience)} AI-robusthed</span><span className="mt-1 block font-mono-data text-[11px] text-[#545D71]">ca. {roundAiScore(enriched.ai_resilience)}/100</span></> : <span className="font-semibold text-xs text-[#667085]">Ikke tilgængeligt</span>}</td>; })}</tr>}
              <tr><td className="p-4 font-semibold text-[#545D71]">Kernekompetencer</td>{selectedPrograms.map((prog) => <td key={createProgramSlug(prog)} className="p-4">{prog.skills_hierarchy?.skills && prog.skills_hierarchy.skills.length > 0 ? <div className="flex flex-wrap gap-1">{prog.skills_hierarchy.skills.slice(0, 3).map((skill) => <span key={skill} className="bg-[#F7F8FA] border border-[#E7E9EF] px-1.5 py-0.5 rounded text-[10px] text-[#12172B]">{skill}</span>)}</div> : <span className="text-[#667085]">Tværdisciplinære evner</span>}</td>)}</tr>
            </tbody></table></div>
        </div>
        {includeAiModels && <div className="space-y-2">
          {selectedPrograms.map((prog) => (
            <ScoreDisclosure key={createProgramSlug(prog)} scores={getEnrichedScores(prog.udbud_titel, prog.scores)} compact />
          ))}
        </div>}
      </main>
      {showSearchModal && <div className="fixed inset-0 bg-[#12172B]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSearchModal(false)} onKeyDown={(e) => { if (e.key === "Escape") setShowSearchModal(false); }}><div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-2xl max-w-lg w-full p-6 space-y-4 card-shadow" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Vælg uddannelse til sammenligning"><div className="flex justify-between items-center border-b border-[#E7E9EF] pb-3"><h3 className="font-bold text-base text-[#12172B]">Vælg uddannelse til sammenligning</h3><button onClick={() => setShowSearchModal(false)} aria-label="Luk valg af uddannelse" className="text-[#667085] hover:text-[#12172B] text-lg font-bold">✕</button></div><input type="text" placeholder="Søg på uddannelse (fx Datalogi, Sygeplejerske, CBS)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#D8DBE4] rounded-xl text-xs focus:outline-none focus:border-[#2563EB]" autoFocus/><div className="max-h-60 overflow-y-auto divide-y divide-[#E7E9EF]">{searchResults.map((prog) => { const slug = createProgramSlug(prog); const isSelected = selectedSlugs.includes(slug); return <button key={slug} onClick={() => addProgram(prog)} disabled={isSelected} className={`w-full p-3 text-left hover:bg-[#EFF6FF] transition flex justify-between items-center text-xs ${isSelected ? "opacity-50 cursor-not-allowed" : ""}`}><div><span className="font-bold text-[#12172B] block">{prog.udbud_titel}</span><span className="text-[11px] text-[#545D71]">{prog.institution || prog.institution_navn} • KOT {prog.kot_nr}</span></div>{isSelected ? <span className="text-[10px] text-[#667085]">Valgt</span> : <span className="text-xs font-bold text-[#2563EB]">+ Vælg</span>}</button>; })}</div></div></div>}
    </div>
  );
}

export default function SammenlignPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#F7F8FA] p-10 text-xs text-[#545D71]">Henter sammenligningsværktøj...</div>}><ComparisonContent /></Suspense>;
}
