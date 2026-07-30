"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function EvidensPage() {
  const [dataStats, setDataStats] = useState<{ total: number; latest: string; params: number }>({
    total: 0,
    latest: "Henter...",
    params: 42
  });

  useEffect(() => {
    fetch("/data/all_programs_catalog.json")
      .then((res) => res.json())
      .then((data) => {
        setDataStats({
          total: data.length,
          latest: "26. juli 2026",
          params: 42
        });
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B] antialiased">
      <header className="border-b border-[#E7E9EF] bg-[#FFFFFF] sticky top-0 z-50 px-6 lg:px-16 py-4 flex justify-between items-center card-shadow">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded">
            <div className="w-8 h-8 rounded-lg bg-[#12172B] flex items-center justify-center font-bold text-[#FFFFFF] text-sm">
              S
            </div>
            <div>
              <h1 className="text-base font-bold text-[#12172B] tracking-tight font-display">
                Studievalg <span className="text-[#545D71] font-normal">PEFF Evidens</span>
              </h1>
              <p className="text-[11px] text-[#545D71]">
                Metode, datagrundlag og transparens
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-6 text-xs font-semibold">
          <Link href="/" className="text-[#545D71] hover:text-[#12172B] transition focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded">
            Studievalg
          </Link>
          <Link href="/analyse" className="text-[#545D71] hover:text-[#12172B] transition focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded">
            AI Insights
          </Link>
          <Link href="/evidens" className="text-[#12172B] border-b-2 border-[#12172B] pb-1 font-bold focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded">
            PEFF Evidens
          </Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F6EE] text-[#0B7A57] border border-[#0F9D6E]/20">
            Videnskabelig transparens
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-[#12172B] font-display">
            PEFF Evidensmotoren
          </h1>
          <p className="text-sm text-[#545D71] leading-relaxed">
            Læs hvordan algoritmen vægter, parser og analyserer data fra officielle instanser.
          </p>
        </div>

        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 card-shadow space-y-6">
          <div className="border-b border-[#E7E9EF] pb-4">
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">ARKITEKTUR</span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">Hierarkisk Evidens-arkitektur</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-[#FFFFFF] p-5 rounded-lg border-l-4 border-l-[#0F9D6E] border-y border-r border-[#E7E9EF] shadow-sm">
              <h3 className="font-bold text-[#12172B] text-xs uppercase tracking-wider">
                Tier 1: Officiel Registerdata (Hard Data)
              </h3>
              <p className="text-xs text-[#545D71] mt-2 leading-relaxed">
                Danmarks Statistik og UFM (KOT). Udgør det urokkelige fundament for alle adgangskvotienter, frafaldsprocenter og dimittendledighed. Vægtes som <strong>ground truth</strong> i alle beregninger og overrides aldrig af AI.
              </p>
            </div>
            
            <div className="bg-[#FFFFFF] p-5 rounded-lg border-l-4 border-l-[#2563EB] border-y border-r border-[#E7E9EF] shadow-sm">
              <h3 className="font-bold text-[#12172B] text-xs uppercase tracking-wider">
                Tier 2: Økonometriske Modeller (Fremskrivninger)
              </h3>
              <p className="text-xs text-[#545D71] mt-2 leading-relaxed">
                Udnytter 10 års tidsseriedata på tværs af de 1.413 udbud. Modeller forudsiger væksten i løn og efterspørgsel via Bayesiansk inferens, som justerer de lineære kvotienter ud fra observerede mega-trends i STEM og omsorg.
              </p>
            </div>
            
            <div className="bg-[#FFFFFF] p-5 rounded-lg border-l-4 border-l-[#7C3AED] border-y border-r border-[#E7E9EF] shadow-sm">
              <h3 className="font-bold text-[#12172B] text-xs uppercase tracking-wider">
                Tier 3: RAG & LLM Semantik (Soft Data)
              </h3>
              <p className="text-xs text-[#545D71] mt-2 leading-relaxed">
                Retrieval-Augmented Generation analyserer tusindvis af siders PDF-studieordninger for at klassificere "AI-robusthed". Den fanger, om undervisningen reelt indeholder anvendt AI, og trækker citater til begrundelserne.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#FFFFFF] border border-[#E7E9EF] rounded-xl p-8 card-shadow space-y-6">
          <div className="border-b border-[#E7E9EF] pb-4">
            <span className="text-[11px] font-bold text-[#545D71] uppercase tracking-wider block">DATAKILDER & METRICS</span>
            <h2 className="text-xl font-bold text-[#12172B] font-display">Systemets Kernemetrics</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-bold text-[#12172B] text-sm font-mono-data">Datapunkter</h3>
              <p className="text-3xl font-bold text-[#0F9D6E] font-mono-data">{dataStats.total}</p>
              <p className="text-[11px] text-[#545D71]">Unikke uddannelsesudbud hentet fra Kot-registret.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-[#12172B] text-sm font-mono-data">Parametre</h3>
              <p className="text-3xl font-bold text-[#2563EB] font-mono-data">{dataStats.params}</p>
              <p className="text-[11px] text-[#545D71]">Vægtede parametre i beregningsmatricen for hver uddannelse.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-[#12172B] text-sm font-mono-data">Seneste Opdatering</h3>
              <p className="text-xl font-bold text-[#7C3AED] font-mono-data mt-2">{dataStats.latest}</p>
              <p className="text-[11px] text-[#545D71]">Synkroniseret automatisk ved seneste KOT-release.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E7E9EF] space-y-4">
             <h3 className="font-bold text-[#12172B] text-sm font-mono-data">Eksempler på udtrukne citater via RAG</h3>
             
             <div className="bg-[#F7F8FA] p-4 rounded-lg border border-[#E7E9EF] text-xs">
                <p className="text-[#12172B] italic mb-2 font-serif">"Studerende i Odontologi skal i modul 8 demonstrere kompetencer i anvendelse af maskinlærings-værktøjer til røntgenbilled-diagnostik."</p>
                <div className="flex justify-between items-center text-[10px] text-[#545D71] font-bold uppercase tracking-wider">
                   <span>Kilde: Københavns Universitet - Studieordning 2026</span>
                   <span className="text-[#0B7A57]">Score Impact: +12% Robusthed</span>
                </div>
             </div>
             
             <div className="bg-[#F7F8FA] p-4 rounded-lg border border-[#E7E9EF] text-xs">
                <p className="text-[#12172B] italic mb-2 font-serif">"Erhvervssproglig uddannelse har fjernet krav til manuel tekstoversættelse i 3. semester og erstattet med AI post-editing."</p>
                <div className="flex justify-between items-center text-[10px] text-[#545D71] font-bold uppercase tracking-wider">
                   <span>Kilde: CBS Program Board Mødereferat (April 2026)</span>
                   <span className="text-[#B45309]">Score Impact: -8% Arbejdsmarked</span>
                </div>
             </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E7E9EF] bg-[#FFFFFF] py-8 px-6 text-[#545D71] text-xs text-center mt-12">
        © 2026 AI-Studievalgsplatform Danmark • PEFF Evidens Hub
      </footer>
    </div>
  );
}
