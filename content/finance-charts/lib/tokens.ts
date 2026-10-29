// Light fintech tokens: white cards on a pale ground, near-black ink, one
// saturated accent per card.

export const INK = "#0b0b0f";
export const MUTED = "#8a8a93";
export const FAINT = "#c4c4cb";
export const GRID = "#ececf0";
export const TRACK = "#efeff2";
export const CARD = "#ffffff";

export const GREEN = "#16a34a";
export const GREEN_SOFT = "#22c55e";
export const RED = "#ef4444";
export const ORANGE = "#f97316";
export const BLUE = "#1d7cf2";
export const SKY = "#38bdf8";
export const PURPLE = "#a855f7";
export const VIOLET = "#7c3aed";
export const YELLOW = "#fbbf24";
export const PINK = "#ec4899";
export const TEAL = "#14b8a6";

// One spring for every chart and card: quick in, a hint of settle.
export const SPRING = {
  damping: 22,
  mass: 1,
  stiffness: 170,
  type: "spring",
} as const;

export const THEME = {
  background: CARD,
  foreground: INK,
  grid: GRID,
  muted: MUTED,
  palette: [BLUE, PURPLE, ORANGE, GREEN, YELLOW, PINK, TEAL],
};

/** Dashed horizontal grid rules, the house style for value axes. */
export const DASHED_GRID = { stroke: GRID, strokeDasharray: "4 4", strokeWidth: 1 } as const;
