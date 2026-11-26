import { mixHex, withAlpha } from "./color";
import { contrastRatio } from "./contrast";
import type { Theme, TokenVars } from "./live-tokens";

/**
 * Knobs that retune tokens.css. Each one at its neutral value (no accent, a scale of 1) adds
 * nothing, so tokens.css stays the only source of the default look.
 */
export interface Tuning {
  /** Replaces clementine orange in both themes; omit for the system's own orange. */
  accent?: string;
  /** Multiplies the four transition durations; 0 turns motion off. The spinner keeps its pace. */
  motionScale: number;
  /** Multiplies every corner radius except the pill. */
  radiusScale: number;
  /** Multiplies the seven text sizes. */
  typeScale: number;
}

const PAGE = { dark: "#12100d", light: "#ffffff" } as const satisfies Record<Theme, string>;
const INK = "#17130f";
const WHITE = "#ffffff";
const BLACK = "#000000";

const RADII = {
  "--radius-control": 14,
  "--radius-md": 8,
  "--radius-panel": 20,
  "--radius-sheet": 28,
  "--radius-sm": 4,
} as const;

const TEXT = {
  "--text-2xl": 32,
  "--text-3xl": 44,
  "--text-base": 16,
  "--text-lg": 20,
  "--text-sm": 14,
  "--text-xl": 24,
  "--text-xs": 12,
} as const;

const DURATIONS = {
  "--dur-base": 220,
  "--dur-fast": 160,
  "--dur-instant": 90,
  "--dur-slow": 320,
} as const;

const scaled = (table: Readonly<Record<`--${string}`, number>>, scale: number, unit: string) =>
  scale === 1
    ? {}
    : Object.fromEntries(
        Object.entries(table).map(([name, base]) => [
          name,
          `${String(Math.round(base * scale))}${unit}`,
        ]),
      );

const legible = (color: string, page: string, toward: string) => {
  let line = color;

  for (let step = 0; step < 12 && contrastRatio(line, page) < 4.5; step += 1) {
    line = mixHex(line, toward, 0.12);
  }

  return line;
};

const accentVars = (accent: string, theme: Theme) => {
  const page = PAGE[theme];
  const dark = theme === "dark";

  return {
    "--accent": accent,
    "--accent-active": mixHex(accent, BLACK, dark ? 0.05 : 0.09),
    "--accent-hover": dark ? mixHex(accent, WHITE, 0.1) : mixHex(accent, BLACK, 0.04),
    "--accent-line": legible(accent, page, dark ? WHITE : BLACK),
    "--accent-wash": mixHex(accent, page, dark ? 0.85 : 0.87),
    "--glow-cast": dark ? "rgb(0 0 0 / 0.5)" : withAlpha(mixHex(accent, BLACK, 0.45), 0.28),
    "--glow-from": accent,
    "--glow-from-press": mixHex(accent, BLACK, 0.07),
    "--glow-ring": dark ? withAlpha(accent, 0.26) : mixHex(accent, page, 0.76),
    "--glow-to": mixHex(accent, WHITE, 0.45),
    "--glow-to-press": mixHex(accent, WHITE, 0.3),
    "--on-accent": contrastRatio(INK, accent) >= contrastRatio(WHITE, accent) ? INK : WHITE,
  };
};

/** The inline custom properties that apply a tuning to one theme of `.ds-clementine`. */
export const tokenOverrides = (tuning: Tuning, theme: Theme) => {
  const vars: Record<`--${string}`, string> = {
    ...scaled(RADII, tuning.radiusScale, "px"),
    ...scaled(TEXT, tuning.typeScale, "px"),
    ...scaled(DURATIONS, tuning.motionScale, "ms"),
  };

  if (tuning.accent !== undefined) {
    Object.assign(vars, accentVars(tuning.accent, theme));
  }

  return vars satisfies TokenVars;
};
