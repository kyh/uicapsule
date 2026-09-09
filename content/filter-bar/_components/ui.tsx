"use client";

import type { ComponentProps } from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "cn";
import { CheckIcon, SearchIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import "../filter-bar.css";

type Styled<Props> = Omit<Props, "className"> & { className?: string };

export const Button = ({
  className,
  variant = "default",
  size = "default",
  ...props
}: Styled<ButtonPrimitive.Props> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}) => (
  <ButtonPrimitive
    className={cn(
      "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-(--ring) disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
      variant === "default" && "bg-(--primary) text-(--primary-foreground) hover:bg-(--primary)/80",
      variant === "outline" && "border border-(--border) bg-(--background) hover:bg-(--muted)",
      variant === "ghost" && "hover:bg-(--muted) aria-expanded:bg-(--muted)",
      size === "default" && "h-9 px-4 py-2",
      size === "sm" && "h-8 px-2.5",
      size === "icon" && "size-9",
      className,
    )}
    {...props}
  />
);

export const Input = ({ className, ...props }: ComponentProps<"input">) => (
  <input
    className={cn(
      "h-9 w-full min-w-0 rounded-md border border-(--input) bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--ring) disabled:opacity-50",
      className,
    )}
    {...props}
  />
);

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverContent = ({
  className,
  align = "center",
  side = "bottom",
  ...props
}: Styled<PopoverPrimitive.Popup.Props> &
  Pick<PopoverPrimitive.Positioner.Props, "align" | "side">) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Positioner
      align={align}
      side={side}
      sideOffset={4}
      className="filter-bar isolate z-50"
    >
      <PopoverPrimitive.Popup
        className={cn(
          "flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-md bg-(--popover) p-4 text-sm text-(--popover-foreground) shadow-md ring-1 ring-(--foreground)/10 outline-none",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Positioner>
  </PopoverPrimitive.Portal>
);

export const Checkbox = ({ className, ...props }: Styled<CheckboxPrimitive.Root.Props>) => (
  <CheckboxPrimitive.Root
    className={cn(
      "relative size-[15px] shrink-0 rounded-[5px] border-[1.5px] border-(--input) outline-none focus-visible:ring-2 focus-visible:ring-(--ring) data-checked:border-transparent",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="absolute inset-0 grid place-content-center text-(--primary)">
      <CheckIcon className="size-4" strokeWidth={2.5} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);

export const Separator = ({
  className,
  orientation = "horizontal",
  ...props
}: Styled<SeparatorPrimitive.Props>) => (
  <SeparatorPrimitive
    orientation={orientation}
    className={cn(
      "shrink-0 bg-(--border) data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
      className,
    )}
    {...props}
  />
);

export const Command = ({ className, ...props }: ComponentProps<typeof CommandPrimitive>) => (
  <CommandPrimitive
    className={cn(
      "flex size-full flex-col overflow-hidden rounded-xl bg-(--popover) p-1 text-(--popover-foreground)",
      className,
    )}
    {...props}
  />
);

export const CommandInput = ({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) => (
  <div className="relative m-1 flex h-8 items-center gap-2 rounded-lg border border-(--input)/30 bg-(--input)/30 px-2">
    <SearchIcon className="size-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      aria-label="Search filters"
      className={cn("w-full bg-transparent text-sm outline-none disabled:opacity-50", className)}
      {...props}
    />
  </div>
);

export const CommandList = ({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.List>) => (
  <CommandPrimitive.List
    className={cn("max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none", className)}
    {...props}
  />
);

export const CommandEmpty = ({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Empty>) => (
  <CommandPrimitive.Empty className={cn("py-6 text-center text-sm", className)} {...props} />
);

export const CommandGroup = ({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) => (
  <CommandPrimitive.Group
    className={cn(
      "overflow-hidden p-1 text-(--foreground) **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:text-(--muted-foreground)",
      className,
    )}
    {...props}
  />
);

export const CommandItem = ({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Item>) => (
  <CommandPrimitive.Item
    className={cn(
      "group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-(--muted) [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    {...props}
  />
);

export const CommandSeparator = ({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) => (
  <CommandPrimitive.Separator className={cn("-mx-1 h-px bg-(--border)", className)} {...props} />
);

export const Slider = ({ className, value, ...props }: Styled<SliderPrimitive.Root.Props>) => {
  const count = Array.isArray(value) ? value.length : 1;
  return (
    <SliderPrimitive.Root
      value={value}
      className={cn("relative flex w-full touch-none items-center select-none", className)}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full items-center">
        <SliderPrimitive.Track className="relative h-1.5 w-full rounded-full bg-(--muted)">
          <SliderPrimitive.Indicator className="rounded-full bg-(--primary)" />
        </SliderPrimitive.Track>
        {Array.from({ length: count }, (_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            index={index}
            className="block size-4 rounded-full border border-(--primary) bg-(--background) shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-(--primary)/30"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
};

export const Tabs = ({ className, ...props }: Styled<TabsPrimitive.Root.Props>) => (
  <TabsPrimitive.Root className={cn("flex flex-col gap-2", className)} {...props} />
);

export const TabsList = ({ className, ...props }: Styled<TabsPrimitive.List.Props>) => (
  <TabsPrimitive.List
    className={cn(
      "inline-flex h-9 w-fit items-center justify-center rounded-lg bg-(--muted) p-[3px] text-(--muted-foreground)",
      className,
    )}
    {...props}
  />
);

export const TabsTrigger = ({ className, ...props }: Styled<TabsPrimitive.Tab.Props>) => (
  <TabsPrimitive.Tab
    className={cn(
      "inline-flex h-full flex-1 items-center justify-center rounded-md px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--ring) data-active:bg-(--background) data-active:text-(--foreground)",
      className,
    )}
    {...props}
  />
);

export const TabsContent = ({ className, ...props }: Styled<TabsPrimitive.Panel.Props>) => (
  <TabsPrimitive.Panel className={cn("flex-1 outline-none", className)} {...props} />
);

export const Calendar = (props: ComponentProps<typeof DayPicker>) => (
  <DayPicker showOutsideDays className="filter-bar-calendar p-3" {...props} />
);
