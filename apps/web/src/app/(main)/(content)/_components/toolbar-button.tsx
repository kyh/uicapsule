"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { cn } from "cn";

type ToolbarButtonProps = Omit<ComponentProps<typeof Button>, "children"> & {
  label: string;
  pressed?: boolean;
  side?: "top" | "bottom";
  children: ReactNode;
};

export const ToolbarButton = ({
  label,
  pressed,
  side = "bottom",
  className,
  children,
  ...props
}: ToolbarButtonProps) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={pressed}
          className={cn(
            "text-muted-foreground hover:text-foreground size-7 rounded-md [&_svg:not([class*='size-'])]:size-4",
            pressed && "bg-accent text-foreground",
            className,
          )}
          {...props}
        />
      }
    >
      {children}
    </TooltipTrigger>
    <TooltipContent side={side}>{label}</TooltipContent>
  </Tooltip>
);
