"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import type { ComponentProps } from "react";

import { cn } from "cn";

const Drawer = ({ ...props }: DrawerPrimitive.Root.Props) => (
  <DrawerPrimitive.Root data-slot="drawer" {...props} />
);

const DrawerTrigger = ({ ...props }: DrawerPrimitive.Trigger.Props) => (
  <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
);

const DrawerPortal = ({ ...props }: DrawerPrimitive.Portal.Props) => (
  <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
);

const DrawerClose = ({ ...props }: DrawerPrimitive.Close.Props) => (
  <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
);

const DrawerOverlay = ({ className, ...props }: DrawerPrimitive.Backdrop.Props) => (
  <DrawerPrimitive.Backdrop
    data-slot="drawer-overlay"
    className={cn(
      "fixed inset-0 z-50 min-h-dvh bg-black/10 opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] supports-backdrop-filter:backdrop-blur-xs data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:opacity-0 data-swiping:duration-0",
      className,
    )}
    {...props}
  />
);

// Bottom/top sheets span the viewport edge; side sheets float inset with a shadow. Each side's
// closed transform clears its inset so the panel fully leaves the screen. Base UI renders a
// backdrop only for the outermost drawer, so a nested viewport paints its own to dim the parent.
const DrawerContent = ({ className, children, ...props }: DrawerPrimitive.Popup.Props) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Viewport
      data-slot="drawer-viewport"
      className="fixed inset-0 z-50 data-nested:before:fixed data-nested:before:inset-0 data-nested:before:bg-black/10 data-nested:before:transition-opacity data-nested:before:duration-450 data-nested:before:ease-[cubic-bezier(0.32,0.72,0,1)] data-nested:supports-backdrop-filter:before:backdrop-blur-xs data-nested:data-ending-style:before:opacity-0 data-nested:data-starting-style:before:opacity-0"
    >
      <DrawerPrimitive.Popup
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col bg-popover text-sm text-popover-foreground outline-none transition-transform duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-swiping:duration-0 data-swiping:select-none",
          "data-[swipe-direction=down]:inset-x-0 data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:mt-24 data-[swipe-direction=down]:max-h-[80vh] data-[swipe-direction=down]:translate-y-(--drawer-swipe-movement-y) data-[swipe-direction=down]:rounded-t-xl data-[swipe-direction=down]:border-t data-[swipe-direction=down]:data-starting-style:translate-y-full data-[swipe-direction=down]:data-ending-style:translate-y-full",
          "data-[swipe-direction=up]:inset-x-0 data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:mb-24 data-[swipe-direction=up]:max-h-[80vh] data-[swipe-direction=up]:translate-y-(--drawer-swipe-movement-y) data-[swipe-direction=up]:rounded-b-xl data-[swipe-direction=up]:border-b data-[swipe-direction=up]:data-starting-style:-translate-y-full data-[swipe-direction=up]:data-ending-style:-translate-y-full",
          "data-[swipe-direction=left]:inset-y-2 data-[swipe-direction=left]:left-2 data-[swipe-direction=left]:w-3/4 data-[swipe-direction=left]:translate-x-(--drawer-swipe-movement-x) data-[swipe-direction=left]:rounded-xl data-[swipe-direction=left]:border data-[swipe-direction=left]:shadow-lg data-[swipe-direction=left]:data-starting-style:translate-x-[calc(-100%-0.5rem-2px)] data-[swipe-direction=left]:data-ending-style:translate-x-[calc(-100%-0.5rem-2px)] data-[swipe-direction=left]:sm:max-w-sm",
          "data-[swipe-direction=right]:inset-y-2 data-[swipe-direction=right]:right-2 data-[swipe-direction=right]:w-3/4 data-[swipe-direction=right]:translate-x-(--drawer-swipe-movement-x) data-[swipe-direction=right]:rounded-xl data-[swipe-direction=right]:border data-[swipe-direction=right]:shadow-lg data-[swipe-direction=right]:data-starting-style:translate-x-[calc(100%+0.5rem+2px)] data-[swipe-direction=right]:data-ending-style:translate-x-[calc(100%+0.5rem+2px)] data-[swipe-direction=right]:sm:max-w-sm",
          "data-[swipe-direction=left]:[&_[data-slot=card]]:border-0 data-[swipe-direction=left]:[&_[data-slot=card]]:bg-transparent data-[swipe-direction=right]:[&_[data-slot=card]]:border-0 data-[swipe-direction=right]:[&_[data-slot=card]]:bg-transparent",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mt-4 hidden h-1.5 w-[100px] shrink-0 rounded-full bg-muted group-data-[swipe-direction=down]/drawer-content:block" />
        <DrawerPrimitive.Content className="contents">{children}</DrawerPrimitive.Content>
      </DrawerPrimitive.Popup>
    </DrawerPrimitive.Viewport>
  </DrawerPortal>
);

const DrawerHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="drawer-header"
    className={cn(
      "flex flex-col gap-0.5 p-4 group-data-[swipe-direction=down]/drawer-content:text-center group-data-[swipe-direction=up]/drawer-content:text-center md:gap-1.5 md:text-left",
      className,
    )}
    {...props}
  />
);

const DrawerFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="drawer-footer"
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
);

const DrawerTitle = ({ className, ...props }: DrawerPrimitive.Title.Props) => (
  <DrawerPrimitive.Title
    data-slot="drawer-title"
    className={cn("font-heading font-medium text-foreground", className)}
    {...props}
  />
);

const DrawerDescription = ({ className, ...props }: DrawerPrimitive.Description.Props) => (
  <DrawerPrimitive.Description
    data-slot="drawer-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
