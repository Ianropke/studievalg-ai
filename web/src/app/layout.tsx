import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Footer } from "@/components/Footer";
import { DEFAULT_SOCIAL_IMAGE, DEFAULT_SOCIAL_IMAGE_URL } from "@/lib/siteMetadata";
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
  metadataBase: new URL("https://uddannelsesindsigt.com"),
  title: "Find uddannelse efter snit, job og AI | Uddannelsesindsigt",
  description:
    "Sammenlign 1.413 danske videregående uddannelser efter adgangskvotient, jobmuligheder, lønpotentiale og tydeligt markerede AI-modelestimater.",
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
    title: "Hvilken uddannelse passer til dit snit og dine prioriteter?",
    description: "Sammenlign 1.413 danske videregående uddannelser på AI-robusthed, jobmuligheder og lønpotentiale med dit eget snit.",
    url: "https://uddannelsesindsigt.com",
    siteName: "Uddannelsesindsigt",
    locale: "da_DK",
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find uddannelse efter snit, job og AI",
    description: "Sammenlign danske uddannelser med officielle optagelsestal og tydeligt markerede modelestimater.",
    images: [DEFAULT_SOCIAL_IMAGE_URL],
  },
  alternates: {
    canonical: "https://uddannelsesindsigt.com",
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
    "url": "https://uddannelsesindsigt.com",
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
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
