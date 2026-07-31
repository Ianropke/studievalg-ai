import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Insights | Uddannelsesindsigt — Dataanalyser af AI på Arbejdsmarkedet",
  description: "Udforsk økonometriske tidsmaskiner, kontrafaktiske fremskrivninger og AI-støjanalyser for 1.413 danske videregående uddannelser.",
  alternates: {
    canonical: "https://uddannelsesindsigt.dk/analyse",
  },
  openGraph: {
    title: "AI Insights | Uddannelsesindsigt",
    description: "Dataanalyser og økonometriske fremskrivninger af kunstig intelligens på det danske uddannelses- og arbejdsmarked.",
    url: "https://uddannelsesindsigt.dk/analyse",
    siteName: "Uddannelsesindsigt",
    locale: "da_DK",
    type: "website",
  },
};

export default function AnalyseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
