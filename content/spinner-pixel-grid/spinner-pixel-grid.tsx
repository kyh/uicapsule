"use client";

import { useSyncExternalStore } from "react";
import type { ComponentProps, CSSProperties } from "react";

import "./spinner-pixel-grid.css";
import { cn } from "cn";

type CellValue = (x: number, y: number, gridSize: number) => number;

type CellMask = (x: number, y: number, gridSize: number) => boolean;

interface VariantConfig {
  keyframe: string;
  duration: number;
  delay: CellValue;
  mask?: CellMask;
}

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

const heartMask: CellMask = (x, y, g) => {
  const c = (g - 1) / 2;
  const nx = (x - c) / (g * 0.48);
  const ny = (c - y) / (g * 0.34) + 0.05;

  return (nx * nx + ny * ny - 1) ** 3 - nx * nx * ny ** 3 <= 0;
};

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

const variantConfigs = {
  cascade: { delay: (_x, y) => 0.12 * y, duration: 1, keyframe: "pixel-scale" },
  chase: {
    delay: (x, y, g) => {
      const last = g - 1;

      if (last === 0) {
        return 0;
      }

      let order = 0;

      if (y === 0) {
        order = x;
      } else if (x === last) {
        order = last + y;
      } else if (y === last) {
        order = 2 * last + (last - x);
      } else {
        order = 3 * last + (last - y);
      }

      return (order / (4 * last)) * 0.8;
    },
    duration: 0.8,
    keyframe: "pixel-chase",
    mask: edgeMask,
  },
  checker: { delay: (x, y) => ((x + y) % 2) * 0.5, duration: 1, keyframe: "pixel-scale" },
  corners: {
    delay: (x, y, g) => {
      const last = g - 1;
      const toX = Math.min(x, last - x);
      const toY = Math.min(y, last - y);

      return Math.hypot(toX, toY) * 0.15;
    },
    duration: 1,
    keyframe: "pixel-scale",
  },
  crosshair: {
    delay: (x, y, g) => {
      const c = Math.floor(g / 2);

      return (y === c ? Math.abs(x - c) : Math.abs(y - c)) * 0.1;
    },
    duration: 0.6,
    keyframe: "pixel-crosshair",
    mask: crosshairMask,
  },
  default: { delay: (x, y) => 0.05 * (x + y), duration: 1, keyframe: "pixel-scale" },
  diamond: {
    delay: (x, y, g) => {
      const c = (g - 1) / 2;

      return (Math.abs(x - c) + Math.abs(y - c)) * 0.12;
    },
    duration: 1,
    keyframe: "pixel-scale",
  },
  frame: { delay: () => 0, duration: 1, keyframe: "pixel-chase", mask: edgeMask },
  heart: { delay: () => 0, duration: 1.2, keyframe: "pixel-beat", mask: heartMask },
  pulse: { delay: () => 0, duration: 1, keyframe: "pixel-scale" },
  radar: {
    delay: (x, y, g) => {
      const c = (g - 1) / 2;

      return ((Math.atan2(y - c, x - c) + Math.PI) / (2 * Math.PI)) * 1.2;
    },
    duration: 1.2,
    keyframe: "pixel-chase",
  },
  rain: { delay: (x, y) => y * 0.1 + x * 0.05, duration: 0.8, keyframe: "pixel-rain" },
  ripple: {
    delay: (x, y, g) => {
      const c = (g - 1) / 2;

      return Math.hypot(x - c, y - c) * 0.18;
    },
    duration: 1,
    keyframe: "pixel-scale",
  },
  saltire: {
    delay: (x, y, g) => {
      const c = Math.floor(g / 2);

      return Math.max(Math.abs(x - c), Math.abs(y - c)) * 0.12;
    },
    duration: 1,
    keyframe: "pixel-scale",
    mask: saltireMask,
  },
  scan: { delay: (_x, y) => y * 0.15, duration: 1.2, keyframe: "pixel-chase" },
  snake: {
    delay: (x, y, g) => {
      const effectiveX = y % 2 === 0 ? x : g - 1 - x;

      return (y * g + effectiveX) * 0.05;
    },
    duration: 1.5,
    keyframe: "pixel-scale",
  },
  spiral: {
    delay: (x, y, g) => {
      const c = (g - 1) / 2;
      const distance = Math.hypot(x - c, y - c);
      const normalizedAngle = (Math.atan2(y - c, x - c) + Math.PI) / (2 * Math.PI);

      return distance * 0.15 + normalizedAngle * 0.3;
    },
    duration: 1,
    keyframe: "pixel-scale",
  },
  star: {
    delay: (x, y, g) => {
      const c = Math.floor(g / 2);

      return Math.max(Math.abs(x - c), Math.abs(y - c)) * 0.12;
    },
    duration: 1,
    keyframe: "pixel-scale",
    mask: starMask,
  },
  vortex: {
    delay: (x, y, g) => {
      const c = (g - 1) / 2;
      const distance = Math.hypot(x - c, y - c);
      const normalizedAngle = (Math.atan2(y - c, x - c) + Math.PI) / (2 * Math.PI);

      return normalizedAngle * 1.2 + distance * 0.1;
    },
    duration: 1.2,
    keyframe: "pixel-chase",
  },
  wave: { delay: (x) => 0.1 * x, duration: 1, keyframe: "pixel-scale" },
} satisfies Record<SpinnerVariant, VariantConfig>;

const dots = ["square", "circle"] as const;

type SpinnerDot = (typeof dots)[number];

type SpinnerProps = ComponentProps<"output"> & {
  /** Pixel size of each dot. */
  size?: number;
  /** Number of dots per row/column. */
  gridSize?: number;
  variant?: SpinnerVariant;
  /** Geometry of each dot. */
  dot?: SpinnerDot;
  /** Dot color. Any CSS color; defaults to the inherited text color. */
  color?: string;
  /** Render the neon glow around each dot. */
  glow?: boolean;
  /** Animation speed multiplier. 2 = twice as fast, 0.5 = half speed. */
  speed?: number;
  /** Cycle the hue of every dot for a rainbow effect. */
  rainbow?: boolean;
  /** Accessible label announced by screen readers. */
  ariaLabel?: string;
};

type SpinnerStyle = CSSProperties & Record<`--${string}`, string>;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeToReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);

  return () => {
    query.removeEventListener("change", onChange);
  };
};

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;

const getServerReducedMotion = () => false;

const usePrefersReducedMotion = () =>
  useSyncExternalStore(subscribeToReducedMotion, getReducedMotion, getServerReducedMotion);

export const SpinnerPixelGrid = ({
  className,
  style,
  size = 8,
  gridSize = 3,
  variant = "default",
  dot = "square",
  color = "currentColor",
  glow = true,
  speed = 1,
  rainbow = false,
  ariaLabel = "Loading",
  ...props
}: SpinnerProps) => {
  const animate = !usePrefersReducedMotion();
  const safeSpeed = speed > 0 ? speed : 1;
  const range = Array.from({ length: gridSize }, (_, i) => i);

  const config: VariantConfig = variantConfigs[variant];
  const duration = config.duration / safeSpeed;
  const rainbowAnimation = rainbow ? `, hue-rotate ${10 / safeSpeed}s linear infinite` : "";

  const rootStyle: SpinnerStyle = {
    ...style,
    "--spinner-color": color,
    "--square-size": `${size}px`,
  };

  return (
    <output
      aria-label={ariaLabel}
      className={cn("inline-flex flex-col", className)}
      style={rootStyle}
      {...props}
    >
      {range.map((y) => (
        <div key={y} className="flex">
          {range.map((x) => (
            <div
              key={x}
              className="relative"
              style={{ height: "var(--square-size)", width: "var(--square-size)" }}
            >
              {(config.mask?.(x, y, gridSize) ?? true) && (
                <div
                  className="absolute inset-0"
                  style={{
                    animation: animate
                      ? `${config.keyframe} ${duration}s linear ${config.delay(x, y, gridSize) / safeSpeed}s infinite${rainbowAnimation}`
                      : undefined,
                    backgroundColor: "var(--spinner-color)",
                    borderRadius: dot === "circle" ? "50%" : undefined,
                    boxShadow: glow
                      ? "0 0 10px var(--spinner-color), 0 0 20px var(--spinner-color), 0 0 40px var(--spinner-color)"
                      : undefined,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </output>
  );
};

export { variants as spinnerVariants, dots as spinnerDots };

export type { SpinnerVariant, SpinnerDot };
