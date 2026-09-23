import type { MetadataRoute } from "next";

import { getAllContent } from "@/lib/content-data";
import { siteConfig } from "@/lib/site-config";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const content = await getAllContent();
  const latest = content[0]?.addedAt;

  return [
    { changeFrequency: "weekly", lastModified: latest, priority: 1, url: siteConfig.url },
    { changeFrequency: "yearly", priority: 0.5, url: `${siteConfig.url}/about` },
    { changeFrequency: "yearly", priority: 0.5, url: `${siteConfig.url}/request` },
    ...content.map((c) => ({
      changeFrequency: "monthly" as const,
      lastModified: c.addedAt,
      priority: 0.8,
      url: `${siteConfig.url}/ui/${c.slug}`,
    })),
  ];
};

export default sitemap;
