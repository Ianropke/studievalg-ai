import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LIST_CONFIGS, getListData } from "@/lib/lists";
import { createProgramSlug } from "@/lib/slugs";
import { Header } from "@/components/Header";
import { getEnrichedScores } from "@/lib/domainScoring";
import { ScoreDisclosure } from "@/components/ScoreDisclosure";
import { DATA_STATUS } from "@/lib/dataStatus";

export async function generateStaticParams() {
  return Object.keys(LIST_CONFIGS).map((slug) => ({
    slug,
  }));
}

export default async function ListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listData = getListData(slug);

  if (!listData) {
    notFound();
  }

  const { config, items } = listData;

  // Schema.org Structured Data ItemList
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": config.title,
    "description": config.description,
    "numberOfItems": items.length,
    "itemListElement": items.map((item) => ({
      "@type": "ListItem",
      "position": item.rank,
      "name": item.program.udbud_titel,
      "url": `https://uddannelsesindsigt.com/uddannelse/${createProgramSlug(item.program)}`,
    })),
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
        "name": config.title,
        "item": `https://uddannelsesindsigt.com/lister/${slug}`
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
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#545D71]">
          <Link href="/" className="hover:underline">Forside</Link>
          <span>/</span>
          <span className="font-medium text-[#12172B]">Toplister</span>
          <span>/</span>
          <span className="font-medium text-[#12172B]">{config.title}</span>
        </nav>

        {/* Title & Badge */}
        <div className="space-y-3 border-b border-[#E7E9EF] pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#E6F4ED] text-[#0B7A57] text-[11px] font-bold px-3 py-1 rounded-full border border-[#0F9D6E]/20">
              {config.badge}
            </span>
            <span className="text-[11px] text-[#8891A3]">
              Optagelsesdata: <strong className="text-[#12172B]">{DATA_STATUS.catalogue.admissionsUpdatedLabel}</strong> · model: <strong className="text-[#12172B]">{DATA_STATUS.scoring.updatedLabel}</strong>
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-[#12172B] tracking-tight font-display">
            {config.title}
          </h1>

          <p className="text-sm text-[#545D71] leading-relaxed max-w-2xl">
            {config.description}
          </p>
        </div>

        {/* Hedge Intro Box */}
        <div className="bg-[#EFF6FF] border border-[#2563EB]/20 p-5 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1D4ED8]">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
            <span>MODELBASERET EVIDENS &amp; METODE</span>
          </div>
          <p className="text-xs text-[#12172B] leading-relaxed">
            {config.introHedge}
          </p>
        </div>

        {/* Numbered List of Programs */}
        <div className="space-y-4">
          {items.map(({ program, rank, valueDisplay }) => {
            const progSlug = createProgramSlug(program);
            const inst = program.institution || program.institution_navn || "Uddannelsessted";
            const kv = program.latest_kvotient || "Alle optaget";
            const scoreDetails = getEnrichedScores(program.udbud_titel, program.scores);
            const rob = scoreDetails.ai_resilience;

            return (
              <div
                key={progSlug}
                className="bg-[#FFFFFF] border border-[#E7E9EF] hover:border-[#2563EB]/40 rounded-xl p-5 card-shadow transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Rank Badge */}
                  <div className="w-9 h-9 rounded-lg bg-[#12172B] text-[#FFFFFF] font-bold text-sm font-mono-data flex items-center justify-center shrink-0">
                    #{rank}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs text-[#545D71]">
                      <span className="font-semibold text-[#2563EB]">{inst}</span>
                      {program.by && <span>• {program.by}</span>}
                      <span>•</span>
                      <span className="font-mono-data text-[#8891A3]">KOT {program.kot_nr || "–"}</span>
                    </div>

                    <Link
                      href={`/uddannelse/${progSlug}`}
                      className="font-bold text-base text-[#12172B] group-hover:text-[#2563EB] transition font-display block"
                    >
                      {program.udbud_titel}
                    </Link>

                    <div className="flex items-center gap-3 text-xs text-[#545D71] pt-1">
                      <span>Kvote 1: <strong className="font-mono-data text-[#12172B]">{kv}</strong></span>
                      <span>•</span>
                      <span>AI-robusthed: <strong className="font-mono-data text-[#0B7A57]">{rob}/100</strong></span>
                      <ScoreDisclosure scores={scoreDetails} compact />
                    </div>
                  </div>
                </div>

                {/* Metric Display & Action Links */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E7E9EF] shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[#8891A3] block">{config.metricLabel}</span>
                    <span className="text-xl font-bold font-mono-data text-[#12172B]">{valueDisplay}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/sammenlign?a=${progSlug}`}
                      className="px-3 py-1.5 bg-[#F7F8FA] hover:bg-[#EFF6FF] border border-[#E7E9EF] text-[#2563EB] rounded-lg text-xs font-semibold transition"
                    >
                      ⚖️ Sammenlign
                    </Link>
                    <Link
                      href={`/uddannelse/${progSlug}`}
                      className="px-3 py-1.5 bg-[#12172B] hover:bg-[#1E293B] text-[#FFFFFF] rounded-lg text-xs font-semibold transition"
                    >
                      Se profil →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <section className="rounded-xl border border-[#D8DBE4] bg-[#FFFFFF] p-6 space-y-4 card-shadow">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0B7A57]">Brug listen som startpunkt</p>
            <h2 className="mt-1 text-lg font-bold font-display">Sådan får du et mere personligt resultat</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#545D71]">
              En topliste bruger samme prioritering for alle. I matchværktøjet kan du kombinere dit gennemsnit, uddannelsessted og dine egne vægte for AI, job og løn.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <Link href="/" className="rounded-lg border border-[#E7E9EF] bg-[#F7F8FA] p-4 font-semibold hover:bg-[#EFF6FF] hover:border-[#2563EB]/30 transition">
              Find dit personlige match →
            </Link>
            <Link href="/guides" className="rounded-lg border border-[#E7E9EF] bg-[#F7F8FA] p-4 font-semibold hover:bg-[#EFF6FF] hover:border-[#2563EB]/30 transition">
              Læs guides til studievalg →
            </Link>
            <Link href="/evidens" className="rounded-lg border border-[#E7E9EF] bg-[#F7F8FA] p-4 font-semibold hover:bg-[#EFF6FF] hover:border-[#2563EB]/30 transition">
              Kontrollér metode og datakvalitet →
            </Link>
          </div>
        </section>

        {config.readerQuestions && (
          <section aria-labelledby="list-faq-heading" className="space-y-4">
            <h2 id="list-faq-heading" className="text-lg font-bold font-display">Spørgsmål om listen</h2>
            <div className="space-y-3">
              {config.readerQuestions.map((item) => (
                <details key={item.question} className="rounded-xl border border-[#E7E9EF] bg-[#FFFFFF] p-5">
                  <summary className="cursor-pointer list-none text-sm font-bold text-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] rounded">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-xs leading-relaxed text-[#545D71]">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Navigation for Other Lists */}
        <div className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-6 space-y-4 card-shadow">
          <h3 className="font-bold text-sm text-[#12172B]">Udforsk Andre Statistiske Toplister</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {Object.values(LIST_CONFIGS)
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/lister/${c.slug}`}
                  className="p-3 bg-[#F7F8FA] hover:bg-[#EFF6FF] border border-[#E7E9EF] hover:border-[#2563EB]/30 rounded-lg font-semibold text-[#12172B] hover:text-[#2563EB] transition flex items-center justify-between"
                >
                  <span>{c.title}</span>
                  <span className="text-[#8891A3]">→</span>
                </Link>
              ))}
          </div>
        </div>

        {/* Method & Evidence Link */}
        <div className="text-center pt-4">
          <Link href="/evidens" className="text-xs font-semibold text-[#2563EB] hover:underline">
            Læs mere om vores datagrundlag, PEFF-metode og transparens på Evidens-siden →
          </Link>
        </div>
      </main>
    </div>
  );
}
