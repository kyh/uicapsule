import { assetUrl } from "../assets";
import { siteConfig } from "../site-config";
import { coverStillKey } from "./content-schema";
import coverMedia from "./cover-media.json";
import homeMediaKeys from "./home-media.json";

import type { ContentComponentSummary, CoverMedia, HomeMedia } from "./content-schema";

/**
 * A page's share video (`og:video`) as the facts its `VideoObject` states.
 * URLs are absolute; `duration` is in seconds.
 */
export interface SocialVideo {
  contentUrl: string;
  description: string;
  duration: number;
  height: number;
  name: string;
  thumbnailUrl: string;
  uploadDate: string;
  width: number;
}

const homeMedia: HomeMedia = homeMediaKeys;

/** The finished sheet of the home og:video, the site-wide share image. */
export const ogImage = {
  alt: `${siteConfig.name} — ${siteConfig.description}. The ${siteConfig.name} mark as a dimensional drawing, surrounded by wireframe UI components labelled with their spacing, size and radius variables.`,
  height: 630,
  url: assetUrl(homeMedia.poster),
  width: 1200,
};

/**
 * Width, height and length of the loop scripts/og-video/scene.html renders: a
 * dimensional drawing of the mark, with wireframe components drawn around it.
 */
export const homeVideo: SocialVideo = {
  contentUrl: assetUrl(homeMedia.video),
  description: `${siteConfig.name} — ${siteConfig.description}. The ${siteConfig.name} mark drawn as a dimensional drawing, with a card, toggle, button, field, dialog, slider and segmented control measured around it and the dialog's layers lifting apart.`,
  duration: 10,
  height: 630,
  name: `${siteConfig.name} — a dimensional drawing`,
  thumbnailUrl: ogImage.url,
  uploadDate: "2026-10-25",
  width: 1200,
};

const mediaBySlug: Record<string, CoverMedia | undefined> = coverMedia;

/**
 * The probed facts for a component's cover, or nothing when the probe is
 * missing or was taken of a different cover (re-run `pnpm og:video`).
 */
export const coverMediaFor = (component: Pick<ContentComponentSummary, "cover" | "slug">) => {
  const entry = mediaBySlug[component.slug];

  return entry && entry.cover === component.cover ? entry : undefined;
};

export const componentVideo = (component: ContentComponentSummary) => {
  const media = coverMediaFor(component);

  if (!media) {
    return;
  }

  return {
    contentUrl: assetUrl(media.cover),
    description: component.description,
    duration: media.duration,
    height: media.height,
    name: `${component.name} — ${siteConfig.name}`,
    thumbnailUrl: assetUrl(coverStillKey(media.cover)),
    uploadDate: media.uploadDate,
    width: media.width,
  };
};
