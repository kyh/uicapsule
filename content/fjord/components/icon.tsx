import type { LucideIcon } from "lucide-react";

interface IconProps {
  icon: LucideIcon;
  size?: 12 | 16 | 20;
  label?: string;
}

/** The one way Fjord draws a glyph: ink, one stroke, hidden from screen readers unless named. */
export const Icon = ({ icon: Glyph, size = 16, label }: IconProps) => (
  <Glyph
    aria-hidden={label ? undefined : true}
    aria-label={label}
    className="fj-icon"
    data-size={size}
    focusable="false"
    role={label ? "img" : undefined}
    strokeWidth={1.75}
  />
);
