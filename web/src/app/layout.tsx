import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "AI-Studievalgsplatform 2026 | Fremtidssikret Studievejledning & AI-Arbejdsmarkedsanalyse",
  description: "Uafhængig dansk studievejledningsplatform baseret på 14.934 officielle UFM KOT-ansøgninger (2009–2026), DuckDB og 42+ forskningskilder fra OECD, ILO, Stanford og Danmarks Statistik.",
  keywords: [
    "studievalg", "udvikling", "AI arbejdsmarked", "KOT optagelse 2026", "grænsekvotienter",
    "uddannelser i Danmark", "fremtidssikret uddannelse", "studievejledning AI", "OECD employment outlook"
  ],
  authors: [{ name: "AI-Studievalgsplatform Danmark" }],
  creator: "AI-Studievalgsplatform",
  publisher: "AI-Studievalgsplatform",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AI-Studievalgsplatform 2026 | Hvilken uddannelse passer til dig?",
    description: "Fremtidssikret dansk studievejledning. Kobler officielle UFM-adgangskvotienter med 42+ internationale AI-forskningsstudier.",
    url: "https://studievalg-ai.dk",
    siteName: "AI-Studievalgsplatform",
    locale: "da_DK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Studievalgsplatform 2026",
    description: "Find din fremtidssikrede uddannelse baseret på UFM-registerdata og AI-resiliens.",
  },
  alternates: {
    canonical: "https://studievalg-ai.dk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI-Studievalgsplatform Danmark",
    "url": "https://studievalg-ai.dk",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All",
    "description": "Fremtidssikret dansk studievejledningsplatform baseret på UFM-registerdata, DuckDB og 42+ forskningskilder.",
    "publisher": {
      "@type": "Organization",
      "name": "AI-Studievalgsplatform Danmark"
    }
  };

  return (
    <html lang="da" className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#F7F8FA] text-[#12172B] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
