"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "motion/react";

import type { EffortTheme } from "./effort-theme";

import { ComposerChrome } from "./composer-chrome";
import { CurlCard } from "./curl-track";
import { CARD_WIDTH, DEFAULT_LEVEL } from "./effort-scale";
import { EFFORT_THEMES, nearestLevel, notchX } from "./effort-theme";
import { KaraokeCard } from "./karaoke-track";
import { SlingshotCard } from "./slingshot-track";

export type EffortVariant = "slingshot" | "karaoke" | "curls";
export type { EffortTheme };

type EffortPickerProps = {
  variant?: EffortVariant;
  /** Which app the picker is pretending to live inside. Orthogonal to variant:
   * the theme paints the chrome, the variant supplies the physics. */
  theme?: EffortTheme;
};

const CARD_POP = { type: "spring", stiffness: 380, damping: 30 } as const;

/** Slingshot is a control you operate. The other two are takes you perform: they
 * start the moment the card opens, they run on their own clock, and they don't
 * let you leave halfway through. */
const isPerformance = (variant: EffortVariant) => variant !== "slingshot";

/**
 * The Codex effort picker, rebuilt twice as a machine that resents being aimed —
 * and reskinned as either of the two apps that ship one.
 *
 * The whole thing is staged as a cropped corner of an app: the composer and the
 * surfaces behind it run wider than the frame and bleed off the edges, so the
 * popover reads as floating over a real product rather than posing on a page.
 * The shell owns the knob's position so the composer chip can follow it frame by
 * frame without re-rendering React.
 */
export const EffortPicker = ({ variant = "slingshot", theme = "chatgpt" }: EffortPickerProps) => {
  const knobX = useMotionValue(notchX(theme, DEFAULT_LEVEL));
  // The slingshot's popover is up by default — a closed card is a dull first frame.
  // A performance has to be summoned: it needs a curtain, and the curls variant
  // needs the click before it asks anyone for their camera.
  const [open, setOpen] = useState(!isPerformance(variant));

  // A performance card has no close button, so the chip is the only way out — and
  // it's barred until the take lands. Clicking it mid-take bumps a nonce that the
  // card reads as "someone tried to leave", and it shakes them off.
  const [takeDone, setTakeDone] = useState(false);
  const [scoldNonce, setScoldNonce] = useState(0);

  // Swapping variants on a mounted picker has to re-close the curtain, or karaoke
  // inherits the slingshot's always-open card and starts singing to nobody.
  const [renderedVariant, setRenderedVariant] = useState(variant);
  if (renderedVariant !== variant) {
    setRenderedVariant(variant);
    setOpen(!isPerformance(variant));
    setTakeDone(false);
  }

  // A theme is free to cut its own number of notches into the track, so a knob
  // parked on one theme's notch need not sit on any of the next one's. Carry the
  // *level* across rather than the position — the dial should read the same word
  // after a reskin as it did before one.
  const [renderedTheme, setRenderedTheme] = useState(theme);
  if (renderedTheme !== theme) {
    const level = nearestLevel(renderedTheme, knobX.get());
    setRenderedTheme(theme);
    knobX.set(notchX(theme, level));
  }

  const handleToggle = () => {
    const trappedMidTake = isPerformance(variant) && open && !takeDone;
    if (trappedMidTake) {
      setScoldNonce((nonce) => nonce + 1);
      return;
    }
    // A card that is about to mount has not delivered a take yet. Karaoke says so
    // itself on mount, but the curls card waits on a camera before it says
    // anything — without this, a finished take leaves the next card unguarded.
    if (!open) setTakeDone(false);
    setOpen((was) => !was);
  };

  const popover = (
    <AnimatePresence>
      {open && (
        <motion.div
          // Re-keyed on theme as well as variant: a reskinned card is a different
          // card, and it should land rather than cross-fade its own chrome.
          key={`${variant}-${theme}`}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={CARD_POP}
          style={{ transformOrigin: "bottom right", width: CARD_WIDTH }}
          // Pinned to the chip's right edge, at its full open width from the first
          // frame: the card doesn't grow with the chip, it lands over where the chip
          // is heading. The chip catches up underneath it.
          className="absolute right-0 bottom-full mb-2.5"
        >
          {variant === "curls" ? (
            <CurlCard knobX={knobX} theme={theme} scoldNonce={scoldNonce} onDone={setTakeDone} />
          ) : variant === "karaoke" ? (
            <KaraokeCard knobX={knobX} theme={theme} scoldNonce={scoldNonce} onDone={setTakeDone} />
          ) : (
            <SlingshotCard knobX={knobX} theme={theme} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className={`relative flex h-full w-full items-end justify-end overflow-hidden ${EFFORT_THEMES[theme].frame}`}
    >
      {/* We're zoomed into the corner of somebody else's app, where the controls live:
          the composer overhangs the left edge and the frame crops it. The zoom comes
          from intrinsic sizes, never a transform — scaling this subtree would leave the
          slingshot's pointer deltas (screen px) out of step with its physics (local px),
          and the knob would outrun your finger.

          The composer sits ON the bottom edge rather than centred, which is where a
          composer actually lives — and it's what buys the curls variant the headroom
          for a square camera without shoving its card off the top of the frame. */}
      <div className="w-[calc(100%+180px)] shrink-0 pr-6 pb-8">
        <ComposerChrome
          knobX={knobX}
          theme={theme}
          open={open}
          onToggle={handleToggle}
          popover={popover}
        />
      </div>
    </div>
  );
};
