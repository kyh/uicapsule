"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { useDismiss } from "../lib/hooks";

/** A pill trigger that opens a ring-lifted list of radio items; choosing one closes it. */
export const Select = <T extends string>({
  label,
  options,
  value,
  onValueChange,
  size = "md",
  disabled = false,
  hideLabel = true,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
  size?: "sm" | "md";
  disabled?: boolean;
  hideLabel?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const current = options.find((option) => option.value === value);

  useDismiss(root, open, () => {
    setOpen(false);
  });

  useEffect(() => {
    if (open) {
      list.current?.querySelector<HTMLButtonElement>("[aria-checked=true]")?.focus();
    }
  }, [open]);

  const choose = (next: T) => {
    onValueChange(next);
    setOpen(false);
    trigger.current?.focus();
  };

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const entries = [
      ...(list.current?.querySelectorAll<HTMLButtonElement>("[role=menuitemradio]") ?? []),
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
      trigger.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div
      className="v-anchor"
      ref={root}
      style={hideLabel ? undefined : { display: "grid", gap: 6 }}
    >
      <span className={hideLabel ? "v-sr" : "v-label"} id={`${id}-label`}>
        {label}
      </span>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-labelledby={`${id}-label ${id}-value`}
        className="v-select-trigger"
        data-size={size}
        disabled={disabled}
        onClick={() => {
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        ref={trigger}
        type="button"
      >
        <span id={`${id}-value`}>{current?.label}</span>
        <ChevronsUpDown aria-hidden />
      </button>
      <div
        aria-labelledby={`${id}-label`}
        className="v-pop v-overlay"
        data-align="end"
        data-open={open ? "" : undefined}
        onKeyDown={move}
        ref={list}
        role="menu"
        data-list=""
        tabIndex={-1}
      >
        {options.map((option) => (
          <button
            aria-checked={option.value === value}
            className="v-menu-item"
            key={option.value}
            onClick={() => {
              choose(option.value);
            }}
            onPointerMove={(event) => {
              event.currentTarget.focus();
            }}
            role="menuitemradio"
            tabIndex={-1}
            type="button"
          >
            {option.label}
            {option.value === value ? <Check aria-hidden className="v-menu-check" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
};
