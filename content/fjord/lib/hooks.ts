import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

const noop = () => null;

export const useInterval = (callback: () => void, delay: number | null) => {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return noop;
    }

    const id = window.setInterval(() => {
      saved.current();
    }, delay);

    return () => {
      window.clearInterval(id);
    };
  }, [delay]);
};

export const useInView = (ref: RefObject<Element | null>) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;

    if (!node || typeof IntersectionObserver === "undefined") {
      return noop;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry?.isIntersecting ?? true);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return visible;
};

export const useDismiss = (
  open: boolean,
  onDismiss: () => void,
  refs: RefObject<HTMLElement | null>[],
) => {
  const saved = useRef(onDismiss);
  const savedRefs = useRef(refs);

  useEffect(() => {
    saved.current = onDismiss;
    savedRefs.current = refs;
  });

  useEffect(() => {
    if (!open) {
      return noop;
    }

    const onPointer = (event: PointerEvent) => {
      const { target } = event;

      if (!(target instanceof Node)) {
        return;
      }

      const inside = savedRefs.current.some((ref) => ref.current?.contains(target) === true);

      if (!inside) {
        saved.current();
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        saved.current();
      }
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
};

export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setReduced(query.matches);
    };

    update();
    query.addEventListener("change", update);

    return () => {
      query.removeEventListener("change", update);
    };
  }, []);

  return reduced;
};
