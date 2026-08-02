import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#E7E9EF] bg-[#FFFFFF] mt-16">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-xs">
          {/* Column 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#12172B] text-[#FFFFFF] flex items-center justify-center font-bold text-xs font-display">
                U
              </span>
              <span className="font-bold text-sm text-[#12172B] font-display">Uddannelsesindsigt</span>
            </div>
            <p className="text-[#545D71] leading-relaxed">
              Uafhængig statistisk beslutningsstøtte for danske uddannelsessøgende.
              Data opdateres løbende fra officielle registerkilder.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#12172B] uppercase tracking-wider text-[11px]">Værktøjer</h3>
            <nav className="flex flex-col gap-2 text-[#545D71]">
              <Link href="/" className="hover:text-[#12172B] transition">Matchværktøj</Link>
              <Link href="/lister/top-10-mest-ai-robuste-uddannelser" className="hover:text-[#12172B] transition">Toplister</Link>
              <Link href="/sammenlign" className="hover:text-[#12172B] transition">Sammenlign uddannelser</Link>
              <Link href="/analyse" className="hover:text-[#12172B] transition">AI Insights</Link>
              <Link href="/evidens" className="hover:text-[#12172B] transition">Evidens & Metode</Link>
            </nav>
          </div>

          {/* Column 3: Data Sources */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#12172B] uppercase tracking-wider text-[11px]">Datakilder</h3>
            <nav className="flex flex-col gap-2 text-[#545D71]">
              <a href="https://ufm.dk" target="_blank" rel="noopener noreferrer" className="hover:text-[#12172B] transition">
                Uddannelses- og Forskningsministeriet ↗
              </a>
              <a href="https://dst.dk" target="_blank" rel="noopener noreferrer" className="hover:text-[#12172B] transition">
                Danmarks Statistik ↗
              </a>
              <a href="https://www.onetonline.org/" target="_blank" rel="noopener noreferrer" className="hover:text-[#12172B] transition">
                O*NET Occupation Database ↗
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#E7E9EF] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#8891A3]">
            © {new Date().getFullYear()} Uddannelsesindsigt Danmark. Alle data er vejledende og erstatter ikke professionel rådgivning.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0F9D6E] animate-pulse"></span>
            <span className="text-[10px] font-mono-data text-[#0B7A57] font-semibold">Data opdateret: Juli 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
