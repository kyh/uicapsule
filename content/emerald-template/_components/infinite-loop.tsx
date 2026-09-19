import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "cn";

export const InfiniteLooper = ({
  speed = 70,
  direction = "right",
  children,
  className,
  containerClassName,
}: {
  speed?: number;
  direction?: "right" | "left";
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const [animating, setAnimating] = useState(true);
  const [looperInstances, setLooperInstances] = useState(1);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const restartTimeoutRef = useRef(0);

  const setupInstances = useCallback(() => {
    const inner = innerRef.current;
    const outer = outerRef.current;
    if (!inner || !outer) {
      return;
    }

    const { width } = inner.getBoundingClientRect();
    const { width: parentWidth } = outer.getBoundingClientRect();

    const widthDeficit = parentWidth - width;
    const instanceWidth = width / inner.children.length;

    if (widthDeficit) {
      setLooperInstances(looperInstances + Math.ceil(widthDeficit / instanceWidth) + 1);
    }

    // Drop and re-add the animation class so every instance restarts in phase.
    setAnimating(false);
    window.clearTimeout(restartTimeoutRef.current);
    restartTimeoutRef.current = window.setTimeout(() => setAnimating(true), 10);
  }, [looperInstances]);

  useEffect(() => {
    setupInstances();
    window.addEventListener("resize", setupInstances);

    return () => {
      window.removeEventListener("resize", setupInstances);
      window.clearTimeout(restartTimeoutRef.current);
    };
  }, [setupInstances]);

  return (
    <div className={cn("w-full overflow-hidden", containerClassName)} ref={outerRef}>
      <div className={cn("flex w-fit justify-center", className)} ref={innerRef}>
        {Array.from({ length: looperInstances }, (_, index) => (
          <div
            key={index}
            className={cn("flex w-max", animating && "animate-slide-across")}
            style={{
              animationDirection: direction === "right" ? "reverse" : "normal",
              animationDuration: `${speed}s`,
            }}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
};
