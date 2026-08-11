import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Insights & Uddannelsesanalyse | Uddannelsesindsigt",
  description:
    "Dyb AI-drevet analyse af to uddannelser side-om-side. Sammenlign radar-profiler, kompetenceskillsets og arbejdsmarkedsfremskrivninger.",
  alternates: {
    canonical: "https://uddannelsesindsigt.com/analyse",
  },
  openGraph: {
    title: "AI Insights | Uddannelsesindsigt",
    description: "Dyb AI-analyse af to uddannelser med radar-visualisering, kompetenceprofiler og arbejdsmarkedsfremskrivninger.",
    url: "https://uddannelsesindsigt.com/analyse",
  },
};

export default function AnalyseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
