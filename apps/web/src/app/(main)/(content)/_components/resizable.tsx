"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "cn";

type Side = "left" | "right";

type ResizableProps = {
  width: number;
  minWidth: number;
  maxWidth: number;
  onWidthChange: (width: number) => void;
  className?: string;
  children: ReactNode;
};

const KEYBOARD_STEP = 16;

export const Resizable = ({
  width,
  minWidth,
  maxWidth,
  onWidthChange,
  className,
  children,
}: ResizableProps) => {
  const [dragging, setDragging] = useState(false);
  const setClamped = (next: number) => onWidthChange(Math.min(maxWidth, Math.max(minWidth, next)));

  const handle = (side: Side) => (
    <ResizeHandle
      side={side}
      width={width}
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

type ResizeHandleProps = {
  side: Side;
  width: number;
  onWidthChange: (width: number) => void;
  onDraggingChange: (dragging: boolean) => void;
};

// The box is centered, so moving one edge by Δ changes the width by 2Δ.
const ResizeHandle = ({ side, width, onWidthChange, onDraggingChange }: ResizeHandleProps) => {
  const start = useRef<{ x: number; width: number } | null>(null);
  const outward = side === "left" ? -1 : 1;

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { x: event.clientX, width };
    onDraggingChange(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    onWidthChange(start.current.width + outward * 2 * (event.clientX - start.current.x));
  };

  const onLostPointerCapture = () => {
    start.current = null;
    onDraggingChange(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    onWidthChange(width + outward * step * 2 * KEYBOARD_STEP);
  };

  return (
    <button
      type="button"
      aria-label={`Resize preview from the ${side}`}
      className={cn(
        "bg-muted-foreground/20 hover:bg-muted-foreground/50 focus-visible:bg-muted-foreground/50 absolute top-1/2 hidden h-24 w-1.5 -translate-y-1/2 cursor-ew-resize touch-none rounded-full transition-colors outline-none md:block",
        side === "left" ? "-left-3 -translate-x-1/2" : "-right-3 translate-x-1/2",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onLostPointerCapture={onLostPointerCapture}
      onKeyDown={onKeyDown}
    />
  );
};
