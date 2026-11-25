"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { motion, useReducedMotion, useSpring } from "motion/react";
import { cn } from "cn";

import { PANEL_BOUNDS, clampPanel } from "./panel-layout";
import type { PanelId, PanelState } from "./panel-layout";

const KEYBOARD_STEP = 24;

const GRIP_SPRING = { damping: 49, mass: 1, stiffness: 600 };
const GRIP_HALF = 16;

const GRIP_SCALE = { damping: 30, stiffness: 400, type: "spring" } as const;

const GRIP_TRANSITION = {
  opacity: { duration: 0.15, ease: "easeOut" },
  scaleX: GRIP_SCALE,
  scaleY: GRIP_SCALE,
} as const;

const GRIP_CLASS = {
  code: "bottom-1/2 left-0 mb-0.75 h-1 w-8",
  info: "top-0 right-1/2 mr-0.75 h-8 w-1",
  nav: "top-0 left-1/2 ml-0.75 h-8 w-1",
} satisfies Record<PanelId, string>;

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
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const reducedMotion = useReducedMotion();
  const grip = useSpring(0, GRIP_SPRING);
  const vertical = panel !== "code";
  const bounds = PANEL_BOUNDS[panel];

  const pointerOf = (event: PointerEvent<HTMLDivElement>) =>
    vertical ? event.clientX : event.clientY;

  const trackGrip = (event: PointerEvent<HTMLDivElement>, jump: boolean) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const along = vertical ? event.clientY - rect.top : event.clientX - rect.left;
    const length = vertical ? rect.height : rect.width;
    const next = Math.min(length - GRIP_HALF, Math.max(GRIP_HALF, along));

    if (jump || reducedMotion) {
      grip.jump(next);
    } else {
      grip.set(next);
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { pointer: pointerOf(event), size: state.open ? state.size : 0 };
    setDragging(true);
    onDraggingChange(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    trackGrip(event, false);

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
    setDragging(false);
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
      data-dragging={dragging || undefined}
      className={cn(
        "absolute z-20 hidden touch-none outline-none select-none md:block",
        "after:bg-primary after:absolute after:opacity-0 after:transition-opacity after:duration-150 after:ease-out after:content-[''] hover:after:opacity-100 focus-visible:after:opacity-100 data-dragging:after:opacity-100 motion-reduce:after:transition-none",
        vertical
          ? "inset-y-0 w-2 cursor-ew-resize after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2"
          : "inset-x-0 h-2 cursor-ns-resize after:inset-x-0 after:top-1/2 after:h-px after:-translate-y-1/2",
        className,
      )}
      onPointerEnter={(event) => {
        trackGrip(event, true);
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onLostPointerCapture={onLostPointerCapture}
      onDoubleClick={() => onChange(panel, { open: !state.open })}
      onKeyDown={onKeyDown}
    >
      <motion.span
        aria-hidden
        className={cn("bg-primary pointer-events-none absolute rounded-full", GRIP_CLASS[panel])}
        style={
          vertical
            ? { marginTop: -GRIP_HALF, originY: 0.5, y: grip }
            : { marginLeft: -GRIP_HALF, originX: 0.5, x: grip }
        }
        initial={false}
        animate={
          hovered || dragging
            ? { opacity: 1, scaleX: 1, scaleY: 1 }
            : { opacity: 0, scaleX: vertical ? 1 : 0.6, scaleY: vertical ? 0.6 : 1 }
        }
        transition={GRIP_TRANSITION}
      />
    </div>
  );
};
