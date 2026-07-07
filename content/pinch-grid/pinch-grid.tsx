"use client";

import { useCallback, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { motion } from "motion/react";

// Abstract "photos" — hue pairs rendered as gradients so the capsule ships no assets.
const TILES = Array.from({ length: 30 }, (_, index) => {
  const hue = (index * 47) % 360;
  const hueB = (hue + 40 + ((index * 13) % 50)) % 360;
  const angle = (index * 67) % 360;
  return {
    id: `tile-${index}`,
    gradient: `linear-gradient(${angle}deg, hsl(${hue} 65% 52%), hsl(${hueB} 70% 30%))`,
  };
});

const LEVELS = [7, 5, 3, 1] as const;
const PINCH_STEP = 90;

export const PinchGrid = () => {
  const [level, setLevel] = useState(1);
  const pinchDebtRef = useRef(0);

  const zoom = useCallback((direction: 1 | -1) => {
    setLevel((previous) => Math.min(LEVELS.length - 1, Math.max(0, previous + direction)));
  }, []);

  const columns = LEVELS[level] ?? 5;

  return (
    <div
      className="flex h-[600px] w-[400px] flex-col overflow-hidden rounded-[36px] bg-[#0b0b0d] shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none"
      onWheel={(event) => {
        // Trackpad pinches arrive as ctrl+wheel.
        if (!event.ctrlKey && !event.metaKey) return;
        pinchDebtRef.current += event.deltaY;
        if (pinchDebtRef.current > PINCH_STEP) {
          // Pinch in → zoom out → more columns.
          pinchDebtRef.current = 0;
          zoom(-1);
        } else if (pinchDebtRef.current < -PINCH_STEP) {
          pinchDebtRef.current = 0;
          zoom(1);
        }
      }}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-[17px] font-semibold text-white">Library</p>
          <p className="text-[12px] text-white/40">June 2026</p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => zoom(-1)}
            disabled={level === 0}
            className="grid size-9 place-items-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-40"
          >
            <ZoomOut className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => zoom(1)}
            disabled={level >= LEVELS.length - 1}
            className="grid size-9 place-items-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-40"
          >
            <ZoomIn className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-1.5 pb-1.5">
        <motion.div
          className="grid h-full content-start gap-1"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {TILES.map((tile) => (
            <motion.div
              key={tile.id}
              layout
              transition={{ type: "spring", duration: 0.55, bounce: 0.18 }}
              className="aspect-square rounded-[3px]"
              style={{ background: tile.gradient }}
            />
          ))}
        </motion.div>
      </div>

      <p className="pb-4 text-center text-[11px] text-white/30">
        Pinch the trackpad — or use the zoom buttons
      </p>
    </div>
  );
};
