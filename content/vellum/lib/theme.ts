"use client";

import { createContext, useContext } from "react";

export type Theme = "light" | "dark";

export const ThemeContext = createContext<Theme>("light");

/** The theme the showcase is drawn in, so token tables print the matching value. */
export const useTheme = () => useContext(ThemeContext);
