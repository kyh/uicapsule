"use client";

import { CircleCheck, CircleX } from "lucide-react";
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

import { Button } from "./button";

const noop = () => null;

interface ToastInput {
  title: string;
  tone?: "ok" | "fail";
  action?: { label: string; onAction: () => void };
}

interface ToastEntry extends ToastInput {
  id: number;
}

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

/** Shows a toast from anywhere under the ToastProvider. */
export const useToast = () => {
  const push = useContext(ToastContext);

  return (toast: ToastInput) => {
    push?.(toast);
  };
};

const readingTime = (title: string) => Math.max(4000, title.split(" ").length * 300 + 2500);

const ToastItem = ({ toast, onClose }: { toast: ToastEntry; onClose: (id: number) => void }) => {
  const [paused, setPaused] = useState(false);
  const held = toast.tone === "fail";

  useEffect(() => {
    if (paused || held) {
      return noop;
    }

    const id = window.setTimeout(() => {
      onClose(toast.id);
    }, readingTime(toast.title));

    return () => {
      window.clearTimeout(id);
    };
  }, [paused, held, onClose, toast.id, toast.title]);

  return (
    <div
      className="v-toast v-overlay"
      onBlur={() => {
        setPaused(false);
      }}
      onFocus={() => {
        setPaused(true);
      }}
      onPointerEnter={() => {
        setPaused(true);
      }}
      onPointerLeave={() => {
        setPaused(false);
      }}
      role={held ? "alert" : "status"}
    >
      {toast.tone === "ok" ? <CircleCheck aria-hidden className="v-ok-text" /> : null}
      {toast.tone === "fail" ? <CircleX aria-hidden className="v-fail-text" /> : null}
      <p className="v-body-sm v-t1 v-grow">{toast.title}</p>
      {toast.action ? (
        <Button
          onClick={() => {
            toast.action?.onAction();
            onClose(toast.id);
          }}
          size="sm"
          variant="secondary"
        >
          {toast.action.label}
        </Button>
      ) : null}
      {held || !toast.action ? (
        <Button
          onClick={() => {
            onClose(toast.id);
          }}
          size="sm"
          variant="ghost"
        >
          Close
        </Button>
      ) : null}
    </div>
  );
};

/** One host for every toast on the page, newest last, at most three. */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const next = useRef(0);

  const close = useCallback((id: number) => {
    setToasts((list) => list.filter((entry) => entry.id !== id));
  }, []);

  const push = useCallback((toast: ToastInput) => {
    next.current += 1;
    const entry: ToastEntry = { ...toast, id: next.current };

    setToasts((list) => [...list, entry].slice(-3));
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section aria-label="Notifications" className="v-toaster">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} onClose={close} toast={toast} />
        ))}
      </section>
    </ToastContext.Provider>
  );
};
