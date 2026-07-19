"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";

import type { MotionValue } from "motion/react";
import type { ReactNode } from "react";

import { CannonTrack } from "./cannon-track";
import { CurlingTrack } from "./curling-track";
import { DotsTrack } from "./dots-track";
import { MacosChrome, VolumeHud } from "./macos-chrome";
import { PlusMinusTrack } from "./plus-minus-track";
import { TiltTrack } from "./tilt-track";
import { DEFAULT_VOLUME } from "./volume-scale";

export type VolumeVariant = "tilt" | "cannon" | "curling" | "dots" | "plus-minus";

type VolumeControlProps = {
  variant?: VolumeVariant;
};

const HUD_POP = { type: "spring", stiffness: 380, damping: 30 } as const;

const HINTS: Record<VolumeVariant, string> = {
  tilt: "Tilt the panel. Roll the marble. Don't overshoot.",
  cannon: "Pull back, let go, and hope.",
  curling: "Throw the stone. Sweep to keep it going.",
  dots: "Draw the number you want. It reads dots, nothing else.",
  "plus-minus": "Hit + for louder. Good luck catching it.",
};

/** Every control takes the volume and nothing else, so the shell can pick one by
 * name. Keyed by variant rather than branched on it: adding a sixth control makes
 * this table and HINTS fail to compile until both know about it. */
const TRACKS: Record<VolumeVariant, (props: { volume: MotionValue<number> }) => ReactNode> = {
  tilt: TiltTrack,
  cannon: CannonTrack,
  curling: CurlingTrack,
  dots: DotsTrack,
  "plus-minus": PlusMinusTrack,
};

/**
 * Five volume controls, none of which will let you simply set the volume.
 *
 * The staging is the same trick as the effort picker: we're zoomed into the top
 * corner of somebody's desktop, the menu bar bleeds off the frame, and the HUD
 * hangs off the speaker icon like it would in the real thing. The shell owns the
 * volume as a motion value so the menu bar can follow a rolling marble frame by
 * frame without re-rendering React — the controls write to it, the chrome reads
 * it, and neither knows anything about the other.
 */
export const VolumeControl = ({ variant = "tilt" }: VolumeControlProps) => {
  const volume = useMotionValue(DEFAULT_VOLUME);
  const [open, setOpen] = useState(true);

  // Swapping controls would otherwise hand the next one a volume the last one
  // earned, which reads as a bug rather than a joke. Everyone starts at 35.
  const [renderedVariant, setRenderedVariant] = useState(variant);
  if (renderedVariant !== variant) {
    setRenderedVariant(variant);
    volume.set(DEFAULT_VOLUME);
  }

  const Track = TRACKS[variant];

  const hud = (
    <AnimatePresence>
      {open && (
        <motion.div
          key={variant}
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.96 }}
          transition={HUD_POP}
          style={{ transformOrigin: "top right" }}
          className="absolute top-full right-0 z-10 mt-2.5"
        >
          <VolumeHud volume={volume} title="Output level" hint={HINTS[variant]}>
            <Track volume={volume} />
          </VolumeHud>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative flex h-full w-full items-start justify-end overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Somebody else's desktop, cropped: the wallpaper, the menu bar and the window
          behind it all run wider than the frame. The zoom is intrinsic sizing, never a
          transform — scaling this subtree would put the controls' pointer deltas (screen
          px) out of step with their physics (local px), and the marble would outrun your
          hand. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-neutral-950 to-neutral-950"
      />

      <NowPlayingWindow volume={volume} />

      <div className="relative w-[calc(100%+220px)] shrink-0 px-6 pt-4">
        <MacosChrome
          volume={volume}
          open={open}
          onToggle={() => setOpen((was) => !was)}
          hud={hud}
        />
      </div>
    </div>
  );
};

/**
 * The app you were trying to turn down, sitting behind everything, bleeding off the
 * bottom-left of the frame. Pure scenery with one exception: its levels ride the
 * volume, so whatever the control up there finally decides, you see it land here.
 */
const NowPlayingWindow = ({ volume }: { volume: MotionValue<number> }) => (
  <div
    aria-hidden
    className="absolute top-1/2 -left-20 w-[640px] -translate-y-1/2 rounded-3xl border border-white/[0.07] bg-neutral-900/60 p-7 shadow-2xl shadow-black/50 backdrop-blur-sm"
  >
    <div className="mb-6 flex gap-2">
      <span className="size-3 rounded-full bg-neutral-700" />
      <span className="size-3 rounded-full bg-neutral-700" />
      <span className="size-3 rounded-full bg-neutral-700" />
    </div>

    <div className="flex items-center gap-6">
      <div className="size-32 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500/40 to-rose-500/30" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[19px] font-medium text-neutral-200">Everything Louder</p>
        <p className="mb-5 truncate text-[15px] text-neutral-500">
          Motörhead — No Sleep 'til Hammersmith
        </p>
        <Levels volume={volume} />
      </div>
    </div>
  </div>
);

/** Each bar is named, so the set can be walked without leaning on its index. */
const BARS = [
  { id: "a", height: 0.45 },
  { id: "b", height: 0.8 },
  { id: "c", height: 0.35 },
  { id: "d", height: 1 },
  { id: "e", height: 0.6 },
  { id: "f", height: 0.9 },
  { id: "g", height: 0.5 },
  { id: "h", height: 0.75 },
  { id: "i", height: 0.4 },
  { id: "j", height: 0.85 },
  { id: "k", height: 0.55 },
  { id: "l", height: 0.7 },
];

/** The only honest feedback in the whole component: bars that get taller when the
 * volume does. They're a readout, not a control — you cannot drag them either. */
const Levels = ({ volume }: { volume: MotionValue<number> }) => (
  <div className="flex h-12 items-end gap-1.5">
    {BARS.map((bar) => (
      <LevelBar key={bar.id} height={bar.height} volume={volume} />
    ))}
  </div>
);

const LevelBar = ({ height, volume }: { height: number; volume: MotionValue<number> }) => {
  const scaleY = useTransform(volume, [0, 100], [0.06, height]);
  return (
    <motion.span
      className="h-full w-2.5 origin-bottom rounded-full bg-gradient-to-t from-indigo-400/60 to-rose-300/60"
      style={{ scaleY }}
    />
  );
};
