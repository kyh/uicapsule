"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { cn } from "cn";

type Side = "left" | "right";

const KEYBOARD_STEP = 16;

const KEY_STEP = new Map<string, 1 | -1>([
  ["ArrowRight", 1],
  ["ArrowLeft", -1],
]);

interface ResizeHandleProps {
  side: Side;
  width: number;
  minWidth: number;
  maxWidth: number;
  onWidthChange: (width: number) => void;
  onDraggingChange: (dragging: boolean) => void;
}

const ResizeHandle = ({
  side,
  width,
  minWidth,
  maxWidth,
  onWidthChange,
  onDraggingChange,
}: ResizeHandleProps) => {
  const start = useRef<{ x: number; width: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const outward = side === "left" ? -1 : 1;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = {
      width: event.currentTarget.parentElement?.offsetWidth ?? width,
      x: event.clientX,
    };
    setDragging(true);
    onDraggingChange(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current) {
      return;
    }

    onWidthChange(start.current.width + outward * 2 * (event.clientX - start.current.x));
  };

  const onLostPointerCapture = () => {
    start.current = null;
    setDragging(false);
    onDraggingChange(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = KEY_STEP.get(event.key);

    if (!step) {
      return;
    }

    event.preventDefault();
    onWidthChange(width + outward * step * 2 * KEYBOARD_STEP);
  };

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a focusable separator is ARIA's splitter widget; an <hr> with tabIndex and key handlers fails no-noninteractive-tabindex and no-noninteractive-element-interactions (checked), so role="separator" on a div is the one spelling every rule accepts
      role="separator"
      tabIndex={0}
      aria-label={`Resize preview from the ${side}`}
      aria-orientation="vertical"
      aria-valuenow={Math.round(width)}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      data-dragging={dragging || undefined}
      className={cn(
        "group absolute top-1/2 hidden h-20 w-4 -translate-y-1/2 cursor-ew-resize touch-none place-items-center outline-none md:grid",
        side === "left" ? "-left-1.5 -translate-x-1/2" : "-right-1.5 translate-x-1/2",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onLostPointerCapture={onLostPointerCapture}
      onKeyDown={onKeyDown}
    >
      <span
        aria-hidden
        className="bg-muted-foreground/25 group-hover:bg-primary group-focus-visible:bg-primary group-data-dragging:bg-primary h-16 w-1 scale-y-50 rounded-full transition-[scale,background-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-y-100 group-focus-visible:scale-y-100 group-data-dragging:scale-y-100 motion-reduce:transition-none"
      />
    </div>
  );
};

interface ResizableProps {
  width: number;
  minWidth: number;
  maxWidth: number;
  onWidthChange: (width: number) => void;
  className?: string;
  children: ReactNode;
}

export const Resizable = ({
  width,
  minWidth,
  maxWidth,
  onWidthChange,
  className,
  children,
}: ResizableProps) => {
  const [dragging, setDragging] = useState(false);

  const setClamped = (next: number) => {
    onWidthChange(Math.min(maxWidth, Math.max(minWidth, next)));
  };

  const handle = (side: Side) => (
    <ResizeHandle
      side={side}
      width={width}
      minWidth={minWidth}
      maxWidth={maxWidth}
      onWidthChange={setClamped}
      onDraggingChange={setDragging}
    />
  );

  return (
    <div className={cn("relative max-w-full", className)} style={{ width }}>
      {handle("left")}
      <div className={cn("h-full w-full", dragging && "pointer-events-none")}>{children}</div>
      {handle("right")}
    </div>
  );
};
