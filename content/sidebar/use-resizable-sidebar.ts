import { useEffect, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

interface UseResizableSidebarOptions {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

const writeWidth = (sidebar: HTMLDivElement | null, width: number) => {
  if (sidebar) {
    sidebar.style.width = `${width}px`;
  }
};

/**
 * Resizes the element behind `sidebarRef` by writing its inline width, so a drag never
 * re-renders React. The bounds stretch to include `defaultWidth`, so the starting width is
 * never clamped away by `minWidth`/`maxWidth`.
 */
export const useResizableSidebar = ({
  defaultWidth = 240,
  minWidth = 100,
  maxWidth = 300,
}: UseResizableSidebarOptions = {}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef<number>(defaultWidth);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const isResizingRef = useRef<boolean>(false);

  const lowerBound = Math.min(minWidth, defaultWidth);
  const upperBound = Math.max(maxWidth, defaultWidth);

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = widthRef.current;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    widthRef.current = defaultWidth;
    writeWidth(sidebarRef.current, defaultWidth);
  }, [defaultWidth]);

  useEffect(() => {
    const applyWidth = (width: number) => {
      widthRef.current = Math.min(Math.max(width, lowerBound), upperBound);
      writeWidth(sidebarRef.current, widthRef.current);
    };

    applyWidth(widthRef.current);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) {
        return;
      }

      applyWidth(startWidthRef.current + (e.clientX - startXRef.current));
    };

    const handleMouseUp = () => {
      if (!isResizingRef.current) {
        return;
      }

      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [lowerBound, upperBound]);

  return {
    handleMouseDown,
    sidebarRef,
  };
};
