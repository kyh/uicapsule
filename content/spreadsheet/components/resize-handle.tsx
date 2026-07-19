"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent, type RefObject } from "react";
import { cn } from "@repo/ui/lib/utils";

import type { Ref } from "react";
import { MIN_COLUMN_WIDTH } from "../lib/spreadsheet-utils";

/** Half the handle's hit width, so the drag line sits centred on it. */
const DRAG_LINE_OFFSET = 2;

interface ResizeHandleProps {
  columnId: string;
  width: number;
  handleColumnResize: (columnId: string, width: number) => void;
  tableContainerRef: RefObject<HTMLDivElement | null>;
  dragLineRef: RefObject<HTMLDivElement | null>;
  setDragLineVisible: (visible: boolean) => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export const ResizeHandle = ({
  columnId,
  width,
  handleColumnResize,
  tableContainerRef,
  dragLineRef,
  setDragLineVisible,
  className,
  ref,
}: ResizeHandleProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const columnStartXRef = useRef(0);
  const currentMouseXRef = useRef(0);

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragLineVisible(true);
    startXRef.current = e.clientX;
    // Seed with the press position so a click with no drag commits the current width.
    currentMouseXRef.current = e.clientX;
    startWidthRef.current = width;

    const headerElement = e.currentTarget.closest("[data-column-id]");
    if (headerElement instanceof HTMLElement) {
      const rect = headerElement.getBoundingClientRect();
      const tableRect = tableContainerRef.current?.getBoundingClientRect();
      if (tableRect) {
        columnStartXRef.current = rect.left - tableRect.left;
        const initialDragX = columnStartXRef.current + startWidthRef.current - DRAG_LINE_OFFSET;
        if (dragLineRef.current) {
          dragLineRef.current.style.left = `${initialDragX}px`;
        }
      }
    }

    const widthForClientX = (clientX: number) =>
      Math.max(MIN_COLUMN_WIDTH, startWidthRef.current + (clientX - startXRef.current));

    const handleMouseMove = (e: MouseEvent) => {
      currentMouseXRef.current = e.clientX;
      const dragX = columnStartXRef.current + widthForClientX(e.clientX) - DRAG_LINE_OFFSET;

      if (dragLineRef.current) {
        dragLineRef.current.style.left = `${dragX}px`;
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setDragLineVisible(false);
      handleColumnResize(columnId, widthForClientX(currentMouseXRef.current));
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "hover:bg-primary/50 dark:hover:bg-primary/60 absolute top-0 right-0 h-full w-1 cursor-col-resize transition-colors",
        isResizing && "bg-primary dark:bg-primary/80",
        className,
      )}
      onMouseDown={handleMouseDown}
    />
  );
};
