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
  className?: G.ClassName;
  theme: NonNullable<ThemeProviderProps["theme"]>;
  toastOptions?: ToastProviderProps["options"];
};
