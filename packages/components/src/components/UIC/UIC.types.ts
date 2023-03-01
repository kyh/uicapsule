import type React from "react";
import type {
  GlobalColorModeProps,
  ThemeProviderProps,
} from "components/Theme";
import type { ToastProviderProps } from "components/Toast";
import type * as G from "types/global";

export type Props = {
  children?: React.ReactNode;
  defaultRTL?: boolean;
  defaultColorMode?: GlobalColorModeProps["defaultMode"];
  defaultViewport?: G.Viewport;
  className?: G.ClassName;
  theme?: NonNullable<ThemeProviderProps["theme"]>;
  defaultTheme?: NonNullable<ThemeProviderProps["defaultTheme"]>;
  toastOptions?: ToastProviderProps["options"];
};
