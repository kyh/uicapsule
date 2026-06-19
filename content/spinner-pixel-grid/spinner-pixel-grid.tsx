"use client";

import {
  forwardRef,
  useEffect,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { cn } from "@repo/ui/lib/utils";

import "./spinner-pixel-grid.css";

const variants = [
  "default",
  "wave",
  "cascade",
  "spiral",
  "vortex",
  "chase",
  "frame",
  "rain",
  "scan",
  "ripple",
  "diamond",
  "star",
  "saltire",
  "crosshair",
  "corners",
  "checker",
  "snake",
  "radar",
  "pulse",
  "heart",
] as const;

type SpinnerVariant = (typeof variants)[number];

type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  /** Pixel size of each dot. */
  size?: number;
  /** Number of dots per row/column. */
  gridSize?: number;
  variant?: SpinnerVariant;
  /** Dot color. Any CSS color; defaults to the inherited text color. */
  color?: string;
  /** Animation speed multiplier. 2 = twice as fast, 0.5 = half speed. */
  speed?: number;
  /** Cycle the hue of every dot for a rainbow effect. */
  rainbow?: boolean;
  /** Accessible label announced by screen readers. */
  ariaLabel?: string;
};

// Respect the user's reduced-motion preference.
const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
};

// Heart shape mask via the implicit heart curve, normalized to the grid.
const isHeartPixel = (x: number, y: number, gridSize: number): boolean => {
  const center = (gridSize - 1) / 2;
  const nx = (x - center) / (gridSize * 0.48);
  const ny = (center - y) / (gridSize * 0.34) + 0.05;
  return Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * Math.pow(ny, 3) <= 0;
};

// Get animation delay (in seconds) based on variant and position
const getAnimationDelay = (
  variant: SpinnerVariant,
  x: number,
  y: number,
  gridSize: number,
): number => {
  const center = (gridSize - 1) / 2;

  switch (variant) {
    case "default":
      // Diagonal wave from top-left
      return 0.05 * (x + y);

    case "wave":
      // Horizontal wave
      return 0.1 * x;

    case "cascade":
      // Vertical wave, top to bottom
      return 0.12 * y;

    case "spiral": {
      // Spiral from center outward
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
      return distance * 0.15 + normalizedAngle * 0.3;
    }

    case "vortex": {
      // Rotating arm that also pulses radially
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
      return normalizedAngle * 1.2 + distance * 0.1;
    }

    case "chase": {
      // Chase around the perimeter
      const isTop = y === 0;
      const isBottom = y === gridSize - 1;
      const isLeft = x === 0;
      const isRight = x === gridSize - 1;
      const isEdge = isTop || isBottom || isLeft || isRight;

      if (!isEdge) return 0;

      let order = 0;
      if (isTop) order = x;
      else if (isRight) order = gridSize - 1 + y;
      else if (isBottom) order = 2 * (gridSize - 1) + (gridSize - 1 - x);
      else if (isLeft) order = 3 * (gridSize - 1) + (gridSize - 1 - y);

      const perimeter = 4 * (gridSize - 1);
      return (order / perimeter) * 0.8;
    }

    case "frame":
      // Whole border pulses together
      return 0;

    case "rain":
      // Rain falling from top, each column offset
      return y * 0.1 + x * 0.05;

    case "scan":
      // Sharp scanline sweeping downward
      return y * 0.15;

    case "ripple": {
      // Concentric rings radiating from the center
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance * 0.18;
    }

    case "diamond": {
      // Diamond-shaped rings (manhattan distance) from the center
      const manhattan = Math.abs(x - center) + Math.abs(y - center);
      return manhattan * 0.12;
    }

    case "star": {
      // Star pattern - radiates outward from center along cross and diagonals
      const centerIdx = Math.floor(gridSize / 2);
      const dx = x - centerIdx;
      const dy = y - centerIdx;
      const isCross = x === centerIdx || y === centerIdx;
      const isDiagonal = Math.abs(dx) === Math.abs(dy);
      if (!isCross && !isDiagonal) return 0;

      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      return dist * 0.12;
    }

    case "saltire": {
      // Diagonal cross (X) radiating from the center
      const centerIdx = Math.floor(gridSize / 2);
      const dist = Math.max(Math.abs(x - centerIdx), Math.abs(y - centerIdx));
      return dist * 0.12;
    }

    case "crosshair": {
      // Center row and column animate outward from center
      const centerIdx = Math.floor(gridSize / 2);
      const isCenterRow = y === centerIdx;
      const isCenterCol = x === centerIdx;
      if (!isCenterRow && !isCenterCol) return 0;

      const distFromCenter = isCenterRow
        ? Math.abs(x - centerIdx)
        : Math.abs(y - centerIdx);
      return distFromCenter * 0.1;
    }

    case "corners": {
      // Collapse inward from all four corners
      const last = gridSize - 1;
      const cornerPoints: [number, number][] = [
        [0, 0],
        [last, 0],
        [0, last],
        [last, last],
      ];
      let nearest = Infinity;
      for (const [cx, cy] of cornerPoints) {
        const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
        if (d < nearest) nearest = d;
      }
      return nearest * 0.15;
    }

    case "checker":
      // Alternating checkerboard pulse
      return ((x + y) % 2) * 0.5;

    case "snake": {
      // Snake pattern (alternating direction per row)
      const effectiveX = y % 2 === 0 ? x : gridSize - 1 - x;
      return (y * gridSize + effectiveX) * 0.05;
    }

    case "radar": {
      // Radar sweep around the center
      const angle = Math.atan2(y - center, x - center);
      const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
      return normalizedAngle * 1.2;
    }

    case "pulse":
      // Every dot breathes together
      return 0;

    case "heart":
      // Whole heart beats together
      return 0;

    default:
      return 0.05 * (x + y);
  }
};

// Get animation name for variant
const getAnimationName = (variant: SpinnerVariant): string => {
  switch (variant) {
    case "chase":
    case "frame":
    case "scan":
    case "radar":
    case "vortex":
      return "pixel-chase";
    case "rain":
      return "pixel-rain";
    case "crosshair":
      return "pixel-crosshair";
    case "heart":
      return "pixel-beat";
    default:
      return "pixel-scale";
  }
};

// Get animation duration (in seconds) for variant
const getAnimationDuration = (variant: SpinnerVariant): number => {
  switch (variant) {
    case "chase":
    case "rain":
      return 0.8;
    case "crosshair":
      return 0.6;
    case "snake":
      return 1.5;
    case "scan":
    case "radar":
    case "vortex":
      return 1.2;
    case "heart":
      return 1.2;
    default:
      return 1;
  }
};

// Check if pixel should be visible for certain variants
const shouldShowPixel = (
  variant: SpinnerVariant,
  x: number,
  y: number,
  gridSize: number,
): boolean => {
  if (variant === "chase" || variant === "frame") {
    const isTop = y === 0;
    const isBottom = y === gridSize - 1;
    const isLeft = x === 0;
    const isRight = x === gridSize - 1;
    return isTop || isBottom || isLeft || isRight;
  }

  if (variant === "star") {
    const centerIdx = Math.floor(gridSize / 2);
    const dx = x - centerIdx;
    const dy = y - centerIdx;
    const isCross = x === centerIdx || y === centerIdx;
    const isDiagonal = Math.abs(dx) === Math.abs(dy);
    const isCorner =
      (x === 0 || x === gridSize - 1) && (y === 0 || y === gridSize - 1);
    return (isCross || isDiagonal) && !isCorner;
  }

  if (variant === "saltire") {
    const centerIdx = Math.floor(gridSize / 2);
    return Math.abs(x - centerIdx) === Math.abs(y - centerIdx);
  }

  if (variant === "crosshair") {
    const centerIdx = Math.floor(gridSize / 2);
    return x === centerIdx || y === centerIdx;
  }

  if (variant === "heart") {
    return isHeartPixel(x, y, gridSize);
  }

  return true;
};

export const SpinnerPixelGrid = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      className,
      size = 8,
      gridSize = 3,
      variant = "default",
      color = "currentColor",
      speed = 1,
      rainbow = false,
      ariaLabel = "Loading",
      ...props
    },
    ref,
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const animate = !prefersReducedMotion;
    const safeSpeed = speed > 0 ? speed : 1;

    const squareSize = `${size}px`;
    const gridArray = Array.from({ length: gridSize }, (_, i) => i);

    const animationName = getAnimationName(variant);
    const duration = getAnimationDuration(variant) / safeSpeed;
    const hueRotate = `hue-rotate ${10 / safeSpeed}s linear infinite`;

    return (
      <div
        ref={ref}
        role="status"
        aria-label={ariaLabel}
        className={cn("inline-flex flex-col gap-0", className)}
        style={
          {
            "--square-size": squareSize,
            "--spinner-color": color,
          } as CSSProperties
        }
        {...props}
      >
        {gridArray.map((y) => (
          <div key={y} className="flex gap-0">
            {gridArray.map((x) => {
              const show = shouldShowPixel(variant, x, y, gridSize);
              const delay = getAnimationDelay(variant, x, y, gridSize) / safeSpeed;
              return (
                <div
                  key={x}
                  className="relative inline-block"
                  style={{
                    width: "var(--square-size)",
                    height: "var(--square-size)",
                    animation: rainbow && animate ? hueRotate : undefined,
                  }}
                >
                  {show && (
                    <div
                      className="absolute top-0 left-0"
                      style={{
                        width: "var(--square-size)",
                        height: "var(--square-size)",
                        backgroundColor: "var(--spinner-color)",
                        boxShadow:
                          "0 0 10px var(--spinner-color), 0 0 20px var(--spinner-color), 0 0 40px var(--spinner-color)",
                        animation: animate
                          ? `${animationName} ${duration}s linear infinite`
                          : undefined,
                        animationDelay: animate ? `${delay}s` : undefined,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  },
);

SpinnerPixelGrid.displayName = "SpinnerPixelGrid";

export { variants as spinnerVariants };
export type { SpinnerVariant };
