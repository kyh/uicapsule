import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { getAllContent } from "@/lib/content-data";
import { siteConfig } from "@/lib/site-config";
import { coverMediaFor } from "@/lib/social-video";

/**
 * The share card for `/ui/<slug>`, rendered by the route's opengraph-image and
 * twitter-image: the component's cover still (public/og/covers, written by
 * `pnpm og:video`) under its name and description, on the site's dark tokens.
 * A component with no still yet gets the same card on a plain background.
 */

const size = { height: 630, width: 1200 };

// Hex equivalents of the dark theme's --background, --foreground,
// --muted-foreground and --primary (satori has no oklch).
const background = "#09090b";
const foreground = "#fafafa";
const muted = "#9f9fa9";
const primary = "#fe5c28";

// packages/ui's Logo path: satori draws SVG but can't render the React component's class.
const LOGO_PATH =
  "M737.064151,576.072011 L737.064151,384.064123 L679.928739,351.133373 L679.928739,674.874909 L810,599.89418 L809.996445,683.985857 L607,801 L607,225 L809.996445,342.167965 L809.99289,534.035047 L737.064151,576.072011 M477,192.025199 L477,833.972434 L513.500593,855 L550,833.972434 L550,192.025199 L513.500593,171 L477,192.025199 M347.067706,674.877164 L289.932294,641.940159 L289.932294,299.97795 L217,342.015345 L217,683.988204 L420,801 L420,225 L347.067706,267.035029 L347.067706,674.877164";

const findComponent = async (slug: string) => {
  const all = await getAllContent();
  return all.find((component) => component.slug === slug);
};

export const componentImageSlugs = async () => {
  const all = await getAllContent();
  return all.map((component) => ({ slug: component.slug }));
};

const MAX_DESCRIPTION = 110;

/** Two lines at most at 28px: cut at a word and mark the cut (satori ignores line-clamp). */
const shorten = (text: string): string => {
  if (text.length <= MAX_DESCRIPTION) {
    return text;
  }
  const cut = text.slice(0, MAX_DESCRIPTION);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:—-]+$/u, "")}…`;
};

const readStill = async (still: string): Promise<string | undefined> => {
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", still));
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return undefined;
  }
};

export const renderComponentImage = async (slug: string): Promise<ImageResponse> => {
  const component = await findComponent(slug);
  const media = component ? coverMediaFor(component) : undefined;
  const still = media ? await readStill(media.still) : undefined;
  const name = component?.name ?? siteConfig.name;
  const description = shorten(component?.description ?? siteConfig.description);

  return new ImageResponse(
    <div
      style={{
        background,
        color: foreground,
        display: "flex",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      {still ? (
        // oxlint-disable-next-line next/no-img-element -- satori renders plain <img>; next/image does not exist here
        <img
          alt=""
          height={size.height}
          src={still}
          style={{
            height: "100%",
            left: 0,
            objectFit: "cover",
            position: "absolute",
            top: 0,
            width: "100%",
          }}
          width={size.width}
        />
      ) : null}
      <div
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(9,9,11,0.6) 0%, rgba(9,9,11,0) 26%, rgba(9,9,11,0.35) 44%, rgba(9,9,11,0.9) 62%, rgba(9,9,11,0.97) 80%, ${background} 100%)`,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "48px 64px 56px",
          position: "absolute",
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 14 }}>
          <svg height="40" viewBox="0 0 1026 1026" width="40">
            <path d={LOGO_PATH} fill={foreground} fillRule="evenodd" />
          </svg>
          <span style={{ fontSize: 22, letterSpacing: "0.32em" }}>UICAPSULE</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ color: primary, fontSize: 22, letterSpacing: "0.08em" }}>
            {`uicapsule.com/ui/${slug}`}
          </span>
          <span
            style={{ fontSize: 68, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05 }}
          >
            {name}
          </span>
          <span style={{ color: muted, fontSize: 28, lineHeight: 1.35, maxWidth: 1000 }}>
            {description}
          </span>
        </div>
      </div>
    </div>,
    size,
  );
};
