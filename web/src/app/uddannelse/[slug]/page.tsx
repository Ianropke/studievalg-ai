import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import dynamicImport from "next/dynamic";
import { getAllPrograms, getProgramBySlug, createProgramSlug } from "@/lib/slugs";

// Pure server SVG triangle radar component
function CompactTriangleRadar({ robust, job, salary }: { robust: number; job: number; salary: number }) {
  const R = 34;
  const cx = 50;
  const cy = 48;
  
  const rRob = R * (robust / 100);
  const rJob = R * (job / 100);
  const rSal = R * (salary / 100);
  
  const pRob = { x: cx, y: cy - rRob };
  const pJob = { x: cx - rJob * 0.866, y: cy + rJob * 0.5 };
  const pSal = { x: cx + rSal * 0.866, y: cy + rSal * 0.5 };

  const refRob100 = { x: cx, y: cy - R };
  const refJob100 = { x: cx - R * 0.866, y: cy + R * 0.5 };
  const refSal100 = { x: cx + R * 0.866, y: cy + R * 0.5 };

  const R50 = R * 0.5;
  const refRob50 = { x: cx, y: cy - R50 };
  const refJob50 = { x: cx - R50 * 0.866, y: cy + R50 * 0.5 };
  const refSal50 = { x: cx + R50 * 0.866, y: cy + R50 * 0.5 };

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
        <polygon points={`${refRob100.x},${refRob100.y} ${refJob100.x},${refJob100.y} ${refSal100.x},${refSal100.y}`} fill="none" stroke="#D8DBE4" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points={`${refRob50.x},${refRob50.y} ${refJob50.x},${refJob50.y} ${refSal50.x},${refSal50.y}`} fill="none" stroke="#E7E9EF" strokeWidth="1" strokeDasharray="2 2" />

        <line x1={cx} y1={cy} x2={refRob100.x} y2={refRob100.y} stroke="#F0F2F5" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={refJob100.x} y2={refJob100.y} stroke="#F0F2F5" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={refSal100.x} y2={refSal100.y} stroke="#F0F2F5" strokeWidth="1" />
        
        <polygon points={`${pRob.x},${pRob.y} ${pJob.x},${pJob.y} ${pSal.x},${pSal.y}`} fill={fillColor} fillOpacity="0.2" stroke={strokeColor} strokeWidth="2" />
        
        <circle cx={pRob.x} cy={pRob.y} r="3.5" fill="#0F9D6E" />
        <circle cx={pJob.x} cy={pJob.y} r="3.5" fill="#2563EB" />
        <circle cx={pSal.x} cy={pSal.y} r="3.5" fill="#7C3AED" />

        <text x={cx} y={refRob100.y - 4} fill="#0F9D6E" fontSize="7.5" fontWeight="bold" textAnchor="middle">AI: {robust}</text>
        <text x={refJob100.x - 2} y={refJob100.y + 10} fill="#2563EB" fontSize="7.5" fontWeight="bold" textAnchor="end">Job: {job}</text>
        <text x={refSal100.x + 2} y={refSal100.y + 10} fill="#7C3AED" fontSize="7.5" fontWeight="bold" textAnchor="start">Løn: {salary}</text>
      </svg>

      <span className={`text-[10px] font-bold font-mono-data px-2 py-0.5 rounded-full border ${badgeBg} ${badgeText} ${badgeBorder}`}>
        Trekant-profil ({avg} · {statusLabel})
      </span>
    </div>
  );
}

export async function generateStaticParams() {
  const all = getAllPrograms();
  return all.map((prog) => ({
    slug: createProgramSlug(prog),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const prog = getProgramBySlug(slug);

  if (!prog) {
    return {
      title: "Uddannelsen blev ikke fundet | Studievalg AI",
    };
  }

  const title = prog.udbud_titel || "Uddannelse";
  const inst = prog.institution || prog.institution_navn || "";
  const kv = prog.latest_kvotient || "Alle optaget";
  const robust = 100 - (prog.scores?.automation_risk || 0);

  return {
    title: `${title} — Adgangskvotient, AI-robusthed & Jobudsigter | Studievalg AI`,
    description: `${title} ved ${inst}: Seneste Kvote 1 adgangskvotient ${kv}. AI-robusthedsscore ${robust}/100, jobmuligheder ${prog.scores?.labour_demand || 50}/100. Se fuld analyse og sammenlign med dine egne prioriteter.`,
    alternates: {
      canonical: `https://studievalg-ai.vercel.app/uddannelse/${slug}`,
    },
  };
}

export default async function UddannelsePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prog = getProgramBySlug(slug);

  if (!prog) {
    notFound();
  }

  const title = prog.udbud_titel || "Uddannelse";
  const inst = prog.institution || prog.institution_navn || "Uddannelsessted";
  const city = prog.by || "";
  const kot = String(prog.kot_nr || "");
  const kv = prog.latest_kvotient || "Alle optaget";

  const robustScore = 100 - (prog.scores?.automation_risk || 0);
  const jobScore = prog.scores?.labour_demand || 50;
  const salScore = prog.scores?.salary_growth || 50;

  // Schema.org Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    "name": title,
    "educationalProgramMode": "Full-time",
    "provider": {
      "@type": "EducationalOrganization",
      "name": inst,
      "address": city,
    },
    "identifier": kot,
    "description": `Adgangskvotient ${kv}. AI-robusthedsscore ${robustScore}/100.`,
    "url": `https://studievalg-ai.vercel.app/uddannelse/${slug}`,
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      {/* Schema.org Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-[#E7E9EF] bg-[#FFFFFF] sticky top-0 z-50 px-6 lg:px-16 py-4 flex justify-between items-center card-shadow">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-lg bg-[#12172B] text-[#FFFFFF] flex items-center justify-center font-bold text-sm font-display hover:opacity-90 transition">
            S
          </Link>
          <div>
            <Link href="/" className="font-bold text-sm text-[#12172B] tracking-tight hover:underline">
              Studievalg AI
            </Link>
            <p className="text-[10px] text-[#545D71]">Statistisk beslutningsstøtte baseret på UFM og Danmarks Statistik</p>
          </div>
        </div>
        <nav className="flex gap-4 text-xs font-semibold">
          <Link href="/" className="text-[#545D71] hover:text-[#12172B]">Studievalg</Link>
          <Link href="/analyse" className="text-[#545D71] hover:text-[#12172B]">AI Insights</Link>
          <Link href="/evidens" className="text-[#545D71] hover:text-[#12172B]">Evidens</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#545D71]">
          <Link href="/" className="hover:underline">Forside</Link>
          <span>/</span>
          <Link href="/" className="hover:underline">Uddannelser</Link>
          <span>/</span>
          <span className="font-medium text-[#12172B]">{title}</span>
        </nav>

        {/* Hero Banner Card */}
        <article className="border border-[#E7E9EF] bg-[#FFFFFF] rounded-2xl p-6 lg:p-8 card-shadow space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-[#E7E9EF]">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-xs text-[#545D71]">
                <span className="font-semibold text-[#2563EB]">{inst}</span>
                {city && <span>• {city}</span>}
                <span>•</span>
                <span className="font-mono-data text-[#8891A3]">KOT {kot}</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#12172B] tracking-tight font-display">
                {title}
              </h1>
            </div>

            <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E7E9EF] text-left md:text-right shrink-0 w-full md:w-auto">
              <span className="text-[11px] text-[#8891A3] block">Kvote 1 adgangskvotient (2026)</span>
              <span className="text-2xl font-bold text-[#12172B] font-mono-data">{kv}</span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#E6F4ED] text-[#0B7A57] border border-[#0F9D6E]/20 mt-1 block">
                Offektiv UFM registerdata
              </span>
            </div>
          </div>

          {/* Visual Score Section: Compact Radar + 3 Bars */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#F7F8FA] p-6 rounded-xl border border-[#E7E9EF]">
            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E7E9EF] flex flex-col items-center justify-center shrink-0 w-40 card-shadow">
              <CompactTriangleRadar robust={robustScore} job={jobScore} salary={salScore} />
            </div>

            <div className="flex-1 space-y-3.5 w-full">
              {/* Bar 1: AI-robusthed */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-[#12172B]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0F9D6E]"></span> AI-robusthed
                  </span>
                  <span className="font-mono-data font-bold text-[#0F9D6E]">{robustScore}/100</span>
                </div>
                <div className="h-2.5 bg-[#E7E9EF] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0F9D6E] rounded-full" style={{ width: `${robustScore}%` }}></div>
                </div>
              </div>

              {/* Bar 2: Jobmuligheder */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-[#12172B]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span> Jobmuligheder
                  </span>
                  <span className="font-mono-data font-bold text-[#2563EB]">{jobScore}/100</span>
                </div>
                <div className="h-2.5 bg-[#E7E9EF] rounded-full overflow-hidden">
                  <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${jobScore}%` }}></div>
                </div>
              </div>

              {/* Bar 3: Lønpotentiale */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-[#12172B]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]"></span> Lønpotentiale
                  </span>
                  <span className="font-mono-data font-bold text-[#7C3AED]">{salScore}/100</span>
                </div>
                <div className="h-2.5 bg-[#E7E9EF] rounded-full overflow-hidden">
                  <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: `${salScore}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* RAG Evidence & Method Explanation */}
          <div className="space-y-4 pt-4 border-t border-[#E7E9EF]">
            <h3 className="text-base font-bold text-[#12172B]">Evidensforklaring & Modelanalyse</h3>
            <p className="text-xs text-[#545D71] leading-relaxed">
              Uddannelsen <strong className="text-[#12172B]">{title}</strong> har en beregnet AI-robusthedsscore på <strong className="text-[#0B7A57]">{robustScore}/100</strong> baseret på O*NET opgavetaksonomi og økonometrisk fremskrivning. Kvote 1-adgangskvotienten var senest <strong className="text-[#12172B]">{kv}</strong>.
            </p>

            {prog.skills_hierarchy && (
              <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E7E9EF] space-y-2 text-xs">
                <h4 className="font-bold text-[#12172B]">Kompetence- og opgaveanalyse</h4>
                <p className="text-[#545D71] leading-relaxed">{prog.skills_hierarchy.learning_outcomes || prog.skills_hierarchy.tasks}</p>
                {prog.skills_hierarchy.skills && prog.skills_hierarchy.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {prog.skills_hierarchy.skills.map((skill, i) => (
                      <span key={i} className="bg-[#FFFFFF] border border-[#D8DBE4] px-2 py-0.5 rounded text-[11px] font-medium text-[#12172B]">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Call to Action Button */}
          <div className="pt-4 border-t border-[#E7E9EF] text-center">
            <Link
              href={`/?q=${encodeURIComponent(title)}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#12172B] hover:bg-[#1E293B] text-[#FFFFFF] font-bold rounded-xl text-xs transition card-shadow"
            >
              Se hvor godt denne uddannelse matcher dine egne prioriteter på Studievalg AI →
            </Link>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E7E9EF] bg-[#FFFFFF] py-12 px-6 lg:px-16 text-[#545D71] text-xs mt-16">
        <div className="max-w-6xl mx-auto space-y-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 md:col-span-2">
              <h4 className="text-sm font-bold text-[#12172B]">Om Studievalg AI</h4>
              <p className="leading-relaxed">
                Studievalg AI er en uafhængig, ikke-kommerciel informationsplatform, der tilbyder pædagogisk beslutningsstøtte til uddannelsessøgende. Formålet er at belyse, hvordan kunstig intelligens forventes at påvirke arbejdsmarkedet og specifikke uddannelser.
              </p>
              <p className="leading-relaxed">
                Denne platform vurderer ikke mennesker eller deres fremtidige jobmuligheder. Den analyserer udelukkende statistiske mønstre på uddannelses- og arbejdsmarkedsniveau baseret på offentlig forskning og tilgængelige data. Alle beregninger udføres deterministisk ud fra dokumenterede modeller og datakilder.
              </p>
              <p className="leading-relaxed text-[#545D71]">
                De viste AI-scorer, kvotienter og analyser er statistiske modelestimater og udgør ikke forudsigelser eller garantier for den enkelte uddannelse, optagelse eller karriere. Officiel ansøgning og optagelse sker altid via Optagelse.dk, og det anbefales at supplere med information fra uddannelsesinstitutionernes egne beskrivelser samt officiel studievejledning.
              </p>
            </div>

            <div className="space-y-3 bg-[#F7F8FA] p-5 rounded-xl border border-[#E7E9EF]">
              <h4 className="text-sm font-bold text-[#12172B]">Transparens</h4>
              <ul className="space-y-2 font-medium text-[#12172B]">
                <li className="flex items-center gap-2 text-[#0B7A57]">✓ Offentlige datakilder</li>
                <li className="flex items-center gap-2 text-[#0B7A57]">✓ Dokumenteret metode (Open methodology)</li>
                <li className="flex items-center gap-2 text-[#0B7A57]">✓ Ingen behandling af personoplysninger</li>
                <li className="flex items-center gap-2 text-[#0B7A57]">✓ Ingen brugertracking eller cookies</li>
                <li className="flex items-center gap-2 text-[#0B7A57]">✓ Ingen reklamer eller kommercielle interesser</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E7E9EF] space-y-3">
            <h4 className="text-xs font-bold text-[#12172B] uppercase tracking-wider">Datakilder</h4>
            <p className="leading-relaxed text-[#545D71]">
              Platformen bygger på aggregerede data fra følgende institutioner og forskningspublikationer:
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-medium text-[#545D71]">
              <span className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md">Uddannelses- og Forskningsministeriet (KOT)</span>
              <span className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md">Danmarks Statistik</span>
              <span className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md">OECD & ILO</span>
              <span className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md">ESCO & O*NET</span>
              <span className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md">OpenAI / Eloundou et al.</span>
              <span className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md">Felten et al.</span>
              <span className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md">Kraka & Deloitte</span>
              <span className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md">PwC AI Jobs Barometer</span>
              <span className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md">McKinsey Global Institute</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E7E9EF] flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#8891A3] gap-2">
            <p>© 2026 Studievalg AI • Uafhængig pædagogisk beslutningsstøtte</p>
            <p className="font-mono-data font-semibold">Data senest opdateret: Juli 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
