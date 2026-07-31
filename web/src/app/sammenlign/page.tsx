"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import initialProgramsCatalog from "@public/data/all_programs_catalog.json";
import { createProgramSlug, getProgramBySlug } from "@/lib/slugs";
import { ProgramItem } from "@/lib/lists";
import { Header } from "@/components/Header";
import { getEnrichedScores } from "@/lib/domainScoring";

// Pure SVG multi-triangle radar for 2-3 programs
function MultiTriangleRadar({ programs }: { programs: ProgramItem[] }) {
  const R = 40;
  const cx = 50;
  const cy = 52;

  const refRob100 = { x: cx, y: cy - R };
  const refJob100 = { x: cx - R * 0.866, y: cy + R * 0.5 };
  const refSal100 = { x: cx + R * 0.866, y: cy + R * 0.5 };

  const R50 = R * 0.5;
  const refRob50 = { x: cx, y: cy - R50 };
  const refJob50 = { x: cx - R50 * 0.866, y: cy + R50 * 0.5 };
  const refSal50 = { x: cx + R50 * 0.866, y: cy + R50 * 0.5 };

  const colors = [
    { fill: "#2563EB", stroke: "#1D4ED8", label: "A" },
    { fill: "#0F9D6E", stroke: "#0B7A57", label: "B" },
    { fill: "#7C3AED", stroke: "#6D28D9", label: "C" },
  ];

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <svg viewBox="0 0 100 100" className="w-48 h-48 overflow-visible">
        {/* Reference Grid Rings */}
        <polygon points={`${refRob100.x},${refRob100.y} ${refJob100.x},${refJob100.y} ${refSal100.x},${refSal100.y}`} fill="none" stroke="#D8DBE4" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points={`${refRob50.x},${refRob50.y} ${refJob50.x},${refJob50.y} ${refSal50.x},${refSal50.y}`} fill="none" stroke="#E7E9EF" strokeWidth="1" strokeDasharray="2 2" />

        {/* Axes Lines */}
        <line x1={cx} y1={cy} x2={refRob100.x} y2={refRob100.y} stroke="#F0F2F5" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={refJob100.x} y2={refJob100.y} stroke="#F0F2F5" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={refSal100.x} y2={refSal100.y} stroke="#F0F2F5" strokeWidth="1" />

        {/* Polygons for each program */}
        {programs.map((prog, idx) => {
          const color = colors[idx % colors.length];
          const enriched = getEnrichedScores(prog.udbud_titel, prog.scores);
          const robust = 100 - (enriched.automation_risk || 0);
          const job = enriched.labour_demand || 50;
          const salary = enriched.salary_growth || 50;

          const rRob = R * (robust / 100);
          const rJob = R * (job / 100);
          const rSal = R * (salary / 100);

          const pRob = { x: cx, y: cy - rRob };
          const pJob = { x: cx - rJob * 0.866, y: cy + rJob * 0.5 };
          const pSal = { x: cx + rSal * 0.866, y: cy + rSal * 0.5 };

          return (
            <g key={prog.id || idx}>
              <polygon
                points={`${pRob.x},${pRob.y} ${pJob.x},${pJob.y} ${pSal.x},${pSal.y}`}
                fill={color.fill}
                fillOpacity="0.25"
                stroke={color.stroke}
                strokeWidth="2.5"
              />
              <circle cx={pRob.x} cy={pRob.y} r="3" fill={color.stroke} />
              <circle cx={pJob.x} cy={pJob.y} r="3" fill={color.stroke} />
              <circle cx={pSal.x} cy={pSal.y} r="3" fill={color.stroke} />
            </g>
          );
        })}

        {/* Axis Labels */}
        <text x={cx} y={refRob100.y - 6} fill="#0F9D6E" fontSize="8" fontWeight="bold" textAnchor="middle">AI-robusthed</text>
        <text x={refJob100.x - 4} y={refJob100.y + 12} fill="#2563EB" fontSize="8" fontWeight="bold" textAnchor="end">Jobmuligheder</text>
        <text x={refSal100.x + 4} y={refSal100.y + 12} fill="#7C3AED" fontSize="8" fontWeight="bold" textAnchor="start">Lønpotentiale</text>
      </svg>
    </div>
  );
}

function ComparisonContent() {
  const searchParams = useSearchParams();
  const allPrograms = initialProgramsCatalog as unknown as ProgramItem[];

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(["10120-odontologi", "13030-ha-almen"]);
  const [userGpa, setUserGpa] = useState<number>(9.5);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const paramA = searchParams.get("a");
    const paramB = searchParams.get("b");
    const paramC = searchParams.get("c");

    const slugs: string[] = [];
    if (paramA) slugs.push(paramA);
    if (paramB) slugs.push(paramB);
    if (paramC) slugs.push(paramC);

    if (slugs.length > 0) {
      // Hydrate via requestAnimationFrame to avoid setState in effect warning
      requestAnimationFrame(() => {
        setSelectedSlugs(slugs);
      });
    }
  }, [searchParams]);

  const selectedPrograms = useMemo(() => {
    const list = selectedSlugs
      .map((slug) => {
        const bySlug = getProgramBySlug(slug);
        if (bySlug) return bySlug;
        const kotPrefix = slug.split("-")[0];
        return allPrograms.find((p) => String(p.kot_nr) === kotPrefix || String(p.kot_nr) === slug);
      })
      .filter(Boolean) as ProgramItem[];

    // Fallback to first 2 programs if selection is empty
    if (list.length === 0 && allPrograms.length >= 2) {
      return [allPrograms[0], allPrograms[1]];
    }
    return list;
  }, [selectedSlugs, allPrograms]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return allPrograms.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return allPrograms
      .filter((p) => p.udbud_titel.toLowerCase().includes(q) || (p.institution && p.institution.toLowerCase().includes(q)))
      .slice(0, 10);
  }, [searchQuery, allPrograms]);

  const addProgram = (prog: ProgramItem) => {
    const slug = createProgramSlug(prog);
    if (!selectedSlugs.includes(slug) && selectedSlugs.length < 3) {
      setSelectedSlugs([...selectedSlugs, slug]);
    }
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

    if (navigator.share) {
      navigator.share({
        title: "Sammenlign uddannelser på Uddannelsesindsigt",
        url: url.toString(),
      }).catch(() => {});
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

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Breadcrumbs & Title */}
        <div className="space-y-3 border-b border-[#E7E9EF] pb-6">
          <nav className="flex items-center gap-2 text-xs text-[#545D71]">
            <Link href="/" className="hover:underline">Forside</Link>
            <span>/</span>
            <span className="font-medium text-[#12172B]">Sammenlign</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#12172B] tracking-tight font-display">
                Sammenlign Uddannelser Side-om-Side
              </h1>
              <p className="text-xs text-[#545D71] pt-1">
                Sammenlign op til 3 uddannelser samtidig på Kote 1 adgangskvotienter, AI-robusthed, løn og jobmuligheder.
              </p>
            </div>

            <button
              onClick={handleShare}
              className="px-4 py-2 bg-[#12172B] hover:bg-[#1E293B] text-[#FFFFFF] font-bold rounded-xl text-xs transition card-shadow shrink-0 flex items-center justify-center gap-2"
            >
              <span>✨ Del sammenligning</span>
              {copied && <span className="text-[10px] bg-[#0F9D6E] px-1.5 py-0.5 rounded">Kopieret!</span>}
            </button>
          </div>
        </div>

        {/* Student GPA Filter Bar */}
        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E7E9EF] card-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-[#12172B]">Dit Gymnasiale Gennemsnit (Kvote 1):</span>
            <p className="text-[11px] text-[#545D71]">Brug slideren til at tjekke din adgangschance på alle valgte uddannelser:</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <input
              type="range"
              min="2.0"
              max="12.0"
              step="0.1"
              value={userGpa}
              onChange={(e) => setUserGpa(parseFloat(e.target.value))}
              className="w-48 accent-[#2563EB] cursor-pointer"
            />
            <span className="text-lg font-bold font-mono-data text-[#2563EB] w-12 text-right">{userGpa.toFixed(1)}</span>
          </div>
        </div>

        {/* SVG Multi Radar Comparison Section */}
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E7E9EF] card-shadow flex flex-col sm:flex-row items-center gap-8">
          <div className="shrink-0 flex flex-col items-center">
            <MultiTriangleRadar programs={selectedPrograms} />
            <span className="text-[10px] font-semibold text-[#8891A3]">Overlappende Trekant-Profil</span>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <h3 className="text-sm font-bold text-[#12172B]">Sammenligningskonfiguration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {selectedPrograms.map((prog, idx) => {
                const style = colors[idx % colors.length];
                const slug = createProgramSlug(prog);
                return (
                  <div key={slug} className={`p-3 rounded-xl border ${style.border} ${style.bg} space-y-2 relative`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold ${style.text}`}>{style.badge}</span>
                      {selectedPrograms.length > 1 && (
                        <button
                          onClick={() => removeProgram(idx)}
                          className="text-xs text-[#8891A3] hover:text-[#EF4444] font-bold px-1"
                          title="Fjern fra sammenligning"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <Link href={`/uddannelse/${slug}`} className="font-bold text-xs text-[#12172B] hover:underline block truncate">
                      {prog.udbud_titel}
                    </Link>
                    <p className="text-[11px] text-[#545D71] truncate">{prog.institution || prog.institution_navn}</p>
                  </div>
                );
              })}

              {selectedPrograms.length < 3 && (
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="p-4 rounded-xl border border-dashed border-[#D8DBE4] hover:border-[#2563EB] bg-[#F7F8FA] hover:bg-[#EFF6FF] text-[#2563EB] font-bold text-xs transition flex flex-col items-center justify-center gap-1 h-full min-h-[90px]"
                >
                  <span>+ Tilføj uddannelse</span>
                  <span className="text-[10px] text-[#8891A3] font-normal">(Op til 3 samtidig)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Table */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E7E9EF] card-shadow overflow-hidden">
          <div className="p-5 border-b border-[#E7E9EF] bg-[#F7F8FA] flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#12172B]">Nøgletalsmatrix Side-om-Side</h3>
            <span className="text-[11px] font-mono-data text-[#0B7A57] font-semibold">Dataopdatering: Juli 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E7E9EF] bg-[#FFFFFF]">
                  <th className="p-4 font-bold text-[#545D71] w-1/4">Parameter / Metric</th>
                  {selectedPrograms.map((prog, idx) => {
                    const style = colors[idx % colors.length];
                    return (
                      <th key={prog.id || idx} className="p-4 font-bold text-[#12172B] w-1/4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${style.bg} ${style.text} mr-1.5`}>
                          {style.badge}
                        </span>
                        <div className="pt-1 font-display">{prog.udbud_titel}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9EF]">
                {/* Row 1: KOT & Institution */}
                <tr>
                  <td className="p-4 font-semibold text-[#545D71]">Institution &amp; By</td>
                  {selectedPrograms.map((prog) => (
                    <td key={prog.id} className="p-4 text-[#12172B]">
                      <div className="font-medium">{prog.institution || prog.institution_navn}</div>
                      <div className="text-[11px] text-[#8891A3]">{prog.by || "Danmark"} • KOT {prog.kot_nr}</div>
                    </td>
                  ))}
                </tr>

                {/* Row 2: Adgangskvotient & User Eligibility */}
                <tr>
                  <td className="p-4 font-semibold text-[#545D71]">Kvote 1 Adgangskvotient</td>
                  {selectedPrograms.map((prog) => {
                    const kv = String(prog.latest_kvotient || "Alle optaget");
                    const kvNum = parseFloat(kv.replace(",", "."));
                    const meets = isNaN(kvNum) || userGpa >= kvNum;
                    return (
                      <td key={prog.id} className="p-4">
                        <span className="font-mono-data font-bold text-sm text-[#12172B] block">{kv}</span>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${meets ? "bg-[#E6F4ED] text-[#0B7A57]" : "bg-[#FEE2E2] text-[#DC2626]"}`}>
                          {meets ? "✓ Adgangssnit opfyldt" : "⚠️ Kvote 2 anbefales"}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Row 3: AI-robusthed */}
                <tr>
                  <td className="p-4 font-semibold text-[#545D71]">AI-robusthedsscore</td>
                  {selectedPrograms.map((prog) => {
                    const enriched = getEnrichedScores(prog.udbud_titel, prog.scores);
                    const rob = 100 - (enriched.automation_risk || 0);
                    return (
                      <td key={prog.id} className="p-4">
                        <span className="font-mono-data font-bold text-sm text-[#0F9D6E] block">{rob}/100</span>
                        <div className="w-full bg-[#E7E9EF] h-2 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-[#0F9D6E] h-full rounded-full" style={{ width: `${rob}%` }}></div>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Row 4: Jobmuligheder */}
                <tr>
                  <td className="p-4 font-semibold text-[#545D71]">Jobmuligheder &amp; Efterspørgsel</td>
                  {selectedPrograms.map((prog) => {
                    const enriched = getEnrichedScores(prog.udbud_titel, prog.scores);
                    const job = enriched.labour_demand || 50;
                    return (
                      <td key={prog.id} className="p-4">
                        <span className="font-mono-data font-bold text-sm text-[#2563EB] block">{job}/100</span>
                        <div className="w-full bg-[#E7E9EF] h-2 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${job}%` }}></div>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Row 5: Lønpotentiale */}
                <tr>
                  <td className="p-4 font-semibold text-[#545D71]">Lønpotentiale</td>
                  {selectedPrograms.map((prog) => {
                    const enriched = getEnrichedScores(prog.udbud_titel, prog.scores);
                    const sal = enriched.salary_growth || 50;
                    return (
                      <td key={prog.id} className="p-4">
                        <span className="font-mono-data font-bold text-sm text-[#7C3AED] block">{sal}/100</span>
                        <div className="w-full bg-[#E7E9EF] h-2 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-[#7C3AED] h-full rounded-full" style={{ width: `${sal}%` }}></div>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Row 6: Primary Skills */}
                <tr>
                  <td className="p-4 font-semibold text-[#545D71]">Kernekompetencer</td>
                  {selectedPrograms.map((prog) => (
                    <td key={prog.id} className="p-4">
                      {prog.skills_hierarchy?.skills && prog.skills_hierarchy.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {prog.skills_hierarchy.skills.slice(0, 3).map((skill, sIdx) => (
                            <span key={sIdx} className="bg-[#F7F8FA] border border-[#E7E9EF] px-1.5 py-0.5 rounded text-[10px] text-[#12172B]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#8891A3]">Tværdisciplinære evner</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Search Modal for Adding Program */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-[#12172B]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-2xl max-w-lg w-full p-6 space-y-4 card-shadow">
            <div className="flex justify-between items-center border-b border-[#E7E9EF] pb-3">
              <h3 className="font-bold text-base text-[#12172B]">Vælg uddannelse til sammenligning</h3>
              <button onClick={() => setShowSearchModal(false)} className="text-[#8891A3] hover:text-[#12172B] text-lg font-bold">
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Søg på uddannelse (fx Datalogi, Sygeplejerske, CBS)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#D8DBE4] rounded-xl text-xs focus:outline-none focus:border-[#2563EB]"
              autoFocus
            />

            <div className="max-h-60 overflow-y-auto divide-y divide-[#E7E9EF]">
              {searchResults.map((prog) => {
                const slug = createProgramSlug(prog);
                const isSelected = selectedSlugs.includes(slug);
                return (
                  <button
                    key={slug}
                    onClick={() => addProgram(prog)}
                    disabled={isSelected}
                    className={`w-full p-3 text-left hover:bg-[#EFF6FF] transition flex justify-between items-center text-xs ${isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>
                      <span className="font-bold text-[#12172B] block">{prog.udbud_titel}</span>
                      <span className="text-[11px] text-[#545D71]">{prog.institution || prog.institution_navn} • KOT {prog.kot_nr}</span>
                    </div>
                    {isSelected ? (
                      <span className="text-[10px] text-[#8891A3]">Valgt</span>
                    ) : (
                      <span className="text-xs font-bold text-[#2563EB]">+ Vælg</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SammenlignPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F8FA] p-10 text-xs text-[#545D71]">Henter sammenligningsværktøj...</div>}>
      <ComparisonContent />
    </Suspense>
  );
}
