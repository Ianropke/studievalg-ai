import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evidensmotoren — Metode & Datakilder | Uddannelsesindsigt",
  description:
    "Fuld transparens om Uddannelsesindsigts datakilder, hierarkiske evidensarkitektur og algoritmisk metode baseret på UFM, DST og O*NET.",
  alternates: {
    canonical: "https://uddannelsesindsigt.dk/evidens",
  },
  openGraph: {
    title: "Evidensmotoren | Uddannelsesindsigt",
    description: "Læs hvordan algoritmen vægter, parser og analyserer data fra officielle instanser.",
    url: "https://uddannelsesindsigt.dk/evidens",
  },
};

export default function EvidensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
