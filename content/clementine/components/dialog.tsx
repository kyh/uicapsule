import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

import "./dialog.css";

const noop = () => null;

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  kind?: "dialog" | "alert" | "sheet";
  size?: "sm" | "md";
}

export const Dialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  kind = "dialog",
  size = "md",
}: DialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  useEffect(() => {
    const node = ref.current;

    if (!node || kind === "alert" || "closedBy" in HTMLDialogElement.prototype) {
      return noop;
    }

    const onClick = (event: MouseEvent) => {
      if (event.target === node) {
        onOpenChange(false);
      }
    };

    node.addEventListener("click", onClick);

    return () => {
      node.removeEventListener("click", onClick);
    };
  }, [kind, onOpenChange]);

  const hasDescription = Boolean(description);

  return (
    <dialog
      aria-describedby={hasDescription ? descId : undefined}
      aria-labelledby={titleId}
      className="cl-dialog"
      closedby={kind === "alert" ? "closerequest" : "any"}
      data-kind={kind}
      data-size={size}
      onClose={() => {
        onOpenChange(false);
      }}
      ref={ref}
      role={kind === "alert" ? "alertdialog" : undefined}
    >
      <div className="cl-dialog__panel">
        {kind === "sheet" ? <span aria-hidden className="cl-dialog__grip" /> : null}
        <header className="cl-dialog__head">
          <h2 className="cl-dialog__title" id={titleId}>
            {title}
          </h2>
          {kind === "alert" ? null : (
            <button
              aria-label="Close"
              className="cl-btn"
              data-size="icon-sm"
              data-variant="secondary"
              onClick={() => {
                onOpenChange(false);
              }}
              type="button"
            >
              <span className="cl-btn__body">
                <X aria-hidden size={16} strokeWidth={1.75} />
              </span>
            </button>
          )}
        </header>
        {hasDescription && (
          <p className="cl-dialog__desc" id={descId}>
            {description}
          </p>
        )}
        {Boolean(children) && <div className="cl-dialog__body">{children}</div>}
        {Boolean(footer) && <footer className="cl-dialog__foot">{footer}</footer>}
      </div>
    </dialog>
  );
};
