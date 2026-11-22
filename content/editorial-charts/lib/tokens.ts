export const PAPER = "#f1f0ec";
export const INK = "#1b1b19";
export const MUTED = "#8b8a84";
export const FAINT = "#c2c1bb";
export const HAIR = "#dbdad3";

export const LADDER = ["#1b1b19", "#4a4943", "#8b8a84", "#aeada7", "#d0cfc9"] as const;

export const DARK = {
  bg: "#1b1b19",
  faint: "#4c4b45",
  ink: "#f1f0ec",
  ladder: ["#f1f0ec", "#c7c6be", "#93928b", "#5c5b54"] as const,
  muted: "#8b8a84",
};

export const SPRING = {
  damping: 22,
  mass: 1,
  stiffness: 170,
  type: "spring",
} as const;
