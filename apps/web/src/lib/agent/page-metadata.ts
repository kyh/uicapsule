import { siteConfig } from "@/lib/site-config";

import type { Metadata } from "next";

/**
 * Per-page metadata helpers.
 *
 * Next merges `metadata` field by field at the top level: a page that exports
 * `openGraph` REPLACES the layout's entire object rather than merging into it,
 * which silently drops `og:type` and `og:image`. Both helpers below always
 * return complete values so overriding a title can't cost a page its OG card.
 */

const ogImage = { url: `${siteConfig.url}/og.jpg`, width: 1920, height: 1080 };

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
  type: "website",
  locale: "en-US",
  siteName: siteConfig.name,
  url: path,
  title,
  description,
  images: [ogImage],
});
