import React from "react";
import { Header } from "@/components/Header";
import { getProgramCatalog } from "@/lib/programCatalog";

export default function EvidensPage() {
  const catalog = getProgramCatalog();
  const dataStats = {
    total: catalog.length,
    latest: "26. juli 2026",
    params: 42
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Hvordan beregnes AI-robusthedsscorerne?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Beregningerne vægter officiel registerdata fra UFM/DST, økonometriske fremskrivningsmodeller samt AI-analyse af studieordninger."
        }
      },
      {
        "@type": "Question",
        "name": "Hvad er datakilderne bag Uddannelsesindsigt?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Platformen samler over 42 datakilder fra Uddannelses- og Forskningsministeriet (KOT), Danmarks Statistik, OECD, ESCO og O*NET."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F6EE] text-[#0B7A57] border border-[#0F9D6E]/20">Sådan regner vi</span>
          <h1 className="text-4xl font-bold tracking-tight text-[#12172B] font-display">Bag om dine scorer</h1>
          <p className="text-sm text-[#545D71] leading-relaxed">Her kan du se, hvor tallene kommer fra, og hvordan vi regner dem ud — helt uden fagsprog.</p>
        </div>
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 card-shadow space-y-6">
          <div className="border-b border-[#E7E9EF] pb-4">
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">SÅDAN BYGGER VI SCOREN</span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">Sådan er dataene bygget op</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-[#FFFFFF] p-5 rounded-lg border-l-4 border-l-[#0F9D6E] border-y border-r border-[#E7E9EF] shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#12172B] text-xs uppercase tracking-wider">NIVEAU 1: OFFICIEL REGISTERDATA (HÅRDE TAL)</h3>
                <span className="font-mono-data text-[10px] text-[#0B7A57] bg-[#E3F6EE] px-2 py-0.5 rounded font-bold border border-[#0F9D6E]/20">Højeste vægt (100% fakta)</span>
              </div>
              <p className="text-xs text-[#545D71] leading-relaxed">Danmarks Statistik og UFM (KOT). Udgør det urokkelige fundament for alle adgangskvotienter, frafaldsprocenter og dimittendledighed. Vægtes som <strong>facit</strong> i alle beregninger og kan aldrig overstyres af AI.</p>
            </div>
            <div className="bg-[#FFFFFF] p-5 rounded-lg border-l-4 border-l-[#2563EB] border-y border-r border-[#E7E9EF] shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#12172B] text-xs uppercase tracking-wider">NIVEAU 2: MODEL- OG ARBEJDSMARKEDSDATA</h3>
                <span className="font-mono-data text-[10px] text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded font-bold border border-[#2563EB]/20">Modelleret</span>
              </div>
              <p className="text-xs text-[#545D71] leading-relaxed">Arbejdsmarkeds- og opgavedata anvendes til at estimere efterspørgsel, lønpotentiale og AI-robusthed. Modellerede mål skal læses som beslutningsstøtte og ikke som garantier for den enkelte.</p>
            </div>
            <div className="bg-[#FFFFFF] p-5 rounded-lg border-l-4 border-l-[#7C3AED] border-y border-r border-[#E7E9EF] shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#12172B] text-xs uppercase tracking-wider">NIVEAU 3: AI-ANALYSE</h3>
                <span className="font-mono-data text-[10px] text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded font-bold border border-[#7C3AED]/20">Supplerende</span>
              </div>
              <p className="text-xs text-[#545D71] leading-relaxed">AI anvendes til at strukturere og fortolke information, men må ikke overstyre dokumenterede registerdata. Resultaterne bør kunne spores tilbage til kilde, metode og beregningsregel.</p>
            </div>
          </div>
        </section>
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 card-shadow space-y-5">
          <div>
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">DATASTATUS</span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">Datagrundlag og opdatering</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-[#E7E9EF] p-4"><div className="text-xs text-[#8891A3]">Uddannelsesudbud</div><div className="text-2xl font-bold font-mono-data">{dataStats.total.toLocaleString("da-DK")}</div></div>
            <div className="rounded-lg border border-[#E7E9EF] p-4"><div className="text-xs text-[#8891A3]">Seneste data</div><div className="text-lg font-bold">{dataStats.latest}</div></div>
            <div className="rounded-lg border border-[#E7E9EF] p-4"><div className="text-xs text-[#8891A3]">Parametre</div><div className="text-2xl font-bold font-mono-data">{dataStats.params}</div></div>
          </div>
          <p className="text-xs text-[#545D71] leading-relaxed">Kataloget læses fra den samme statiske fil, som fortsat ligger i <code>public/data</code>. Det betyder, at den også kan hentes direkte som <code>/data/all_programs_catalog.json</code>, mens serverkoden undgår at importere filen gennem Webpacks modul-graf.</p>
        </section>
        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 card-shadow space-y-4">
          <h2 className="text-xl font-bold text-[#12172B] font-display">Ofte stillede spørgsmål</h2>
          <div className="space-y-3 text-sm text-[#545D71]">
            <p><strong>Hvordan beregnes AI-robusthedsscorerne?</strong> Beregningerne kombinerer registerdata, arbejdsmarkedsdata og dokumenterede modelregler.</p>
            <p><strong>Hvor kommer dataene fra?</strong> Platformen anvender blandt andet UFM, Danmarks Statistik og internationale arbejdsmarkeds- og opgavedatasæt.</p>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#E7E9EF] bg-[#FFFFFF] py-12 px-6 lg:px-16 text-[#545D71] text-xs mt-16">
        <div className="max-w-4xl mx-auto text-center"><p>© 2026 Uddannelsesindsigt • Uafhængig pædagogisk beslutningsstøtte baseret på UFM og Danmarks Statistik</p></div>
      </footer>
    </div>
  );
}
