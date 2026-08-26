import type { Metadata } from "next";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/siteMetadata";

export const metadata: Metadata = {
  title: "Bag om dine scorer — Sådan regner vi | Uddannelsesindsigt",
  description: "Her kan du se, hvor tallene kommer fra, og hvordan vi regner dem ud — helt uden fagsprog.",
  alternates: {
    canonical: "https://uddannelsesindsigt.com/evidens",
  },
  openGraph: {
    title: "Bag om dine scorer | Uddannelsesindsigt",
    description: "Her kan du se, hvor tallene kommer fra, og hvordan vi regner dem ud — helt uden fagsprog.",
    url: "https://uddannelsesindsigt.com/evidens",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export default function EvidensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
