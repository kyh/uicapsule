"use client";

import * as React from "react";
import { cn } from "@repo/ui/utils";
import { AnimatePresence, motion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      "bg-muted text-muted-foreground inline-flex h-9 items-center justify-center rounded-lg p-1",
      className,
    )}
    {...props}
  />
);

export const TabsTrigger = ({
  className,
  isSelected,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  isSelected?: boolean;
}) => {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "ring-offset-background focus-visible:ring-ring data-[state=active]:text-foreground relative inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <AnimatePresence initial={false}>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-background pointer-events-none absolute inset-0 rounded-md shadow-sm"
            layoutId="selected-indicator"
          />
        )}
      </AnimatePresence>
      <div className="relative">{children}</div>
    </TabsPrimitive.Trigger>
  );
};

export const TabsContent = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content
    className={cn(
      "ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
      className,
    )}
    {...props}
  />
);
