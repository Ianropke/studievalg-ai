import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { GUIDE_CONFIGS } from "@/lib/guides";
import { LIST_CONFIGS } from "@/lib/lists";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/siteMetadata";

export const metadata: Metadata = {
  title: "Guides til studievalg 2026 | Snit, job og AI",
  description:
    "Praktiske guides til uddannelsesvalg: find uddannelser med dit snit, forstå AI-robusthed, sammenlign job- og lønindikatorer og brug officielle optagelsesdata.",
  alternates: {
    canonical: "https://uddannelsesindsigt.com/guides",
  },
  openGraph: {
    title: "Guides til studievalg | Uddannelsesindsigt",
    description:
      "Brug konkrete optagelsesdata og tydeligt markerede modelestimater til at undersøge dit studievalg.",
    url: "https://uddannelsesindsigt.com/guides",
    siteName: "Uddannelsesindsigt",
    locale: "da_DK",
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B]">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <nav aria-label="Brødkrummer" className="flex items-center gap-2 text-xs text-[#545D71]">
          <Link href="/" className="hover:underline">Forside</Link>
          <span>/</span>
          <span className="font-medium text-[#12172B]">Guides</span>
        </nav>

        <section className="max-w-3xl space-y-4">
          <span className="inline-flex rounded-full border border-[#0F9D6E]/20 bg-[#E3F6EE] px-3 py-1 text-xs font-bold text-[#0B7A57]">
            Praktisk hjælp til dit studievalg
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">
            Guides til at vælge uddannelse
          </h1>
          <p className="text-sm leading-relaxed text-[#545D71]">
            Gå fra brede spørgsmål til konkrete muligheder. Guiderne kombinerer officielle optagelsesdata med tydeligt markerede modelindikatorer og viser, hvornår du bør kontrollere oplysninger hos uddannelsesstedet eller en studievejleder.
          </p>
        </section>

        <section aria-labelledby="guide-heading" className="space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0B7A57]">Start her</p>
            <h2 id="guide-heading" className="text-xl font-bold font-display">Tre praktiske beslutningsguides</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(GUIDE_CONFIGS).map((guide) => (
              <article key={guide.slug} className="flex flex-col rounded-xl border border-[#E7E9EF] bg-white p-5 card-shadow">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">{guide.badge}</span>
                <h3 className="mt-2 text-lg font-bold font-display">{guide.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-[#545D71]">{guide.description}</p>
                <Link
                  href={`/guides/${guide.slug}`}
                  className="mt-5 inline-flex items-center justify-between rounded-lg bg-[#12172B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                >
                  Læs guiden <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="lists-heading" className="space-y-4 rounded-2xl border border-[#D8DBE4] bg-white p-6 sm:p-8 card-shadow">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">Datadrevne indgange</p>
            <h2 id="lists-heading" className="mt-1 text-xl font-bold font-display">Udforsk aktuelle toplister</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#545D71]">
              Toplisterne er genveje til kataloget. Læs altid badge, modelstatus og datadato sammen med placeringen.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(LIST_CONFIGS).map((list) => (
              <Link
                key={list.slug}
                href={`/lister/${list.slug}`}
                className="rounded-lg border border-[#E7E9EF] bg-[#F7F8FA] p-4 hover:border-[#2563EB]/30 hover:bg-[#EFF6FF] transition"
              >
                <span className="block text-sm font-bold text-[#12172B]">{list.title}</span>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#545D71]">{list.description}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
