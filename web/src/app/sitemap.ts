import { MetadataRoute } from "next";
import { getAllPrograms, createProgramSlug } from "@/lib/slugs";
import { getAdmission2026 } from "@/lib/admissions2026";
import { LIST_CONFIGS } from "@/lib/lists";
import { DATA_STATUS } from "@/lib/dataStatus";
import { GUIDE_CONFIGS, GUIDE_UPDATED_AT } from "@/lib/guides";

import { STUDY_NEWS } from "@/lib/studyNews";

const DATA_LAST_MODIFIED = DATA_STATUS.catalogue.admissionsUpdatedAt;
const MODEL_LAST_MODIFIED = DATA_STATUS.scoring.updatedAt;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://uddannelsesindsigt.com";
  const activePrograms = getAllPrograms().filter(
    (program) => getAdmission2026(program).kind === "matched",
  );

  const programUrls = activePrograms.map((prog) => ({
    url: `${baseUrl}/uddannelse/${createProgramSlug(prog)}`,
    lastModified: MODEL_LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const listUrls = Object.keys(LIST_CONFIGS).map((slug) => ({
    url: `${baseUrl}/lister/${slug}`,
    lastModified: MODEL_LAST_MODIFIED,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const guideUrls = Object.keys(GUIDE_CONFIGS).map((slug) => ({
    url: `${baseUrl}/guides/${slug}`,
    lastModified: GUIDE_UPDATED_AT,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const newsUrls = STUDY_NEWS.map(({ slug, publishedAt }) => ({
    url: `${baseUrl}/guides/${slug}`,
    lastModified: publishedAt,
  }));

  const mainUrls = [
    {
      url: baseUrl,
      lastModified: STUDY_NEWS[0].publishedAt,
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sammenlign`,
      lastModified: MODEL_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/analyse`,
      lastModified: MODEL_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/evidens`,
      lastModified: MODEL_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: STUDY_NEWS[0].publishedAt,
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

  return [...mainUrls, ...guideUrls, ...newsUrls, ...listUrls, ...programUrls];
}
