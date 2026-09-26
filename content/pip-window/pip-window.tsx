"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Mic, Video } from "lucide-react";
import { motion, useAnimation, useReducedMotion } from "motion/react";

import { PhoneFrame, SCREEN_HEIGHT, SCREEN_WIDTH } from "./phone-frame";

const PIP_WIDTH = 150;
const PIP_HEIGHT = 100;
const PADDING = 14;
const PEEK = 26;

type Tucked = "left" | "right" | null;

// Top corners clear the Dynamic Island.
const TOP_Y = PADDING + 46;
// Bottom corners sit above the call bar so the window never covers its controls.
const BOTTOM_Y = SCREEN_HEIGHT - PIP_HEIGHT - 96;

const HOME = { x: SCREEN_WIDTH - PIP_WIDTH - PADDING, y: BOTTOM_Y };

const CORNERS = [
  { x: PADDING, y: TOP_Y },
  { x: SCREEN_WIDTH - PIP_WIDTH - PADDING, y: TOP_Y },
  { x: PADDING, y: BOTTOM_Y },
  HOME,
];

const clampY = (value: number) => Math.min(BOTTOM_Y, Math.max(TOP_Y, value));

const NOTES = [
  ["Capsule roadmap", "45 components · 12 shipped"],
  ["PiP physics", "Flick it — velocity picks the corner"],
  ["Edge tuck", "Throw it off the side, tap the tab to bring it back"],
  ["Cover videos", "record restart re-arms capture on the sized tab"],
  ["Motion notes", "One spring config per size change"],
];

export const PipWindow = () => {
  const controls = useAnimation();
  const positionRef = useRef({ ...HOME });
  const [tucked, setTucked] = useState<Tucked>(null);
  const reduced = useReducedMotion() ?? false;
  const spring = (bounce: number, duration: number) =>
    reduced ? { duration: 0 } : { bounce, duration, type: "spring" as const };

  const settle = (offsetX: number, offsetY: number, velocityX: number, velocityY: number) => {
    const { current } = positionRef;
    const projectedX = current.x + offsetX + velocityX * 0.18;
    const projectedY = current.y + offsetY + velocityY * 0.18;

    // A hard sideways throw tucks the window off-screen.
    if (projectedX < -PIP_WIDTH * 0.35 || (velocityX < -900 && projectedX < PADDING)) {
      positionRef.current = { x: -(PIP_WIDTH - PEEK), y: clampY(projectedY) };
      setTucked("left");
      void controls.start({
        ...positionRef.current,
        transition: spring(0.24, 0.5),
      });
      return;
    }
    if (
      projectedX > SCREEN_WIDTH - PIP_WIDTH * 0.65 ||
      (velocityX > 900 && projectedX > SCREEN_WIDTH - PIP_WIDTH - PADDING)
    ) {
      positionRef.current = { x: SCREEN_WIDTH - PEEK, y: clampY(projectedY) };
      setTucked("right");
      void controls.start({
        ...positionRef.current,
        transition: spring(0.24, 0.5),
      });
      return;
    }

    let nearest = HOME;
    let best = Number.POSITIVE_INFINITY;
    for (const corner of CORNERS) {
      const distance = (corner.x - projectedX) ** 2 + (corner.y - projectedY) ** 2;
      if (distance < best) {
        best = distance;
        nearest = corner;
      }
    }
    positionRef.current = { ...nearest };
    setTucked(null);
    void controls.start({
      ...nearest,
      transition: spring(0.32, 0.55),
    });
  };

  const untuck = () => {
    const side = tucked;
    if (!side) {
      return;
    }
    const target =
      side === "left"
        ? { x: PADDING, y: positionRef.current.y }
        : { x: SCREEN_WIDTH - PIP_WIDTH - PADDING, y: positionRef.current.y };
    positionRef.current = target;
    setTucked(null);
    void controls.start({
      ...target,
      transition: spring(0.35, 0.5),
    });
  };

  return (
    <PhoneFrame className="bg-[#0b1516]" tone="teal">
      <div className="px-5 pt-[60px]">
        <p className="text-[24px] font-bold text-white">Notes</p>
        <div className="mt-4 space-y-2.5">
          {NOTES.map(([title, body]) => (
            <div key={title} className="rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/[0.05]">
              <p className="text-[13px] font-semibold text-white/90">{title}</p>
              <p className="mt-0.5 text-[12px] text-white/40">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.12}
        initial={HOME}
        animate={controls}
        onDragEnd={(_, info) =>
          settle(info.offset.x, info.offset.y, info.velocity.x, info.velocity.y)
        }
        onClick={untuck}
        style={{ height: PIP_HEIGHT, width: PIP_WIDTH }}
        className="absolute top-0 left-0 cursor-grab overflow-hidden rounded-2xl shadow-2xl shadow-black/70 ring-1 ring-white/20 active:cursor-grabbing"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#3f6a68] via-[#20393b] to-[#112022]" />
        <motion.div
          aria-hidden
          className="absolute -top-6 left-8 size-24 rounded-full bg-[#8cc2ba]/30 blur-xl"
          animate={reduced ? undefined : { x: [0, 8, -4, 0], y: [0, 4, -2, 0] }}
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        />
        <div className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-b from-[#f0a58f] to-[#c76b52] text-[15px] font-semibold text-white">
          NV
        </div>
        <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-white/80">
          <Video className="size-3" />
          <span className="text-[10px] font-medium">Nova</span>
        </div>
        <motion.div className="absolute right-2 bottom-1.5 flex items-end gap-[2px]" aria-hidden>
          {[0, 1, 2].map((bar) => (
            <motion.span
              key={bar}
              className="w-[3px] rounded-full bg-emerald-400"
              animate={reduced ? { height: 6 + bar * 2 } : { height: [3, 9 + bar * 2, 4, 8, 3] }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 0.9 + bar * 0.2, ease: "easeInOut", repeat: Infinity }
              }
            />
          ))}
        </motion.div>

        {tucked && (
          <div
            className={`absolute inset-y-0 flex items-center bg-black/30 ${
              tucked === "left" ? "right-0 pr-1" : "left-0 pl-1"
            }`}
          >
            {tucked === "left" ? (
              <ChevronRight className="size-4 text-white/80" />
            ) : (
              <ChevronLeft className="size-4 text-white/80" />
            )}
          </div>
        )}
      </motion.div>

      <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-[11px] text-white/30">
        Flick the call window · throw it off an edge to tuck it
      </p>

      <div className="pointer-events-none absolute inset-x-16 bottom-12 flex items-center justify-center gap-4 rounded-full bg-white/[0.07] py-2.5 backdrop-blur-md ring-1 ring-white/10">
        <Mic className="size-4 text-white/70" />
        <Video className="size-4 text-white/70" />
        <span className="size-4 rounded-full bg-red-500" />
      </div>
    </PhoneFrame>
  );
};
