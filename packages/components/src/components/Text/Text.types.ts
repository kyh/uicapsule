import React from "react";
import type * as G from "types/global";

export type Props<TagName extends keyof JSX.IntrinsicElements | void = void> = {
  variant?:
    | "display-1"
    | "display-2"
    | "display-3"
    | "title-1"
    | "title-2"
    | "title-3"
    | "featured-1"
    | "featured-2"
    | "featured-3"
    | "body-strong-1"
    | "body-strong-2"
    | "body-medium-1"
    | "body-medium-2"
    | "body-1"
    | "body-2"
    | "caption-1"
    | "caption-2";
  color?:
    | "neutral"
    | "neutral-faded"
    | "critical"
    | "positive"
    | "primary"
    | "disabled";
  align?: G.Responsive<"start" | "center" | "end">;
  decoration?: "line-through";
  maxLines?: number;
  as?: TagName;
  children?: React.ReactNode;
  className?: G.ClassName;
  attributes?: G.Attributes<TagName>;
};
