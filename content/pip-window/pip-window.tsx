"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Mic, Video } from "lucide-react";
import { motion, useAnimation } from "motion/react";

const STAGE_WIDTH = 340;
const STAGE_HEIGHT = 620;
const PIP_WIDTH = 150;
const PIP_HEIGHT = 100;
const PADDING = 14;
const PEEK = 26;

type Tucked = "left" | "right" | null;

const CORNERS = [
  { x: PADDING, y: PADDING + 44 },
  { x: STAGE_WIDTH - PIP_WIDTH - PADDING, y: PADDING + 44 },
  { x: PADDING, y: STAGE_HEIGHT - PIP_HEIGHT - PADDING - 8 },
  { x: STAGE_WIDTH - PIP_WIDTH - PADDING, y: STAGE_HEIGHT - PIP_HEIGHT - PADDING - 8 },
];

const NOTES = [
  ["Capsule roadmap", "45 components · 12 shipped"],
  ["PiP physics", "Flick it — velocity picks the corner"],
  ["Edge tuck", "Throw it off the side, tap the tab to bring it back"],
  ["Cover videos", "record restart re-arms capture on the sized tab"],
  ["Motion notes", "One spring config per size change"],
];

export const PipWindow = () => {
  const controls = useAnimation();
  const positionRef = useRef({ ...CORNERS[3] });
  const [tucked, setTucked] = useState<Tucked>(null);

  const settle = (offsetX: number, offsetY: number, velocityX: number, velocityY: number) => {
    const current = positionRef.current;
    const projectedX = current.x + offsetX + velocityX * 0.18;
    const projectedY = current.y + offsetY + velocityY * 0.18;

    // A hard sideways throw tucks the window off-screen.
    if (projectedX < -PIP_WIDTH * 0.35 || (velocityX < -900 && projectedX < PADDING)) {
      positionRef.current = { x: -(PIP_WIDTH - PEEK), y: clampY(projectedY) };
      setTucked("left");
      void controls.start({
        ...positionRef.current,
        transition: { type: "spring", duration: 0.5, bounce: 0.24 },
      });
      return;
    }
    if (
      projectedX > STAGE_WIDTH - PIP_WIDTH * 0.65 ||
      (velocityX > 900 && projectedX > STAGE_WIDTH - PIP_WIDTH - PADDING)
    ) {
      positionRef.current = { x: STAGE_WIDTH - PEEK, y: clampY(projectedY) };
      setTucked("right");
      void controls.start({
        ...positionRef.current,
        transition: { type: "spring", duration: 0.5, bounce: 0.24 },
      });
      return;
    }

    let nearest = CORNERS[0];
    let best = Number.POSITIVE_INFINITY;
    for (const corner of CORNERS) {
      const distance = (corner.x - projectedX) ** 2 + (corner.y - projectedY) ** 2;
      if (distance < best) {
        best = distance;
        nearest = corner;
      }
    }
    if (!nearest) return;
    positionRef.current = { ...nearest };
    setTucked(null);
    void controls.start({
      ...nearest,
      transition: { type: "spring", duration: 0.55, bounce: 0.32 },
    });
  };

  const clampY = (value: number) =>
    Math.min(STAGE_HEIGHT - PIP_HEIGHT - PADDING, Math.max(PADDING + 44, value));

  const untuck = () => {
    const side = tucked;
    if (!side) return;
    const target =
      side === "left"
        ? { x: PADDING, y: positionRef.current.y }
        : { x: STAGE_WIDTH - PIP_WIDTH - PADDING, y: positionRef.current.y };
    positionRef.current = target;
    setTucked(null);
    void controls.start({
      ...target,
      transition: { type: "spring", duration: 0.5, bounce: 0.35 },
    });
  };

  return (
    <div
      className="relative overflow-hidden rounded-[44px] bg-[#0e0f13] shadow-2xl shadow-black/60 ring-8 ring-black select-none"
      style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
    >
      {/* Backdrop app */}
      <div className="px-5 pt-12">
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

      {/* PiP window */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.12}
        initial={{ x: CORNERS[3]?.x ?? 0, y: CORNERS[3]?.y ?? 0 }}
        animate={controls}
        onDragEnd={(_, info) =>
          settle(info.offset.x, info.offset.y, info.velocity.x, info.velocity.y)
        }
        onClick={untuck}
        style={{ width: PIP_WIDTH, height: PIP_HEIGHT }}
        className="absolute top-0 left-0 cursor-grab overflow-hidden rounded-2xl shadow-2xl shadow-black/70 ring-1 ring-white/20 active:cursor-grabbing"
      >
        {/* Fake FaceTime feed */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3b4a6b] via-[#22293d] to-[#141824]" />
        <motion.div
          aria-hidden
          className="absolute -top-6 left-8 size-24 rounded-full bg-[#7c8db0]/30 blur-xl"
          animate={{ x: [0, 8, -4, 0], y: [0, 4, -2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
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
              animate={{ height: [3, 9 + bar * 2, 4, 8, 3] }}
              transition={{ duration: 0.9 + bar * 0.2, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </motion.div>

        {/* Peek chevron when tucked */}
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

      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[11px] text-white/30">
        Flick the call window · throw it off an edge to tuck it
      </p>

      {/* Call bar */}
      <div className="pointer-events-none absolute inset-x-16 bottom-10 flex items-center justify-center gap-4 rounded-full bg-white/[0.07] py-2.5 backdrop-blur-md ring-1 ring-white/10">
        <Mic className="size-4 text-white/70" />
        <Video className="size-4 text-white/70" />
        <span className="size-4 rounded-full bg-red-500" />
      </div>
    </div>
  );
};
