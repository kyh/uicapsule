"use client";

import { createContext, useContext } from "react";

export type Theme = "light" | "dark";

export type Density = "compact" | "default" | "comfortable";

/** Control and row heights in px for each density, mirroring the `[data-density]` blocks in tokens.css. */
export const DENSITY = {
  comfortable: { lg: 40, md: 36, row: 40, sm: 30 },
  compact: { lg: 32, md: 28, row: 32, sm: 22 },
  default: { lg: 36, md: 32, row: 36, sm: 26 },
} as const;

/** The knobs the showcase is drawn with, so printed specs match what is on screen. */
export interface Settings {
  theme: Theme;
  density: Density;
  radiusScale: number;
  monoScale: number;
}

export const SettingsContext = createContext<Settings>({
  density: "default",
  monoScale: 0.8,
  radiusScale: 1,
  theme: "light",
});

/** The current theme, density, radius and mono scale. */
export const useSettings = () => useContext(SettingsContext);

/** The current theme, so token tables print the matching value. */
export const useTheme = () => useContext(SettingsContext).theme;

/** Formats a px figure to at most one decimal, as the specs print it. */
export const figure = (value: number) => String(Math.round(value * 10) / 10);

/** The scaled radii in px, mirroring tokens.css; the pill never scales. */
export const radii = (scale: number) => ({
  mark: 2 * scale,
  overlay: 10 * scale,
  panel: Math.max(0, 14 * scale - 3),
  shell: 14 * scale,
  tag: 6 * scale,
});
