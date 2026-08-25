import Link from "next/link";
import { DATA_STATUS } from "@/lib/dataStatus";

export function Footer() {
  return (
    <footer className="border-t border-[#E7E9EF] bg-[#FFFFFF] mt-16 text-[#545D71] text-xs">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        
        {/* Top Grid: About + Legal + Transparens */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Om Uddannelsesindsigt & Forbehold */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#12172B] text-[#FFFFFF] flex items-center justify-center font-bold text-xs font-display">
                U
              </span>
              <span className="font-bold text-sm text-[#12172B] font-display">Uddannelsesindsigt</span>
            </div>
            <p className="leading-relaxed">
              Uddannelsesindsigt hjælper dig med at vælge uddannelse — helt uafhængigt og uden reklamer. Vi viser dig, hvordan kunstig intelligens forventes at påvirke forskellige fag og job i fremtiden, så du kan tage det med i dit valg.
            </p>
            <p className="leading-relaxed">
              Denne platform vurderer ikke mennesker eller deres fremtidige jobmuligheder. Den analyserer udelukkende statistiske mønstre på uddannelses- og arbejdsmarkedsniveau baseret på offentlig forskning og tilgængelige data. Alle beregninger udføres deterministisk ud fra dokumenterede modeller og datakilder.
            </p>
            <p className="leading-relaxed text-[#8891A3]">
              Tallene her er vores bedste bud, baseret på statistik og modeller — ikke en garanti for, hvad der kommer til at ske for dig, dit optag eller din karriere. Officiel ansøgning sker altid via Optagelse.dk.
            </p>
            <p className="leading-relaxed text-[#8891A3]">
              Vi anbefaler desuden at tale med en studievejleder om dit konkrete valg — denne platform er ét godt input blandt flere, ikke en erstatning for personlig vejledning.
            </p>
          </div>

          {/* Column 3: Transparens Badges */}
          <div className="space-y-3 bg-[#F7F8FA] p-5 rounded-xl border border-[#E7E9EF] h-fit">
            <h3 className="text-xs font-bold text-[#12172B] uppercase tracking-wider">Transparens</h3>
            <ul className="space-y-2 font-medium text-[#12172B] text-xs">
              <li className="flex items-center gap-2 text-[#0B7A57]">✓ Offentlige datakilder</li>
              <li className="flex items-center gap-2 text-[#0B7A57]">✓ Dokumenteret metode</li>
              <li className="flex items-center gap-2 text-[#0B7A57]">✓ Ingen login eller personlig profil</li>
              <li className="flex items-center gap-2 text-[#0B7A57]">✓ Matchvalg gemmes ikke i en konto</li>
              <li className="flex items-center gap-2 text-[#0B7A57]">✓ Ingen reklamer eller kommercielle interesser</li>
            </ul>
            <p className="pt-1 text-[10px] leading-relaxed text-[#8891A3]">
              Hosting kan levere tekniske drifts- og performance-målinger. Matchværktøjet opretter ikke en personlig brugerprofil.
            </p>
          </div>
        </div>

        {/* Middle Navigation & Datakilder */}
        <div className="pt-8 border-t border-[#E7E9EF] grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-3">
            <h3 className="font-bold text-[#12172B] uppercase tracking-wider text-[11px]">Værktøjer & Sider</h3>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[#545D71]">
              <Link href="/" className="hover:text-[#12172B] transition">Matchværktøj</Link>
              <Link href="/lister/top-10-mest-ai-robuste-uddannelser" className="hover:text-[#12172B] transition">Toplister</Link>
              <Link href="/sammenlign" className="hover:text-[#12172B] transition">Sammenlign uddannelser</Link>
              <Link href="/analyse" className="hover:text-[#12172B] transition">AI Insights</Link>
              <Link href="/evidens" className="hover:text-[#12172B] transition">Bag om dine scorer</Link>
              <Link href="/om-os" className="hover:text-[#12172B] transition">Om Uddannelsesindsigt</Link>
            </nav>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-[#12172B] uppercase tracking-wider text-[11px]">Officielle Datakilder</h3>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <a href="https://ufm.dk" target="_blank" rel="noopener noreferrer" className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md hover:text-[#12172B] transition">
                UFM (KOT) ↗
              </a>
              <a href="https://dst.dk" target="_blank" rel="noopener noreferrer" className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md hover:text-[#12172B] transition">
                Danmarks Statistik ↗
              </a>
              <a href="https://www.onetonline.org/" target="_blank" rel="noopener noreferrer" className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md hover:text-[#12172B] transition">
                O*NET ↗
              </a>
              <a href="https://www.oecd.org" target="_blank" rel="noopener noreferrer" className="bg-[#F7F8FA] border border-[#D8DBE4] px-2.5 py-1 rounded-md hover:text-[#12172B] transition">
                OECD & ESCO ↗
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Single Copyright + Data Timestamp */}
        <div className="pt-6 border-t border-[#E7E9EF] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p className="text-[#8891A3]">
            © {new Date().getFullYear()} Uddannelsesindsigt • Uafhængig beslutningsstøtte
          </p>
          <div className="flex items-center gap-1.5 font-mono-data text-[#0B7A57] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#0F9D6E] animate-pulse"></span>
            <span>Optagelsesdata: {DATA_STATUS.catalogue.admissionsUpdatedLabel} · Model: {DATA_STATUS.scoring.updatedLabel}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
