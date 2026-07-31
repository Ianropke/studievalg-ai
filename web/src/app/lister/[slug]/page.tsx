import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LIST_CONFIGS, getListData } from "@/lib/lists";
import { createProgramSlug } from "@/lib/slugs";
import { Header } from "@/components/Header";

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
      "url": `https://uddannelsesindsigt.dk/uddannelse/${createProgramSlug(item.program)}`,
    })),
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
              Seneste optagelses- &amp; AI-data: <strong className="text-[#12172B]">Juli 2026</strong>
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
            const rob = 100 - (program.scores?.automation_risk || 0);

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

      {/* Footer */}
      <footer className="border-t border-[#E7E9EF] bg-[#FFFFFF] py-12 px-6 lg:px-16 text-[#545D71] text-xs mt-16">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <p>© 2026 Uddannelsesindsigt • Uafhængig pædagogisk beslutningsstøtte baseret på UFM og Danmarks Statistik</p>
        </div>
      </footer>
    </div>
  );
}
