"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Vibe dial — a temperature knob for generation. Turn it and the sample
 * output morphs live: color heats up, corners loosen, type gets louder,
 * and the copy drifts from enterprise-safe to unhinged. Temperature as
 * something you can feel, not a float in a settings panel.
 */

const MIN = 0;
const MAX = 2;

const COPY: { at: number; headline: string; sub: string; cta: string }[] = [
  {
    at: 0,
    headline: "Dependable infrastructure for enterprise teams.",
    sub: "SOC 2 compliant. 99.99% uptime. Zero surprises.",
    cta: "Request a demo",
  },
  {
    at: 0.4,
    headline: "Ship faster with tools that stay out of the way.",
    sub: "Set up in minutes, forget it's there.",
    cta: "Get started",
  },
  {
    at: 0.8,
    headline: "Make something people actually love.",
    sub: "The fun parts of building, minus the boring ones.",
    cta: "Start building",
  },
  {
    at: 1.2,
    headline: "Your ideas, but louder.",
    sub: "Crank it. See what happens. Undo exists.",
    cta: "Let's go",
  },
  {
    at: 1.6,
    headline: "unleash the gremlin in your product ✨",
    sub: "warranty voided. vibes immaculate. 🔥🌀",
    cta: "chaos mode",
  },
];

const copyFor = (t: number) => {
  let pick = COPY[0];
  for (const c of COPY) if (t >= c.at) pick = c;
  return pick ?? COPY[0];
};

export const VibeDial = () => {
  const [temp, setTemp] = useState(0.2);
  const [dragging, setDragging] = useState(false);

  const angle = -135 + (temp / MAX) * 270;
  const copy = copyFor(temp);
  const hue = 215 + temp * 85; // calm blue → hot magenta
  const wild = Math.max(0, temp - 1) / 1; // 0..1 above t=1

  return (
    <div className="flex w-[640px] items-stretch gap-6 rounded-3xl bg-[#101116] p-7 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      {/* Dial side */}
      <div className="flex w-[190px] shrink-0 flex-col items-center justify-center">
        <div
          className="relative size-[150px] cursor-ns-resize touch-none rounded-full"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            setTemp((current) => Math.min(MAX, Math.max(MIN, current - event.movementY * 0.011)));
          }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture(event.pointerId);
            setDragging(false);
          }}
          onWheel={(event) => {
            event.preventDefault();
            setTemp((current) => Math.min(MAX, Math.max(MIN, current - event.deltaY * 0.0035)));
          }}
        >
          {/* Tick arc */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="6"
              strokeDasharray={`${String((270 / 360) * 2 * Math.PI * 44)} ${String(2 * Math.PI * 44)}`}
              strokeLinecap="round"
              transform="rotate(-135 50 50)"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={`oklch(0.72 0.21 ${String(hue)})`}
              strokeWidth="6"
              animate={{
                strokeDasharray: `${String((temp / MAX) * (270 / 360) * 2 * Math.PI * 44)} ${String(2 * Math.PI * 44)}`,
              }}
              transition={{ duration: 0.12 }}
              strokeLinecap="round"
              transform="rotate(-135 50 50)"
            />
          </svg>

          {/* Knob body */}
          <motion.div
            animate={{ rotate: angle, scale: dragging ? 1.04 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute inset-[16px] rounded-full bg-gradient-to-b from-[#2a2d39] to-[#16181f] shadow-xl shadow-black/60 ring-1 ring-white/12"
          >
            {/* Indicator */}
            <span
              className="absolute top-[9px] left-1/2 h-[14px] w-[3.5px] -translate-x-1/2 rounded-full"
              style={{ background: `oklch(0.8 0.2 ${String(hue)})` }}
            />
          </motion.div>

          {/* Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[19px] font-bold text-white tabular-nums">{temp.toFixed(2)}</span>
            <span className="text-[9px] tracking-[0.18em] text-white/35 uppercase">temp</span>
          </div>
        </div>

        <div className="mt-4 flex w-full justify-between px-3 text-[9.5px] tracking-wide text-white/30 uppercase">
          <span>safe</span>
          <span>spicy</span>
        </div>
      </div>

      {/* Sample output */}
      <motion.div
        animate={{
          backgroundColor: `oklch(${String(0.16 + temp * 0.02)} ${String(0.01 + temp * 0.05)} ${String(hue)})`,
          borderRadius: 14 + temp * 12,
        }}
        className="relative flex-1 overflow-hidden p-6 ring-1 ring-white/[0.08]"
      >
        {/* Heat wash */}
        <motion.div
          aria-hidden
          animate={{ opacity: temp / MAX }}
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 80% 10%, oklch(0.6 0.24 ${String(hue + 40)} / 0.35) 0%, transparent 60%)`,
          }}
        />

        <p className="relative text-[10px] font-semibold tracking-[0.2em] text-white/35 uppercase">
          Sample output
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={copy?.headline}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.22 }}
            className="relative"
          >
            <motion.h2
              animate={{
                rotate: wild * -1.5,
                letterSpacing: `${String(-0.02 + temp * 0.012)}em`,
              }}
              className="mt-4 text-[21px] leading-[1.25] font-bold text-white"
              style={{ fontStyle: temp > 1.55 ? "italic" : "normal" }}
            >
              {copy?.headline}
            </motion.h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">{copy?.sub}</p>
          </motion.div>
        </AnimatePresence>

        {/* CTA morphs continuously */}
        <motion.button
          type="button"
          animate={{
            borderRadius: 8 + temp * 14,
            backgroundColor: `oklch(${String(0.75 - temp * 0.05)} ${String(0.05 + temp * 0.11)} ${String(hue + 20)})`,
            rotate: wild * -2,
            scale: 1 + wild * 0.06,
          }}
          whileHover={{ scale: 1.04 }}
          className="relative mt-5 px-5 py-2.5 text-[13px] font-semibold text-black shadow-lg shadow-black/30"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={copy?.cta}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="inline-block"
            >
              {copy?.cta}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </div>
  );
};
