import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Metadata } from "next";
import { getAllPrograms, getProgramBySlug, createProgramSlug } from "@/lib/slugs";
import { getEnrichedScores } from "@/lib/domainScoring";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/siteMetadata";
import { ScoreDisclosure } from "@/components/ScoreDisclosure";
import { EvidenceList } from "@/components/EvidenceList";
import { DATA_STATUS } from "@/lib/dataStatus";
import { normalizeProgramName } from "@/lib/programName";
import { aiBand, roundAiScore } from "@/lib/aiPresentation";

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
  const enriched = getEnrichedScores(title, prog.scores);
  const robust = enriched.ai_resilience;
  const aiDescription = enriched.ranking_eligible.ai
    ? `${aiBand(robust)} AI-robusthed i et opgavebaseret O*NET 31.0-modelestimat.`
    : "AI-modelestimat er ikke tilgængeligt, fordi en defensibel programkobling mangler.";

  return {
    title: `${title} — adgangskvotient og AI-perspektiv | Uddannelsesindsigt`,
    description: `${title} ved ${inst}: Seneste Kvote 1-adgangskvotient ${kv}. ${aiDescription}`,
    alternates: {
      canonical: `https://uddannelsesindsigt.com/uddannelse/${slug}`,
    },
    openGraph: {
      title: `${title} | Uddannelsesindsigt`,
      description: `${title} ved ${inst}: adgangskvotient ${kv}. ${aiDescription}`,
      url: `https://uddannelsesindsigt.com/uddannelse/${slug}`,
      siteName: "Uddannelsesindsigt",
      locale: "da_DK",
      type: "website",
      images: [DEFAULT_SOCIAL_IMAGE],
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
  const robustScore = enriched.ai_resilience;
  const aiEligible = enriched.ranking_eligible.ai;
  const roundedRobustScore = roundAiScore(robustScore);

  // Schema.org Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    "name": title,
    "educationalProgramMode": "Full-time",
    "provider": {
      "@type": "EducationalOrganization",
      "name": inst,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": city,
        "addressCountry": "DK"
      },
    },
    "identifier": kot,
    "description": `Seneste Kvote 1-adgangskvotient ${kv}. ${aiEligible ? `${aiBand(robustScore)} AI-robusthed i et tydeligt markeret modelestimat.` : "AI-modelestimat ikke tilgængeligt."}`,
    "url": `https://uddannelsesindsigt.com/uddannelse/${slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Forside",
        "item": "https://uddannelsesindsigt.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Uddannelser",
        "item": "https://uddannelsesindsigt.com"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": `https://uddannelsesindsigt.com/uddannelse/${slug}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      {/* Schema.org Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Header />

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="max-w-4xl mx-auto px-6 py-10 space-y-8">
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
                <span className="font-mono-data text-[#667085]">KOT {kot}</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#12172B] tracking-tight font-display">
                {title}
              </h1>
            </div>

            <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E7E9EF] text-left md:text-right shrink-0 w-full md:w-auto">
              <span className="text-[11px] text-[#667085] block">Kvote 1 adgangskvotient (2026)</span>
              <span className="text-2xl font-bold text-[#12172B] font-mono-data">{kv}</span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#E6F4ED] text-[#0B7A57] border border-[#0F9D6E]/20 mt-1 block">
                Officiel UFM-registerdata
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
              {aiEligible
                ? `${aiBand(robustScore)} AI-robusthed (ca. ${roundedRobustScore}/100). Estimatet beskriver opgavernes mulige møde med AI og er ikke en prognose for uddannelsens værdi, ledighed eller din fremtid.`
                : "Der vises ikke et AI-estimat for denne uddannelse, fordi den endnu ikke har en defensibel programkobling til O*NET 31.0. Manglende data er ikke det samme som lav AI-robusthed."}
            </p>
          </div>

          <div className={`rounded-xl border p-5 ${aiEligible ? "border-[#0F9D6E]/25 bg-[#E3F6EE]" : "border-[#D8DBE4] bg-[#F7F8FA]"}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0B7A57]">AI-perspektiv</p>
                <h2 className="mt-1 text-lg font-bold text-[#12172B]">{aiEligible ? `${aiBand(robustScore)} modelestimat` : "Ikke tilgængeligt"}</h2>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#545D71]">{aiEligible ? `Baseret på amerikanske O*NET 31.0-opgavedata via en program-crosswalk. Dækning på hele siden: ${DATA_STATUS.scoring.mappedProgrammeCount} af ${DATA_STATUS.catalogue.programmeCount} uddannelser.` : "Uddannelsen vises stadig i kataloget og kan sammenlignes på observerede optagelsesdata."}</p>
              </div>
              {aiEligible && <span className="w-fit rounded-full border border-[#0F9D6E]/30 bg-white px-4 py-2 text-sm font-bold text-[#0B7A57]">ca. {roundedRobustScore}/100</span>}
            </div>
          </div>

          {/* Dataoverblik Faktaboks (Mono-tal & Seneste Optagelsesdato) */}
          <div className="bg-[#F7F8FA] p-5 rounded-xl border border-[#E7E9EF] space-y-3">
            <h3 className="text-xs font-bold text-[#12172B] uppercase tracking-wider">Dataoverblik & Nøgletal</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[#667085] block text-[11px]">KOT-nummer</span>
                <span className="font-mono-data font-bold text-[#12172B]">{kot}</span>
              </div>
              <div>
                <span className="text-[#667085] block text-[11px]">Adgangskvotient</span>
                <span className="font-mono-data font-bold text-[#12172B]">{kv}</span>
              </div>
              <div>
                <span className="text-[#667085] block text-[11px]">Institution</span>
                <span className="font-semibold text-[#12172B] truncate block">{inst}</span>
              </div>
              <div>
                <span className="text-[#667085] block text-[11px]">Dataopdatering</span>
                <span className="font-mono-data text-[#0B7A57] font-semibold">Optagelse {DATA_STATUS.catalogue.admissionsUpdatedLabel} · model {DATA_STATUS.scoring.updatedLabel}</span>
              </div>
            </div>
          </div>

          {/* RAG Evidence & Method Explanation */}
          <div className="space-y-4 pt-4 border-t border-[#E7E9EF]">
            <h3 className="text-base font-bold text-[#12172B]">Evidensforklaring & Modelanalyse</h3>
            <p className="text-xs text-[#545D71] leading-relaxed">
              Kvote 1-adgangskvotienten for <strong className="text-[#12172B]">{title}</strong> var senest <strong className="text-[#12172B]">{kv}</strong>. {aiEligible ? `AI-perspektivet er et modelestimat i kategorien “${aiBand(robustScore)}”, afrundet til ca. ${roundedRobustScore}/100.` : "Der er ikke tilstrækkeligt grundlag for et programspecifikt AI-estimat."}
            </p>
            <ScoreDisclosure scores={enriched} />
            <EvidenceList evidence={prog.rag_evidence} />

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

          {/* Andre konkrete udbud af samme uddannelsesfamilie */}
          <div className="pt-6 border-t border-[#E7E9EF] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#12172B]">Samme uddannelse andre steder</h3>
              <p className="text-xs text-[#545D71]">Andre KOT-udbud med samme normaliserede uddannelsesnavn — ikke et modelbaseret lighedsforslag.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getAllPrograms()
                .filter((p) => createProgramSlug(p) !== slug && p.udbud_titel && normalizeProgramName(p.udbud_titel) === normalizeProgramName(title))
                .map((p) => ({ program: p, slug: createProgramSlug(p) }))
                .slice(0, 4)
                .map(({ program: simProg, slug: simSlug }) => (
                  <Link
                    key={simSlug}
                    href={`/uddannelse/${simSlug}`}
                    className="p-3.5 bg-[#F7F8FA] hover:bg-[#FFFFFF] border border-[#E7E9EF] hover:border-[#12172B] rounded-xl transition card-shadow space-y-1 block group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-xs text-[#12172B] group-hover:text-[#2563EB] transition truncate">
                        {simProg.udbud_titel}
                      </h4>
                      <span className="text-[10px] font-mono-data font-semibold text-[#0B7A57] bg-[#E6F4ED] px-2 py-0.5 rounded-full shrink-0">KOT {simProg.kot_nr}</span>
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
              Find og sammenlign uddannelsen i søgeværktøjet →
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
