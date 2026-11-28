import { createContext, use, useEffect, useState } from "react";
import type { ReactNode } from "react";

const RootContext = createContext<HTMLElement | null>(null);

/**
 * The inspector's own element: everything the inspector renders lives inside it, and the picker
 * skips it (and, inside a shadow root, its host) when it looks for the element under the pointer.
 */
export const Inspector = ({
  capturing,
  children,
}: {
  capturing?: boolean;
  children: ReactNode;
}) => {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  return (
    <div
      ref={setRoot}
      className="uic-inspector"
      data-capturing={capturing === true ? "" : undefined}
    >
      <RootContext value={root}>{children}</RootContext>
    </div>
  );
};

/** Whether `element` is the inspector itself rather than the page under it. */
export const useIsOwnElement = () => {
  const root = use(RootContext);

  return (element: Element) => {
    if (!root) {
      return false;
    }

    const container = root.getRootNode();
    const host = container instanceof ShadowRoot ? container.host : null;

    return element === host || root.contains(element);
  };
};

/** Re-renders on every scroll or resize, once per frame, for anything drawn over page content. */
export const useViewportTick = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let frame = 0;

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setTick((value) => value + 1);
      });
    };

    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return tick;
};
