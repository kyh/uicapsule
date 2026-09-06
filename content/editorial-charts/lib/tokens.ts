// Editorial mono tokens — paper ground, charcoal ink, lightness IS the data.
// Inspired by print-editorial data graphics; values are our own.

export const PAPER = "#f1f0ec";
export const INK = "#1b1b19";
export const MUTED = "#8b8a84";
export const FAINT = "#c2c1bb";
export const HAIR = "#dbdad3";

// Ink ladder for multi-series work: most important = darkest.
export const LADDER = ["#1b1b19", "#4a4943", "#8b8a84", "#aeada7", "#d0cfc9"] as const;

// Dark card: ink becomes paper, ladder runs bright → dim.
export const DARK = {
  bg: "#1b1b19",
  ink: "#f1f0ec",
  muted: "#8b8a84",
  faint: "#4c4b45",
  ladder: ["#f1f0ec", "#c7c6be", "#93928b", "#5c5b54"] as const,
};

// One spring for the whole set — quick in, no bounce to speak of.
export const SPRING = {
  type: "spring",
  stiffness: 170,
  damping: 22,
  mass: 1,
} as const;
