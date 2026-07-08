"use client";

import { useRef, useState } from "react";
import { Music2 } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

const TRACKS = [
  ["Night Drive", "Solenne", "3:42"],
  ["Copper Sky", "Field Notes", "4:05"],
  ["Detent", "Haptic Club", "2:58"],
  ["Phosphor", "CRT Dreams", "3:21"],
  ["Edge Peek", "Backstack", "3:47"],
  ["Split Flap", "Terminal 5", "4:12"],
  ["Gooey", "Surface Tension", "3:03"],
  ["Rolodex", "Paper Trail", "2:47"],
  ["Cold Air", "Vent", "3:58"],
  ["Snap Point", "Sheet Music", "3:15"],
  ["Blur In", "Crossfade", "4:22"],
  ["Warm Rose", "HI/LO", "3:36"],
];

const MAX_STRETCH = 0.14;
const RESISTANCE = 1400;

export const OverscrollStretch = () => {
  const overscroll = useMotionValue(0); // + = pulled past top, - = past bottom
  const scaleY = useTransform(overscroll, (value) => 1 + Math.abs(value) * MAX_STRETCH);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [origin, setOrigin] = useState<"top" | "bottom">("top");
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyOverscroll = (deltaY: number) => {
    const node = scrollRef.current;
    if (!node) return false;
    const atTop = node.scrollTop <= 0;
    const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;

    if (atTop && deltaY < 0) {
      setOrigin("top");
      overscroll.set(Math.min(1, overscroll.get() - deltaY / RESISTANCE));
      return true;
    }
    if (atBottom && deltaY > 0) {
      setOrigin("bottom");
      overscroll.set(Math.max(-1, overscroll.get() - deltaY / RESISTANCE));
      return true;
    }
    return false;
  };

  const scheduleSettle = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      void animate(overscroll, 0, { type: "spring", duration: 0.5, bounce: 0.3 });
    }, 90);
  };

  return (
    <div className="relative flex h-[600px] w-[360px] flex-col overflow-hidden rounded-[36px] bg-[#101014] shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <p className="text-[20px] font-bold text-white">Library</p>
        <span className="text-[11px] text-white/35">Android 12 overscroll</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 pb-3 [scrollbar-width:none]"
        onWheel={(event) => {
          if (applyOverscroll(event.deltaY)) scheduleSettle();
        }}
      >
        <motion.div
          style={{
            scaleY,
            transformOrigin: origin === "top" ? "top center" : "bottom center",
          }}
          className="space-y-1"
        >
          {TRACKS.map(([title, artist, length], index) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.05]"
            >
              <div
                className="grid size-10 shrink-0 place-items-center rounded-lg"
                style={{
                  background: `linear-gradient(135deg, hsl(${(index * 47 + 200) % 360} 45% 38%), hsl(${(index * 47 + 250) % 360} 55% 22%))`,
                }}
              >
                <Music2 className="size-4 text-white/80" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white">{title}</p>
                <p className="truncate text-[11px] text-white/40">{artist}</p>
              </div>
              <span className="text-[11px] text-white/30 tabular-nums">{length}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <p className="pb-4 text-center text-[11px] text-white/30">
        Scroll past either end — the list stretches, no glow
      </p>
    </div>
  );
};
