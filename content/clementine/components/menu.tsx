import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { useDismiss } from "../lib/use-dismiss";
import type { DismissReason } from "../lib/use-dismiss";

import "./menu.css";

const noop = () => null;

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onSelect: () => void;
}

export interface MenuTriggerProps {
  "aria-expanded": boolean;
  "aria-controls": string;
  "aria-haspopup": "menu";
  onClick: () => void;
}

interface MenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  items: readonly MenuItem[];
  trigger: (props: MenuTriggerProps) => ReactNode;
  align?: "start" | "end";
}

const moveFocus = (list: HTMLElement | null, step: number) => {
  const buttons = [...(list?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
  let next = (current + step + buttons.length) % buttons.length;

  if (current === -1) {
    next = step > 0 ? 0 : buttons.length - 1;
  }

  buttons[next]?.focus();
};

const focusTrigger = (wrap: HTMLElement | null) =>
  wrap?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();

export const Menu = ({ open, onOpenChange, label, items, trigger, align = "start" }: MenuProps) => {
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();

  const close = useCallback(
    (reason: DismissReason | "select" | "tab" = "outside") => {
      onOpenChange(false);

      if (reason === "escape" || reason === "select") {
        focusTrigger(wrap.current);
      }
    },
    [onOpenChange],
  );

  const refs = useMemo(() => [wrap], []);

  useDismiss(open, close, refs);

  useEffect(() => {
    if (!open) {
      return noop;
    }

    const frame = window.requestAnimationFrame(() => {
      moveFocus(list.current, 1);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(list.current, event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Tab") {
      close("tab");
    }
  };

  return (
    <div className="cl-anchor" ref={wrap}>
      {trigger({
        "aria-controls": id,
        "aria-expanded": open,
        "aria-haspopup": "menu",
        onClick: () => {
          onOpenChange(!open);
        },
      })}
      <div
        aria-label={label}
        className="cl-popover cl-menu"
        data-align={align}
        data-open={open || undefined}
        id={id}
        inert={!open}
        onKeyDown={onKeyDown}
        ref={list}
        role="menu"
        tabIndex={-1}
      >
        {items.map((item) => (
          <button
            className="cl-menu__item"
            data-danger={item.danger === true || undefined}
            key={item.label}
            onClick={() => {
              close("select");
              item.onSelect();
            }}
            onPointerMove={(event) => {
              if (document.activeElement !== event.currentTarget) {
                event.currentTarget.focus();
              }
            }}
            role="menuitem"
            tabIndex={-1}
            type="button"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
