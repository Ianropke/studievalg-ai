import type { Metadata } from "next";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/siteMetadata";

export const metadata: Metadata = {
  title: "Sammenlign Uddannelser Side-om-Side | Uddannelsesindsigt",
  description:
    "Sammenlign op til tre danske videregående uddannelser på adgangskvotient, studiested, fagligt indhold og tydeligt markerede AI-modelestimater.",
  alternates: {
    canonical: "https://uddannelsesindsigt.com/sammenlign",
  },
  openGraph: {
    title: "Sammenlign Uddannelser | Uddannelsesindsigt",
    description: "Sammenlign op til tre uddannelser på adgangskvotient, fagligt indhold og et valgfrit AI-perspektiv.",
    url: "https://uddannelsesindsigt.com/sammenlign",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export default function SammenlignLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
