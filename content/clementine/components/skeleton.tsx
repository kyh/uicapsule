import type { CSSProperties } from "react";

import "./skeleton.css";

export const Skeleton = ({
  width,
  height = 14,
  round = false,
}: {
  width: string | number;
  height?: number;
  round?: boolean;
}) => (
  <span
    aria-hidden
    className="cl-skeleton"
    data-round={round || undefined}
    style={{ height, width } satisfies CSSProperties}
  />
);
