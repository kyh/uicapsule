"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { ChevronRightIcon, ZapIcon } from "lucide-react";

import { CHIP_OPEN_WIDTH, ComposerChrome } from "./composer-chrome";
import { DEFAULT_LEVEL, notchX } from "./effort-scale";
import { KaraokeCard } from "./karaoke-track";
import { SlingshotTrack } from "./slingshot-track";

import type { TrackPhase } from "./slingshot-track";

export type EffortVariant = "slingshot" | "karaoke";

type EffortPickerProps = {
  variant?: EffortVariant;
};

const HEADER_FADE = { duration: 0.18, ease: [0.4, 0, 0.2, 1] } as const;
const CARD_POP = { type: "spring", stiffness: 380, damping: 30 } as const;

/**
 * The Codex effort picker, rebuilt twice as a machine that resents being aimed.
 *
 * The whole thing is staged as a cropped corner of an app: the composer and the
 * surfaces behind it run wider than the frame and bleed off the edges, so the
 * popover reads as floating over a real product rather than posing on a page.
 * The shell owns the knob's position so the composer chip can follow it frame by
 * frame without re-rendering React.
 */
export const EffortPicker = ({ variant = "slingshot" }: EffortPickerProps) => {
  const knobX = useMotionValue(notchX(DEFAULT_LEVEL));
  const [phase, setPhase] = useState<TrackPhase>("idle");
  // The slingshot's popover is up by default — a closed card is a dull first frame.
  // The karaoke take has to be summoned: it's a performance, it needs a curtain.
  const [open, setOpen] = useState(variant === "slingshot");

  // Swapping variants on a mounted picker has to re-close the curtain, or karaoke
  // inherits the slingshot's always-open card and starts singing to nobody.
  const [renderedVariant, setRenderedVariant] = useState(variant);
  if (renderedVariant !== variant) {
    setRenderedVariant(variant);
    setOpen(variant === "slingshot");
  }

  // Hold the knob and the panel stops labelling itself and starts labelling the
  // *track* — which end buys you what. It's the only instruction the thing gives.
  const winding = phase !== "idle";

  // The karaoke card has no close button, so the chip is the only way out — and
  // it's barred until the verse lands. Clicking it mid-take bumps a nonce that the
  // card reads as "someone tried to leave", and it shakes them off.
  const [takeDone, setTakeDone] = useState(false);
  const [scoldNonce, setScoldNonce] = useState(0);

  const handleToggle = () => {
    const trappedMidVerse = variant === "karaoke" && open && !takeDone;
    if (trappedMidVerse) {
      setScoldNonce((nonce) => nonce + 1);
      return;
    }
    setOpen((was) => !was);
  };

  const popover = (
    <AnimatePresence>
      {open && (
        <motion.div
          key={variant}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={CARD_POP}
          style={{ transformOrigin: "bottom right", width: CHIP_OPEN_WIDTH }}
          // Pinned to the chip's right edge, at its full open width from the first
          // frame: the card doesn't grow with the chip, it lands over where the chip
          // is heading. The chip catches up underneath it.
          className="absolute right-0 bottom-full mb-2.5"
        >
          {variant === "karaoke" ? (
            <KaraokeCard knobX={knobX} scoldNonce={scoldNonce} onDone={setTakeDone} />
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-neutral-800/95 p-5 shadow-2xl shadow-black/60">
              <div className="relative mb-5 h-6">
                <motion.div
                  className="absolute inset-0 flex items-center justify-between"
                  animate={{ opacity: winding ? 0 : 1 }}
                  transition={HEADER_FADE}
                >
                  <span className="flex items-center gap-0.5 text-[15px] text-neutral-400">
                    Advanced
                    <ChevronRightIcon className="size-4 text-neutral-500" />
                  </span>
                  <ZapIcon className="size-5 text-neutral-500" />
                </motion.div>

                <motion.div
                  aria-hidden={!winding}
                  className="absolute inset-0 flex items-center justify-between px-0.5 text-[15px] text-neutral-500"
                  animate={{ opacity: winding ? 1 : 0 }}
                  transition={HEADER_FADE}
                >
                  <span>Faster</span>
                  <span>Smarter</span>
                </motion.div>
              </div>

              <div className="flex justify-center">
                <SlingshotTrack knobX={knobX} onPhaseChange={setPhase} />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative flex h-full w-full items-center justify-end overflow-hidden bg-neutral-950 text-neutral-100">
      {/* We're zoomed into the corner of somebody else's app, where the controls live:
          the composer overhangs the left edge and the frame crops it. The zoom comes
          from intrinsic sizes, never a transform — scaling this subtree would leave the
          slingshot's pointer deltas (screen px) out of step with its physics (local px),
          and the knob would outrun your finger. */}
      <div className="w-[calc(100%+180px)] shrink-0 pr-6">
        <ComposerChrome knobX={knobX} open={open} onToggle={handleToggle} popover={popover} />
      </div>
    </div>
  );
};
