import { useEffect, useRef, useState } from "react";

/** Measures an element's content width so a chart draws at real pixels and its type never scales. */
export const useWidth = <T extends HTMLElement>(fallback = 560) => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setWidth(Math.max(200, Math.round(entry.contentRect.width)));
      }
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
};
