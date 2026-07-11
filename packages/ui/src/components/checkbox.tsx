"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "@repo/ui/lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer group/checkbox relative size-[15px] shrink-0 rounded-[5px] border-[1.5px] border-input transition-colors outline-none",
        // Invisible hit-area extension for comfortable clicking in form rows.
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50 group-has-disabled/field:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        // Highlighted row (cmdk) or direct hover previews a stronger border.
        "hover:border-muted-foreground/60 group-data-selected/command-item:border-muted-foreground/60",
        // Checked: the border disappears and only the drawn check remains.
        "data-checked:border-transparent",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        keepMounted
        className="absolute inset-0 grid place-content-center text-primary"
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* pathLength=1 normalizes the dash range so dashoffset 1→0 draws the check. */}
          <path
            d="M6 12L10 16L18 8"
            pathLength={1}
            className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-150 ease-out group-data-checked/checkbox:[stroke-dashoffset:0]"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
