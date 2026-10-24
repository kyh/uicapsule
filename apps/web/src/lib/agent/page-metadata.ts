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

/** An `og:image` / `twitter:image` entry. */
export interface ShareImage {
  alt: string;
  height: number;
  type?: string;
  url: string;
  width: number;
}

/**
 * The page's own share card, rendered by `app/card/[...path]` from the same
 * title and description its metadata states. Pages without one use `ogImage`.
 */
export const shareCardImage = (path: string, title: string): ShareImage => ({
  alt: `${title} — ${siteConfig.name}`,
  height: 630,
  type: "image/png",
  url: `${siteConfig.url}/card${path}`,
  width: 1200,
});

export interface ShareMedia {
  /** Defaults to the site-wide `ogImage`. */
  image?: ShareImage;
  videos?: OpenGraphVideos;
}

export const pageOpenGraph = (
  path: string,
  title: string = siteConfig.name,
  description: string = siteConfig.description,
  { image = ogImage, videos }: ShareMedia = {},
): Metadata["openGraph"] => {
  const openGraph: NonNullable<Metadata["openGraph"]> = {
    description,
    images: [image],
    locale: "en-US",
    siteName: siteConfig.name,
    title,
    type: "website",
    url: path,
  };
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
  { image = ogImage }: Pick<ShareMedia, "image"> = {},
): Metadata["twitter"] => ({
  card: "summary_large_image",
  creator: siteConfig.twitter,
  description,
  images: [image],
  title,
});
