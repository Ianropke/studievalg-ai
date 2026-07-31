import { MetadataRoute } from "next";
import { getAllPrograms, createProgramSlug } from "@/lib/slugs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://uddannelsesindsigt.dk";
  const allPrograms = getAllPrograms();

  const programUrls = allPrograms.map((prog) => ({
    url: `${baseUrl}/uddannelse/${createProgramSlug(prog)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const mainUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/analyse`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/evidens`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
  ];

  return [...mainUrls, ...programUrls];
}
