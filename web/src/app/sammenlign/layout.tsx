import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sammenlign Uddannelser Side-om-Side | Uddannelsesindsigt",
  description: "Sammenlign 2-3 danske videregående uddannelser side-om-side. Se direkte forskelle i adgangskvotienter, AI-robusthed, løn og jobmuligheder.",
  alternates: {
    canonical: "https://uddannelsesindsigt.dk/sammenlign",
  },
  openGraph: {
    title: "Sammenlign Uddannelser Side-om-Side | Uddannelsesindsigt",
    description: "Sammenlign adgangskvotienter, AI-robusthed, løn og jobmuligheder for op til 3 uddannelser samtidig.",
    url: "https://uddannelsesindsigt.dk/sammenlign",
    siteName: "Uddannelsesindsigt",
    locale: "da_DK",
    type: "website",
  },
};

export default function SammenlignLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
