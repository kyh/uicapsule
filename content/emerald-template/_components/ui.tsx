import type { ComponentProps } from "react";
import { cn } from "cn";

export const Button = ({ className, ...props }: ComponentProps<"button">) => (
  <button
    type="button"
    className={cn(
      "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium outline-none transition-colors hover:bg-(--muted) focus-visible:ring-2 focus-visible:ring-(--ring) disabled:opacity-50",
      className,
    )}
    {...props}
  />
);

export const Badge = ({ className, ...props }: ComponentProps<"span">) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full bg-(--primary) px-2 py-0.5 text-xs font-medium text-(--primary-foreground)",
      className,
    )}
    {...props}
  />
);
