"use client";

import React from "react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/utils";

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 p-2", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
Toolbar.displayName = "Toolbar";

type ToolbarButtonProps = React.ComponentProps<typeof Button>;

export const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps
>(({ children, className, ...props }, ref) => (
  <Button
    ref={ref}
    size="sm"
    variant="outline"
    className={cn(className)}
    {...props}
  >
    {children}
  </Button>
));
ToolbarButton.displayName = "ToolbarButton";
