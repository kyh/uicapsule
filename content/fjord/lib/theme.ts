import { createContext, useContext } from "react";

export type Theme = "light" | "dark";

export interface Appearance {
  theme: Theme;
  focusHue: number;
  reducedMotion: boolean;
}

export const AppearanceContext = createContext<Appearance>({
  focusHue: 244,
  reducedMotion: false,
  theme: "light",
});

export const useAppearance = () => useContext(AppearanceContext);
