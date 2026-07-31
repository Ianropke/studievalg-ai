import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evidensforklaring | Uddannelsesindsigt — Metode, Datagrundlag & PEFF-Modellering",
  description: "Pædagogisk guide til, hvordan vores AI-robusthedsscores beregnes ud fra UFM-registerdata, O*NET-opgavetaksonomier og RAG-studieordningsudtræk.",
  alternates: {
    canonical: "https://uddannelsesindsigt.dk/evidens",
  },
  openGraph: {
    title: "Evidensforklaring | Uddannelsesindsigt",
    description: "Metode, datagrundlag og transparens bag beregningen af AI-robusthedsscores for 1.413 danske uddannelser.",
    url: "https://uddannelsesindsigt.dk/evidens",
    siteName: "Uddannelsesindsigt",
    locale: "da_DK",
    type: "website",
  },
};

export default function EvidensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
