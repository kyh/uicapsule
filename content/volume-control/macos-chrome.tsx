"use client";

import { useRef } from "react";
import { motion, useMotionValueEvent, useTransform } from "motion/react";
import {
  BatteryMediumIcon,
  SearchIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeIcon,
  VolumeOffIcon,
  WifiIcon,
} from "lucide-react";

import type { MotionValue } from "motion/react";
import type { ReactNode } from "react";

import { clampVolume, speakerTier, VOLUME_MAX } from "./volume-scale";

/** Every control is built to fit inside the HUD with 20px of air on each side, so
 * this one number sets the groove's length, the cannon's range, and the sheet of
 * ice. Widen it and the whole set widens with it. */
export const HUD_WIDTH = 520;
export const HUD_INNER_WIDTH = HUD_WIDTH - 40;

const TIERS = ["muted", "low", "mid", "high"] as const;

const TIER_ICON = {
  muted: VolumeOffIcon,
  low: VolumeIcon,
  mid: Volume1Icon,
  high: Volume2Icon,
} as const;

type MacosChromeProps = {
  /** Volume 0–100, owned by the shell. The menu bar follows it frame by frame. */
  volume: MotionValue<number>;
  open: boolean;
  onToggle: () => void;
  /** The HUD, anchored under the speaker icon. */
  hud: ReactNode;
};

/**
 * The desktop the controls live on: a menu bar running off the left edge of the
 * frame, with the speaker icon as the one thing you can actually click. It opens
 * the HUD and, from then on, only reports — it never sets anything itself.
 */
export const MacosChrome = ({ volume, open, onToggle, hud }: MacosChromeProps) => (
  <div className="flex items-center gap-6 select-none">
    <div aria-hidden className="flex items-center gap-6 text-[15px] whitespace-nowrap">
      <span className="font-semibold text-neutral-100">Music</span>
      <span className="text-neutral-300">File</span>
      <span className="text-neutral-300">Edit</span>
      <span className="text-neutral-300">Controls</span>
      <span className="text-neutral-300">Window</span>
    </div>

    <div className="ml-auto flex shrink-0 items-center gap-5">
      <BatteryMediumIcon aria-hidden className="size-6 text-neutral-300" />
      <WifiIcon aria-hidden className="size-[19px] text-neutral-300" />

      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label="Sound"
          className={`flex size-9 cursor-pointer items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
            open ? "bg-white/15" : "hover:bg-white/10"
          }`}
        >
          <SpeakerGlyph volume={volume} />
        </button>

        {hud}
      </div>

      <SearchIcon aria-hidden className="size-[19px] text-neutral-300" />
      <span aria-hidden className="text-[15px] whitespace-nowrap text-neutral-100">
        Tue 9:41
      </span>
    </div>
  </div>
);

/**
 * Four glyphs stacked, cross-fading on the volume value. A tier change is an icon
 * swap, and an icon swap is a re-render — so instead the icons all stay mounted
 * and opacity does the work, off the motion value, on the compositor.
 */
const SpeakerGlyph = ({ volume }: { volume: MotionValue<number> }) => (
  <span className="relative flex size-[22px] items-center justify-center">
    {TIERS.map((tier) => {
      const Icon = TIER_ICON[tier];
      return <TierIcon key={tier} tier={tier} Icon={Icon} volume={volume} />;
    })}
  </span>
);

const TierIcon = ({
  tier,
  Icon,
  volume,
}: {
  tier: (typeof TIERS)[number];
  Icon: (typeof TIER_ICON)[keyof typeof TIER_ICON];
  volume: MotionValue<number>;
}) => {
  const opacity = useTransform(volume, (value) => (speakerTier(value) === tier ? 1 : 0));
  return (
    <motion.span aria-hidden className="absolute inset-0" style={{ opacity }}>
      <Icon className="size-[22px] text-neutral-100" />
    </motion.span>
  );
};

type VolumeHudProps = {
  volume: MotionValue<number>;
  /** What the HUD calls the control it's showing. */
  title: string;
  /** A line of instruction under the title — the only help you get. */
  hint: string;
  children: ReactNode;
};

/**
 * The HUD itself: a readout that reports whatever the control below it decides,
 * and no way to set the volume directly. The number and the meter are written
 * straight to the DOM — a marble rolling or a stone sliding moves the volume
 * every frame, and none of that is worth a React render.
 */
export const VolumeHud = ({ volume, title, hint, children }: VolumeHudProps) => {
  const readoutRef = useRef<HTMLSpanElement>(null);
  useMotionValueEvent(volume, "change", (value) => {
    if (readoutRef.current) readoutRef.current.textContent = String(Math.round(value));
  });
  const meterScale = useTransform(volume, (value) => clampVolume(value) / VOLUME_MAX);

  return (
    <div
      style={{ width: HUD_WIDTH }}
      className="rounded-[22px] border border-white/10 bg-neutral-800/95 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl"
    >
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <p className="text-[15px] font-medium text-neutral-100">{title}</p>
        <p aria-live="polite" className="text-[15px] tabular-nums text-neutral-400">
          <span ref={readoutRef} className="text-neutral-100">
            {Math.round(volume.get())}
          </span>
          <span className="text-neutral-500"> / {VOLUME_MAX}</span>
        </p>
      </div>

      <p className="mb-3 text-[13px] text-neutral-500">{hint}</p>

      {/* The honest slider, demoted to a read-only meter. It shows you exactly
          where you are and offers no way to change it. */}
      <div aria-hidden className="mb-4 h-1.5 overflow-hidden rounded-full bg-neutral-700/70">
        <motion.div
          className="h-full origin-left rounded-full bg-neutral-100"
          style={{ scaleX: meterScale }}
        />
      </div>

      {children}
    </div>
  );
};
