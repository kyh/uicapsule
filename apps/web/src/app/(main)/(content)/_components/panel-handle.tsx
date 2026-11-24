"use client";

import { useRef } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { cn } from "cn";

import { PANEL_BOUNDS, clampPanel } from "./panel-layout";
import type { PanelId, PanelState } from "./panel-layout";

const KEYBOARD_STEP = 24;

const DIRECTION = { code: -1, info: -1, nav: 1 } satisfies Record<PanelId, 1 | -1>;

const LABEL = {
  code: "Resize the code panel",
  info: "Resize the info panel",
  nav: "Resize the component list",
} satisfies Record<PanelId, string>;

const GROW_KEYS = {
  code: { grow: "ArrowUp", shrink: "ArrowDown" },
  info: { grow: "ArrowLeft", shrink: "ArrowRight" },
  nav: { grow: "ArrowRight", shrink: "ArrowLeft" },
} satisfies Record<PanelId, { grow: string; shrink: string }>;

interface PanelHandleProps {
  panel: PanelId;
  state: PanelState;
  onChange: (id: PanelId, next: Partial<PanelState>) => void;
  onDraggingChange: (dragging: boolean) => void;
  className?: string;
}

export const PanelHandle = ({
  panel,
  state,
  onChange,
  onDraggingChange,
  className,
}: PanelHandleProps) => {
  const start = useRef<{ pointer: number; size: number } | null>(null);
  const vertical = panel !== "code";
  const bounds = PANEL_BOUNDS[panel];

  const pointerOf = (event: PointerEvent<HTMLDivElement>) =>
    vertical ? event.clientX : event.clientY;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { pointer: pointerOf(event), size: state.open ? state.size : 0 };
    onDraggingChange(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current) {
      return;
    }

    const raw = start.current.size + DIRECTION[panel] * (pointerOf(event) - start.current.pointer);

    if (raw < bounds.min / 2) {
      onChange(panel, { open: false });

      return;
    }

    onChange(panel, { open: true, size: clampPanel(panel, raw) });
  };

  const onLostPointerCapture = () => {
    start.current = null;
    onDraggingChange(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = GROW_KEYS[panel];

    if (event.key === "Enter") {
      event.preventDefault();
      onChange(panel, { open: !state.open });

      return;
    }

    if (event.key !== keys.grow && event.key !== keys.shrink) {
      return;
    }

    event.preventDefault();

    const step = event.key === keys.grow ? KEYBOARD_STEP : -KEYBOARD_STEP;
    const base = state.open ? state.size : bounds.min - KEYBOARD_STEP;

    onChange(panel, { open: true, size: clampPanel(panel, base + step) });
  };

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a focusable separator is a widget; <hr> can't take focus or handlers
      role="separator"
      tabIndex={0}
      aria-label={LABEL[panel]}
      aria-orientation={vertical ? "vertical" : "horizontal"}
      aria-valuenow={state.open ? state.size : 0}
      aria-valuemin={0}
      aria-valuemax={bounds.max}
      title="Drag to resize, double-click to collapse"
      className={cn(
        "group/handle absolute z-20 hidden touch-none outline-none md:block",
        vertical ? "inset-y-0 w-2 cursor-col-resize" : "inset-x-0 h-2 cursor-row-resize",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onLostPointerCapture={onLostPointerCapture}
      onDoubleClick={() => onChange(panel, { open: !state.open })}
      onKeyDown={onKeyDown}
    >
      <span
        aria-hidden
        className={cn(
          "bg-primary/0 group-hover/handle:bg-primary/60 group-focus-visible/handle:bg-primary group-active/handle:bg-primary absolute transition-colors delay-75",
          vertical
            ? "inset-y-0 left-1/2 w-0.5 -translate-x-1/2"
            : "inset-x-0 top-1/2 h-0.5 -translate-y-1/2",
        )}
      />
    </div>
  );
};
