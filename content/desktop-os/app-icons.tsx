import type { ReactNode } from "react";

/**
 * Hand-authored app / file artwork.
 *
 * Every icon is a CSS-gradient "squircle" (macOS uses ~22.4% corner radius,
 * expressed as a percentage so it survives the dock's width/height lerp) with a
 * flat inline-SVG glyph on top. Nothing here is a third-party mark and nothing
 * loads over the network.
 */

export type GlyphId = "files" | "preview" | "photos" | "notes" | "terminal" | "trash" | "folder";

const SQUIRCLE_RADIUS = "22.4%";

const SQUIRCLE_SHADOW =
  "inset 0 1.5% 0 rgba(255,255,255,0.45), inset 0 -2% 0 rgba(0,0,0,0.18), 0 2% 6% rgba(0,0,0,0.28)";

const Squircle = ({
  background,
  children,
}: {
  background: string;
  children: ReactNode;
}): ReactNode => (
  <div
    className="relative size-full"
    style={{
      background,
      borderRadius: SQUIRCLE_RADIUS,
      boxShadow: SQUIRCLE_SHADOW,
    }}
  >
    <svg viewBox="0 0 64 64" className="absolute inset-0 size-full" aria-hidden="true">
      {children}
    </svg>
  </div>
);

const PINWHEEL = [
  { angle: 0, fill: "#f2b33d" },
  { angle: 45, fill: "#ef6b4b" },
  { angle: 90, fill: "#e34b8a" },
  { angle: 135, fill: "#a05ad6" },
  { angle: 180, fill: "#4f7fe0" },
  { angle: 225, fill: "#35b6d8" },
  { angle: 270, fill: "#45c37a" },
  { angle: 315, fill: "#b9d34a" },
] as const;

const GLYPHS: Record<GlyphId, ReactNode> = {
  files: (
    <Squircle background="linear-gradient(165deg, #6fc0ff 0%, #2f7fe6 52%, #1f57b8 100%)">
      <path
        d="M14 22h13l4 5h19a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V25a3 3 0 0 1 3-3Z"
        fill="rgba(255,255,255,0.94)"
      />
      <path d="M11 32h42v12a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V32Z" fill="rgba(255,255,255,0.72)" />
    </Squircle>
  ),
  preview: (
    <Squircle background="linear-gradient(165deg, #f6f4ee 0%, #d9d5cb 100%)">
      <rect
        x="13"
        y="14"
        width="30"
        height="34"
        rx="3"
        fill="#ffffff"
        stroke="rgba(0,0,0,0.16)"
        strokeWidth="1.4"
      />
      <path d="M17 41l7-9 5 6 4-5 6 8H17Z" fill="#7fb2e8" />
      <circle cx="35" cy="22" r="3.2" fill="#f2b33d" />
      <circle
        cx="41"
        cy="40"
        r="9.5"
        fill="rgba(255,255,255,0.35)"
        stroke="#2f6fd0"
        strokeWidth="3"
      />
      <path d="M48 47l6.5 6.5" stroke="#2f6fd0" strokeWidth="4" strokeLinecap="round" />
    </Squircle>
  ),
  photos: (
    <Squircle background="linear-gradient(165deg, #ffffff 0%, #e9e6df 100%)">
      {PINWHEEL.map((petal) => (
        <ellipse
          key={petal.angle}
          cx="32"
          cy="21"
          rx="6.5"
          ry="12"
          fill={petal.fill}
          opacity="0.88"
          transform={`rotate(${petal.angle} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="4.2" fill="rgba(255,255,255,0.85)" />
    </Squircle>
  ),
  notes: (
    <Squircle background="linear-gradient(165deg, #fff0b0 0%, #f7d24a 46%, #eab61f 100%)">
      <rect x="12" y="12" width="40" height="10" rx="2" fill="rgba(255,255,255,0.85)" />
      {[29, 36, 43, 50].map((y) => (
        <rect
          key={y}
          x="17"
          y={y}
          width={y === 50 ? 20 : 30}
          height="2.6"
          rx="1.3"
          fill="rgba(0,0,0,0.24)"
        />
      ))}
    </Squircle>
  ),
  terminal: (
    <Squircle background="linear-gradient(165deg, #4a4a52 0%, #1d1d22 40%, #0b0b0e 100%)">
      <rect x="9" y="9" width="46" height="46" rx="8" fill="rgba(255,255,255,0.04)" />
      <path
        d="M18 24l8 8-8 8"
        stroke="#ffffff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M31 42h15" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" />
    </Squircle>
  ),
  trash: (
    <Squircle background="linear-gradient(165deg, rgba(255,255,255,0.55) 0%, rgba(220,222,228,0.42) 100%)">
      <path
        d="M20 22h24l-2.4 28a4 4 0 0 1-4 3.6H26.4a4 4 0 0 1-4-3.6L20 22Z"
        fill="rgba(255,255,255,0.5)"
        stroke="rgba(40,44,54,0.65)"
        strokeWidth="2.2"
      />
      <path d="M15 20h34" stroke="rgba(40,44,54,0.75)" strokeWidth="3" strokeLinecap="round" />
      <path d="M26 15h12" stroke="rgba(40,44,54,0.75)" strokeWidth="3" strokeLinecap="round" />
      {[27, 32, 37].map((x) => (
        <path
          key={x}
          d={`M${x} 29v17`}
          stroke="rgba(40,44,54,0.45)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </Squircle>
  ),
  folder: (
    <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
      <path
        d="M6 16h18l5 6h29a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V19a3 3 0 0 1 3-3Z"
        fill="#5aa7ef"
      />
      <path d="M3 27h58v22a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V27Z" fill="#82c2f8" />
      <path d="M3 27h58v3H3z" fill="rgba(255,255,255,0.45)" />
    </svg>
  ),
};

/**
 * Fills its square container edge to edge — the dock magnification lerps the
 * wrapper's width/height, so the artwork must honour the `size-full` contract.
 */
export const AppGlyph = ({ id }: { id: GlyphId }): ReactNode => GLYPHS[id];

/* --------------------------------------------------------- status glyphs -- */

export const MacBatteryGlyph = (): ReactNode => (
  <svg width="24" height="12" viewBox="0 0 24 12" fill="none" aria-hidden="true">
    <rect
      x="0.5"
      y="1.5"
      width="19"
      height="9"
      rx="2.4"
      stroke="currentColor"
      strokeOpacity="0.55"
    />
    <rect x="2" y="3" width="13" height="6" rx="1.2" fill="currentColor" />
    <path
      d="M21.5 4.2 v3.6 a1.6 1.6 0 0 0 1.2 -1.8 a1.6 1.6 0 0 0 -1.2 -1.8 Z"
      fill="currentColor"
      fillOpacity="0.55"
    />
  </svg>
);

export const SignalBarsGlyph = (): ReactNode => (
  <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true">
    <rect x="0" y="8" width="2.6" height="3" rx="0.6" />
    <rect x="4.6" y="6" width="2.6" height="5" rx="0.6" />
    <rect x="9.2" y="3.5" width="2.6" height="7.5" rx="0.6" />
    <rect x="13.8" y="0.5" width="2.6" height="10.5" rx="0.6" />
  </svg>
);

export const WifiGlyph = (): ReactNode => (
  <svg
    width="15"
    height="11"
    viewBox="0 0 15 11"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M1.4 3.6 A9 9 0 0 1 13.6 3.6" />
    <path d="M3.6 6 A5.6 5.6 0 0 1 11.4 6" />
    <path d="M5.9 8.4 A2.3 2.3 0 0 1 9.1 8.4" />
    <circle cx="7.5" cy="9.8" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

export const IOSBatteryGlyph = (): ReactNode => (
  <svg width="28" height="13" viewBox="0 0 28 13" fill="none" aria-hidden="true">
    <rect
      x="0.6"
      y="0.6"
      width="24"
      height="11.8"
      rx="3.4"
      stroke="currentColor"
      strokeOpacity="0.55"
    />
    <rect x="2.1" y="2.1" width="21" height="8.8" rx="2" fill="currentColor" />
    <path d="M26.4 4 v5 a2.1 2.1 0 0 0 0 -5 Z" fill="currentColor" fillOpacity="0.55" />
  </svg>
);

export const BellSlashGlyph = (): ReactNode => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3 10 h8 l-1 -1.5 V6 a3 3 0 0 0 -6 0 v2.5 Z" fill="currentColor" />
    <path
      d="M5.6 11 a1.4 1.4 0 0 0 2.8 0"
      stroke="currentColor"
      strokeWidth="1.1"
      fill="none"
      strokeLinecap="round"
    />
    <line
      x1="1.6"
      y1="12.4"
      x2="12.4"
      y2="1.6"
      stroke="#000000"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <line
      x1="1.6"
      y1="12.4"
      x2="12.4"
      y2="1.6"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
);
