import React from "react";
import type * as G from "types/global";

export type Props = {
  svg: React.ReactElement | React.ComponentType;
  size?: G.Responsive<number | string>;
  color?: "neutral-faded" | "positive" | "critical" | "primary";
  autoWidth?: boolean;
  className?: G.ClassName;
  attributes?: G.Attributes<"span", Props>;
};
