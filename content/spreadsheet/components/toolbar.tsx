"use client";

import { forwardRef, type ComponentProps, type HTMLAttributes, type ReactNode } from "react";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-2 p-2", className)} {...props}>
      {children}
    </div>
  ),
);
Toolbar.displayName = "Toolbar";

type ToolbarButtonProps = ComponentProps<typeof Button>;

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ children, className, ...props }, ref) => (
    <Button ref={ref} size="sm" variant="outline" className={cn(className)} {...props}>
      {children}
    </Button>
  ),
);
ToolbarButton.displayName = "ToolbarButton";
