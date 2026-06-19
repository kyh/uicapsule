"use client";

import { forwardRef, useEffect, useState, type CSSProperties, type HTMLAttributes } from "react";
import { cn } from "@repo/ui/lib/utils";

import "./spinner-pixel-grid.css";

type CellValue = (x: number, y: number, gridSize: number) => number;
type CellMask = (x: number, y: number, gridSize: number) => boolean;

interface VariantConfig {
  /** Keyframe animation applied to each visible dot. */
  keyframe: string;
  /** Base animation duration in seconds. */
  duration: number;
  /** Animation delay (seconds) for the dot at (x, y). */
  delay: CellValue;
  /** Which dots are part of the pattern. Defaults to all. */
  mask?: CellMask;
}

// --- Shape masks (which dots make up a variant's pattern) ---

const edgeMask: CellMask = (x, y, g) => x === 0 || y === 0 || x === g - 1 || y === g - 1;

const starMask: CellMask = (x, y, g) => {
  const c = Math.floor(g / 2);
  const isCross = x === c || y === c;
  const isDiagonal = Math.abs(x - c) === Math.abs(y - c);
  const isCorner = (x === 0 || x === g - 1) && (y === 0 || y === g - 1);
  return (isCross || isDiagonal) && !isCorner;
};

const saltireMask: CellMask = (x, y, g) => {
  const c = Math.floor(g / 2);
  return Math.abs(x - c) === Math.abs(y - c);
};

const crosshairMask: CellMask = (x, y, g) => {
  const c = Math.floor(g / 2);
  return x === c || y === c;
};

// Heart shape via the implicit heart curve, normalized to the grid.
const heartMask: CellMask = (x, y, g) => {
  const c = (g - 1) / 2;
  const nx = (x - c) / (g * 0.48);
  const ny = (c - y) / (g * 0.34) + 0.05;
  return Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * Math.pow(ny, 3) <= 0;
};

// Per-variant configuration. Delay functions only run for dots the mask keeps
// visible, so they never need to guard against out-of-pattern positions.
const variantConfigs = {
  // Diagonal wave from the top-left corner
  default: { keyframe: "pixel-scale", duration: 1, delay: (x, y) => 0.05 * (x + y) },
  // Horizontal wave
  wave: { keyframe: "pixel-scale", duration: 1, delay: (x) => 0.1 * x },
  // Vertical wave, top to bottom
  cascade: { keyframe: "pixel-scale", duration: 1, delay: (_x, y) => 0.12 * y },
  // Spiral radiating from the center
  spiral: {
    keyframe: "pixel-scale",
    duration: 1,
    delay: (x, y, g) => {
      const c = (g - 1) / 2;
      const distance = Math.hypot(x - c, y - c);
      const normalizedAngle = (Math.atan2(y - c, x - c) + Math.PI) / (2 * Math.PI);
      return distance * 0.15 + normalizedAngle * 0.3;
    },
  },
  // Rotating arm that also pulses radially
  vortex: {
    keyframe: "pixel-chase",
    duration: 1.2,
    delay: (x, y, g) => {
      const c = (g - 1) / 2;
      const distance = Math.hypot(x - c, y - c);
      const normalizedAngle = (Math.atan2(y - c, x - c) + Math.PI) / (2 * Math.PI);
      return normalizedAngle * 1.2 + distance * 0.1;
    },
  },
  // Chase around the perimeter
  chase: {
    keyframe: "pixel-chase",
    duration: 0.8,
    mask: edgeMask,
    delay: (x, y, g) => {
      const last = g - 1;
      let order = 0;
      if (y === 0) order = x;
      else if (x === last) order = last + y;
      else if (y === last) order = 2 * last + (last - x);
      else order = 3 * last + (last - y);
      return (order / (4 * last)) * 0.8;
    },
  },
  // Whole border pulses together
  frame: { keyframe: "pixel-chase", duration: 1, mask: edgeMask, delay: () => 0 },
  // Rain falling from the top, each column offset
  rain: { keyframe: "pixel-rain", duration: 0.8, delay: (x, y) => y * 0.1 + x * 0.05 },
  // Sharp scanline sweeping downward
  scan: { keyframe: "pixel-chase", duration: 1.2, delay: (_x, y) => y * 0.15 },
  // Concentric rings radiating from the center
  ripple: {
    keyframe: "pixel-scale",
    duration: 1,
    delay: (x, y, g) => {
      const c = (g - 1) / 2;
      return Math.hypot(x - c, y - c) * 0.18;
    },
  },
  // Diamond-shaped rings (manhattan distance) from the center
  diamond: {
    keyframe: "pixel-scale",
    duration: 1,
    delay: (x, y, g) => {
      const c = (g - 1) / 2;
      return (Math.abs(x - c) + Math.abs(y - c)) * 0.12;
    },
  },
  // Cross + diagonals radiating from the center
  star: {
    keyframe: "pixel-scale",
    duration: 1,
    mask: starMask,
    delay: (x, y, g) => {
      const c = Math.floor(g / 2);
      return Math.max(Math.abs(x - c), Math.abs(y - c)) * 0.12;
    },
  },
  // Diagonal cross (X) radiating from the center
  saltire: {
    keyframe: "pixel-scale",
    duration: 1,
    mask: saltireMask,
    delay: (x, y, g) => {
      const c = Math.floor(g / 2);
      return Math.max(Math.abs(x - c), Math.abs(y - c)) * 0.12;
    },
  },
  // Center row and column animate outward from the center
  crosshair: {
    keyframe: "pixel-crosshair",
    duration: 0.6,
    mask: crosshairMask,
    delay: (x, y, g) => {
      const c = Math.floor(g / 2);
      return (y === c ? Math.abs(x - c) : Math.abs(y - c)) * 0.1;
    },
  },
  // Collapse inward from all four corners
  corners: {
    keyframe: "pixel-scale",
    duration: 1,
    delay: (x, y, g) => {
      const last = g - 1;
      const toX = Math.min(x, last - x);
      const toY = Math.min(y, last - y);
      return Math.hypot(toX, toY) * 0.15;
    },
  },
  // Alternating checkerboard pulse
  checker: { keyframe: "pixel-scale", duration: 1, delay: (x, y) => ((x + y) % 2) * 0.5 },
  // Snake (alternating direction per row)
  snake: {
    keyframe: "pixel-scale",
    duration: 1.5,
    delay: (x, y, g) => {
      const effectiveX = y % 2 === 0 ? x : g - 1 - x;
      return (y * g + effectiveX) * 0.05;
    },
  },
  // Radar sweep around the center
  radar: {
    keyframe: "pixel-chase",
    duration: 1.2,
    delay: (x, y, g) => {
      const c = (g - 1) / 2;
      return ((Math.atan2(y - c, x - c) + Math.PI) / (2 * Math.PI)) * 1.2;
    },
  },
  // Every dot breathes together
  pulse: { keyframe: "pixel-scale", duration: 1, delay: () => 0 },
  // Whole heart beats together
  heart: { keyframe: "pixel-beat", duration: 1.2, mask: heartMask, delay: () => 0 },
} satisfies Record<string, VariantConfig>;

const variants = Object.keys(variantConfigs) as SpinnerVariant[];

type SpinnerVariant = keyof typeof variantConfigs;

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

// Respect the user's reduced-motion preference, read on the first render.
const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
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
    const animate = !usePrefersReducedMotion();
    const safeSpeed = speed > 0 ? speed : 1;
    const range = Array.from({ length: gridSize }, (_, i) => i);

    const config = variantConfigs[variant];
    const duration = config.duration / safeSpeed;
    // Rainbow runs without a delay so every dot cycles hue in sync.
    const rainbowAnimation = rainbow ? `, hue-rotate ${10 / safeSpeed}s linear infinite` : "";

    return (
      <div
        ref={ref}
        role="status"
        aria-label={ariaLabel}
        className={cn("inline-flex flex-col", className)}
        style={{ "--square-size": `${size}px`, "--spinner-color": color } as CSSProperties}
        {...props}
      >
        {range.map((y) => (
          <div key={y} className="flex">
            {range.map((x) => (
              <div
                key={x}
                className="relative"
                style={{ width: "var(--square-size)", height: "var(--square-size)" }}
              >
                {(config.mask?.(x, y, gridSize) ?? true) && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: "var(--spinner-color)",
                      boxShadow:
                        "0 0 10px var(--spinner-color), 0 0 20px var(--spinner-color), 0 0 40px var(--spinner-color)",
                      animation: animate
                        ? `${config.keyframe} ${duration}s linear ${config.delay(x, y, gridSize) / safeSpeed}s infinite${rainbowAnimation}`
                        : undefined,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
);

SpinnerPixelGrid.displayName = "SpinnerPixelGrid";

export { variants as spinnerVariants };
export type { SpinnerVariant };
