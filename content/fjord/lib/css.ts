import type { CSSProperties } from "react";

type CustomProperties = Partial<Record<`--fj-${string}`, string | number>>;

/** Sets Fjord custom properties inline, typed so only --fj-* names pass. */
export const cssVars = (vars: CustomProperties) => {
  const style: CSSProperties = { ...vars };

  return style;
};
