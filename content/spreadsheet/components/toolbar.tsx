"use client";

import { type ComponentProps } from "react";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

export type ToolbarProps = ComponentProps<"div">;

export const Toolbar = ({ className, ...props }: ToolbarProps) => (
  <div className={cn("flex items-center gap-2 p-2", className)} {...props} />
);

export type ToolbarButtonProps = ComponentProps<typeof Button>;

export const ToolbarButton = (props: ToolbarButtonProps) => (
  <Button size="sm" variant="outline" {...props} />
);
