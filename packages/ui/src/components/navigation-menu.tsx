"use client";

import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";

import { cn } from "cn";

const NavigationMenu = ({ className, ...props }: NavigationMenuPrimitive.Root.Props) => (
  <NavigationMenuPrimitive.Root
    data-slot="navigation-menu"
    className={cn("relative", className)}
    {...props}
  />
);

const NavigationMenuList = ({ className, ...props }: NavigationMenuPrimitive.List.Props) => (
  <NavigationMenuPrimitive.List
    data-slot="navigation-menu-list"
    className={cn("flex items-center gap-3", className)}
    {...props}
  />
);

const NavigationMenuItem = ({ ...props }: NavigationMenuPrimitive.Item.Props) => (
  <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" {...props} />
);

const NavigationMenuTrigger = ({ ...props }: NavigationMenuPrimitive.Trigger.Props) => (
  <NavigationMenuPrimitive.Trigger data-slot="navigation-menu-trigger" {...props} />
);

const NavigationMenuContent = ({ className, ...props }: NavigationMenuPrimitive.Content.Props) => (
  <NavigationMenuPrimitive.Content
    data-slot="navigation-menu-content"
    className={cn(
      "h-full transition-[opacity,translate,filter] duration-200 ease-out",
      // Exiting content overlays the incoming content instead of stacking below it.
      "data-ending-style:absolute data-ending-style:inset-x-0 data-ending-style:top-0",
      "data-starting-style:opacity-0 data-ending-style:opacity-0",
      "data-starting-style:blur-xs data-ending-style:blur-xs",
      "data-starting-style:data-[activation-direction=left]:-translate-x-1/2",
      "data-starting-style:data-[activation-direction=right]:translate-x-1/2",
      "data-ending-style:data-[activation-direction=left]:translate-x-1/2",
      "data-ending-style:data-[activation-direction=right]:-translate-x-1/2",
      className,
    )}
    {...props}
  />
);

const NavigationMenuPortal = ({ ...props }: NavigationMenuPrimitive.Portal.Props) => (
  <NavigationMenuPrimitive.Portal data-slot="navigation-menu-portal" {...props} />
);

const NavigationMenuPositioner = ({
  className,
  ...props
}: NavigationMenuPrimitive.Positioner.Props) => (
  <NavigationMenuPrimitive.Positioner
    data-slot="navigation-menu-positioner"
    align="start"
    sideOffset={4}
    collisionPadding={8}
    className={cn(
      "z-50 transition-[top,left] duration-200 ease-out data-instant:transition-none",
      className,
    )}
    {...props}
  />
);

/** Popup that morphs (position + size) between sibling triggers' contents. */
const NavigationMenuPopup = ({ className, ...props }: NavigationMenuPrimitive.Popup.Props) => (
  <NavigationMenuPrimitive.Popup
    data-slot="navigation-menu-popup"
    className={cn(
      "relative flex h-(--popup-height) w-(--popup-width) origin-(--transform-origin) flex-col overflow-hidden rounded-md bg-popover text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 transition-[width,height,opacity,scale] duration-200 ease-out outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
      className,
    )}
    {...props}
  />
);

const NavigationMenuViewport = ({
  className,
  ...props
}: NavigationMenuPrimitive.Viewport.Props) => (
  <NavigationMenuPrimitive.Viewport
    data-slot="navigation-menu-viewport"
    className={cn("relative w-full flex-1 overflow-hidden", className)}
    {...props}
  />
);

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuPortal,
  NavigationMenuPositioner,
  NavigationMenuPopup,
  NavigationMenuViewport,
};
