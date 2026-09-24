import { ogImage, siteConfig } from "@/lib/site-config";

import type { Metadata } from "next";

/**
 * Per-page metadata helpers.
 *
 * Next merges `metadata` field by field at the top level: a page that exports
 * `openGraph` REPLACES the layout's entire object rather than merging into it,
 * which silently drops `og:type` and `og:image`. Both helpers below always
 * return complete values so overriding a title can't cost a page its OG card.
 */

/** An explicit canonical, plus the Markdown representation the proxy serves from the same URL. */
export const canonicalAlternates = (path: string): Metadata["alternates"] => ({
  canonical: path,
  types: { "text/markdown": path === "/" ? "/index.md" : `${path}.md` },
});

export const pageOpenGraph = (
  path: string,
  title: string = siteConfig.name,
  description: string = siteConfig.description,
): Metadata["openGraph"] => ({
  description,
  images: [ogImage],
  locale: "en-US",
  siteName: siteConfig.name,
  title,
  type: "website",
  url: path,
});

/**
 * The card a page shows when shared. Same replace-don't-merge rule as
 * `openGraph`, so the image is restated rather than inherited.
 */
export const pageTwitter = (
  title: string = siteConfig.name,
  description: string = siteConfig.description,
): Metadata["twitter"] => ({
  card: "summary_large_image",
  description,
  images: [ogImage],
  title,
});
