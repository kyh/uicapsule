import { useEffect, useRef } from "react";

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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    // Get current width from CSS variable
    const currentWidth = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-width")
        .replace("px", "") || defaultWidth.toString(),
    );
    startWidthRef.current = currentWidth;
  };

  useEffect(() => {
    // Set initial CSS variable value
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${defaultWidth}px`,
    );

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = e.clientX - startXRef.current;
      const newWidth = startWidthRef.current + deltaX;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);

      // Set CSS variable directly
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${clampedWidth}px`,
      );
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    const handleMouseDownGlobal = () => {
      if (isResizingRef.current) {
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      }
    };

    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDownGlobal);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDownGlobal);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [defaultWidth, minWidth, maxWidth]);

  return {
    handleMouseDown,
  };
};
