"use client";

import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";

/** A short label for an icon control, after a 400ms rest; never the only way to the info. */
export const Tooltip = ({
  content,
  render,
}: {
  content: ReactNode;
  render: (props: { "aria-describedby": string }) => ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();

  const show = (delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setOpen(true);
    }, delay);
  };

  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <span
      className="v-anchor"
      onBlur={hide}
      onFocus={() => {
        show(0);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          hide();
        }
      }}
      onPointerEnter={() => {
        show(400);
      }}
      onPointerLeave={hide}
      role="presentation"
    >
      {render({ "aria-describedby": id })}
      <span className="v-tooltip" data-open={open ? "" : undefined} id={id} role="tooltip">
        {content}
      </span>
    </span>
  );
};
