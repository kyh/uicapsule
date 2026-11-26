import type { CSSProperties } from "react";

type AccentStyle = CSSProperties & Record<`--${string}`, string>;

type Tone = readonly [name: `--${string}`, lightness: number, chroma: number, hue: number];

const ACCENT_TONES: readonly Tone[] = [
  ["--color-emerald-300", 0.845, 0.143, 164.978],
  ["--color-emerald-400", 0.765, 0.177, 163.223],
  ["--color-emerald-600", 0.596, 0.145, 163.225],
  ["--color-emerald-900", 0.378, 0.077, 168.94],
  ["--color-green-500", 0.723, 0.219, 149.579],
  ["--color-green-600", 0.627, 0.194, 149.214],
  ["--color-teal-600", 0.6, 0.118, 184.704],
  ["--emerald-pulse", 0.696, 0.17, 162.48],
  ["--emerald-glow", 0.3441, 0.0477, 186.8],
  ["--emerald-sweep", 0.596, 0.1274, 163.23],
  ["--emerald-sweep-tip", 0.8452, 0.1299, 164.98],
  ["--emerald-card-from", 0.2856, 0.0239, 159.38],
  ["--emerald-card-to", 0.3119, 0.0194, 163.39],
];

/**
 * Rotates every accent tone of the template by `hueShift` degrees in OKLCH, keeping each
 * tone's lightness and chroma. A shift of 0 leaves the stylesheet's own values untouched.
 */
export const accentStyle = (hueShift: number) => {
  const style: AccentStyle = {};

  if (hueShift === 0) {
    return style;
  }

  for (const [name, lightness, chroma, hue] of ACCENT_TONES) {
    style[name] = `oklch(${lightness} ${chroma} ${(hue + hueShift) % 360})`;
  }

  return style;
};
