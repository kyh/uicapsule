"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

const noop = () => null;

const SWEEP = 270;
const ARC = 2 * Math.PI * 40;
const BASE_SIZE = 300;

const DEFAULT_MOODS = ["Precise", "Balanced", "Creative", "Loose", "Unhinged"];

const moodFor = (moods: readonly string[], fraction: number) =>
  moods[Math.min(moods.length - 1, Math.floor(fraction * moods.length))] ?? "";

const hueSpan = (coolHue: number, hotHue: number) => (((hotHue - coolHue) % 360) + 360) % 360;

/** Props for {@link VibeDial}; every one is optional and defaults to the original look. */
export interface VibeDialProps {
  coolHue?: number;
  decimals?: number;
  defaultValue?: number;
  glow?: number;
  highLabel?: string;
  hotHue?: number;
  label?: string;
  lowLabel?: string;
  max?: number;
  moods?: readonly string[];
  sensitivity?: number;
  size?: number;
  ticks?: number;
}

export const VibeDial = ({
  coolHue = 215,
  decimals = 2,
  defaultValue = 0.2,
  glow = 1,
  highLabel = "spicy",
  hotHue = 25,
  label = "temperature",
  lowLabel = "safe",
  max = 2,
  moods = DEFAULT_MOODS,
  sensitivity = 1,
  size = BASE_SIZE,
  ticks = 41,
}: VibeDialProps) => {
  const clampTemp = (value: number) => Math.min(max, Math.max(0, value));
  const [temp, setTemp] = useState(() => clampTemp(defaultValue));
  const [dragging, setDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement | null>(null);
  const wheelStep = 0.00175 * max * sensitivity;
  const dragStep = 0.0045 * max * sensitivity;

  useEffect(() => {
    const dial = dialRef.current;

    if (!dial) {
      return noop;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setTemp((current) => Math.min(max, Math.max(0, current - event.deltaY * wheelStep)));
    };

    dial.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      dial.removeEventListener("wheel", onWheel);
    };
  }, [max, wheelStep]);

  const scale = size / BASE_SIZE;
  const span = hueSpan(coolHue, hotHue);
  const majorEvery = Math.max(1, Math.round((ticks - 1) / 4));
  const tickAngle = (index: number) => -135 + (index / (ticks - 1)) * SWEEP;
  const fraction = Math.min(1, temp / max);
  const angle = -135 + fraction * SWEEP;
  const hue = coolHue + fraction * span;
  const wild = Math.max(0, fraction - 0.6) / 0.4;
  const mood = moodFor(moods, fraction);
  const lit = Math.round(fraction * (ticks - 1));

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col items-center select-none">
        <div
          ref={dialRef}
          className="relative cursor-ns-resize touch-none rounded-full"
          style={{ height: size, width: size }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
              return;
            }

            setTemp((current) => clampTemp(current - event.movementY * dragStep));
          }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture(event.pointerId);
            setDragging(false);
          }}
        >
          <motion.div
            aria-hidden
            animate={{
              opacity: Math.min(1, (0.18 + fraction * 0.5) * glow),
              scale: 0.85 + fraction * 0.3,
            }}
            transition={{ damping: 30, stiffness: 200, type: "spring" }}
            className="pointer-events-none absolute rounded-full blur-2xl"
            style={{
              inset: -64 * scale,
              background: `radial-gradient(circle, oklch(0.62 0.24 ${String(hue)} / 0.55) 0%, transparent 65%)`,
            }}
          />

          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
            {Array.from({ length: ticks }, (_, index) => {
              const major = index % majorEvery === 0;

              return (
                <line
                  key={index}
                  x1="50"
                  y1={major ? 1.5 : 2.5}
                  x2="50"
                  y2="6"
                  stroke={
                    index <= lit
                      ? `oklch(0.8 0.19 ${String(coolHue + (index / (ticks - 1)) * span)})`
                      : "rgba(255,255,255,0.12)"
                  }
                  strokeWidth={major ? 1.1 : 0.7}
                  strokeLinecap="round"
                  transform={`rotate(${String(tickAngle(index))} 50 50)`}
                />
              );
            })}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="2.5"
              strokeDasharray={`${String((SWEEP / 360) * ARC)} ${String(ARC)}`}
              strokeLinecap="round"
              transform="rotate(135 50 50)"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={`oklch(0.74 0.2 ${String(hue)})`}
              strokeWidth="2.5"
              animate={{
                strokeDasharray: `${String(fraction * (SWEEP / 360) * ARC)} ${String(ARC)}`,
              }}
              transition={{ duration: 0.12 }}
              strokeLinecap="round"
              transform="rotate(135 50 50)"
            />
          </svg>

          <motion.div
            animate={{ rotate: angle, scale: dragging ? 1.03 : 1 }}
            transition={{ damping: 30, stiffness: 400, type: "spring" }}
            style={{ inset: 44 * scale }}
            className="absolute rounded-full bg-gradient-to-b from-[#35291f] to-[#140d09] shadow-[0_18px_40px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.08)] ring-1 ring-white/10"
          >
            <span
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{
                height: 22 * scale,
                top: 14 * scale,
                width: 5 * scale,
                background: `oklch(0.82 0.2 ${String(hue)})`,
                boxShadow: `0 0 12px oklch(0.75 0.22 ${String(hue)})`,
              }}
            />
          </motion.div>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="leading-none font-bold tracking-tight tabular-nums"
              style={{
                fontSize: 44 * scale,
                color: `oklch(${String(0.97 - fraction * 0.1)} ${String(fraction * 0.12)} ${String(hue)})`,
              }}
            >
              {temp.toFixed(decimals)}
            </span>
            <span className="mt-1.5 text-[10px] tracking-[0.22em] text-white/35 uppercase">
              {label}
            </span>
          </div>
        </div>

        <div className="relative mt-6 h-8 w-[260px]">
          <AnimatePresence initial={false}>
            <motion.p
              key={mood}
              initial={{ filter: "blur(4px)", opacity: 0, y: 8 }}
              animate={{ filter: "blur(0px)", opacity: 1, rotate: wild * -3, y: 0 }}
              exit={{ filter: "blur(4px)", opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0 text-center text-[24px] font-bold tracking-tight"
              style={{
                color: `oklch(0.8 0.17 ${String(hue)})`,
                fontStyle: wild > 0.5 ? "italic" : "normal",
              }}
            >
              {mood}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-3 flex w-[220px] justify-between text-[10px] tracking-[0.18em] text-white/30 uppercase">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      </div>
    </MotionConfig>
  );
};
