import { cx } from "../lib/cx";

/** Four small squares with one lit, stepping clockwise. Halogen's only repeating motion. */
export const Pending = ({ className, label }: { className?: string; label?: string }) => (
  <span
    aria-hidden={label ? undefined : true}
    aria-label={label}
    className={cx("hx-pending", className)}
    role={label ? "img" : undefined}
  >
    <span />
    <span />
    <span />
    <span />
  </span>
);
