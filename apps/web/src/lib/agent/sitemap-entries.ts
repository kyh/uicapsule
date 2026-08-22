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
    url: absoluteUrl("/"),
    lastModified,
    changeFrequency: "weekly",
    priority: 1,
  },
  ...prosePages.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: page.sitemapPriority ?? 0.5,
  })),
  ...componentSlugs.map((slug) => ({
    url: absoluteUrl(`/ui/${slug}`),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  })),
];
