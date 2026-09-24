"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LockOpen } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useAnimate, useReducedMotion } from "motion/react";

const GRID = 3;
const CELL = 92;
const PAD = 46;
const BOARD = CELL * (GRID - 1) + PAD * 2;
const HIT_RADIUS = 30;
const CORRECT = [0, 3, 6, 7, 8];

type Phase = "idle" | "drawing" | "error" | "success";

const dotPosition = (index: number) => ({
  x: PAD + (index % GRID) * CELL,
  y: PAD + Math.floor(index / GRID) * CELL,
});

const STROKE: Record<Phase, string> = {
  drawing: "#38bdf8",
  error: "#ef4444",
  idle: "#38bdf8",
  success: "#34d399",
};

export const PatternUnlock = () => {
  const [path, setPath] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
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
    // Rect is in screen pixels; dots are in board pixels. They differ when an ancestor is scaled.
    const scale = rect.width / BOARD;
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  };

  const capture = useCallback((point: { x: number; y: number }) => {
    setPath((previous) => {
      for (let index = 0; index < GRID * GRID; index += 1) {
        if (previous.includes(index)) {
          continue;
        }
        const dot = dotPosition(index);
        if (Math.hypot(dot.x - point.x, dot.y - point.y) < HIT_RADIUS) {
          return [...previous, index];
        }
      }
      return previous;
    });
  }, []);

  const finish = useCallback(() => {
    setCursor(null);
    setPath((current) => {
      if (current.length === 0) {
        setPhase("idle");
        return current;
      }
      if (current.join(",") === CORRECT.join(",")) {
        setPhase("success");
        queue(() => {
          setPhase("idle");
          setPath([]);
        }, 2200);
      } else {
        setPhase("error");
        if (scope.current && !reduceMotion) {
          void animate(
            scope.current,
            { x: [0, -12, 12, -8, 8, 0] },
            { duration: 0.4, ease: "easeInOut" },
          );
        }
        queue(() => {
          setPhase("idle");
          setPath([]);
        }, 800);
      }
      return current;
    });
  }, [animate, queue, reduceMotion, scope]);

  const points = path.map(dotPosition);
  const stroke = STROKE[phase];

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-[340px] flex-col items-center rounded-[36px] bg-[#101014] py-9 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
        <AnimatePresence mode="wait" initial={false}>
          {phase === "success" ? (
            <motion.div
              key="unlocked"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ bounce: 0.5, duration: 0.4, type: "spring" }}
              className="flex items-center gap-2 text-emerald-400"
            >
              <LockOpen className="size-4" />
              <span className="text-[14px] font-semibold">Unlocked</span>
            </motion.div>
          ) : (
            <motion.p
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-[14px] font-medium ${phase === "error" ? "text-red-400" : "text-white/70"}`}
            >
              {phase === "error" ? "Try again" : "Draw your pattern"}
            </motion.p>
          )}
        </AnimatePresence>

        <div ref={scope} className="mt-4">
          <div
            ref={boardRef}
            style={{ height: BOARD, width: BOARD }}
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
            <svg width={BOARD} height={BOARD} className="absolute inset-0">
              {points.length > 0 && (
                <polyline
                  points={[...points, ...(phase === "drawing" && cursor ? [cursor] : [])]
                    .map((p) => `${p.x},${p.y}`)
                    .join(" ")}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.85}
                  style={{ filter: `drop-shadow(0 0 8px ${stroke})` }}
                />
              )}
            </svg>

            {Array.from({ length: GRID * GRID }, (_, index) => {
              const dot = dotPosition(index);
              const active = path.includes(index);
              return (
                <motion.span
                  key={index}
                  className="absolute grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center"
                  style={{ left: dot.x, top: dot.y }}
                >
                  <motion.span
                    animate={{
                      backgroundColor: active ? stroke : "rgba(255,255,255,0.35)",
                      scale: active ? 1.5 : 1,
                    }}
                    transition={{ bounce: 0.5, duration: 0.3, type: "spring" }}
                    className="size-3 rounded-full"
                  />
                  {active && (
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
            })}
          </div>
        </div>

        <p className="mt-2 text-[11px] text-white/30">The pattern is an L — start top-left</p>
      </div>
    </MotionConfig>
  );
};
