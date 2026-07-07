"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

const COMMIT = 0.42;
const DRAG_RANGE = 190;

const STORIES = [
  ["Detents, explained", "Why every good gesture has a click"],
  ["The spring config", "One curve to rule the capsule library"],
  ["Edge peeks", "Predictive back and the end of mystery navigation"],
  ["Phosphor & fog", "Faking depth without WebGL"],
];

export const PredictiveBack = () => {
  const [detailOpen, setDetailOpen] = useState(true);
  const progress = useMotionValue(0);
  const draggingRef = useRef(false);

  const detailX = useTransform(progress, [0, 1], [0, 300]);
  const detailScale = useTransform(progress, [0, 1], [1, 0.88]);
  const detailRadius = useTransform(progress, [0, 0.15], [44, 28]);
  const homeScale = useTransform(progress, [0, 1], [0.94, 1]);
  const homeDim = useTransform(progress, [0, 1], [0.5, 0]);
  const arrowOpacity = useTransform(progress, [0.04, 0.15], [0, 1]);
  const arrowX = useTransform(progress, [0, 1], [-28, 8]);

  const releaseGesture = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const value = progress.get();
    if (value > COMMIT) {
      void animate(progress, 1, { type: "spring", duration: 0.4, bounce: 0 }).then(() => {
        setDetailOpen(false);
        progress.set(0);
      });
    } else {
      void animate(progress, 0, { type: "spring", duration: 0.45, bounce: 0.25 });
    }
  };

  const openDetail = () => {
    setDetailOpen(true);
    progress.set(1);
    void animate(progress, 0, { type: "spring", duration: 0.5, bounce: 0.18 });
  };

  return (
    <div
      className="relative h-[620px] w-[340px] overflow-hidden rounded-[44px] bg-black shadow-2xl shadow-black/60 ring-8 ring-black select-none"
      onPointerMove={(event) => {
        if (!draggingRef.current) return;
        const rect = event.currentTarget.getBoundingClientRect();
        progress.set(Math.min(1, Math.max(0, (event.clientX - rect.left) / DRAG_RANGE)));
      }}
      onPointerUp={releaseGesture}
      onPointerCancel={releaseGesture}
    >
      {/* Home screen (previous destination) */}
      <motion.div style={{ scale: homeScale }} className="absolute inset-0 bg-[#101116] px-5 pt-12">
        <p className="text-[22px] font-bold text-white">Reader</p>
        <div className="mt-4 space-y-2">
          {STORIES.map(([title, blurb], index) => (
            <button
              type="button"
              key={title}
              onClick={index === 2 ? openDetail : undefined}
              className={`w-full rounded-2xl p-4 text-left ring-1 transition-colors ${
                index === 2
                  ? "bg-[#20304d] ring-[#3b82f6]/30 hover:bg-[#24365a]"
                  : "bg-white/[0.05] ring-white/[0.05]"
              }`}
            >
              <p className="flex items-center justify-between text-[14px] font-semibold text-white">
                {title}
                {index === 2 && <ChevronRight className="size-4 text-white/40" />}
              </p>
              <p className="mt-0.5 text-[12px] text-white/45">{blurb}</p>
            </button>
          ))}
        </div>
        {detailOpen && (
          <motion.div
            aria-hidden
            style={{ opacity: homeDim }}
            className="pointer-events-none absolute inset-0 bg-black"
          />
        )}
      </motion.div>

      {/* Detail screen (current) */}
      {detailOpen && (
        <motion.div
          style={{ x: detailX, scale: detailScale, borderRadius: detailRadius }}
          className="absolute inset-0 overflow-hidden bg-[#161821] shadow-2xl shadow-black/70"
        >
          <div className="h-36 bg-[radial-gradient(circle_at_30%_40%,#3b82f6_0%,#1d2a44_70%)]" />
          <div className="px-5 pt-5">
            <p className="text-[11px] font-semibold tracking-widest text-sky-400 uppercase">
              Navigation
            </p>
            <p className="mt-1 text-[21px] leading-snug font-bold text-white">
              Edge peeks: predictive back and the end of mystery navigation
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-white/60">
              Android 14 made the back gesture honest. Drag from the left edge and the current
              screen shrinks in your hand, revealing exactly where you&apos;ll land before you
              commit. Let go early and it snaps back — no surprises, no leap of faith.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-white/60">
              Try it: drag slowly from the left bezel of this screen and watch the reader list wait
              underneath.
            </p>
          </div>
        </motion.div>
      )}

      {/* Back arrow indicator */}
      {detailOpen && (
        <motion.div
          style={{ opacity: arrowOpacity, x: arrowX }}
          className="absolute top-1/2 left-2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-lg"
        >
          <ArrowLeft className="size-4" />
        </motion.div>
      )}

      {/* Edge hot zone */}
      {detailOpen && (
        <div
          className="absolute inset-y-0 left-0 z-30 w-7 cursor-w-resize"
          onPointerDown={(event) => {
            draggingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={releaseGesture}
        />
      )}

      <p className="pointer-events-none absolute inset-x-0 bottom-4 z-20 text-center text-[11px] text-white/30">
        {detailOpen ? "Drag from the left edge" : "Open the highlighted story"}
      </p>
    </div>
  );
};
