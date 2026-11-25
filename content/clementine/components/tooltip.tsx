import { useEffect, useId, useState } from "react";
import type { KeyboardEvent, ReactElement, ReactNode } from "react";

import "./tooltip.css";

export interface TooltipTriggerProps {
  "aria-describedby": string;
  onBlur: () => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

export const Tooltip = ({
  content,
  children,
}: {
  content: ReactNode;
  children: (props: TooltipTriggerProps) => ReactElement;
}) => {
  const [open, setOpen] = useState(false);
  const [delay, setDelay] = useState<number | null>(null);
  const id = useId();

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const timer = window.setTimeout(() => setOpen(true), delay);

    return () => window.clearTimeout(timer);
  }, [delay]);

  const hide = () => {
    setDelay(null);
    setOpen(false);
  };

  return (
    <span className="cl-anchor">
      {children({
        "aria-describedby": id,
        onBlur: hide,
        onFocus: () => setDelay(0),
        onKeyDown: (event) => {
          if (event.key === "Escape") {
            hide();
          }
        },
        onPointerEnter: () => setDelay(400),
        onPointerLeave: hide,
      })}
      <span className="cl-tooltip" data-open={open || undefined} id={id} role="tooltip">
        {content}
      </span>
    </span>
  );
};
