import { assetUrl } from "./assets";
import coverMedia from "./content/cover-media.json";
import { siteConfig } from "./site-config";

import type { ContentComponentSummary } from "./content/content-schema";
import type { SocialVideo } from "./agent/structured-data";

/**
 * The videos pages share as `og:video` and describe as `VideoObject`.
 *
 * Both come from `pnpm og:video` (scripts/og-video.ts): the home page's is a
 * rendered trailer in public/og, a component's is its existing cover in the
 * assets store, sized and dated by `cover-media.json`.
 */

/** Width, height and length of the trailer scripts/og-video/scene.html renders. */
export const homeVideo: SocialVideo = {
  contentUrl: `${siteConfig.url}/og/og.mp4`,
  description: `${siteConfig.name} — ${siteConfig.description}. Wireframe UI primitives: a toggle, a dial, a slider, a card stack and a sheet.`,
  duration: 10,
  height: 630,
  name: `${siteConfig.name} trailer`,
  thumbnailUrl: `${siteConfig.url}/og/og.jpg`,
  uploadDate: "2026-10-24",
  width: 1200,
};

interface CoverMediaEntry {
  cover: string;
  duration: number;
  height: number;
  still: string;
  uploadDate: string;
  width: number;
}

const mediaBySlug: Record<string, CoverMediaEntry | undefined> = coverMedia;

/**
 * The probed facts for a component's cover, or nothing when the probe is
 * missing or was taken of a different cover (re-run `pnpm og:video`).
 */
export const coverMediaFor = (
  component: Pick<ContentComponentSummary, "cover" | "slug">,
): CoverMediaEntry | undefined => {
  const entry = mediaBySlug[component.slug];
  return entry && entry.cover === component.cover ? entry : undefined;
};

export const componentVideo = (component: ContentComponentSummary): SocialVideo | undefined => {
  const media = coverMediaFor(component);
  if (!media) {
    return undefined;
  }
  return {
    contentUrl: assetUrl(media.cover),
    description: component.description,
    duration: media.duration,
    height: media.height,
    name: `${component.name} — ${siteConfig.name}`,
    thumbnailUrl: `${siteConfig.url}${media.still}`,
    uploadDate: media.uploadDate,
    width: media.width,
  };
};
