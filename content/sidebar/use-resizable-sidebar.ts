import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";

interface UseResizableSidebarOptions {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export const useResizableSidebar = ({
  defaultWidth = 240,
  minWidth = 100,
  maxWidth = 300,
}: UseResizableSidebarOptions = {}) => {
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const isResizingRef = useRef<boolean>(false);

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-width")
        .replace("px", "") || defaultWidth.toString(),
    );
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", `${defaultWidth}px`);

    // The width lives in a CSS variable rather than state so dragging never re-renders.
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const newWidth = startWidthRef.current + (e.clientX - startXRef.current);
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      document.documentElement.style.setProperty("--sidebar-width", `${clampedWidth}px`);
    };

    const handleMouseUp = () => {
      if (!isResizingRef.current) return;
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
  }, [defaultWidth, minWidth, maxWidth]);

  return {
    handleMouseDown,
  };
};
