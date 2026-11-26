import type { LucideIcon } from "lucide-react";

interface IconProps {
  icon: LucideIcon;
  size?: 14 | 16 | 20 | 24 | 32;
  label?: string;
  className?: string;
}

/** Renders a Lucide glyph with flat caps, mitred joins and a 1.5px absolute stroke. */
export const Icon = ({ icon: Glyph, size = 16, label, className }: IconProps) => (
  <Glyph
    absoluteStrokeWidth
    aria-hidden={label !== undefined && label !== "" ? undefined : true}
    aria-label={label}
    className={className}
    focusable="false"
    role={label !== undefined && label !== "" ? "img" : undefined}
    size={size}
    strokeLinecap="square"
    strokeLinejoin="miter"
    strokeWidth={1.5}
  />
);
