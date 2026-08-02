import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sammenlign Uddannelser Side-om-Side | Uddannelsesindsigt",
  description:
    "Sammenlign op til 3 danske videregående uddannelser side-om-side på AI-robusthed, jobmuligheder, lønpotentiale og adgangskvotienter.",
  alternates: {
    canonical: "https://uddannelsesindsigt.dk/sammenlign",
  },
  openGraph: {
    title: "Sammenlign Uddannelser | Uddannelsesindsigt",
    description: "Sammenlign op til 3 uddannelser på nøgletal som AI-robusthed, jobmuligheder og lønpotentiale.",
    url: "https://uddannelsesindsigt.dk/sammenlign",
  },
};

export default function SammenlignLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
