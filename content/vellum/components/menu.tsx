"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { useDismiss } from "../lib/hooks";

export interface MenuAction {
  label: string;
  icon?: ReactNode;
  tone?: "fail";
  onSelect: () => void;
}

/** A list of actions from one trigger; the trigger is any Button the caller renders. */
export const Menu = ({
  label,
  renderTrigger,
  items,
  align = "end",
}: {
  label: string;
  renderTrigger: (props: {
    "aria-expanded": boolean;
    "aria-haspopup": "menu";
    onClick: () => void;
  }) => ReactNode;
  items: readonly (MenuAction | "separator")[];
  align?: "start" | "end";
}) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useDismiss(root, open, () => setOpen(false));

  useEffect(() => {
    if (open) {
      list.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    }
  }, [open]);

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const entries = [
      ...(list.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? []),
    ];

    const at = entries.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      entries[(at + 1) % entries.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      entries[at === -1 ? entries.length - 1 : (at - 1 + entries.length) % entries.length]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      entries[event.key === "Home" ? 0 : entries.length - 1]?.focus();
    } else if (event.key === "Escape") {
      setOpen(false);
      root.current?.querySelector<HTMLButtonElement>("[aria-haspopup]")?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className="v-anchor" ref={root}>
      {renderTrigger({
        "aria-expanded": open,
        "aria-haspopup": "menu",
        onClick: () => setOpen((value) => !value),
      })}
      <div
        aria-label={label}
        className="v-pop v-overlay"
        data-align={align}
        data-open={open ? "" : undefined}
        onKeyDown={move}
        ref={list}
        role="menu"
        tabIndex={-1}
      >
        {items.map((item, index) =>
          item === "separator" ? (
            <hr className="v-menu-sep" key={`separator-${index}`} />
          ) : (
            <button
              className="v-menu-item"
              data-tone={item.tone}
              key={item.label}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              onPointerMove={(event) => event.currentTarget.focus()}
              role="menuitem"
              tabIndex={-1}
              type="button"
            >
              {item.icon}
              {item.label}
            </button>
          ),
        )}
      </div>
    </div>
  );
};
