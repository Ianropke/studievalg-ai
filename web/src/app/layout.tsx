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
  metadataBase: new URL("https://uddannelsesindsigt.dk"),
  title: "Uddannelsesindsigt | Fremtidssikret Studievejledning & AI-Arbejdsmarkedsanalyse",
  description:
    "Uddannelsesindsigt tilbyder uafhængig statistisk beslutningsstøtte til danske uddannelsessøgende baseret på UFM optagelsesdata, Danmarks Statistik og AI-arbejdsmarkedsmodeller.",
  keywords: [
    "uddannelsesindsigt",
    "studievalg",
    "udvikling",
    "AI arbejdsmarked",
    "KOT optagelse 2026",
    "grænsekvotienter",
    "lønniveau",
    "jobmuligheder",
  ],
  authors: [{ name: "Uddannelsesindsigt Danmark" }],
  creator: "Uddannelsesindsigt",
  publisher: "Uddannelsesindsigt",
  openGraph: {
    title: "Uddannelsesindsigt | Hvilken uddannelse passer til dig?",
    description: "Sammenlign 1.413 danske videregående uddannelser på AI-robusthed, jobmuligheder og lønpotentiale med dit eget snit.",
    url: "https://uddannelsesindsigt.dk",
    siteName: "Uddannelsesindsigt",
    locale: "da_DK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Uddannelsesindsigt",
    description: "Fremtidssikret pædagogisk studievejledning baseret på registerdata og AI-opgavetaksonomi.",
  },
  alternates: {
    canonical: "https://uddannelsesindsigt.dk",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Uddannelsesindsigt Danmark",
    "url": "https://uddannelsesindsigt.dk",
    "description": "Uafhængig pædagogisk beslutningsstøtte og datadrevet studievejledning for videregående uddannelser i Danmark.",
    "sameAs": [],
    "provider": {
      "@type": "Organization",
      "name": "Uddannelsesindsigt Danmark"
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
