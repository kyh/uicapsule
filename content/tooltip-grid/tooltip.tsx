"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  use,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLProps,
  type ReactNode,
  type Ref,
} from "react";

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

/**
 * Which edge/corner of the trigger the pointer crossed on entry. Drives the
 * direction the block grid wipes in. A pointer that enters within
 * `EDGE_THRESHOLD_RATIO` of the trigger's centre line on the minor axis counts
 * as a straight edge entry; anything further out is a corner entry.
 */
const EDGE_THRESHOLD_RATIO = 0.25;

const resolveHoverDirection = (
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  pointerX: number,
  pointerY: number,
): HoverDirection => {
  const deltaX = pointerX - (rect.left + rect.width / 2);
  const deltaY = pointerY - (rect.top + rect.height / 2);
  const thresholdX = rect.width * EDGE_THRESHOLD_RATIO;
  const thresholdY = rect.height * EDGE_THRESHOLD_RATIO;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (Math.abs(deltaY) < thresholdY) return deltaX > 0 ? "right" : "left";
    if (deltaY < 0) return deltaX > 0 ? "top-right" : "top-left";
    return deltaX > 0 ? "bottom-right" : "bottom-left";
  }

  if (Math.abs(deltaX) < thresholdX) return deltaY > 0 ? "bottom-center" : "top-center";
  if (deltaX < 0) return deltaY > 0 ? "bottom-left" : "top-left";
  return deltaY > 0 ? "bottom-right" : "top-right";
};

type TooltipOptions = {
  initialOpen?: boolean;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const useTooltip = ({
  initialOpen = false,
  placement = "top",
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: TooltipOptions = {}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(initialOpen);
  const [hoverDirection, setHoverDirection] = useState<HoverDirection>(DEFAULT_HOVER_DIRECTION);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    strategy: "fixed",
    placement,
    open,
    onOpenChange: (isOpen, event) => {
      const reference = data.elements.reference;
      if (isOpen && !open && reference && event instanceof MouseEvent) {
        setHoverDirection(
          resolveHoverDirection(reference.getBoundingClientRect(), event.clientX, event.clientY),
        );
      }
      setOpen(isOpen);
    },
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({
        fallbackAxisSideDirection: "start",
        padding: 5,
      }),
      shift({ padding: 5 }),
    ],
  });

  const context = data.context;

  const hover = useHover(context, {
    move: false,
    enabled: controlledOpen == null,
  });

  const focus = useFocus(context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  // Reset direction when tooltip closes so the next open starts from a known state.
  useEffect(() => {
    if (!open) {
      setHoverDirection(DEFAULT_HOVER_DIRECTION);
    }
  }, [open]);

  return useMemo(
    () => ({
      open,
      setOpen,
      hoverDirection,
      ...interactions,
      ...data,
    }),
    [open, setOpen, hoverDirection, interactions, data],
  );
};

type TooltipContextValue = ReturnType<typeof useTooltip>;

const TooltipContext = createContext<TooltipContextValue | null>(null);

export const useTooltipContext = () => {
  const context = use(TooltipContext);

  if (context == null) {
    throw new Error("Tooltip components must be wrapped in <Tooltip />");
  }

  return context;
};

export const Tooltip = ({ children, ...options }: { children: ReactNode } & TooltipOptions) => {
  const tooltip = useTooltip(options);

  return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
};

const isRef = (value: unknown): value is Ref<HTMLElement> =>
  typeof value === "function" ||
  (typeof value === "object" && value !== null && "current" in value);

/** React 19 exposes a child element's ref through its props, not `element.ref`. */
const getChildRef = (child: ReactNode): Ref<HTMLElement> | undefined => {
  if (!isValidElement(child)) return undefined;
  const props: unknown = child.props;
  if (typeof props !== "object" || props === null || !("ref" in props)) return undefined;
  return isRef(props.ref) ? props.ref : undefined;
};

export const TooltipTrigger = ({
  children,
  asChild = false,
  ref: propRef,
  ...props
}: HTMLProps<HTMLElement> & { asChild?: boolean }) => {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setReference, propRef, getChildRef(children)]);

  // The user can style the trigger based on the state.
  const stateProps = {
    "data-state": context.open ? "open" : "closed",
    "data-side": context.placement.split("-")[0],
  };

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && isValidElement(children)) {
    return cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...(children.props as object),
        ...stateProps,
      }),
    );
  }

  return (
    <button ref={ref} {...stateProps} {...context.getReferenceProps(props)}>
      {children}
    </button>
  );
};

export const TooltipContent = ({
  className,
  type = "default",
  ref: propRef,
  ...props
}: HTMLProps<HTMLDivElement> & {
  type?: "default" | "block";
}) => {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);
  const { children: floatingPropsChildren, ...floatingProps } = context.getFloatingProps(props);
  const children = floatingPropsChildren as ReactNode;
  const blockType = type === "block";

  const tooltipMotionProps = blockType
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.23 },
      };

  const contentMotionProps = blockType
    ? {
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: {
            delay: context.hoverDirection.includes("top") ? totalDelay * 2 : totalDelay,
          },
        },
        exit: { opacity: 0 },
      }
    : {};

  return (
    <FloatingPortal>
      <AnimatePresence>
        {context.open && (
          <motion.div
            className={`tooltip ${blockType ? "block" : ""} ${className ?? ""}`}
            ref={ref}
            style={context.floatingStyles}
            {...tooltipMotionProps}
            {...floatingProps}
          >
            {blockType && <TooltipBlocks />}
            <motion.div className="content" {...contentMotionProps}>
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {blockType && <AnimatePresence>{context.open && <TooltipLines />}</AnimatePresence>}
    </FloatingPortal>
  );
};

const easeInOutQuint = (x: number) => {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
};

const lineTransition = {
  ease: easeInOutQuint,
  duration: 1,
};

const TooltipLines = () => {
  const context = useTooltipContext();
  const floatingEl = context.elements.floating;

  if (!floatingEl || context.x == null || context.y == null) return null;

  return (
    <>
      <motion.div
        className="line lineH"
        initial={{ opacity: 0, y: -1 }}
        animate={{ opacity: 1, y: context.y }}
        exit={{ opacity: 0, y: -1 }}
        transition={lineTransition}
      />
      <motion.div
        className="line lineH"
        initial={{ opacity: 0, y: "100dvh" }}
        animate={{ opacity: 1, y: context.y + floatingEl.offsetHeight }}
        exit={{ opacity: 0, y: "100dvh" }}
        transition={lineTransition}
      />
      <motion.div
        className="line lineV"
        initial={{ opacity: 0, x: -1 }}
        animate={{ opacity: 1, x: context.x }}
        exit={{ opacity: 0, x: -1 }}
        transition={lineTransition}
      />
      <motion.div
        className="line lineV"
        initial={{ opacity: 0, x: "100dvw" }}
        animate={{ opacity: 1, x: context.x + floatingEl.offsetWidth }}
        exit={{ opacity: 0, x: "100dvw" }}
        transition={lineTransition}
      />
    </>
  );
};

const cols = 11;
const rows = 8;
const duration = 0.07;
const baseDelay = duration / 2;
const blocks = Array.from({ length: cols * rows }, (_, i) => i);
const centerCol = Math.floor(cols / 2);

const calculateDelay = (n: number) => baseDelay * Math.floor(n / cols) + baseDelay * (n % cols);

// Calculate total delay for the default top direction
const totalDelay = calculateDelay(cols * rows);

/**
 * Per-block stagger delay: distance (in grid steps) from the entry edge/corner,
 * scaled by `baseDelay`, so the wipe travels away from where the pointer came in.
 */
const getDirectionalDelay = (n: number, direction: HoverDirection) => {
  const row = Math.floor(n / cols);
  const col = n % cols;
  const fromBottom = rows - 1 - row;
  const fromRight = cols - 1 - col;

  switch (direction) {
    case "left":
      return baseDelay * col + baseDelay * row;
    case "right":
      return baseDelay * fromRight + baseDelay * row;
    case "bottom-center":
      return baseDelay * fromBottom + baseDelay * Math.abs(col - centerCol);
    case "top-left":
      return baseDelay * row + baseDelay * col;
    case "top-right":
      return baseDelay * row + baseDelay * fromRight;
    case "bottom-left":
      return baseDelay * fromBottom + baseDelay * col;
    case "bottom-right":
      return baseDelay * fromBottom + baseDelay * fromRight;
    case "top-center":
      return baseDelay * row + baseDelay * Math.abs(col - centerCol);
  }
};

const TooltipBlocks = () => {
  const context = useTooltipContext();

  if (context.x == null || context.y == null) return null;

  return (
    <div className="blocksContainer" style={{ "--cols": cols, "--rows": rows } as CSSProperties}>
      {blocks.map((i) => (
        <motion.div
          key={i}
          className="block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration,
            delay: getDirectionalDelay(i, context.hoverDirection),
          }}
        />
      ))}
    </div>
  );
};
