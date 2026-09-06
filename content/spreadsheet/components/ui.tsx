"use client";

import type { ComponentProps } from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";
import "../spreadsheet.css";

type Styled<Props> = Omit<Props, "className"> & { className?: string };

export function Button({
  className,
  variant = "outline",
  size = "sm",
  ...props
}: Styled<ButtonPrimitive.Props> & {
  variant?: "outline" | "ghost";
  size?: "sm" | "icon";
}) {
  return (
    <ButtonPrimitive
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-medium outline-none transition-colors hover:bg-(--muted) focus-visible:ring-2 focus-visible:ring-(--ring) disabled:opacity-50",
        variant === "outline" && "border border-(--border) bg-(--background) shadow-xs",
        size === "sm" ? "h-8 px-2.5" : "size-9",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-(--input) bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--ring)",
        className,
      )}
      {...props}
    />
  );
}

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;

export function DropdownMenuContent({
  className,
  align = "start",
  ...props
}: Styled<Menu.Popup.Props> & Pick<Menu.Positioner.Props, "align">) {
  return (
    <Menu.Portal>
      <Menu.Positioner align={align} sideOffset={4} className="spreadsheet isolate z-50">
        <Menu.Popup
          className={cn(
            "min-w-32 rounded-md bg-(--popover) p-1 text-(--popover-foreground) shadow-md ring-1 ring-(--foreground)/10 outline-none",
            className,
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: Styled<Menu.Item.Props>) {
  return (
    <Menu.Item
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-(--accent) data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
