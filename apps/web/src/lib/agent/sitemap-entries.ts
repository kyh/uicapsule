import { absoluteUrl } from "./markdown";
import { prosePages } from "./site-pages";

import type { MetadataRoute } from "next";

/**
 * Pure sitemap construction. `lastmod` comes from each component's `addedAt`
 * rather than the clock or a file mtime, so the same commit emits the same
 * sitemap from any checkout.
 */

export type SitemapEntry = MetadataRoute.Sitemap[number];

export interface SitemapComponent {
  addedAt: string;
  slug: string;
}

/** The form is indexable but carries no prose, so it has no Markdown twin. */
const requestPath = "/request";

export const buildSitemapEntries = (components: SitemapComponent[]): SitemapEntry[] => {
  // Sorted rather than indexed off the feed, so the home page's lastmod does
  // not depend on the caller's ordering.
  const latest = components
    .map((component) => component.addedAt)
    .toSorted()
    .at(-1);

  return [
    {
      changeFrequency: "weekly",
      lastModified: latest,
      priority: 1,
      url: absoluteUrl("/"),
    },
    ...prosePages.map((page) => ({
      changeFrequency: "yearly" as const,
      priority: page.sitemapPriority ?? 0.5,
      url: absoluteUrl(page.path),
    })),
    {
      changeFrequency: "yearly",
      priority: 0.5,
      url: absoluteUrl(requestPath),
    },
    ...components.map((component) => ({
      changeFrequency: "monthly" as const,
      lastModified: component.addedAt,
      priority: 0.8,
      url: absoluteUrl(`/ui/${component.slug}`),
    })),
  ];
};
