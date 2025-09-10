"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@repo/ui/utils";

type ResizableProps = {
  children: React.ReactNode;
  width: number;
  setWidth: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  onResize?: (width: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
};

export const Resizable = ({
  children,
  width,
  setWidth,
  minWidth = 300,
  maxWidth = 1392,
  className,
  onResize,
  onResizeStart,
  onResizeEnd,
}: ResizableProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const dragStateRef = useRef({
    isDragging: false,
    dragHandle: null as "left" | "right" | null,
    startX: 0,
    startWidth: 0,
  });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState.isDragging) return;

      const deltaX = e.clientX - dragState.startX;
      const symmetricalDelta = deltaX * 2;

      const adjustedDelta =
        dragState.dragHandle === "left" ? -symmetricalDelta : symmetricalDelta;

      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, dragState.startWidth + adjustedDelta),
      );

      setWidth(newWidth);
      onResize?.(newWidth);
    },
    [minWidth, maxWidth, onResize, setWidth],
  );

  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false;
    dragStateRef.current.dragHandle = null;

    setIsDragging(false);
    onResizeEnd?.();
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [handleMouseMove, onResizeEnd]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: "left" | "right") => {
      e.preventDefault();

      dragStateRef.current = {
        isDragging: true,
        dragHandle: handle,
        startX: e.clientX,
        startWidth: width,
      };

      setIsDragging(true);
      onResizeStart?.();
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    },
    [width, handleMouseMove, handleMouseUp, onResizeStart],
  );

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className={cn("relative", isDragging && "select-none", className)}
      style={{ width: `${width}px` }}
    >
      <button
        className="bg-muted-foreground/20 hover:bg-muted-foreground/50 absolute top-1/2 -left-3 h-[100px] w-2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full transition"
        onMouseDown={(e) => handleMouseDown(e, "left")}
      />
      <div className="h-full w-full" style={{ width: `${width}px` }}>
        {children}
      </div>
      <button
        className="bg-muted-foreground/20 hover:bg-muted-foreground/50 absolute top-1/2 -right-3 h-[100px] w-2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full transition"
        onMouseDown={(e) => handleMouseDown(e, "right")}
      />
    </div>
  );
};
