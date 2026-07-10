"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationPlaybackControls } from "motion/react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";

type Phase = "idle" | "holding" | "success";

const HOLD_MS = 1400;
const RESET_MS = 1700;

const BUTTON_W = 192;
const BUTTON_H = 56;
const RING_GAP = 5;
const RING_STROKE = 3;

// Ring rect geometry (svg is padded so the stroke never clips)
const PAD = RING_GAP + RING_STROKE;
const SVG_W = BUTTON_W + PAD * 2;
const SVG_H = BUTTON_H + PAD * 2;
const RING_W = BUTTON_W + RING_GAP * 2;
const RING_H = BUTTON_H + RING_GAP * 2;
const RING_RX = (BUTTON_H + RING_GAP * 2) / 2;

export const HoldToConfirm = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const progress = useMotionValue(0);
  const shakeX = useMotionValue(0);
  const dashOffset = useTransform(progress, (p) => 1 - p);
  const fillRef = useRef<AnimationPlaybackControls | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      fillRef.current?.stop();
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const beginHold = () => {
    if (phase !== "idle") return;
    setPhase("holding");
    fillRef.current?.stop();
    fillRef.current = animate(progress, 1, {
      duration: (HOLD_MS / 1000) * (1 - progress.get()),
      ease: "linear",
      onComplete: () => {
        setPhase("success");
        resetTimer.current = setTimeout(() => {
          animate(progress, 0, { duration: 0.45, ease: "easeInOut" });
          setPhase("idle");
        }, RESET_MS);
      },
    });
  };

  const cancelHold = () => {
    if (phase !== "holding") return;
    setPhase("idle");
    fillRef.current?.stop();
    // Ring snaps back…
    fillRef.current = animate(progress, 0, { duration: 0.3, ease: "easeOut" });
    // …and the button shakes "no".
    animate(shakeX, [0, -7, 6, -4, 3, -1, 0], {
      duration: 0.42,
      ease: "easeOut",
    });
  };

  const isSuccess = phase === "success";

  return (
    <motion.div className="relative select-none" style={{ x: shakeX }}>
      {/* Progress ring */}
      <svg
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: -PAD, top: -PAD }}
        width={SVG_W}
        height={SVG_H}
        fill="none"
      >
        {/* Track */}
        <rect
          x={PAD - RING_GAP}
          y={PAD - RING_GAP}
          width={RING_W}
          height={RING_H}
          rx={RING_RX}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={RING_STROKE}
        />
        {/* Fill */}
        <motion.rect
          x={PAD - RING_GAP}
          y={PAD - RING_GAP}
          width={RING_W}
          height={RING_H}
          rx={RING_RX}
          pathLength={1}
          strokeDasharray="1"
          strokeLinecap="round"
          strokeWidth={RING_STROKE}
          style={{ strokeDashoffset: dashOffset }}
          animate={{ stroke: isSuccess ? "#34d399" : "#fafafa" }}
          transition={{ duration: 0.25 }}
        />
      </svg>

      <motion.button
        type="button"
        onPointerDown={beginHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        className="relative flex cursor-pointer touch-none items-center justify-center overflow-hidden rounded-full font-medium tracking-tight text-zinc-950 outline-none"
        style={{ width: BUTTON_W, height: BUTTON_H }}
        animate={{
          scale: phase === "holding" ? 0.94 : 1,
          backgroundColor: isSuccess ? "#10b981" : "#fafafa",
          boxShadow: isSuccess
            ? "0 0 32px 4px rgba(16,185,129,0.45)"
            : "0 0 0px 0px rgba(16,185,129,0)",
        }}
        transition={{
          scale: { type: "spring", stiffness: 500, damping: 30 },
          backgroundColor: { duration: 0.25 },
          boxShadow: { duration: 0.35 },
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isSuccess ? (
            <motion.span
              key="check"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="text-zinc-950"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M4.5 12.5 L10 18 L19.5 6.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                />
              </svg>
            </motion.span>
          ) : (
            <motion.span
              key="label"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="text-[15px]"
            >
              Hold to confirm
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
};
