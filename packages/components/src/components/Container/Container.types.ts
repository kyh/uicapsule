import React from "react";
import type * as G from "types/global";

export type Props = {
  padding?: G.Responsive<number>;
  width?: G.Responsive<string>;
  children?: React.ReactNode;
  className?: G.ClassName;
  attributes?: G.Attributes<"div">;
};
