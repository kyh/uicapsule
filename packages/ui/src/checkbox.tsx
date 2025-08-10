"use client";

import * as React from "react";
import { cn } from "@repo/ui/utils";
import { motion, useMotionValue, useTransform } from "motion/react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

export const Checkbox = ({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) => {
  const pathLength = useMotionValue(props.checked ? 1 : 0);
  const strokeLinecap = useTransform(() =>
    pathLength.get() === 0 ? "none" : "round",
  );
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "border-border focus-visible:ring-ring size-4 shrink-0 rounded-sm border shadow-sm focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <svg
        className="size-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <motion.path
          d="M4 12L10 18L20 6"
          animate={{ pathLength: props.checked ? 1 : 0 }}
          transition={{
            type: "spring",
            bounce: 0,
            duration: props.checked ? 0.3 : 0.1,
          }}
          style={{
            pathLength,
            strokeLinecap,
          }}
        />
      </svg>
    </CheckboxPrimitive.Root>
  );
};
