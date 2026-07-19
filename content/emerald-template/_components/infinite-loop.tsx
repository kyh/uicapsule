import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

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

  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setupInstances = useCallback(() => {
    const inner = innerRef.current;
    const outer = outerRef.current;
    if (!inner || !outer) return;

    const { width } = inner.getBoundingClientRect();
    const { width: parentWidth } = outer.getBoundingClientRect();

    const widthDeficit = parentWidth - width;
    const instanceWidth = width / inner.children.length;

    if (widthDeficit) {
      setLooperInstances(looperInstances + Math.ceil(widthDeficit / instanceWidth) + 1);
    }

    // Drop and re-add the animation class so every instance restarts in phase.
    setAnimating(false);
    clearTimeout(restartTimeoutRef.current);
    restartTimeoutRef.current = setTimeout(() => setAnimating(true), 10);
  }, [looperInstances]);

  useEffect(() => {
    setupInstances();
    window.addEventListener("resize", setupInstances);

    return () => {
      window.removeEventListener("resize", setupInstances);
      clearTimeout(restartTimeoutRef.current);
    };
  }, [setupInstances]);

  return (
    <div className={cn("w-full overflow-hidden", containerClassName)} ref={outerRef}>
      <div className={cn("flex w-fit justify-center", className)} ref={innerRef}>
        {[...Array(looperInstances)].map((_, index) => (
          <div
            key={index}
            className={cn("flex w-max", animating && "animate-slide-across")}
            style={{
              animationDuration: `${speed}s`,
              animationDirection: direction === "right" ? "reverse" : "normal",
            }}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
};
