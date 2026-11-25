import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { Button } from "./button";
import { Icon } from "./icon";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  meta?: string;
  size?: "lg";
  footer?: ReactNode;
  children: ReactNode;
}

/** A native modal dialog driven by `open` and `onOpenChange`. Focuses `[data-autofocus]` on open. */
export const Dialog = ({
  open,
  onOpenChange,
  title,
  meta,
  size,
  footer,
  children,
}: DialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    if (open && !node.open) {
      node.showModal();
      node.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  return (
    <dialog
      aria-label={title}
      className="hx-dialog"
      data-size={size}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
      ref={ref}
    >
      <header className="hx-head">
        <h2 className="hx-head-title hx-code">{title}</h2>
        {meta ? <span className="hx-head-meta hx-code-sm">{meta}</span> : null}
        <div className="hx-head-actions">
          <Button
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            size="icon-sm"
            variant="ghost"
          >
            <Icon icon={X} />
          </Button>
        </div>
      </header>
      <div className="hx-body-pad hx-gap-4">{children}</div>
      {footer ? <footer className="hx-foot">{footer}</footer> : null}
    </dialog>
  );
};
