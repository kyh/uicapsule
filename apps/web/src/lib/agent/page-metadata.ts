import { siteConfig } from "@/lib/site-config";

import type { Metadata } from "next";

// WARNING: a page exporting `openGraph` replaces the layout's whole object (dropping og:type and og:image); build it with these helpers.
/** An explicit canonical, plus the Markdown representation the proxy serves from the same URL. */
export const canonicalAlternates = (path: string) => ({
  canonical: path,
  types: { "text/markdown": path === "/" ? "/index.md" : `${path}.md` },
});

type OpenGraphVideos = NonNullable<NonNullable<Metadata["openGraph"]>["videos"]>;

/** `og:video` tags for an H.264 mp4 at an absolute URL. */
export const ogVideo = (url: string, width: number, height: number) => [
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
 * title and description its metadata states. The home page uses `ogImage` instead.
 */
export const shareCardImage = (path: string, title: string) => ({
  alt: `${title} — ${siteConfig.name}`,
  height: 630,
  type: "image/png",
  url: `${siteConfig.url}/card${path}`,
  width: 1200,
});

export interface ShareMedia {
  image: ShareImage;
  /** Defaults to the site's name. */
  title?: string;
  /** Defaults to the site's description. */
  description?: string;
  videos?: OpenGraphVideos;
}

export const pageOpenGraph = (
  path: string,
  { image, title = siteConfig.name, description = siteConfig.description, videos }: ShareMedia,
) => {
  const openGraph: NonNullable<Metadata["openGraph"]> = {
    description,
    images: [image],
    locale: "en-US",
    siteName: siteConfig.name,
    title,
    type: "website",
    url: path,
  };

  if (videos !== undefined) {
    openGraph.videos = videos;
  }

  return openGraph;
};

/**
 * The card a page shows when shared. Same replace-don't-merge rule as
 * `openGraph`, so the image and the creator are restated rather than inherited.
 */
export const pageTwitter = ({
  image,
  title = siteConfig.name,
  description = siteConfig.description,
}: Omit<ShareMedia, "videos">) => ({
  card: "summary_large_image",
  creator: siteConfig.twitter,
  description,
  images: [image],
  title,
});
