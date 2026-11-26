import type { ChartMotionSpringTransition } from "@tanstack/charts/motion";

export interface Tone {
  ink: string;
  muted: string;
  faint: string;
}

export interface Palette extends Tone {
  paper: string;
  /** The ink at 55% alpha, for the minor rungs between every fifth. */
  tint: string;
  /** Darkest to lightest; one shade per waffle plan. */
  ladder: readonly string[];
  /** The inverted card: its `bg` is the sheet's ink, its `ink` the sheet's paper. */
  dark: Tone & { bg: string; ladder: readonly string[] };
}

const channels = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

const mix = (from: string, to: string, t: number) => {
  const a = channels(from);
  const b = channels(to);

  const out = a.map((v, i) =>
    Math.round(v + ((b[i] ?? v) - v) * t)
      .toString(16)
      .padStart(2, "0"),
  );

  return `#${out.join("")}`;
};

const derive = (paper: string, ink: string) => {
  const muted = mix(ink, paper, 0.52);

  const palette: Palette = {
    dark: {
      bg: ink,
      faint: mix(ink, paper, 0.23),
      ink: paper,
      ladder: [paper, mix(ink, paper, 0.8), mix(ink, paper, 0.56), mix(ink, paper, 0.3)],
      muted,
    },
    faint: mix(ink, paper, 0.78),
    ink,
    ladder: [ink, mix(ink, paper, 0.22), muted, mix(ink, paper, 0.69), mix(ink, paper, 0.85)],
    muted,
    paper,
    tint: `${ink}8c`,
  };

  return palette;
};

const INK_ON_PAPER: Palette = {
  dark: {
    bg: "#1b1b19",
    faint: "#4c4b45",
    ink: "#f1f0ec",
    ladder: ["#f1f0ec", "#c7c6be", "#93928b", "#5c5b54"],
    muted: "#8b8a84",
  },
  faint: "#c2c1bb",
  ink: "#1b1b19",
  ladder: ["#1b1b19", "#4a4943", "#8b8a84", "#aeada7", "#d0cfc9"],
  muted: "#8b8a84",
  paper: "#f1f0ec",
  tint: "rgba(27,27,25,0.55)",
};

export const PALETTES = {
  blueprint: derive("#e8eef5", "#1d3557"),
  inverted: derive("#18181a", "#ecebe6"),
  ink: INK_ON_PAPER,
  redInk: derive("#f4efe6", "#7a1f12"),
  sepia: derive("#f3e9d8", "#3b2a1a"),
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof PALETTES;

export const SPRING: ChartMotionSpringTransition = {
  damping: 22,
  mass: 1,
  stiffness: 170,
  type: "spring",
};
