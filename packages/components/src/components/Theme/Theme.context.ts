import { createContext } from "react";
import type * as T from "./Theme.types";

/* Context used to store data responsible for switching between modes of a theme */
export const ThemeContext = createContext<T.ThemeContextData>({
  theme: "",
  colorMode: "light",
});

/* Context used to globally define mode, used only within the library */
export const GlobalColorModeContext =
  createContext<T.GlobalColorModeContextData>({
    mode: "light",
    setMode: () => {},
    invertMode: () => {},
  });
