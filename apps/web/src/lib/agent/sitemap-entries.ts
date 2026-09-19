import { absoluteUrl } from "./markdown";
import { prosePages } from "./site-pages";

import type { MetadataRoute } from "next";

/**
 * Pure sitemap construction. `lastModified` is passed in rather than read from
 * the clock so the output is deterministic for a given deploy — see
 * `app/sitemap.ts`, which derives it from the content tree's mtimes.
 */

export type SitemapEntry = MetadataRoute.Sitemap[number];

export const buildSitemapEntries = (
  componentSlugs: string[],
  lastModified: Date,
): SitemapEntry[] => [
  {
    changeFrequency: "weekly",
    lastModified,
    priority: 1,
    url: absoluteUrl("/"),
  },
  ...prosePages.map((page) => ({
    changeFrequency: "monthly" as const,
    lastModified,
    priority: page.sitemapPriority ?? 0.5,
    url: absoluteUrl(page.path),
  })),
  ...componentSlugs.map((slug) => ({
    changeFrequency: "monthly" as const,
    lastModified,
    priority: 0.8,
    url: absoluteUrl(`/ui/${slug}`),
  })),
];
