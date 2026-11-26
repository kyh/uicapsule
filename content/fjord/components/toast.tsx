import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { CircleCheck, OctagonX, TriangleAlert, X } from "lucide-react";

import { Button } from "./button";
import { Icon } from "./icon";

const noop = () => null;

export interface ToastInput {
  title: string;
  description?: string;
  status?: "ok" | "warn" | "fail";
  action?: { label: string; onSelect: () => void };
}

interface ToastEntry extends ToastInput {
  id: number;
}

const READ_BASE = 2500;
const READ_PER_CHAR = 55;
const READ_ACTION = 3000;
const READ_MIN = 4000;
const READ_MAX = 12_000;

/** How long a toast stays: a base, plus time per character, plus time to reach an action. */
export const readingTime = (toast: ToastInput) => {
  const characters = toast.title.length + (toast.description?.length ?? 0);
  const total = READ_BASE + characters * READ_PER_CHAR + (toast.action ? READ_ACTION : 0);

  return Math.min(READ_MAX, Math.max(READ_MIN, total));
};

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export const useToast = () => {
  const push = useContext(ToastContext);

  return (toast: ToastInput) => push?.(toast);
};

const STATUS_ICON = { fail: OctagonX, ok: CircleCheck, warn: TriangleAlert } as const;

const ToastItem = ({
  toast,
  onDismiss,
}: {
  toast: ToastEntry;
  onDismiss: (id: number) => void;
}) => {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(readingTime(toast));
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return noop;
    }

    const hold = () => {
      setPaused(true);
    };

    const release = () => {
      setPaused(false);
    };

    const events = [
      ["pointerenter", hold],
      ["focusin", hold],
      ["pointerleave", release],
      ["focusout", release],
    ] as const;

    for (const [name, handler] of events) {
      node.addEventListener(name, handler);
    }

    return () => {
      for (const [name, handler] of events) {
        node.removeEventListener(name, handler);
      }
    };
  }, []);

  useEffect(() => {
    if (paused) {
      return noop;
    }

    const started = Date.now();

    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, remaining.current);

    return () => {
      remaining.current -= Date.now() - started;
      window.clearTimeout(timer);
    };
  }, [paused, onDismiss, toast.id]);

  return (
    <li className="fj-overlay fj-toast" data-status={toast.status} ref={ref}>
      <Icon icon={STATUS_ICON[toast.status ?? "ok"]} />
      <div className="fj-toast-body">
        <p className="fj-toast-title">{toast.title}</p>
        {toast.description !== undefined && toast.description !== "" ? (
          <p className="fj-toast-text">{toast.description}</p>
        ) : null}
      </div>
      {toast.action ? (
        <Button
          onClick={() => {
            toast.action?.onSelect();
            onDismiss(toast.id);
          }}
          size="xs"
        >
          {toast.action.label}
        </Button>
      ) : null}
      <Button
        aria-label="Dismiss"
        onClick={() => {
          onDismiss(toast.id);
        }}
        size="icon-xs"
        variant="ghost"
      >
        <Icon icon={X} />
      </Button>
    </li>
  );
};

/** Holds the toasts for the page; they stack bottom right, appear without growing and wait while hovered. */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(1);

  const push = useCallback((toast: ToastInput) => {
    const id = nextId.current;

    nextId.current += 1;
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section aria-label="Notifications" aria-live="polite">
        <ol className="fj-toaster">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} onDismiss={dismiss} toast={toast} />
          ))}
        </ol>
      </section>
    </ToastContext.Provider>
  );
};
