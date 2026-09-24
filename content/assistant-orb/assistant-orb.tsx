"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";

/**
 * Assistant orb — one orb, four moods. Each state has a distinct motion
 * signature: idle breathes, listening leans in and ripples, thinking
 * swirls inward, speaking pulses in bursts. The signatures matter more
 * than the gradients — you should be able to read the state from motion
 * alone.
 */

type OrbState = "idle" | "listening" | "thinking" | "speaking";

const STATES: { key: OrbState; label: string; blurb: string }[] = [
  { blurb: "slow breath, drifting color", key: "idle", label: "Idle" },
  { blurb: "leans in, ripples outward", key: "listening", label: "Listening" },
  { blurb: "contracts, swirls inward", key: "thinking", label: "Thinking" },
  { blurb: "pulses with the voice", key: "speaking", label: "Speaking" },
];

const ORB_VARIANTS = {
  idle: {
    scale: [1, 1.045, 1],
    transition: { duration: 4.2, ease: "easeInOut", repeat: Infinity },
  },
  listening: {
    scale: [1.12, 1.16, 1.12],
    transition: { duration: 1.1, ease: "easeInOut", repeat: Infinity },
  },
  speaking: {
    scale: [1, 1.09, 1.02, 1.11, 1.04, 1],
    transition: { duration: 1.15, ease: "easeInOut", repeat: Infinity },
  },
  thinking: {
    scale: [0.9, 0.93, 0.9],
    transition: { duration: 1.8, ease: "easeInOut", repeat: Infinity },
  },
} satisfies Variants;

/** Reduced motion holds each state at its resting size — glow and color still differ. */
const STILL_SCALE: Record<OrbState, number> = {
  idle: 1,
  listening: 1.12,
  speaking: 1.04,
  thinking: 0.9,
};

/** Swirl layer speed per state — thinking spins hardest. */
const SWIRL_DURATION: Record<OrbState, number> = {
  idle: 14,
  listening: 9,
  speaking: 6,
  thinking: 2.4,
};

const GLOW: Record<OrbState, string> = {
  idle: "0 0 70px 8px rgba(99,132,255,0.25)",
  listening: "0 0 90px 16px rgba(56,189,248,0.4)",
  speaking: "0 0 95px 18px rgba(129,140,248,0.45)",
  thinking: "0 0 55px 6px rgba(167,139,250,0.35)",
};

export const AssistantOrb = () => {
  const [state, setState] = useState<OrbState>("idle");
  const [auto, setAuto] = useState(true);
  const reduceMotion = useReducedMotion() ?? false;
  const touring = auto && !reduceMotion;

  useEffect(() => {
    if (!touring) {
      return;
    }
    const order: OrbState[] = ["idle", "listening", "thinking", "speaking"];
    const interval = setInterval(() => {
      setState((current) => order[(order.indexOf(current) + 1) % order.length] ?? "idle");
    }, 3600);
    return () => clearInterval(interval);
  }, [touring]);

  const active = STATES.find((s) => s.key === state);

  return (
    <div className="flex w-[460px] flex-col items-center rounded-3xl bg-[#0c0d13] px-8 pt-12 pb-8 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      <div className="relative flex h-[210px] w-full items-center justify-center">
        <AnimatePresence>
          {state === "listening" &&
            [0, 1, 2].map((ring) => (
              <motion.span
                key={ring}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={
                  reduceMotion
                    ? { opacity: 0.3 - ring * 0.08, scale: 1.2 + ring * 0.25 }
                    : { opacity: [0, 0.35, 0], scale: 1.9 }
                }
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { delay: ring * 0.63, duration: 1.9, ease: "easeOut", repeat: Infinity }
                }
                className="absolute size-[150px] rounded-full border border-sky-300/50"
              />
            ))}
        </AnimatePresence>

        <AnimatePresence>
          {state === "thinking" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: reduceMotion ? 0 : 360 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 0.4 },
                rotate: reduceMotion
                  ? { duration: 0 }
                  : { duration: 3.2, ease: "linear", repeat: Infinity },
              }}
              className="absolute size-[190px]"
            >
              {[0, 120, 240].map((angle) => (
                <span
                  key={angle}
                  className="absolute top-1/2 left-1/2 size-[7px] rounded-full bg-violet-300/80"
                  style={{
                    transform: `rotate(${String(angle)}deg) translateX(92px) translateY(-50%)`,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={ORB_VARIANTS}
          animate={reduceMotion ? { scale: STILL_SCALE[state] } : state}
          style={{ boxShadow: GLOW[state] }}
          className="relative size-[150px] rounded-full transition-shadow duration-700"
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 32% 28%, #b7c8ff 0%, #6384ff 34%, #3b2f8f 72%, #191542 100%)",
            }}
          />
          <motion.div
            key={state}
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{
              duration: SWIRL_DURATION[state],
              ease: "linear",
              repeat: Infinity,
            }}
            className="absolute inset-[6%] rounded-full opacity-75"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, rgba(125,211,252,0.55) 18%, transparent 40%, rgba(196,181,253,0.5) 62%, transparent 85%)",
              filter: "blur(11px)",
            }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 26%, transparent 48%)",
            }}
          />
        </motion.div>
      </div>

      <div className="mt-7 h-[46px] text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <p className="text-[15px] font-semibold text-white capitalize">{state}</p>
            <p className="mt-0.5 text-[11.5px] text-white/40">{active?.blurb}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <div className="flex gap-1 rounded-full bg-white/[0.06] p-1">
          {STATES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setAuto(false);
                setState(s.key);
              }}
              className={`relative rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                state === s.key ? "text-black" : "text-white/55 hover:text-white/80"
              }`}
            >
              {state === s.key && (
                <motion.span
                  layoutId="orb-state-pill"
                  className="absolute inset-0 rounded-full bg-white"
                  transition={{ damping: 35, stiffness: 500, type: "spring" }}
                />
              )}
              <span className="relative">{s.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setAuto((a) => !a)}
          disabled={reduceMotion}
          aria-pressed={touring}
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed ${
            touring ? "bg-white/[0.12] text-white/85" : "bg-white/[0.05] text-white/40"
          }`}
        >
          Auto
        </button>
      </div>
    </div>
  );
};
