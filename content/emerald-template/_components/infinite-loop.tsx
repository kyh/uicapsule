import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@repo/ui/utils";

export const InfiniteLooper = ({
  speed = 70,
  direction = "right",
  children,
  className,
  containerClassName,
}: {
  speed?: number;
  direction?: "right" | "left";
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const [animating, setAnimating] = useState(true);
  const [looperInstances, setLooperInstances] = useState(1);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const setupInstances = useCallback(() => {
    if (!innerRef?.current || !outerRef?.current) return;

    const resetAnimation = () => {
      if (innerRef?.current) {
        setAnimating(false);

        setTimeout(() => {
          if (innerRef?.current) {
            setAnimating(true);
          }
        }, 10);
      }
    };

    const { width } = innerRef.current.getBoundingClientRect();
    const { width: parentWidth } = outerRef.current.getBoundingClientRect();

    const widthDeficit = parentWidth - width;
    const instanceWidth = width / innerRef.current.children.length;

    if (widthDeficit) {
      setLooperInstances(
        looperInstances + Math.ceil(widthDeficit / instanceWidth) + 1,
      );
    }

    resetAnimation();
  }, [looperInstances]);

  useEffect(() => setupInstances(), [setupInstances]);

  useEffect(() => {
    window.addEventListener("resize", setupInstances);

    return () => {
      window.removeEventListener("resize", setupInstances);
    };
  }, [looperInstances, setupInstances]);

  return (
    <div
      className={cn("w-full overflow-hidden", containerClassName)}
      ref={outerRef}
    >
      <div
        className={cn("flex w-fit justify-center", className)}
        ref={innerRef}
      >
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
