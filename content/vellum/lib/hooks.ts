"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import type { RefObject } from "react";

const noop = () => null;

/** Re-renders every `interval` ms while `active`, returning the current time. */
export const useNow = (interval = 1000, active = true) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return noop;
    }

    const id = window.setInterval(() => {
      setNow(Date.now());
    }, interval);

    return () => {
      window.clearInterval(id);
    };
  }, [interval, active]);

  return now;
};

/** Copies text to the clipboard and reports `copied` for a moment after. */
export const useCopy = (resetAfter = 1600) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const area = document.createElement("textarea");

        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.append(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }

      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setCopied(false);
      }, resetAfter);
    },
    [resetAfter],
  );

  return { copied, copy };
};

/** Shuts an anchored overlay when Escape is pressed or a pointer lands outside `ref`. */
export const useDismiss = (
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void,
) => {
  const dismiss = useEffectEvent(onDismiss);

  useEffect(() => {
    if (!open) {
      return noop;
    }

    const onPointer = (event: PointerEvent) => {
      if (ref.current && event.target instanceof Node && !ref.current.contains(event.target)) {
        dismiss();
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref]);
};

/** Schedules `step` after `delay` ms; anything still pending is cancelled on unmount. */
export const useLater = () => {
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      for (const id of timers.current) {
        window.clearTimeout(id);
      }
    },
    [],
  );

  return useCallback((step: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((value) => value !== id);
      step();
    }, delay);

    timers.current.push(id);
  }, []);
};

/** Formats seconds as `m:ss`. */
export const clock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));

  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
};
