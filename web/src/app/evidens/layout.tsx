import type { Metadata } from "next";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/siteMetadata";

export const metadata: Metadata = {
  title: "Bag om dine scorer — Sådan regner vi | Uddannelsesindsigt",
  description: "Se O*NET 31.0-metoden, den aktuelle dækning, datakilder, modelantagelser og begrænsninger bag Uddannelsesindsigts AI-scorer.",
  alternates: {
    canonical: "https://uddannelsesindsigt.com/evidens",
  },
  openGraph: {
    title: "Bag om dine scorer | Uddannelsesindsigt",
    description: "Se O*NET 31.0-metoden, dækningen og begrænsningerne bag Uddannelsesindsigts AI-scorer.",
    url: "https://uddannelsesindsigt.com/evidens",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export default function EvidensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
