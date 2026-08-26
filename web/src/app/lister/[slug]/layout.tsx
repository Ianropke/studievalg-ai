import type { Metadata } from "next";
import { LIST_CONFIGS } from "@/lib/lists";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/siteMetadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const config = LIST_CONFIGS[slug];

  if (!config) {
    return {
      title: "Statistisk Liste | Uddannelsesindsigt",
    };
  }

  return {
    title: `${config.seoTitle || `${config.title} (2026)`} | Uddannelsesindsigt`,
    description: config.description,
    alternates: {
      canonical: `https://uddannelsesindsigt.com/lister/${slug}`,
    },
    openGraph: {
      title: config.seoTitle || config.title,
      description: config.description,
      url: `https://uddannelsesindsigt.com/lister/${slug}`,
      siteName: "Uddannelsesindsigt",
      locale: "da_DK",
      type: "website",
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export default function ListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
