"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FC } from "react";
import {
  Bluetooth,
  Calculator,
  Camera,
  Flashlight,
  Moon,
  Music2,
  Plane,
  Radio,
  Signal,
  SkipForward,
  Sun,
  Timer,
  Volume2,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type ToggleId = "airplane" | "cellular" | "wifi" | "bluetooth" | "airdrop" | "hotspot";

interface Toggle {
  id: ToggleId;
  label: string;
  icon: LucideIcon;
  activeClass: string;
}

const TOGGLES: Toggle[] = [
  { activeClass: "bg-[#ff9f0a] text-white", icon: Plane, id: "airplane", label: "Airplane Mode" },
  { activeClass: "bg-[#30d158] text-white", icon: Signal, id: "cellular", label: "Cellular" },
  { activeClass: "bg-[#0a84ff] text-white", icon: Wifi, id: "wifi", label: "Wi-Fi" },
  { activeClass: "bg-[#0a84ff] text-white", icon: Bluetooth, id: "bluetooth", label: "Bluetooth" },
  { activeClass: "bg-[#0a84ff] text-white", icon: Radio, id: "airdrop", label: "AirDrop" },
  { activeClass: "bg-[#30d158] text-white", icon: Radio, id: "hotspot", label: "Hotspot" },
];

const SHORTCUTS: { label: string; icon: LucideIcon }[] = [
  { icon: Flashlight, label: "Flashlight" },
  { icon: Timer, label: "Timer" },
  { icon: Calculator, label: "Calculator" },
  { icon: Camera, label: "Camera" },
];

const LONG_PRESS_MS = 380;

const VerticalSlider: FC<{ icon: LucideIcon; initial: number }> = ({ icon: Icon, initial }) => {
  const [value, setValue] = useState(initial);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const update = (clientY: number) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const rect = track.getBoundingClientRect();
    const next = 1 - (clientY - rect.top) / rect.height;
    setValue(Math.min(1, Math.max(0.05, next)));
  };

  return (
    <div
      ref={trackRef}
      className="relative h-full w-full cursor-grab overflow-hidden rounded-3xl bg-white/[0.14] active:cursor-grabbing"
      onPointerDown={(event) => {
        draggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event.clientY);
      }}
      onPointerMove={(event) => {
        if (draggingRef.current) {
          update(event.clientY);
        }
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
    >
      <motion.div
        className="absolute inset-x-0 bottom-0 bg-white"
        animate={{ height: `${value * 100}%` }}
        transition={{ bounce: 0, duration: 0.3, type: "spring" }}
      />
      <Icon
        className={`absolute bottom-3 left-1/2 size-5 -translate-x-1/2 ${
          value > 0.16 ? "text-neutral-500" : "text-white/80"
        }`}
      />
    </div>
  );
};

export const ControlCenterTile = () => {
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<Record<ToggleId, boolean>>({
    airdrop: false,
    airplane: false,
    bluetooth: true,
    cellular: true,
    hotspot: false,
    wifi: true,
  });
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(
    () => () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    },
    [],
  );

  const startPress = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = setTimeout(() => setExpanded(true), LONG_PRESS_MS);
  }, []);

  const cancelPress = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const flip = useCallback((id: ToggleId) => {
    setActive((previous) => ({ ...previous, [id]: !previous[id] }));
  }, []);

  const primaryToggles = TOGGLES.slice(0, 4);

  return (
    <div className="relative h-[620px] w-[340px] overflow-hidden rounded-[44px] bg-[#101223] shadow-2xl shadow-black/60 ring-8 ring-black select-none">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute -top-24 -left-20 size-80 rounded-full bg-[#7c3aed]/35 blur-3xl" />
        <div className="absolute -right-16 bottom-16 size-72 rounded-full bg-[#0ea5e9]/25 blur-3xl" />
      </div>

      <div className="relative grid grid-cols-2 gap-3.5 p-5 pt-14">
        <motion.div
          layoutId="connectivity"
          style={{ borderRadius: 24 }}
          onPointerDown={startPress}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          className={`grid aspect-square grid-cols-2 place-items-center gap-1 bg-white/[0.14] p-3 backdrop-blur-2xl ${
            expanded ? "invisible" : ""
          }`}
        >
          {primaryToggles.map((toggle) => (
            <button
              type="button"
              key={toggle.id}
              aria-label={toggle.label}
              aria-pressed={active[toggle.id]}
              onClick={() => flip(toggle.id)}
              className={`grid size-11 place-items-center rounded-full transition-colors ${
                active[toggle.id] ? toggle.activeClass : "bg-white/[0.12] text-white/80"
              }`}
            >
              <toggle.icon className="size-5" />
            </button>
          ))}
        </motion.div>

        <div className="flex aspect-square flex-col justify-between rounded-3xl bg-white/[0.14] p-4 backdrop-blur-2xl">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#f472b6] to-[#7c3aed]">
              <Music2 className="size-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-white">Night Drive</p>
              <p className="text-[10px] text-white/50">Solenne</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-5 text-white">
            <span className="flex gap-[3px]">
              {[0, 1, 2].map((bar) => (
                <motion.span
                  key={bar}
                  className="w-[3px] rounded-full bg-white"
                  animate={{ height: reduceMotion ? 8 - bar * 2 : [4, 12 - bar * 2, 5, 10, 4] }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 1 + bar * 0.25, ease: "easeInOut", repeat: Infinity }
                  }
                />
              ))}
            </span>
            <SkipForward className="size-5 text-white/80" />
          </div>
        </div>

        <div className="grid aspect-square grid-cols-2 gap-3.5">
          <VerticalSlider icon={Sun} initial={0.65} />
          <VerticalSlider icon={Volume2} initial={0.4} />
        </div>

        <div className="grid aspect-square grid-cols-2 gap-3.5">
          {SHORTCUTS.map(({ label, icon: Icon }) => (
            <button
              type="button"
              key={label}
              aria-label={label}
              className="grid place-items-center rounded-3xl bg-white/[0.14] text-white/85 backdrop-blur-2xl transition-colors hover:bg-white/[0.2]"
            >
              <Icon className="size-5" />
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              key="backdrop"
              initial={{ backdropFilter: "blur(0px)", opacity: 0 }}
              animate={{ backdropFilter: "blur(10px)", opacity: 1 }}
              exit={{ backdropFilter: "blur(0px)", opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setExpanded(false)}
              className="absolute inset-0 z-20 bg-black/35"
            />
            <motion.div
              key="panel"
              layoutId="connectivity"
              style={{ borderRadius: 28 }}
              transition={{ bounce: 0.22, duration: 0.5, type: "spring" }}
              className="absolute inset-x-5 top-14 z-30 grid grid-cols-2 gap-2.5 bg-[#3a3a44]/90 p-4 backdrop-blur-2xl"
            >
              {TOGGLES.map((toggle) => (
                <button
                  type="button"
                  key={toggle.id}
                  aria-label={toggle.label}
                  aria-pressed={active[toggle.id]}
                  onClick={() => flip(toggle.id)}
                  className="flex items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-white/5"
                >
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors ${
                      active[toggle.id] ? toggle.activeClass : "bg-white/[0.12] text-white/80"
                    }`}
                  >
                    <toggle.icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-medium text-white">
                      {toggle.label}
                    </span>
                    <span className="block text-[10px] text-white/45">
                      {active[toggle.id] ? "On" : "Off"}
                    </span>
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-[11px] text-white/30">
        Hold the connectivity tile
      </p>

      <div className="absolute top-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/[0.1] px-3 py-1 text-[11px] text-white/70 backdrop-blur-xl">
        <Moon className="size-3 text-indigo-300" /> Focus
      </div>
    </div>
  );
};
