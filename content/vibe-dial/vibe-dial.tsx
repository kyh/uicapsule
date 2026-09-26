"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

/**
 * Vibe dial — a temperature knob for generation. Turn it and the dial itself
 * heats up: the LED ring fills and shifts from cool blue to ember, the glow
 * swells, and the readout drifts from "precise" to "unhinged". Temperature as
 * something you can feel, not a float in a settings panel.
 */

const MIN = 0;
const MAX = 2;
const SWEEP = 270;
const TICKS = 41;

const MOODS: { at: number; label: string }[] = [
  { at: 0, label: "Precise" },
  { at: 0.4, label: "Balanced" },
  { at: 0.8, label: "Creative" },
  { at: 1.2, label: "Loose" },
  { at: 1.6, label: "Unhinged" },
];

const moodFor = (t: number) => MOODS.findLast((mood) => t >= mood.at)?.label ?? "Precise";
const clampTemp = (value: number) => Math.min(MAX, Math.max(MIN, value));

const ARC = 2 * Math.PI * 40;
const tickAngle = (index: number) => -135 + (index / (TICKS - 1)) * SWEEP;

export const VibeDial = () => {
  const [temp, setTemp] = useState(0.2);
  const [dragging, setDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement | null>(null);

  // React registers wheel listeners as passive, so preventDefault there is ignored; the dial
  // needs a native non-passive listener to keep the wheel from scrolling the page.
  useEffect(() => {
    const dial = dialRef.current;
    if (!dial) {
      return;
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setTemp((current) => clampTemp(current - event.deltaY * 0.0035));
    };
    dial.addEventListener("wheel", onWheel, { passive: false });
    return () => dial.removeEventListener("wheel", onWheel);
  }, []);

  const fraction = temp / MAX;
  const angle = -135 + fraction * SWEEP;
  const hue = 215 + temp * 85;
  const wild = Math.max(0, temp - 1.2) / 0.8;
  const mood = moodFor(temp);
  const lit = Math.round(fraction * (TICKS - 1));

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col items-center select-none">
        <div
          ref={dialRef}
          className="relative size-[300px] cursor-ns-resize touch-none rounded-full"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
              return;
            }
            setTemp((current) => clampTemp(current - event.movementY * 0.009));
          }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture(event.pointerId);
            setDragging(false);
          }}
        >
          <motion.div
            aria-hidden
            animate={{ opacity: 0.18 + fraction * 0.5, scale: 0.85 + fraction * 0.3 }}
            transition={{ damping: 30, stiffness: 200, type: "spring" }}
            className="pointer-events-none absolute -inset-16 rounded-full blur-2xl"
            style={{
              background: `radial-gradient(circle, oklch(0.62 0.24 ${String(hue)} / 0.55) 0%, transparent 65%)`,
            }}
          />

          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
            {Array.from({ length: TICKS }, (_, index) => {
              const major = index % 10 === 0;
              return (
                <line
                  key={index}
                  x1="50"
                  y1={major ? 1.5 : 2.5}
                  x2="50"
                  y2="6"
                  stroke={
                    index <= lit
                      ? `oklch(0.8 0.19 ${String(215 + (index / (TICKS - 1)) * 170)})`
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
            className="absolute inset-[44px] rounded-full bg-gradient-to-b from-[#35291f] to-[#140d09] shadow-[0_18px_40px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.08)] ring-1 ring-white/10"
          >
            <span
              className="absolute top-[14px] left-1/2 h-[22px] w-[5px] -translate-x-1/2 rounded-full"
              style={{
                background: `oklch(0.82 0.2 ${String(hue)})`,
                boxShadow: `0 0 12px oklch(0.75 0.22 ${String(hue)})`,
              }}
            />
          </motion.div>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[44px] leading-none font-bold tracking-tight tabular-nums"
              style={{
                color: `oklch(${String(0.97 - fraction * 0.1)} ${String(fraction * 0.12)} ${String(hue)})`,
              }}
            >
              {temp.toFixed(2)}
            </span>
            <span className="mt-1.5 text-[10px] tracking-[0.22em] text-white/35 uppercase">
              temperature
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
          <span>safe</span>
          <span>spicy</span>
        </div>
      </div>
    </MotionConfig>
  );
};
