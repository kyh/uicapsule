"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Assistant orb — one orb, four moods. Each state has a distinct motion
 * signature: idle breathes, listening leans in and ripples, thinking
 * swirls inward, speaking pulses in bursts. The signatures matter more
 * than the gradients — you should be able to read the state from motion
 * alone.
 */

type OrbState = "idle" | "listening" | "thinking" | "speaking";

const STATES: { key: OrbState; label: string; blurb: string }[] = [
  { key: "idle", label: "Idle", blurb: "slow breath, drifting color" },
  { key: "listening", label: "Listening", blurb: "leans in, ripples outward" },
  { key: "thinking", label: "Thinking", blurb: "contracts, swirls inward" },
  { key: "speaking", label: "Speaking", blurb: "pulses with the voice" },
];

const ORB_VARIANTS = {
  idle: {
    scale: [1, 1.045, 1],
    transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" as const },
  },
  listening: {
    scale: [1.12, 1.16, 1.12],
    transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" as const },
  },
  thinking: {
    scale: [0.9, 0.93, 0.9],
    transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" as const },
  },
  speaking: {
    scale: [1, 1.09, 1.02, 1.11, 1.04, 1],
    transition: { duration: 1.15, repeat: Infinity, ease: "easeInOut" as const },
  },
};

/** Swirl layer speed per state — thinking spins hardest. */
const SWIRL_DURATION: Record<OrbState, number> = {
  idle: 14,
  listening: 9,
  thinking: 2.4,
  speaking: 6,
};

const GLOW: Record<OrbState, string> = {
  idle: "0 0 70px 8px rgba(99,132,255,0.25)",
  listening: "0 0 90px 16px rgba(56,189,248,0.4)",
  thinking: "0 0 55px 6px rgba(167,139,250,0.35)",
  speaking: "0 0 95px 18px rgba(129,140,248,0.45)",
};

export const AssistantOrb = () => {
  const [state, setState] = useState<OrbState>("idle");
  const [auto, setAuto] = useState(true);

  // Auto-tour the states so the demo reads without interaction.
  useEffect(() => {
    if (!auto) return undefined;
    const order: OrbState[] = ["idle", "listening", "thinking", "speaking"];
    const interval = setInterval(() => {
      setState((current) => order[(order.indexOf(current) + 1) % order.length] ?? "idle");
    }, 3600);
    return () => clearInterval(interval);
  }, [auto]);

  const active = STATES.find((s) => s.key === state);

  return (
    <div className="flex w-[460px] flex-col items-center rounded-3xl bg-[#0c0d13] px-8 pt-12 pb-8 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      {/* Orb assembly */}
      <div className="relative flex h-[210px] w-full items-center justify-center">
        {/* Listening ripples */}
        <AnimatePresence>
          {state === "listening" &&
            [0, 1, 2].map((ring) => (
              <motion.span
                key={ring}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1.9, opacity: [0, 0.35, 0] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.9,
                  repeat: Infinity,
                  delay: ring * 0.63,
                  ease: "easeOut",
                }}
                className="absolute size-[150px] rounded-full border border-sky-300/50"
              />
            ))}
        </AnimatePresence>

        {/* Thinking orbiters */}
        <AnimatePresence>
          {state === "thinking" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{
                rotate: { duration: 3.2, repeat: Infinity, ease: "linear" },
                opacity: { duration: 0.4 },
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

        {/* The orb */}
        <motion.div
          variants={ORB_VARIANTS}
          animate={state}
          style={{ boxShadow: GLOW[state] }}
          className="relative size-[150px] rounded-full transition-shadow duration-700"
        >
          {/* Base body */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 32% 28%, #b7c8ff 0%, #6384ff 34%, #3b2f8f 72%, #191542 100%)",
            }}
          />
          {/* Swirl layer — blurred conic, speed encodes state */}
          <motion.div
            key={state}
            animate={{ rotate: 360 }}
            transition={{
              duration: SWIRL_DURATION[state],
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-[6%] rounded-full opacity-75"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, rgba(125,211,252,0.55) 18%, transparent 40%, rgba(196,181,253,0.5) 62%, transparent 85%)",
              filter: "blur(11px)",
            }}
          />
          {/* Specular highlight */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 26%, transparent 48%)",
            }}
          />
        </motion.div>
      </div>

      {/* State readout */}
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

      {/* Controls */}
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
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">{s.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setAuto((a) => !a)}
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
            auto ? "bg-white/[0.12] text-white/85" : "bg-white/[0.05] text-white/40"
          }`}
        >
          Auto
        </button>
      </div>
    </div>
  );
};
