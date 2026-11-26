import { X } from "lucide-react";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "./button";
import { Icon } from "./icon";
import { StatusMark } from "./status";
import type { RunStatus } from "./status";

interface ToastItem {
  id: number;
  status: RunStatus;
  title: string;
  detail?: string;
}

type Push = (toast: Omit<ToastItem, "id">) => void;

const ToastContext = createContext<Push | null>(null);

/** Returns `push`, which shows a toast in the corner for five seconds. */
export const useToast = () => {
  const push = use(ToastContext);

  if (!push) {
    throw new Error("useToast needs a ToastProvider above it.");
  }

  return push;
};

const ToastRow = ({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss(item.id);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [item.id, onDismiss]);

  return (
    <li className="hx-toast">
      <StatusMark status={item.status} />
      <div className="hx-stack hx-gap-half">
        <span className="hx-body-sm">{item.title}</span>
        {item.detail !== undefined && item.detail !== "" ? (
          <span className="hx-code-sm hx-ink-3">{item.detail}</span>
        ) : null}
      </div>
      <Button
        aria-label="Dismiss"
        onClick={() => {
          onDismiss(item.id);
        }}
        size="icon-sm"
        variant="ghost"
      >
        <Icon icon={X} />
      </Button>
    </li>
  );
};

/** Holds the toast region. Renders inside the system's scope so toasts keep its tokens. */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback<Push>((toast) => {
    const id = nextId.current;

    nextId.current += 1;
    setItems((current) => [...current.slice(-2), { ...toast, id }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext value={value}>
      {children}
      <ol aria-label="Notifications" aria-live="polite" className="hx-toasts">
        {items.map((item) => (
          <ToastRow item={item} key={item.id} onDismiss={dismiss} />
        ))}
      </ol>
    </ToastContext>
  );
};
