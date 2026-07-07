"use client";

import { useRef, useState } from "react";
import {
  Bluetooth,
  Flashlight,
  MessageCircle,
  Moon,
  Music2,
  RotateCcw,
  Sun,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

const STAGE_HEIGHT = 620;
// Shade progress: 0 closed · 1 peek · 2 full quick settings.

type Tile = { id: string; label: string; icon: LucideIcon; on: boolean };

const TILES: Tile[] = [
  { id: "wifi", label: "Internet", icon: Wifi, on: true },
  { id: "bt", label: "Bluetooth", icon: Bluetooth, on: true },
  { id: "torch", label: "Torch", icon: Flashlight, on: false },
  { id: "dnd", label: "Do Not Disturb", icon: Moon, on: false },
  { id: "rotate", label: "Auto-rotate", icon: RotateCcw, on: true },
  { id: "dark", label: "Dark theme", icon: Moon, on: true },
];

const NOTIFICATIONS = [
  ["Nova", "sent 3 photos", MessageCircle],
  ["Now playing", "Night Drive · Solenne", Music2],
] as const;

export const NotificationShade = () => {
  const progress = useMotionValue(0);
  const [tiles, setTiles] = useState(TILES);
  const draggingRef = useRef<{ startY: number; startProgress: number } | null>(null);

  const shadeHeight = useTransform(progress, [0, 1, 2], ["0%", "58%", "100%"]);
  const scrimOpacity = useTransform(progress, [0, 1], [0, 0.6]);
  const tileHeight = useTransform(progress, [1, 2], [56, 88]);
  const gridGap = useTransform(progress, [1, 2], [8, 10]);
  const labelOpacity = useTransform(progress, [1.4, 2], [0, 1]);
  const brightnessOpacity = useTransform(progress, [1.5, 2], [0, 1]);

  const release = () => {
    const drag = draggingRef.current;
    draggingRef.current = null;
    if (!drag) return;
    const value = progress.get();
    const target = value < 0.5 ? 0 : value < 1.5 ? 1 : 2;
    void animate(progress, target, { type: "spring", duration: 0.5, bounce: 0.24 });
  };

  const flip = (id: string) => {
    setTiles((previous) =>
      previous.map((tile) => (tile.id === id ? { ...tile, on: !tile.on } : tile)),
    );
  };

  return (
    <div
      className="relative h-[620px] w-[340px] overflow-hidden rounded-[44px] bg-[#101422] shadow-2xl shadow-black/60 ring-8 ring-black select-none"
      onPointerMove={(event) => {
        const drag = draggingRef.current;
        if (!drag) return;
        const delta = (event.clientY - drag.startY) / (STAGE_HEIGHT * 0.38);
        progress.set(Math.min(2, Math.max(0, drag.startProgress + delta * 2)));
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {/* Home content */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute -top-20 -left-16 size-72 rounded-full bg-[#4338ca]/40 blur-3xl" />
        <div className="absolute right-0 bottom-20 size-64 rounded-full bg-[#0891b2]/25 blur-3xl" />
      </div>
      <div className="relative px-6 pt-16">
        <p className="text-[46px] leading-none font-medium tracking-tight text-white">9:41</p>
        <p className="mt-1 text-[13px] text-white/50">Mon, Jul 7</p>
      </div>

      {/* Scrim */}
      <motion.div
        aria-hidden
        style={{ opacity: scrimOpacity }}
        className="pointer-events-none absolute inset-0 bg-black"
      />

      {/* Shade: clipped from the top, so peek reveals tiles first */}
      <motion.div
        style={{ height: shadeHeight }}
        className="absolute inset-x-0 top-0 overflow-hidden rounded-b-[36px] bg-[#151a2c]/98 shadow-2xl shadow-black/70"
      >
        <div className="px-4 pt-12">
          {/* Quick settings tiles */}
          <motion.div className="grid grid-cols-2" style={{ gap: gridGap }}>
            {tiles.slice(0, 6).map((tile) => (
              <motion.button
                type="button"
                key={tile.id}
                onClick={() => flip(tile.id)}
                style={{ height: tileHeight }}
                whileTap={{ scale: 0.96 }}
                className={`flex items-center gap-3 rounded-[26px] px-4 text-left transition-colors duration-300 ${
                  tile.on ? "bg-[#b7c4ff] text-[#1b2352]" : "bg-white/[0.08] text-white/70"
                }`}
              >
                <tile.icon className="size-4.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold">{tile.label}</span>
                  <motion.span
                    style={{ opacity: labelOpacity }}
                    className="block text-[10px] opacity-70"
                  >
                    {tile.on ? "On" : "Off"}
                  </motion.span>
                </span>
              </motion.button>
            ))}
          </motion.div>

          {/* Brightness — full stage only */}
          <motion.div
            style={{ opacity: brightnessOpacity }}
            className="mt-3 flex items-center gap-3 rounded-full bg-white/[0.08] px-4 py-2.5"
          >
            <Sun className="size-4 text-white/60" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-3/5 rounded-full bg-[#b7c4ff]" />
            </div>
          </motion.div>

          {/* Notifications */}
          <div className="mt-3 space-y-2">
            {NOTIFICATIONS.map(([title, body, Icon]) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-[22px] bg-white/[0.06] px-4 py-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#b7c4ff]/20 text-[#b7c4ff]">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-white">{title}</p>
                  <p className="truncate text-[11px] text-white/45">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Shade handle — also a pull zone */}
        <div
          className="absolute inset-x-0 bottom-0 flex h-8 cursor-grab items-end justify-center pb-2 active:cursor-grabbing"
          onPointerDown={(event) => {
            draggingRef.current = { startY: event.clientY, startProgress: progress.get() };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={release}
        >
          <div className="h-1 w-10 rounded-full bg-white/25" />
        </div>
      </motion.div>

      {/* Pull zone (status bar area + shade handle) */}
      <div
        className="absolute inset-x-0 top-0 z-20 h-10 cursor-grab active:cursor-grabbing"
        onPointerDown={(event) => {
          draggingRef.current = { startY: event.clientY, startProgress: progress.get() };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={release}
      />
      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[11px] text-white/30">
        Pull down from the top — keep pulling for full settings
      </p>
    </div>
  );
};
