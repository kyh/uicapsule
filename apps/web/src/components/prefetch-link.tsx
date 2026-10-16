"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import Link from "next/link";

type PrefetchLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

/**
 * A `Link` for big grids of links to one dynamic route. Before intent it keeps the
 * default prefetch (the route's shared App Shell, one request however many cards);
 * hover, focus or touch upgrades it to `prefetch={true}`, which also resolves that
 * card's cached per-slug content. Viewport `prefetch={true}` would cost a request per
 * visible card.
 */
export const PrefetchLink = ({
  onFocus,
  onMouseEnter,
  onTouchStart,
  ...props
}: PrefetchLinkProps) => {
  const [intent, setIntent] = useState(false);
  return (
    <Link
      {...props}
      prefetch={intent ? true : "auto"}
      onFocus={(event) => {
        setIntent(true);
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        setIntent(true);
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        setIntent(true);
        onTouchStart?.(event);
      }}
    />
  );
};
