import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * Every page's share card, one design: the mark and wordmark, the page's URL in
 * the accent, its title and description, on the site's dark tokens. A component
 * page puts its cover still (public/og/covers, written by `pnpm og:video`)
 * behind the text; every other page has the plain background. Served by
 * `app/card/[...path]`; `shareCardImage` in page-metadata names it in the tags.
 */

const size = { height: 630, width: 1200 };

// Hex equivalents of the dark theme's --background, --foreground,
// --muted-foreground, --secondary and --primary (satori has no oklch).
const background = "#09090b";
const foreground = "#fafafa";
const muted = "#9f9fa9";
const hairline = "#27272a";
const primary = "#fe5c28";

/** The host as people say it; a constant so a dev render looks like production's. */
const DISPLAY_HOST = "uicapsule.com";

// packages/ui's Logo path: satori draws SVG but can't render the React component's class.
const LOGO_PATH =
  "M737.064151,576.072011 L737.064151,384.064123 L679.928739,351.133373 L679.928739,674.874909 L810,599.89418 L809.996445,683.985857 L607,801 L607,225 L809.996445,342.167965 L809.99289,534.035047 L737.064151,576.072011 M477,192.025199 L477,833.972434 L513.500593,855 L550,833.972434 L550,192.025199 L513.500593,171 L477,192.025199 M347.067706,674.877164 L289.932294,641.940159 L289.932294,299.97795 L217,342.015345 L217,683.988204 L420,801 L420,225 L347.067706,267.035029 L347.067706,674.877164";

const MAX_DESCRIPTION = 110;

/** Two lines at most at 28px: cut at a word and mark the cut (satori ignores line-clamp). */
const shorten = (text: string): string => {
  if (text.length <= MAX_DESCRIPTION) {
    return text;
  }
  const cut = text.slice(0, MAX_DESCRIPTION);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:—-]+$/u, "")}…`;
};

/** A still under public/, as a data URL satori can draw; a missing file reads as none. */
export const readStill = async (still: string): Promise<string | undefined> => {
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", still));
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return undefined;
  }
};

export interface ShareCard {
  description: string;
  /** The page's path, shown as its URL. */
  path: string;
  /** A data URL drawn full-bleed behind the text. */
  still?: string;
  title: string;
}

// Satori renders plain elements only (no fragments), so each backdrop layer is its own element.
const Still = ({ src }: { src: string }) => (
  // oxlint-disable-next-line next/no-img-element -- satori renders plain <img>; next/image does not exist here
  <img
    alt=""
    height={size.height}
    src={src}
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
);

/** Over a still, a scrim keeps the text readable. */
const Scrim = () => (
  <div
    style={{
      backgroundImage: `linear-gradient(180deg, rgba(9,9,11,0.6) 0%, rgba(9,9,11,0) 26%, rgba(9,9,11,0.35) 44%, rgba(9,9,11,0.9) 62%, rgba(9,9,11,0.97) 80%, ${background} 100%)`,
      display: "flex",
      height: "100%",
      position: "absolute",
      width: "100%",
    }}
  />
);

/** Without one, a faint outline of the mark fills the right. */
const Mark = () => (
  <svg
    height="600"
    style={{ position: "absolute", right: -40, top: 15 }}
    viewBox="0 0 1026 1026"
    width="600"
  >
    <path d={LOGO_PATH} fill="none" stroke={hairline} strokeWidth="2.5" />
  </svg>
);

export const renderShareCard = ({ description, path: pagePath, still, title }: ShareCard) =>
  new ImageResponse(
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
      {still ? <Still src={still} /> : <Mark />}
      {still ? <Scrim /> : null}
      <div
        style={{
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
            {`${DISPLAY_HOST}${pagePath}`}
          </span>
          <span
            style={{ fontSize: 68, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05 }}
          >
            {title}
          </span>
          <span style={{ color: muted, fontSize: 28, lineHeight: 1.35, maxWidth: 1000 }}>
            {shorten(description)}
          </span>
        </div>
      </div>
    </div>,
    size,
  );
