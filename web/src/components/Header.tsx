"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: "Matchværktøj", href: "/" },
    { label: "Toplister", href: "/lister/top-10-mest-ai-robuste-uddannelser" },
    { label: "Sammenlign", href: "/sammenlign" },
    { label: "AI Insights", href: "/analyse" },
    { label: "Evidens", href: "/evidens" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b border-[#E7E9EF] card-shadow">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Gå til forsiden"
            className="w-8 h-8 rounded-lg bg-[#12172B] text-[#FFFFFF] flex items-center justify-center font-bold text-sm font-display hover:opacity-90 transition"
          >
            U
          </Link>
          <div>
            <Link href="/" className="font-bold text-sm text-[#12172B] tracking-tight hover:underline font-display">
              Uddannelsesindsigt
            </Link>
            <p className="text-[10px] text-[#545D71]">Statistisk beslutningsstøtte baseret på UFM og Danmarks Statistik</p>
          </div>
        </div>
        <nav aria-label="Hovednavigation" className="flex items-center gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto max-w-full pb-1 sm:pb-0">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href.split("/")[1] ? `/${item.href.split("/")[1]}` : item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded ${
                  isActive
                    ? "text-[#12172B] border-b-2 border-[#12172B] pb-1 font-bold"
                    : "text-[#545D71] hover:text-[#12172B]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
