import type { CSSProperties } from "react";

interface CSSVarProperties extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

/** Types an inline style object that sets CSS custom properties alongside regular ones. */
export const cssVars = (style: CSSVarProperties) => style;
