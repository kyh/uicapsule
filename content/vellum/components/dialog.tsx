"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

import { Panel, ShellFoot } from "./card";

const noop = () => null;

/** Asks for a decision over the scrim: a shell settling from 0.97, lifted by its ring. */
export const Dialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  meta,
  role = "dialog",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer: ReactNode;
  meta?: ReactNode;
  role?: "dialog" | "alertdialog";
}) => {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return noop;
    }

    returnTo.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusables = () => [
      ...(box.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled), textarea, [tabindex]:not([tabindex='-1'])",
      ) ?? []),
    ];

    const frame = window.requestAnimationFrame(() => {
      const entries = focusables();

      (entries.find((element) => element.dataset.autofocus !== undefined) ?? entries[0])?.focus();
    });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const entries = focusables();
      const [first] = entries;
      const last = entries.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      returnTo.current?.focus();
    };
  }, [open, onOpenChange]);

  return (
    <div
      className="v-scrim"
      data-open={open ? "" : undefined}
      inert={!open}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
      role="presentation"
    >
      <div
        aria-describedby={description ? `${id}-description` : undefined}
        aria-labelledby={`${id}-title`}
        aria-modal="true"
        className="v-shell v-dialog"
        ref={box}
        role={role}
      >
        <Panel>
          <div className="v-dialog-body">
            <h2 className="v-heading-sm" id={`${id}-title`}>
              {title}
            </h2>
            {description ? (
              <div className="v-body-sm v-t2" id={`${id}-description`}>
                {description}
              </div>
            ) : null}
            {children}
          </div>
        </Panel>
        <ShellFoot meta={meta}>{footer}</ShellFoot>
      </div>
    </div>
  );
};
