import type { Metadata } from "next";
import Link from "next/link";
import { DATA_STATUS } from "@/lib/dataStatus";

export const metadata: Metadata = {
  title: "Om Uddannelsesindsigt | Data, metode og ansvar",
  description:
    "Læs om Uddannelsesindsigts datakilder, modeller, begrænsninger og principper for gennemsigtig studievejledning.",
  alternates: {
    canonical: "https://uddannelsesindsigt.com/om-os",
  },
  openGraph: {
    title: "Om Uddannelsesindsigt | Data, metode og ansvar",
    description:
      "Sådan arbejder Uddannelsesindsigt med offentlige optagelsesdata, arbejdsmarkedsindikatorer og AI-estimater.",
    url: "https://uddannelsesindsigt.com/om-os",
    siteName: "Uddannelsesindsigt",
    locale: "da_DK",
    type: "website",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "Om Uddannelsesindsigt",
    "url": "https://uddannelsesindsigt.com/om-os",
    "description":
      "Uddannelsesindsigts datakilder, metode, begrænsninger og ansvar.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Uddannelsesindsigt",
      "url": "https://uddannelsesindsigt.com",
    },
    "dateModified": DATA_STATUS.methodologyReviewedAt,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Forside",
        "item": "https://uddannelsesindsigt.com",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Om Uddannelsesindsigt",
        "item": "https://uddannelsesindsigt.com/om-os",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <nav className="flex items-center gap-2 text-xs text-[#545D71]" aria-label="Brødkrummer">
          <Link href="/" className="hover:underline">
            Forside
          </Link>
          <span>/</span>
          <span className="font-medium text-[#12172B]">Om Uddannelsesindsigt</span>
        </nav>

        <header className="space-y-4 border-b border-[#E7E9EF] pb-7">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
            Data, metode og ansvar
          </p>
          <h1 className="text-3xl font-bold font-display">
            Om Uddannelsesindsigt
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[#545D71]">
            Uddannelsesindsigt er et uafhængigt beslutningsstøtteværktøj, der
            hjælper kommende studerende med at sammenligne danske videregående
            uddannelser på optagelse, arbejdsmarked og AI-relaterede indikatorer.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Hvad bygger siden på?</h2>
          <p className="leading-relaxed text-[#545D71]">
            Optagelsesoplysninger kommer fra offentlige UFM/KOT-data. Arbejdsmarkeds-
            og lønindikatorer bygger på register- og modelafledte data, mens
            AI-robusthed er et crosswalk-estimat baseret på opgaveeksponering og
            augmentationspotentiale.
          </p>
          <p className="leading-relaxed text-[#545D71]">
            Se den fulde forklaring på{" "}
            <Link href="/evidens" className="font-semibold text-[#2563EB] hover:underline">
              evidenssiden
            </Link>
            . Her beskrives også, hvilke tal der kræver bedre uddannelsesspecifik
            dokumentation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Sådan skal tallene læses</h2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-[#545D71]">
            <li>En score er en indikator og ikke en garanti for optagelse, job eller løn.</li>
            <li>Modelestimater må ikke læses som observerede udfald for den enkelte studerende.</li>
            <li>Optagelsesdata ændrer sig fra år til år og bør kontrolleres hos de officielle kilder.</li>
            <li>Personlig studievejledning er stadig vigtig ved konkrete uddannelsesvalg.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Datakilder</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href="https://ufm.dk" target="_blank" rel="noopener noreferrer" className="rounded-md border border-[#D8DBE4] bg-white px-3 py-2 hover:border-[#2563EB]">
              Uddannelses- og Forskningsministeriet ↗
            </a>
            <a href="https://dst.dk" target="_blank" rel="noopener noreferrer" className="rounded-md border border-[#D8DBE4] bg-white px-3 py-2 hover:border-[#2563EB]">
              Danmarks Statistik ↗
            </a>
            <a href="https://www.onetonline.org/" target="_blank" rel="noopener noreferrer" className="rounded-md border border-[#D8DBE4] bg-white px-3 py-2 hover:border-[#2563EB]">
              O*NET ↗
            </a>
          </div>
        </section>

        <section className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-5 text-sm leading-relaxed text-[#92400E]">
          <h2 className="mb-2 font-bold text-[#78350F]">Vigtigt forbehold</h2>
          <p>
            Uddannelsesindsigt er ikke en officiel optagelsesmyndighed og erstatter
            ikke Optagelse.dk eller en studievejleder. Brug siden som et gennemsigtigt
            supplement, og kontrollér altid aktuelle adgangskrav og frister hos de
            officielle kilder.
          </p>
        </section>
      </main>
    </div>
  );
}
