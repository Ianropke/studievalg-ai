import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bag om dine scorer — Sådan regner vi | Uddannelsesindsigt",
  description: "Her kan du se, hvor tallene kommer fra, og hvordan vi regner dem ud — helt uden fagsprog.",
  alternates: {
    canonical: "https://uddannelsesindsigt.dk/evidens",
  },
  openGraph: {
    title: "Bag om dine scorer | Uddannelsesindsigt",
    description: "Her kan du se, hvor tallene kommer fra, og hvordan vi regner dem ud — helt uden fagsprog.",
    url: "https://uddannelsesindsigt.dk/evidens",
  },
};

export default function EvidensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
