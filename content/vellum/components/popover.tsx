"use client";

import { useId, useRef } from "react";
import type { ReactNode } from "react";

import { useDismiss } from "../lib/hooks";

/** A small anchored panel, opened and closed through open and onOpenChange. */
export const Popover = ({
  open,
  onOpenChange,
  renderTrigger,
  title,
  children,
  align = "start",
  side = "bottom",
  width = 288,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renderTrigger: (props: {
    "aria-expanded": boolean;
    "aria-controls": string;
    onClick: () => void;
  }) => ReactNode;
  title: string;
  children: ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
  width?: number;
}) => {
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useDismiss(root, open, () => {
    onOpenChange(false);
  });

  return (
    <div className="v-anchor" ref={root}>
      {renderTrigger({
        "aria-controls": id,
        "aria-expanded": open,
        onClick: () => {
          onOpenChange(!open);
        },
      })}
      <dialog
        aria-label={title}
        className="v-pop v-overlay"
        data-align={align}
        data-open={open ? "" : undefined}
        data-side={side}
        id={id}
        open
        data-padded=""
        style={{ width: `min(${width}px, calc(100vw - 32px))` }}
      >
        {children}
      </dialog>
    </div>
  );
};
