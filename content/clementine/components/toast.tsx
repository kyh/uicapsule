import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import "./toast.css";

const noop = () => null;

interface ToastInput {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

interface ToastState extends ToastInput {
  id: number;
}

const ToastContext = createContext<{ show: (toast: ToastInput) => void } | null>(null);

/** Returns `show`, which replaces any toast on screen. A toast waits while it is hovered or focused. */
export const useToast = () => {
  const ctx = use(ToastContext);

  if (!ctx) {
    throw new Error("useToast needs a ToastProvider");
  }

  return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const seq = useRef(0);

  const show = useCallback((input: ToastInput) => {
    seq.current += 1;
    setLeaving(false);
    setToast({ ...input, id: seq.current });
  }, []);

  useEffect(() => {
    if (!toast || paused) {
      return noop;
    }

    const hide = window.setTimeout(
      () => {
        setLeaving(true);
      },
      toast.action ? 8000 : 5000,
    );

    return () => {
      window.clearTimeout(hide);
    };
  }, [toast, paused]);

  useEffect(() => {
    if (!leaving) {
      return noop;
    }

    const remove = window.setTimeout(() => {
      setToast(null);
    }, 160);

    return () => {
      window.clearTimeout(remove);
    };
  }, [leaving]);

  const card = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      return;
    }

    const hold = () => {
      setPaused(true);
    };

    const release = (event: Event) => {
      const next = event instanceof FocusEvent ? event.relatedTarget : null;

      if (!(next instanceof Node && node.contains(next)) && !node.matches(":hover")) {
        setPaused(false);
      }
    };

    node.addEventListener("pointerenter", hold);
    node.addEventListener("pointerleave", release);
    node.addEventListener("focusin", hold);
    node.addEventListener("focusout", release);

    return () => {
      node.removeEventListener("pointerenter", hold);
      node.removeEventListener("pointerleave", release);
      node.removeEventListener("focusin", hold);
      node.removeEventListener("focusout", release);
      setPaused(false);
    };
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext value={value}>
      {children}
      <output aria-live="polite" className="cl-toaster">
        {toast ? (
          <div className="cl-toast" data-leaving={leaving || undefined} key={toast.id} ref={card}>
            <div className="cl-toast__text">
              <p className="cl-toast__title">{toast.title}</p>
              {toast.description !== undefined && toast.description !== "" ? (
                <p className="cl-toast__desc">{toast.description}</p>
              ) : null}
            </div>
            {toast.action ? (
              <button
                className="cl-toast__action"
                onClick={() => {
                  setLeaving(true);
                  toast.action?.onClick();
                }}
                type="button"
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
        ) : null}
      </output>
    </ToastContext>
  );
};
