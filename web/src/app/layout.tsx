import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { PrivacyAwareTelemetry } from "@/components/PrivacyAwareTelemetry";
import { BROWSE_COVERAGE } from "@/lib/browseCatalog";
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
  title: "Find uddannelse efter snit og AI | Uddannelsesindsigt",
  description:
    `Udforsk ${BROWSE_COVERAGE.programmeCount} danske uddannelsestilbud fra optaget i 2026. Sammenlign dine favoritter og find din retning.`,
  keywords: [
    "uddannelsesindsigt",
    "studievalg",
    "udvikling",
    "AI arbejdsmarked",
    "O*NET 31.0",
    "AI robuste uddannelser",
    "grænsekvotienter",
    "uddannelsessøgning",
    "videregående uddannelser",
  ],
  authors: [{ name: "Uddannelsesindsigt Danmark" }],
  creator: "Uddannelsesindsigt",
  publisher: "Uddannelsesindsigt",
  openGraph: {
    title: "Hvilken uddannelse passer til dit snit og dine prioriteter?",
    description: `Udforsk ${BROWSE_COVERAGE.programmeCount} uddannelsestilbud. Find nye muligheder og sammenlign dine favoritter.`,
    url: "https://uddannelsesindsigt.com",
    siteName: "Uddannelsesindsigt",
    locale: "da_DK",
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find uddannelse efter snit og AI",
    description: "Find din retning. Udforsk danske uddannelser og sammenlign dine favoritter.",
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
        <PrivacyAwareTelemetry />
      </body>
    </html>
  );
}
