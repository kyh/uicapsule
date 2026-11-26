"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LockOpen } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useAnimate, useReducedMotion } from "motion/react";

const CARD_GUTTER = 64;

type Phase = "idle" | "drawing" | "error" | "success";

const range = (length: number) => Array.from({ length }, (_, index) => index);

export const UNLOCK_PATTERNS = {
  l: {
    article: "an L",
    build: (grid: number) => [
      ...range(grid).map((row) => row * grid),
      ...range(grid - 1).map((col) => (grid - 1) * grid + col + 1),
    ],
    label: "L",
  },
  z: {
    article: "a Z",
    build: (grid: number) => [
      ...range(grid),
      ...range(grid - 2).map((step) => (step + 1) * grid + grid - 2 - step),
      ...range(grid).map((col) => (grid - 1) * grid + col),
    ],
    label: "Z",
  },
  u: {
    article: "a U",
    build: (grid: number) => [
      ...range(grid).map((row) => row * grid),
      ...range(grid - 1).map((col) => (grid - 1) * grid + col + 1),
      ...range(grid - 1).map((step) => (grid - 2 - step) * grid + grid - 1),
    ],
    label: "U",
  },
  square: {
    article: "a square",
    build: (grid: number) => [
      ...range(grid),
      ...range(grid - 1).map((step) => (step + 1) * grid + grid - 1),
      ...range(grid - 1).map((step) => (grid - 1) * grid + grid - 2 - step),
      ...range(grid - 2).map((step) => (grid - 2 - step) * grid),
    ],
    label: "Square",
  },
} as const;

export type UnlockPatternId = keyof typeof UNLOCK_PATTERNS;

export interface PatternUnlockProps {
  /** Dots per side of the square grid. */
  grid?: number;
  /** Distance between neighbouring dots, in px. */
  spacing?: number;
  /** Dot indices, row-major from the top-left, that unlock. Defaults to an L. */
  pattern?: readonly number[];
  color?: string;
  errorColor?: string;
  successColor?: string;
  lineWidth?: number;
  /** Trail glow blur radius, in px. */
  glow?: number;
  ripple?: boolean;
  /** Peak horizontal offset of the wrong-pattern shake, in px. */
  shake?: number;
  /** Seconds the unlocked state holds before resetting. */
  successHold?: number;
  /** Seconds the error state holds before resetting. */
  errorHold?: number;
  prompt?: string;
  errorText?: string;
  successText?: string;
  hint?: string;
}

interface StatusLineProps {
  phase: Phase;
  errorColor: string;
  errorText?: string;
  prompt?: string;
  successColor: string;
  successText?: string;
}

const StatusLine = ({
  phase,
  errorColor,
  errorText = "Try again",
  prompt = "Draw your pattern",
  successColor,
  successText = "Unlocked",
}: StatusLineProps) => (
  <AnimatePresence mode="wait" initial={false}>
    {phase === "success" ? (
      <motion.div
        key="unlocked"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ bounce: 0.5, duration: 0.4, type: "spring" }}
        className="flex items-center gap-2"
        style={{ color: successColor }}
      >
        <LockOpen className="size-4" />
        <span className="text-[14px] font-semibold">{successText}</span>
      </motion.div>
    ) : (
      <motion.p
        key="prompt"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-[14px] font-medium"
        style={{
          color:
            phase === "error"
              ? `color-mix(in srgb, ${errorColor} 75%, white)`
              : "rgb(255 255 255 / 0.7)",
        }}
      >
        {phase === "error" ? errorText : prompt}
      </motion.p>
    )}
  </AnimatePresence>
);

interface Point {
  x: number;
  y: number;
}

interface TrailProps {
  board: number;
  glow: number;
  lineWidth: number;
  points: Point[];
  stroke: string;
}

const Trail = ({ board, glow, lineWidth, points, stroke }: TrailProps) => (
  <svg width={board} height={board} className="absolute inset-0">
    {points.length > 0 && (
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={lineWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
        style={{ filter: `drop-shadow(0 0 ${glow}px ${stroke})` }}
      />
    )}
  </svg>
);

interface PatternDotProps {
  active: boolean;
  position: Point;
  ripple: boolean;
  stroke: string;
}

const PatternDot = ({ active, position, ripple, stroke }: PatternDotProps) => (
  <motion.span
    className="absolute grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center"
    style={{ left: position.x, top: position.y }}
  >
    <motion.span
      animate={{
        backgroundColor: active ? stroke : "rgba(200,255,220,0.38)",
        scale: active ? 1.5 : 1,
      }}
      transition={{ bounce: 0.5, duration: 0.3, type: "spring" }}
      className="size-3 rounded-full"
    />
    {active && ripple && (
      <motion.span
        aria-hidden
        initial={{ opacity: 0.6, scale: 0.4 }}
        animate={{ opacity: 0, scale: 2.4 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="absolute size-5 rounded-full"
        style={{ backgroundColor: stroke }}
      />
    )}
  </motion.span>
);

export const PatternUnlock = ({
  grid = 3,
  spacing = 92,
  pattern,
  color = "#38bdf8",
  errorColor = "#ef4444",
  successColor = "#34d399",
  lineWidth = 4,
  glow = 8,
  ripple = true,
  shake = 12,
  successHold = 2.2,
  errorHold = 0.8,
  prompt,
  errorText,
  successText,
  hint = "The pattern is an L — start top-left",
}: PatternUnlockProps) => {
  const pad = spacing / 2;
  const board = spacing * (grid - 1) + pad * 2;
  const hitRadius = spacing / 3;
  const target = (pattern ?? UNLOCK_PATTERNS.l.build(grid)).join(",");

  const dotPosition = (index: number) => ({
    x: pad + (index % grid) * spacing,
    y: pad + Math.floor(index / grid) * spacing,
  });

  const [path, setPath] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [cursor, setCursor] = useState<Point | null>(null);
  const [scope, animate] = useAnimate();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, []);

  const queue = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  const localPoint = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();

    if (!rect) {
      return null;
    }

    const scale = rect.width / board;

    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  };

  const capture = (point: Point) => {
    setPath((previous) => {
      for (let index = 0; index < grid * grid; index += 1) {
        if (previous.includes(index)) {
          continue;
        }

        const dot = dotPosition(index);

        if (Math.hypot(dot.x - point.x, dot.y - point.y) < hitRadius) {
          return [...previous, index];
        }
      }

      return previous;
    });
  };

  const finish = useCallback(() => {
    setCursor(null);
    setPath((current) => {
      if (current.length === 0) {
        setPhase("idle");

        return current;
      }

      if (current.join(",") === target) {
        setPhase("success");
        queue(() => {
          setPhase("idle");
          setPath([]);
        }, successHold * 1000);
      } else {
        setPhase("error");

        if (scope.current instanceof HTMLElement && !reduceMotion && shake > 0) {
          void animate(
            scope.current,
            { x: [0, -shake, shake, -shake * (2 / 3), shake * (2 / 3), 0] },
            { duration: 0.4, ease: "easeInOut" },
          );
        }

        queue(() => {
          setPhase("idle");
          setPath([]);
        }, errorHold * 1000);
      }

      return current;
    });
  }, [animate, errorHold, queue, reduceMotion, scope, shake, successHold, target]);

  const points = path.map(dotPosition);
  const stroke = { drawing: color, error: errorColor, idle: color, success: successColor }[phase];

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={{ width: board + CARD_GUTTER }}
        className="flex flex-col items-center rounded-[36px] bg-[#08110b] py-9 shadow-2xl shadow-black/60 ring-1 ring-emerald-200/10 select-none"
      >
        <StatusLine
          phase={phase}
          errorColor={errorColor}
          errorText={errorText}
          prompt={prompt}
          successColor={successColor}
          successText={successText}
        />

        <div ref={scope} className="mt-4">
          <div
            ref={boardRef}
            style={{ height: board, width: board }}
            className="relative cursor-pointer touch-none"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setPath([]);
              setPhase("drawing");
              const point = localPoint(event.clientX, event.clientY);

              if (point) {
                capture(point);
                setCursor(point);
              }
            }}
            onPointerMove={(event) => {
              if (phase !== "drawing") {
                return;
              }

              const point = localPoint(event.clientX, event.clientY);

              if (point) {
                capture(point);
                setCursor(point);
              }
            }}
            onPointerUp={finish}
            onPointerCancel={finish}
          >
            <Trail
              board={board}
              glow={glow}
              lineWidth={lineWidth}
              points={phase === "drawing" && cursor ? [...points, cursor] : points}
              stroke={stroke}
            />

            {range(grid * grid).map((index) => (
              <PatternDot
                key={index}
                active={path.includes(index)}
                position={dotPosition(index)}
                ripple={ripple}
                stroke={stroke}
              />
            ))}
          </div>
        </div>

        {hint && <p className="mt-2 text-[11px] text-white/30">{hint}</p>}
      </div>
    </MotionConfig>
  );
};
