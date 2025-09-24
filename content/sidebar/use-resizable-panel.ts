import * as React from "react";

interface UseResizablePanelOptions {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

interface UseResizablePanelResult {
  width: number;
  isResizing: boolean;
  getHandleProps: () => {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  };
}

const DEFAULT_MIN_WIDTH = 200;
const DEFAULT_MAX_WIDTH = 420;
const DEFAULT_INITIAL_WIDTH = 280;

export function useResizablePanel(options: UseResizablePanelOptions = {}): UseResizablePanelResult {
  const { initialWidth = DEFAULT_INITIAL_WIDTH, minWidth = DEFAULT_MIN_WIDTH, maxWidth = DEFAULT_MAX_WIDTH } = options;

  const [width, setWidth] = React.useState(initialWidth);
  const [isResizing, setIsResizing] = React.useState(false);

  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(initialWidth);
  const isDraggingRef = React.useRef(false);

  const handlePointerMove = React.useCallback(
    (event: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const delta = event.clientX - startXRef.current;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));

      setWidth(nextWidth);
    },
    [maxWidth, minWidth],
  );

  const handlePointerUp = React.useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsResizing(false);
    document.body.classList.remove("select-none");
  }, []);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();

      isDraggingRef.current = true;
      startXRef.current = event.clientX;
      startWidthRef.current = width;
      setIsResizing(true);
      document.body.classList.add("select-none");
    },
    [width],
  );

  React.useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.classList.remove("select-none");
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    width,
    isResizing,
    getHandleProps: () => ({
      onPointerDown: handlePointerDown,
    }),
  };
}
