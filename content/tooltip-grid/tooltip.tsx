"use client";

import { createContext, use, useCallback, useMemo, useState } from "react";
import type { CSSProperties, HTMLProps, ReactNode } from "react";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
} from "@floating-ui/react";
import { AnimatePresence, motion } from "motion/react";

import type { Placement } from "@floating-ui/react";

import "./tooltip.css";

type HoverDirection =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "left"
  | "right";

const DEFAULT_HOVER_DIRECTION: HoverDirection = "top-center";

const EDGE_THRESHOLD_RATIO = 0.25;

const resolveHoverDirection = (
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  pointerX: number,
  pointerY: number,
) => {
  const deltaX = pointerX - (rect.left + rect.width / 2);
  const deltaY = pointerY - (rect.top + rect.height / 2);
  const thresholdX = rect.width * EDGE_THRESHOLD_RATIO;
  const thresholdY = rect.height * EDGE_THRESHOLD_RATIO;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (Math.abs(deltaY) < thresholdY) {
      return deltaX > 0 ? "right" : "left";
    }

    if (deltaY < 0) {
      return deltaX > 0 ? "top-right" : "top-left";
    }

    return deltaX > 0 ? "bottom-right" : "bottom-left";
  }

  if (Math.abs(deltaX) < thresholdX) {
    return deltaY > 0 ? "bottom-center" : "top-center";
  }

  if (deltaX < 0) {
    return deltaY > 0 ? "bottom-left" : "top-left";
  }

  return deltaY > 0 ? "bottom-right" : "top-right";
};

interface TooltipOptions {
  initialOpen?: boolean;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const useTooltip = ({
  initialOpen = false,
  placement = "top",
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: TooltipOptions = {}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(initialOpen);
  const [hoverDirection, setHoverDirection] = useState<HoverDirection>(DEFAULT_HOVER_DIRECTION);

  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }

      setControlledOpen?.(nextOpen);
    },
    [controlledOpen, setControlledOpen],
  );

  const data = useFloating({
    middleware: [
      offset(5),
      flip({
        fallbackAxisSideDirection: "start",
        padding: 5,
      }),
      shift({ padding: 5 }),
    ],
    onOpenChange: (isOpen, event) => {
      const { reference } = data.elements;

      if (isOpen && !open && reference && event instanceof MouseEvent) {
        setHoverDirection(
          resolveHoverDirection(reference.getBoundingClientRect(), event.clientX, event.clientY),
        );
      }

      if (!isOpen) {
        setHoverDirection(DEFAULT_HOVER_DIRECTION);
      }

      setOpen(isOpen);
    },
    open,
    placement,
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
  });

  const { context } = data;

  const hover = useHover(context, {
    enabled: controlledOpen === undefined,
    move: false,
  });

  const focus = useFocus(context, {
    enabled: controlledOpen === undefined,
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  return useMemo(
    () => ({
      hoverDirection,
      open,
      setOpen,
      ...interactions,
      ...data,
    }),
    [open, setOpen, hoverDirection, interactions, data],
  );
};

type TooltipContextValue = ReturnType<typeof useTooltip>;

const isPlaced = ({ x, y }: Pick<TooltipContextValue, "x" | "y">) =>
  x !== null && x !== undefined && y !== null && y !== undefined;

const TooltipContext = createContext<TooltipContextValue | null>(null);

export const useTooltipContext = () => {
  const context = use(TooltipContext);

  if (context === null) {
    throw new Error("Tooltip components must be wrapped in <Tooltip />");
  }

  return context;
};

export const Tooltip = ({ children, ...options }: { children: ReactNode } & TooltipOptions) => {
  const tooltip = useTooltip(options);

  return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
};

export const TooltipTrigger = ({ children, ref: propRef, ...props }: HTMLProps<HTMLElement>) => {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setReference, propRef]);

  return (
    <button
      type="button"
      ref={ref}
      data-side={context.placement.split("-")[0]}
      data-state={context.open ? "open" : "closed"}
      {...context.getReferenceProps(props)}
    >
      {children}
    </button>
  );
};

const easeInOutQuint = (x: number) =>
  x < 0.5 ? 16 * x * x * x * x * x : 1 - (-2 * x + 2) ** 5 / 2;

const lineTransition = {
  duration: 1,
  ease: easeInOutQuint,
};

type CssVarStyle = CSSProperties & Record<`--${string}`, number | string>;

const TooltipLines = ({ color }: { color: string }) => {
  const context = useTooltipContext();
  const floatingEl = context.elements.floating;

  if (!floatingEl || !isPlaced(context)) {
    return null;
  }

  const style: CssVarStyle = { "--border-color": color };

  return (
    <>
      <motion.div
        className="line lineH"
        style={style}
        initial={{ opacity: 0, y: -1 }}
        animate={{ opacity: 1, y: context.y }}
        exit={{ opacity: 0, y: -1 }}
        transition={lineTransition}
      />
      <motion.div
        className="line lineH"
        style={style}
        initial={{ opacity: 0, y: "100dvh" }}
        animate={{ opacity: 1, y: context.y + floatingEl.offsetHeight }}
        exit={{ opacity: 0, y: "100dvh" }}
        transition={lineTransition}
      />
      <motion.div
        className="line lineV"
        style={style}
        initial={{ opacity: 0, x: -1 }}
        animate={{ opacity: 1, x: context.x }}
        exit={{ opacity: 0, x: -1 }}
        transition={lineTransition}
      />
      <motion.div
        className="line lineV"
        style={style}
        initial={{ opacity: 0, x: "100dvw" }}
        animate={{ opacity: 1, x: context.x + floatingEl.offsetWidth }}
        exit={{ opacity: 0, x: "100dvw" }}
        transition={lineTransition}
      />
    </>
  );
};

interface BlockGrid {
  cols: number;
  rows: number;
  duration: number;
}

const getDirectionalDelay = (n: number, direction: HoverDirection, grid: BlockGrid) => {
  const { cols, rows } = grid;
  const baseDelay = grid.duration / 2;
  const row = Math.floor(n / cols);
  const col = n % cols;
  const fromBottom = rows - 1 - row;
  const fromRight = cols - 1 - col;
  const fromCenter = Math.abs(col - Math.floor(cols / 2));

  switch (direction) {
    case "left": {
      return baseDelay * col + baseDelay * row;
    }

    case "right": {
      return baseDelay * fromRight + baseDelay * row;
    }

    case "bottom-center": {
      return baseDelay * fromBottom + baseDelay * fromCenter;
    }

    case "top-left": {
      return baseDelay * row + baseDelay * col;
    }

    case "top-right": {
      return baseDelay * row + baseDelay * fromRight;
    }

    case "bottom-left": {
      return baseDelay * fromBottom + baseDelay * col;
    }

    case "bottom-right": {
      return baseDelay * fromBottom + baseDelay * fromRight;
    }

    case "top-center": {
      return baseDelay * row + baseDelay * fromCenter;
    }

    default: {
      return 0;
    }
  }
};

const TooltipBlocks = ({ grid }: { grid: BlockGrid }) => {
  const context = useTooltipContext();

  if (!isPlaced(context)) {
    return null;
  }

  const style: CssVarStyle = { "--cols": grid.cols, "--rows": grid.rows };

  return (
    <div className="blocksContainer" style={style}>
      {Array.from({ length: grid.cols * grid.rows }, (_, i) => (
        <motion.div
          key={i}
          className="block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            delay: getDirectionalDelay(i, context.hoverDirection, grid),
            duration: grid.duration,
          }}
        />
      ))}
    </div>
  );
};

export const TooltipContent = ({
  className,
  type = "default",
  cols = 11,
  rows = 8,
  blockDuration = 0.07,
  panelColor = "#020617",
  guides = true,
  guideColor = "#334155",
  ref: propRef,
  style,
  children,
  ...props
}: HTMLProps<HTMLDivElement> & {
  type?: "default" | "block";
  cols?: number;
  rows?: number;
  blockDuration?: number;
  panelColor?: string;
  guides?: boolean;
  guideColor?: string;
}) => {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);
  const floatingProps = context.getFloatingProps(props);
  const blockType = type === "block";

  const grid = useMemo<BlockGrid>(
    () => ({ cols, duration: blockDuration, rows }),
    [cols, rows, blockDuration],
  );

  const revealDelay = (blockDuration / 2) * rows;

  const tooltipStyle: CssVarStyle = {
    ...context.floatingStyles,
    ...style,
    "--colors-panel": panelColor,
  };

  const tooltipMotionProps = blockType
    ? {}
    : {
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        initial: { opacity: 0 },
        transition: { duration: 0.23 },
      };

  const contentMotionProps = blockType
    ? {
        animate: {
          opacity: 1,
          transition: {
            delay: context.hoverDirection.includes("top") ? revealDelay * 2 : revealDelay,
          },
        },
        exit: { opacity: 0 },
        initial: { opacity: 0 },
      }
    : {};

  return (
    <FloatingPortal>
      <AnimatePresence>
        {context.open && (
          <motion.div
            className={`tooltip ${blockType ? "block" : ""} ${className ?? ""}`}
            ref={ref}
            style={tooltipStyle}
            {...tooltipMotionProps}
            {...floatingProps}
          >
            {blockType && <TooltipBlocks grid={grid} />}
            <motion.div className="content" {...contentMotionProps}>
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {blockType && guides && (
        <AnimatePresence>{context.open && <TooltipLines color={guideColor} />}</AnimatePresence>
      )}
    </FloatingPortal>
  );
};
