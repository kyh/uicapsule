import { useCallback, useId, useMemo, useRef } from "react";
import type { ReactNode } from "react";

import { useDismiss } from "../lib/use-dismiss";
import type { DismissReason } from "../lib/use-dismiss";

import "./popover.css";

export interface TriggerProps {
  "aria-expanded": boolean;
  "aria-controls": string;
  onClick: () => void;
}

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: (props: TriggerProps) => ReactNode;
  title: string;
  children: ReactNode;
  align?: "start" | "end";
}

export const Popover = ({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  align = "start",
}: PopoverProps) => {
  const wrap = useRef<HTMLDivElement>(null);
  const id = useId();

  const close = useCallback(
    (reason: DismissReason) => {
      onOpenChange(false);

      if (reason === "escape") {
        wrap.current?.querySelector<HTMLElement>("[aria-controls]")?.focus();
      }
    },
    [onOpenChange],
  );

  const refs = useMemo(() => [wrap], []);

  useDismiss(open, close, refs);

  return (
    <div className="cl-anchor" ref={wrap}>
      {trigger({
        "aria-controls": id,
        "aria-expanded": open,
        onClick: () => {
          onOpenChange(!open);
        },
      })}
      <dialog
        aria-label={title}
        className="cl-popover"
        data-align={align}
        data-open={open || undefined}
        id={id}
        inert={!open}
        open
      >
        {children}
      </dialog>
    </div>
  );
};
