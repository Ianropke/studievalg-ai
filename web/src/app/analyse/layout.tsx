import type { Metadata } from "next";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/siteMetadata";

export const metadata: Metadata = {
  title: "AI Insights: Ny forskning om AI og uddannelsesvalg | Uddannelsesindsigt",
  description:
    "Nye danske og internationale tal om AI, arbejde og unge — forklaret med kilder, forbehold og konkrete spørgsmål til dit uddannelsesvalg.",
  alternates: {
    canonical: "https://uddannelsesindsigt.com/analyse",
  },
  openGraph: {
    title: "AI Insights: Hvad betyder AI for dit uddannelsesvalg?",
    description: "Nye AI-tal med kilder, forbehold og konkrete råd til unge, der skal vælge uddannelse.",
    url: "https://uddannelsesindsigt.com/analyse",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export default function AnalyseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
