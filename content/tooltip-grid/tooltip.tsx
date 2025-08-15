/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
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
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);
  const [hoverDirection, setHoverDirection] = React.useState<
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "left"
    | "right"
  >("top-center");

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    placement,
    open,
    onOpenChange: (isOpen, event) => {
      if (isOpen && !open && event) {
        // Tooltip is opening, use the event to determine direction
        if (data.elements.reference) {
          console.log("data.elements.reference", data.elements.reference);
          const rect = data.elements.reference.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const mouseEvent = event as MouseEvent;
          const mouseX = mouseEvent.clientX;
          const mouseY = mouseEvent.clientY;

          // Determine which side the mouse entered from with more granular detection
          const deltaX = mouseX - centerX;
          const deltaY = mouseY - centerY;

          // Use percentage-based thresholds (25% of trigger dimensions)
          const thresholdX = rect.width * 0.25;
          const thresholdY = rect.height * 0.25;

          console.log("Mouse position:", { mouseX, mouseY });
          console.log("Center position:", { centerX, centerY });
          console.log("Deltas:", { deltaX, deltaY });
          console.log("Thresholds:", {
            absDeltaX: Math.abs(deltaX),
            absDeltaY: Math.abs(deltaY),
            thresholdX,
            thresholdY,
          });

          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal entry
            if (Math.abs(deltaY) < thresholdY) {
              const direction = deltaX > 0 ? "right" : "left";
              console.log("Setting horizontal direction:", direction);
              setHoverDirection(direction);
            } else {
              // Corner entry
              if (deltaY < 0) {
                const direction = deltaX > 0 ? "top-right" : "top-left";
                console.log("Setting top corner direction:", direction);
                setHoverDirection(direction);
              } else {
                const direction = deltaX > 0 ? "bottom-right" : "bottom-left";
                console.log("Setting bottom corner direction:", direction);
                setHoverDirection(direction);
              }
            }
          } else {
            // Vertical entry
            if (Math.abs(deltaX) < thresholdX) {
              const direction = deltaY > 0 ? "bottom-center" : "top-center";
              console.log("Setting vertical direction:", direction);
              setHoverDirection(direction);
            } else {
              // Corner entry
              if (deltaX < 0) {
                const direction = deltaY > 0 ? "bottom-left" : "top-left";
                console.log("Setting left corner direction:", direction);
                setHoverDirection(direction);
              } else {
                const direction = deltaY > 0 ? "bottom-right" : "top-right";
                console.log("Setting right corner direction:", direction);
                setHoverDirection(direction);
              }
            }
          }
        }
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

  // Reset direction when tooltip closes
  React.useEffect(() => {
    if (!open) {
      setHoverDirection("top-center");
    }
  }, [open]);

  return React.useMemo(
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

type ContextType = ReturnType<typeof useTooltip> | null;

const TooltipContext = React.createContext<ContextType>(null);

export const useTooltipContext = () => {
  const context = React.useContext(TooltipContext);

  if (context == null) {
    throw new Error("Tooltip components must be wrapped in <Tooltip />");
  }

  return context;
};

export const Tooltip = ({
  children,
  ...options
}: { children: React.ReactNode } & TooltipOptions) => {
  const tooltip = useTooltip(options);

  return (
    <TooltipContext.Provider value={tooltip}>
      {children}
    </TooltipContext.Provider>
  );
};

export const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLProps<HTMLElement> & { asChild?: boolean }
>(({ children, asChild = false, ...props }, propRef) => {
  const context = useTooltipContext();
  const childrenRef = (children as any).ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...(children.props as object),
        // @ts-expect-error data-state and data-side are valid props
        "data-state": context.open ? "open" : "closed",
        "data-side": context.placement.split("-")[0],
      }),
    );
  }

  return (
    <button
      ref={ref}
      // The user can style the trigger based on the state
      data-state={context.open ? "open" : "closed"}
      data-side={context.placement.split("-")[0]}
      {...context.getReferenceProps(props)}
    >
      {children}
    </button>
  );
});

TooltipTrigger.displayName = "TooltipTrigger";

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement> & {
    type?: "default" | "block";
  }
>(({ className, type = "default", ...props }, propRef) => {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);
  const { children: floatingPropsChildren, ...floatingProps } =
    context.getFloatingProps(props);
  const children = floatingPropsChildren as React.ReactNode;
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
            delay: context.hoverDirection.includes("top")
              ? totalDelay * 2
              : totalDelay,
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
            className={`${"tooltip"} ${blockType ? "block" : ""} ${className ?? ""}`}
            ref={ref}
            style={context.floatingStyles}
            {...tooltipMotionProps}
            {...floatingProps}
          >
            {blockType && <TooltipBlocks context={context} />}
            <motion.div className={"content"} {...contentMotionProps}>
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {blockType && (
        <AnimatePresence>
          {context.open && <TooltipLines context={context} />}
        </AnimatePresence>
      )}
    </FloatingPortal>
  );
});

TooltipContent.displayName = "TooltipContent";

const easeInOutQuint = (x: number) => {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
};

const TooltipLines = ({ context }: { context: ContextType }) => {
  const floatingEl = context?.elements.floating;

  if (!floatingEl || !context.x || !context.y) return null;

  return (
    <>
      <motion.div
        className={`${"line"} ${"lineH"}`}
        initial={{ opacity: 0, top: -1 }}
        animate={{ opacity: 1, top: context.y }}
        exit={{ opacity: 0, top: -1 }}
        transition={{
          ease: easeInOutQuint,
          duration: 1,
        }}
      />
      <motion.div
        className={`${"line"} ${"lineH"}`}
        initial={{ opacity: 0, top: "100dvh" }}
        animate={{ opacity: 1, top: context.y + floatingEl.offsetHeight }}
        exit={{ opacity: 0, top: "100dvh" }}
        transition={{
          ease: easeInOutQuint,
          duration: 1,
        }}
      />
      <motion.div
        className={`${"line"} ${"lineV"}`}
        style={{ height: document.documentElement.scrollHeight }}
        initial={{ opacity: 0, left: -1 }}
        animate={{ opacity: 1, left: context.x }}
        exit={{ opacity: 0, left: -1 }}
        transition={{
          ease: easeInOutQuint,
          duration: 1,
        }}
      />
      <motion.div
        className={`${"line"} ${"lineV"}`}
        style={{ height: document.documentElement.scrollHeight }}
        initial={{ opacity: 0, left: "100dvw" }}
        animate={{ opacity: 1, left: context.x + floatingEl.offsetWidth }}
        exit={{ opacity: 0, left: "100dvw" }}
        transition={{
          ease: easeInOutQuint,
          duration: 1,
        }}
      />
    </>
  );
};

const cols = 11;
const rows = 8;
const duration = 0.07;
const baseDelay = duration / 2;
const blocks = Array.from({ length: cols * rows }, (_, i) => i);

const calculateDelay = (n: number) =>
  baseDelay * Math.floor(n / cols) + baseDelay * (n % cols);

// Calculate total delay for the default top direction
const totalDelay = calculateDelay(cols * rows);

const TooltipBlocks = ({ context }: { context: ContextType }) => {
  if (!context?.x || !context?.y) return null;

  const getDirectionalDelay = (n: number) => {
    const row = Math.floor(n / cols);
    const col = n % cols;

    switch (context.hoverDirection) {
      case "left":
        // Animate from left edge outward
        return baseDelay * col + baseDelay * row;
      case "right":
        // Animate from right edge outward
        return baseDelay * (cols - 1 - col) + baseDelay * row;
      case "top-center":
        // Animate from top-center outward
        const centerCol = Math.floor(cols / 2);
        const distanceFromCenter = Math.abs(col - centerCol);
        return baseDelay * row + baseDelay * distanceFromCenter;
      case "bottom-center":
        // Animate from bottom-center outward
        const bottomCenterCol = Math.floor(cols / 2);
        const distanceFromBottomCenter = Math.abs(col - bottomCenterCol);
        return (
          baseDelay * (rows - 1 - row) + baseDelay * distanceFromBottomCenter
        );
      case "top-left":
        // Animate from top-left outward
        return baseDelay * row + baseDelay * col;
      case "top-right":
        // Animate from top-right outward
        return baseDelay * row + baseDelay * (cols - 1 - col);
      case "bottom-left":
        // Animate from bottom-left outward
        return baseDelay * (rows - 1 - row) + baseDelay * col;
      case "bottom-right":
        // Animate from bottom-right outward
        return baseDelay * (rows - 1 - row) + baseDelay * (cols - 1 - col);
      default:
        // Fallback to top-center behavior
        const fallbackCenterCol = Math.floor(cols / 2);
        const fallbackDistanceFromCenter = Math.abs(col - fallbackCenterCol);
        return baseDelay * row + baseDelay * fallbackDistanceFromCenter;
    }
  };

  return (
    <div
      className={`${"blocksContainer"}`}
      style={{ "--cols": cols, "--rows": rows } as React.CSSProperties}
    >
      {blocks.map((i) => (
        <motion.div
          key={i}
          className={`${"block"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration,
            delay: getDirectionalDelay(i),
          }}
        />
      ))}
    </div>
  );
};
