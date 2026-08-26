import { MetadataRoute } from "next";
import { getAllPrograms, createProgramSlug } from "@/lib/slugs";
import { LIST_CONFIGS } from "@/lib/lists";
import { DATA_STATUS } from "@/lib/dataStatus";
import { GUIDE_CONFIGS, GUIDE_UPDATED_AT } from "@/lib/guides";

const DATA_LAST_MODIFIED = DATA_STATUS.catalogue.admissionsUpdatedAt;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://uddannelsesindsigt.com";
  const allPrograms = getAllPrograms();

  const programUrls = allPrograms.map((prog) => ({
    url: `${baseUrl}/uddannelse/${createProgramSlug(prog)}`,
    lastModified: DATA_LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const listUrls = Object.keys(LIST_CONFIGS).map((slug) => ({
    url: `${baseUrl}/lister/${slug}`,
    lastModified: DATA_LAST_MODIFIED,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const guideUrls = Object.keys(GUIDE_CONFIGS).map((slug) => ({
    url: `${baseUrl}/guides/${slug}`,
    lastModified: GUIDE_UPDATED_AT,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const mainUrls = [
    {
      url: baseUrl,
      lastModified: DATA_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sammenlign`,
      lastModified: DATA_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/analyse`,
      lastModified: DATA_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/evidens`,
      lastModified: DATA_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: GUIDE_UPDATED_AT,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/om-os`,
      lastModified: DATA_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  return [...mainUrls, ...guideUrls, ...listUrls, ...programUrls];
}
