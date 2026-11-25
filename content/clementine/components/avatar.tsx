import { cx } from "../lib/cx";

import "./avatar.css";

export const Avatar = ({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <span aria-hidden className={cx("cl-avatar", className)} data-size={size}>
      {initials}
    </span>
  );
};
