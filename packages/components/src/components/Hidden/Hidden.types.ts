import React from "react";
import type * as G from "types/global";

export type Props = {
  hide?: G.Responsive<boolean>;
  visibility?: boolean;
  as?: keyof JSX.IntrinsicElements;
  displayStyle?: "inline" | "flex";
  /** @deprecated Use displayStyle instead */
  inline?: boolean;
  children: ((className: string) => React.ReactNode) | React.ReactNode;
};
