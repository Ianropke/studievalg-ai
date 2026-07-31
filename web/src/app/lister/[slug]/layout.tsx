import type { Metadata } from "next";
import { LIST_CONFIGS } from "@/lib/lists";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const config = LIST_CONFIGS[slug];

  if (!config) {
    return {
      title: "Statistisk Liste | Uddannelsesindsigt",
    };
  }

  return {
    title: `${config.title} (2026) | Uddannelsesindsigt`,
    description: config.description,
    alternates: {
      canonical: `https://uddannelsesindsigt.dk/lister/${slug}`,
    },
    openGraph: {
      title: `${config.title} | Uddannelsesindsigt`,
      description: config.description,
      url: `https://uddannelsesindsigt.dk/lister/${slug}`,
      siteName: "Uddannelsesindsigt",
      locale: "da_DK",
      type: "website",
    },
  };
}

export default function ListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
