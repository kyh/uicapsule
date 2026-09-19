"use client";

import type { ComponentProps, ReactNode } from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { AnimatePresence, motion } from "motion/react";
import type { Transition } from "motion/react";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";

import { cn } from "cn";

// Hidden toasts stay mounted so promotion into the visible stack animates.
const MAX_VISIBLE = 3;
const STACK_OFFSET_Y = 10;
const STACK_SCALE = 0.06;
const STACK_OPACITY = 0.2;
const STAGGER_INTERVAL = 0.02;
const TOAST_SPRING = { damping: 30, stiffness: 400, type: "spring" } satisfies Transition;

type ToastType = "default" | "success" | "error" | "warning" | "info" | "loading";

interface ToastData {
  icon?: ReactNode;
}

interface ToastOptions {
  /** Reusing an id updates that toast in place — e.g. loading → success. */
  id?: string;
  description?: ReactNode;
  icon?: ReactNode;
  /** Milliseconds before auto-dismiss. `0` keeps the toast until closed. */
  duration?: number;
}

const manager = ToastPrimitive.createToastManager<ToastData>();

const add = (type: ToastType, title: ReactNode, options?: ToastOptions) =>
  manager.add({
    data: { icon: options?.icon },
    description: options?.description,
    id: options?.id,
    timeout: options?.duration,
    title,
    type,
  });

const toast = Object.assign(
  (title: ReactNode, options?: ToastOptions) => add("default", title, options),
  {
    dismiss: (id?: string) => manager.close(id),
    error: (title: ReactNode, options?: ToastOptions) => add("error", title, options),
    info: (title: ReactNode, options?: ToastOptions) => add("info", title, options),
    loading: (title: ReactNode, options?: ToastOptions) =>
      add("loading", title, { duration: 0, ...options }),
    success: (title: ReactNode, options?: ToastOptions) => add("success", title, options),
    warning: (title: ReactNode, options?: ToastOptions) => add("warning", title, options),
  },
);

const TYPE_ICONS = {
  default: null,
  error: <OctagonXIcon className="size-4" />,
  info: <InfoIcon className="size-4" />,
  loading: <Loader2Icon className="size-4 animate-spin" />,
  success: <CircleCheckIcon className="size-4" />,
  warning: <TriangleAlertIcon className="size-4" />,
} satisfies Record<ToastType, ReactNode>;

const isToastType = (type: string | undefined): type is ToastType =>
  type !== undefined && type in TYPE_ICONS;

const ToastIcon = ({
  toast: toastObject,
}: {
  toast: ToastPrimitive.Root.ToastObject<ToastData>;
}) => {
  const icon =
    toastObject.data?.icon ?? (isToastType(toastObject.type) ? TYPE_ICONS[toastObject.type] : null);
  if (!icon) {
    return null;
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        toastObject.type === "success" && "text-primary",
        toastObject.type === "error" && "text-destructive",
      )}
    >
      {icon}
    </span>
  );
};

const ToastItem = ({
  toast: toastObject,
  index,
}: {
  toast: ToastPrimitive.Root.ToastObject<ToastData>;
  index: number;
}) => {
  const isVisible = index < MAX_VISIBLE;

  return (
    <ToastPrimitive.Root
      toast={toastObject}
      data-slot="toast"
      render={
        <motion.div
          className="pointer-events-auto absolute bottom-0 left-0 flex w-full origin-bottom items-center gap-3 rounded-xl border bg-popover p-4 text-sm text-popover-foreground shadow-lg will-change-transform"
          style={{
            pointerEvents: isVisible ? "auto" : "none",
            zIndex: MAX_VISIBLE - index,
          }}
          initial={{ opacity: 0, scale: 0.85, y: 60 }}
          animate={{
            opacity: isVisible ? 1 - index * STACK_OPACITY : 0,
            scale: 1 - index * STACK_SCALE,
            y: -index * STACK_OFFSET_Y,
          }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2, ease: "easeIn" }, y: 20 }}
          transition={{ ...TOAST_SPRING, delay: index * STAGGER_INTERVAL }}
        />
      }
    >
      <ToastIcon toast={toastObject} />
      <div className="min-w-0 flex-1">
        <ToastPrimitive.Title className="font-medium leading-snug" />
        <ToastPrimitive.Description className="mt-0.5 text-muted-foreground text-xs leading-snug" />
      </div>
      <ToastPrimitive.Close
        aria-label="Dismiss"
        className="text-muted-foreground hover:bg-accent hover:text-foreground -mr-1 flex size-7 shrink-0 items-center justify-center rounded-full transition-colors"
      >
        <XIcon className="size-3.5" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
};

const ToastList = () => {
  const { toasts } = ToastPrimitive.useToastManager<ToastData>();

  return (
    <AnimatePresence initial={false}>
      {toasts.map((toastObject, index) => (
        <ToastItem key={toastObject.id} toast={toastObject} index={index} />
      ))}
    </AnimatePresence>
  );
};

const Toaster = ({ ...props }: ComponentProps<typeof ToastPrimitive.Provider>) => (
  <ToastPrimitive.Provider toastManager={manager} limit={MAX_VISIBLE + 2} {...props}>
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport
        data-slot="toaster"
        className="pointer-events-none fixed bottom-6 left-1/2 z-100 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 outline-none"
      >
        <ToastList />
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  </ToastPrimitive.Provider>
);

export { Toaster, toast };
