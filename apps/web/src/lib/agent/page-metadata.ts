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

type OpenGraphVideos = NonNullable<NonNullable<Metadata["openGraph"]>["videos"]>;

/** `og:video` tags for an H.264 mp4 at an absolute URL. */
export const ogVideo = (url: string, width: number, height: number): OpenGraphVideos => [
  { height, secureUrl: url, type: "video/mp4", url, width },
];

export interface ShareMedia {
  /**
   * The route renders its own card (an `opengraph-image` / `twitter-image`
   * file), so the site image is left out for Next to fill from the file:
   * metadata that names `images` outranks the file convention.
   */
  ownImage?: boolean;
  videos?: OpenGraphVideos;
}

export const pageOpenGraph = (
  path: string,
  title: string = siteConfig.name,
  description: string = siteConfig.description,
  { ownImage = false, videos }: ShareMedia = {},
): Metadata["openGraph"] => {
  const openGraph: NonNullable<Metadata["openGraph"]> = {
    description,
    locale: "en-US",
    siteName: siteConfig.name,
    title,
    type: "website",
    url: path,
  };
  // Even `images: undefined` counts as set and hides the file's card, so the key is added, not blanked.
  if (!ownImage) {
    openGraph.images = [ogImage];
  }
  if (videos) {
    openGraph.videos = videos;
  }
  return openGraph;
};

/**
 * The card a page shows when shared. Same replace-don't-merge rule as
 * `openGraph`, so the image and the creator are restated rather than inherited.
 */
export const pageTwitter = (
  title: string = siteConfig.name,
  description: string = siteConfig.description,
  { ownImage = false }: Pick<ShareMedia, "ownImage"> = {},
): Metadata["twitter"] => {
  const twitter: NonNullable<Metadata["twitter"]> = {
    card: "summary_large_image",
    creator: siteConfig.twitter,
    description,
    title,
  };
  if (!ownImage) {
    twitter.images = [ogImage];
  }
  return twitter;
};
