import type * as G from "types/global";

export type Props = {
  size?: G.Responsive<"small" | "medium">;
  color?: "inherit";
  className?: G.ClassName;
  attributes?: G.Attributes<"span", Props>;
};
