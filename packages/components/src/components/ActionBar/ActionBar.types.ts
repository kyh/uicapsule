import React from "react";
import type * as G from "types/global";

export type Props = {
  position?: "top" | "bottom";
  size?: "medium" | "large";
  children?: React.ReactNode;
  className?: G.ClassName;
  attributes?: G.Attributes<"div", Props>;
};
