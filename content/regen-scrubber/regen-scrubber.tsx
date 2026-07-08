"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";

/**
 * Regen scrubber — instead of hammering "regenerate", drag through the
 * variation space. Every seed is a point; the scrubber interpolates the
 * artwork continuously between them (hue, form, rotation, glow), and the
 * caption snaps per seed. Release detents onto the nearest variation.
 */

const COUNT = 12;
const TRACK_WIDTH = 440;

/** Deterministic per-seed parameters — the "latent points". */
const fract = (x: number) => x - Math.floor(x);
const seeded = (seed: number, k: number) => fract(Math.sin(seed * 127.1 + k * 311.7) * 43758.5453);

const SEEDS = Array.from({ length: COUNT }, (_, i) => ({
  hue: (i * 47 + seeded(i, 1) * 30) % 360,
  hueB: (i * 47 + 80 + seeded(i, 2) * 60) % 360,
  r1: 30 + seeded(i, 3) * 45,
  r2: 30 + seeded(i, 4) * 45,
  r3: 30 + seeded(i, 5) * 45,
  r4: 30 + seeded(i, 6) * 45,
  rotate: seeded(i, 7) * 360,
  squish: 0.82 + seeded(i, 8) * 0.36,
}));

const TAGLINES = [
  "Aurora, bottled.",
  "Softer than schedule.",
  "The quiet gradient.",
  "Warmth, engineered.",
  "A slow bloom.",
  "Signal in pastel.",
  "Weightless mornings.",
  "Dusk, distilled.",
  "The gentle machine.",
  "Halfway to neon.",
  "Low-light luxury.",
  "Afterglow, always.",
];

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** Interpolate a seed parameter at continuous position t. */
const at = (t: number, pick: (s: (typeof SEEDS)[number]) => number, wrapHue = false) => {
  const i = Math.min(COUNT - 1, Math.max(0, t));
  const lo = SEEDS[Math.floor(i)];
  const hi = SEEDS[Math.min(COUNT - 1, Math.floor(i) + 1)];
  if (!lo || !hi) return 0;
  const u = i - Math.floor(i);
  const a = pick(lo);
  const b = pick(hi);
  if (wrapHue) {
    const delta = ((b - a + 540) % 360) - 180;
    return (a + delta * u + 360) % 360;
  }
  return lerp(a, b, u);
};

export const RegenScrubber = () => {
  const t = useMotionValue(0);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useMotionValueEvent(t, "change", (value) => {
    const next = Math.round(Math.min(COUNT - 1, Math.max(0, value)));
    setIndex((current) => (current === next ? current : next));
  });

  // Derived visual channels.
  const background = useTransform(t, (value) => {
    const hue = at(value, (s) => s.hue, true);
    const hueB = at(value, (s) => s.hueB, true);
    return `linear-gradient(135deg,
      oklch(0.72 0.19 ${String(hue)}) 0%,
      oklch(0.5 0.22 ${String(hueB)}) 100%)`;
  });
  const borderRadius = useTransform(t, (value) => {
    const r = (k: 1 | 2 | 3 | 4) =>
      at(value, (s) => [s.r1, s.r2, s.r3, s.r4][k - 1] ?? 40).toFixed(1);
    return `${r(1)}% ${String(100 - Number(r(1)))}% ${r(2)}% ${String(100 - Number(r(2)))}% / ${r(3)}% ${r(4)}% ${String(100 - Number(r(4)))}% ${String(100 - Number(r(3)))}%`;
  });
  const rotate = useTransform(t, (value) => at(value, (s) => s.rotate));
  const scaleY = useTransform(t, (value) => at(value, (s) => s.squish));
  const glow = useTransform(t, (value) => {
    const hue = at(value, (s) => s.hue, true);
    return `0 0 90px 12px oklch(0.6 0.2 ${String(hue)} / 0.45)`;
  });
  const thumbX = useTransform(t, (value) => (value / (COUNT - 1)) * TRACK_WIDTH);

  const tFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const u = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return u * (COUNT - 1);
  };

  // Idle drift so the preview breathes before first touch.
  useEffect(() => {
    const controls = animate(t, 2, { duration: 3, ease: "easeInOut" });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-[560px] rounded-3xl bg-[#101116] p-7 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold text-white">Cover art</p>
          <p className="text-[11px] text-white/40">Scrub the space instead of rerolling</p>
        </div>
        <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[11px] font-medium text-white/60 tabular-nums">
          seed {String(index + 1).padStart(2, "0")} / {COUNT}
        </span>
      </div>

      {/* Preview */}
      <div className="relative flex h-[230px] items-center justify-center overflow-hidden rounded-2xl bg-[#0a0b0f] ring-1 ring-white/[0.06]">
        <motion.div
          style={{
            background,
            borderRadius,
            rotate,
            scaleY,
            boxShadow: glow,
          }}
          className="size-[132px]"
        />
        {/* Caption snaps per seed */}
        <div className="absolute bottom-4 left-0 flex w-full justify-center">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.22 }}
            className="text-[13px] font-medium tracking-wide text-white/75"
          >
            {TAGLINES[index]}
          </motion.p>
        </div>
      </div>

      {/* Scrubber */}
      <div className="mt-6 px-1">
        <div
          ref={trackRef}
          className="relative h-10 cursor-ew-resize touch-none"
          style={{ width: TRACK_WIDTH, marginInline: "auto" }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            t.set(tFromPointer(event.clientX));
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              t.set(tFromPointer(event.clientX));
            }
          }}
          onPointerUp={(event) => {
            setDragging(false);
            const target = Math.round(tFromPointer(event.clientX));
            animate(t, target, { type: "spring", stiffness: 400, damping: 32 });
          }}
        >
          {/* Track */}
          <div className="absolute top-1/2 h-[4px] w-full -translate-y-1/2 rounded-full bg-white/10" />
          {/* Detent ticks */}
          {SEEDS.map((seed, i) => (
            <span
              key={seed.hue}
              className={`absolute top-1/2 h-[10px] w-px -translate-y-1/2 ${
                i === index ? "bg-white/70" : "bg-white/20"
              }`}
              style={{ left: (i / (COUNT - 1)) * TRACK_WIDTH }}
            />
          ))}
          {/* Thumb */}
          <motion.div
            style={{ x: thumbX }}
            animate={{ scale: dragging ? 1.25 : 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="absolute top-1/2 -ml-[10px] size-[20px] -translate-y-1/2 rounded-full bg-white shadow-lg shadow-black/50"
          />
        </div>

        <div className="mt-2 flex justify-between text-[10px] text-white/30">
          <span>familiar</span>
          <span>weirder →</span>
        </div>
      </div>
    </div>
  );
};
