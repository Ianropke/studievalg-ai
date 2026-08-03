import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Metadata } from "next";
import { getAllPrograms, getProgramBySlug, createProgramSlug } from "@/lib/slugs";
import { getEnrichedScores } from "@/lib/domainScoring";

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
    title: `${title} — Adgangskvotient, AI-robusthed & Jobudsigter | Uddannelsesindsigt`,
    description: `${title} ved ${inst}: Seneste Kvote 1 adgangskvotient ${kv}. AI-robusthedsscore ${robust}/100, jobmuligheder ${prog.scores?.labour_demand || 50}/100. Se fuld analyse og sammenlign med dine egne prioriteter.`,
    alternates: {
      canonical: `https://uddannelsesindsigt.dk/uddannelse/${slug}`,
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

  const enriched = getEnrichedScores(title, prog.scores);
  const robustScore = 100 - (enriched.automation_risk || 0);
  const jobScore = enriched.labour_demand || 50;
  const salScore = enriched.salary_growth || 50;

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

      <Header />

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

          {/* Kort Svar-boks (AI Summary highlight box for SEO & AI agents) */}
          <div className="bg-[#EFF6FF] border border-[#2563EB]/20 p-5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1D4ED8]">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
              <span>KORT FORTALT</span>
            </div>
            <p className="text-sm font-semibold text-[#12172B] leading-relaxed">
              {robustScore >= 78 
                ? `Denne uddannelse vurderes at stå særligt stærkt i en AI-præget fremtid (AI-robusthed ${robustScore}/100), fordi arbejdet primært bygger på tværfaglig analyse, kompleks problemløsning og menneskelig vurdering.`
                : robustScore >= 65
                ? `Uddannelsen har en moderat AI-robusthedsscore (${robustScore}/100). Kunstig intelligens forventes i stigende grad at assistere dokumentation og rutineopgaver, mens den faglige helhedsvurdering fortsat kræver menneskelige fagpersoner.`
                : `Uddannelsen berøres i højere grad af AI-automatisering (${robustScore}/100), idet en række kerneopgaver kan effektiviseres af sprogmodeller. Det anbefales at supplere studiet med strategiske eller teknologiske kompetencer.`}
            </p>
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

          {/* Dataoverblik Faktaboks (Mono-tal & Seneste Optagelsesdato) */}
          <div className="bg-[#F7F8FA] p-5 rounded-xl border border-[#E7E9EF] space-y-3">
            <h3 className="text-xs font-bold text-[#12172B] uppercase tracking-wider">Dataoverblik & Nøgletal</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[#8891A3] block text-[11px]">KOT-nummer</span>
                <span className="font-mono-data font-bold text-[#12172B]">{kot}</span>
              </div>
              <div>
                <span className="text-[#8891A3] block text-[11px]">Adgangskvotient</span>
                <span className="font-mono-data font-bold text-[#12172B]">{kv}</span>
              </div>
              <div>
                <span className="text-[#8891A3] block text-[11px]">Institution</span>
                <span className="font-semibold text-[#12172B] truncate block">{inst}</span>
              </div>
              <div>
                <span className="text-[#8891A3] block text-[11px]">Dataopdatering</span>
                <span className="font-mono-data text-[#0B7A57] font-semibold">Juli 2026</span>
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
                      <Link key={i} href={`/?q=${encodeURIComponent(skill)}`} className="bg-[#FFFFFF] hover:border-[#12172B] border border-[#D8DBE4] px-2 py-0.5 rounded text-[11px] font-medium text-[#12172B] transition">
                        {skill} →
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lignende Uddannelser (Beregnet ud fra Geometrisk Trekant-Afstand) */}
          <div className="pt-6 border-t border-[#E7E9EF] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#12172B]">Lignende uddannelser</h3>
              <p className="text-xs text-[#545D71]">Beregnet ud fra geometrisk afstand mellem uddannelsernes tre score-profiler (AI, Job, Løn):</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getAllPrograms()
                .filter((p) => createProgramSlug(p) !== slug && p.udbud_titel)
                .map((p) => {
                  const pRob = 100 - (p.scores?.automation_risk || 0);
                  const pJob = p.scores?.labour_demand || 50;
                  const pSal = p.scores?.salary_growth || 50;
                  const dist = Math.hypot(pRob - robustScore, pJob - jobScore, pSal - salScore);
                  return { program: p, slug: createProgramSlug(p), dist, pRob, pJob, pSal };
                })
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 4)
                .map(({ program: simProg, slug: simSlug, pRob }) => (
                  <Link
                    key={simSlug}
                    href={`/uddannelse/${simSlug}`}
                    className="p-3.5 bg-[#F7F8FA] hover:bg-[#FFFFFF] border border-[#E7E9EF] hover:border-[#12172B] rounded-xl transition card-shadow space-y-1 block group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-xs text-[#12172B] group-hover:text-[#2563EB] transition truncate">
                        {simProg.udbud_titel}
                      </h4>
                      <span className="text-[10px] font-mono-data font-semibold text-[#0B7A57] bg-[#E6F4ED] px-2 py-0.5 rounded-full shrink-0">
                        AI {pRob}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#545D71] truncate">{simProg.institution || simProg.institution_navn}</p>
                  </Link>
                ))}
            </div>
          </div>

          {/* Call to Action Button */}
          <div className="pt-6 border-t border-[#E7E9EF] text-center">
            <Link
              href={`/?q=${encodeURIComponent(title)}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#12172B] hover:bg-[#1E293B] text-[#FFFFFF] font-bold rounded-xl text-xs transition card-shadow"
            >
              Se hvor godt denne uddannelse matcher dine egne prioriteter på Uddannelsesindsigt →
            </Link>
          </div>
        </article>
      </main>

      {/* Legal Footer */}
      <footer className="border-t border-[#E7E9EF] bg-[#FFFFFF] py-12 px-6 lg:px-16 text-[#545D71] text-xs mt-16">
        <div className="max-w-6xl mx-auto space-y-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 md:col-span-2">
              <h4 className="text-sm font-bold text-[#12172B]">Om Uddannelsesindsigt</h4>
              <p className="leading-relaxed">
                Uddannelsesindsigt hjælper dig med at vælge uddannelse — helt uafhængigt og uden reklamer. Vi viser dig, hvordan kunstig intelligens forventes at påvirke forskellige fag og job i fremtiden, så du kan tage det med i dit valg.
              </p>
              <p className="leading-relaxed text-[#8891A3]">
                Tallene her er vores bedste bud, baseret på statistik og modeller — ikke en garanti for, hvad der kommer til at ske for dig, dit optag eller din karriere. Officiel ansøgning sker via Optagelse.dk.
              </p>
              <p className="leading-relaxed text-[#8891A3]">
                Vi anbefaler desuden at tale med en studievejleder om dit konkrete valg — denne platform er ét godt input blandt flere, ikke en erstatning for personlig vejledning.
              </p>
            </div>

            <div className="space-y-3 bg-[#F7F8FA] p-5 rounded-xl border border-[#E7E9EF]">
              <h4 className="text-sm font-bold text-[#12172B]">Transparens</h4>
              <ul className="space-y-2 font-medium text-[#12172B]">
                <li className="flex items-center gap-2 text-[#0B7A57]">✓ Offentlige datakilder</li>
                <li className="flex items-center gap-2 text-[#0B7A57]">✓ Dokumenteret metode</li>
                <li className="flex items-center gap-2 text-[#0B7A57]">✓ Ingen behandling af personoplysninger</li>
                <li className="flex items-center gap-2 text-[#0B7A57]">✓ Nul sporing eller cookies</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E7E9EF] flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#8891A3] gap-2">
            <p>© 2026 Uddannelsesindsigt • Uafhængig pædagogisk beslutningsstøtte</p>
            <p className="font-mono-data font-semibold">Data senest opdateret: Juli 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
