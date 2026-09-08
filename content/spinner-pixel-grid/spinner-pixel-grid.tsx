"use client";

import { useSyncExternalStore } from "react";
import type { ComponentProps, CSSProperties } from "react";

import "./spinner-pixel-grid.css";
import { cn } from "cn";

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

// Per-variant configuration. Delay functions only run for dots the mask keeps
// visible, so they never need to guard against out-of-pattern positions.
const variantConfigs = {
  // Vertical wave, top to bottom
  cascade: { delay: (_x, y) => 0.12 * y, duration: 1, keyframe: "pixel-scale" },
  // Chase around the perimeter
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
  // Alternating checkerboard pulse
  checker: { delay: (x, y) => ((x + y) % 2) * 0.5, duration: 1, keyframe: "pixel-scale" },
  // Collapse inward from all four corners
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
  // Center row and column animate outward from the center
  crosshair: {
    delay: (x, y, g) => {
      const c = Math.floor(g / 2);
      return (y === c ? Math.abs(x - c) : Math.abs(y - c)) * 0.1;
    },
    duration: 0.6,
    keyframe: "pixel-crosshair",
    mask: crosshairMask,
  },
  // Diagonal wave from the top-left corner
  default: { delay: (x, y) => 0.05 * (x + y), duration: 1, keyframe: "pixel-scale" },
  // Diamond-shaped rings (manhattan distance) from the center
  diamond: {
    delay: (x, y, g) => {
      const c = (g - 1) / 2;
      return (Math.abs(x - c) + Math.abs(y - c)) * 0.12;
    },
    duration: 1,
    keyframe: "pixel-scale",
  },
  // Whole border pulses together
  frame: { delay: () => 0, duration: 1, keyframe: "pixel-chase", mask: edgeMask },
  // Whole heart beats together
  heart: { delay: () => 0, duration: 1.2, keyframe: "pixel-beat", mask: heartMask },
  // Every dot breathes together
  pulse: { delay: () => 0, duration: 1, keyframe: "pixel-scale" },
  // Radar sweep around the center
  radar: {
    delay: (x, y, g) => {
      const c = (g - 1) / 2;
      return ((Math.atan2(y - c, x - c) + Math.PI) / (2 * Math.PI)) * 1.2;
    },
    duration: 1.2,
    keyframe: "pixel-chase",
  },
  // Rain falling from the top, each column offset
  rain: { delay: (x, y) => y * 0.1 + x * 0.05, duration: 0.8, keyframe: "pixel-rain" },
  // Concentric rings radiating from the center
  ripple: {
    delay: (x, y, g) => {
      const c = (g - 1) / 2;
      return Math.hypot(x - c, y - c) * 0.18;
    },
    duration: 1,
    keyframe: "pixel-scale",
  },
  // Diagonal cross (X) radiating from the center
  saltire: {
    delay: (x, y, g) => {
      const c = Math.floor(g / 2);
      return Math.max(Math.abs(x - c), Math.abs(y - c)) * 0.12;
    },
    duration: 1,
    keyframe: "pixel-scale",
    mask: saltireMask,
  },
  // Sharp scanline sweeping downward
  scan: { delay: (_x, y) => y * 0.15, duration: 1.2, keyframe: "pixel-chase" },
  // Snake (alternating direction per row)
  snake: {
    delay: (x, y, g) => {
      const effectiveX = y % 2 === 0 ? x : g - 1 - x;
      return (y * g + effectiveX) * 0.05;
    },
    duration: 1.5,
    keyframe: "pixel-scale",
  },
  // Spiral radiating from the center
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
  // Cross + diagonals radiating from the center
  star: {
    delay: (x, y, g) => {
      const c = Math.floor(g / 2);
      return Math.max(Math.abs(x - c), Math.abs(y - c)) * 0.12;
    },
    duration: 1,
    keyframe: "pixel-scale",
    mask: starMask,
  },
  // Rotating arm that also pulses radially
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
  // Horizontal wave
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

// React's CSSProperties has no index signature for custom properties, so widen it
// rather than reaching for a type assertion.
type SpinnerStyle = CSSProperties & Record<`--${string}`, string>;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeToReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;

// The server cannot know the preference. Reporting "no preference" keeps the
// server and client markup identical, and React re-renders after hydration if
// the real preference differs.
const getServerReducedMotion = () => false;

// Respect the user's reduced-motion preference, kept in sync with the media query.
const usePrefersReducedMotion = (): boolean =>
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
  // Rainbow runs without a delay so every dot cycles hue in sync.
  const rainbowAnimation = rainbow ? `, hue-rotate ${10 / safeSpeed}s linear infinite` : "";

  // The custom properties come last so a caller-supplied `style` cannot drop the
  // two variables every dot depends on.
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
