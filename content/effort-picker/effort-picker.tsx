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

export { type EffortTheme } from "./effort-theme";

export type EffortVariant = "slingshot" | "karaoke" | "curls";

const CARDS = { curls: CurlCard, karaoke: KaraokeCard, slingshot: SlingshotCard };

interface EffortPickerProps {
  variant?: EffortVariant;
  /** Which app the picker is pretending to live inside. Orthogonal to variant:
   * the theme paints the chrome, the variant supplies the physics. */
  theme?: EffortTheme;
}

const CARD_POP = { damping: 30, stiffness: 380, type: "spring" } as const;

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
  const [open, setOpen] = useState(!isPerformance(variant));

  const [renderedVariant, setRenderedVariant] = useState(variant);

  if (renderedVariant !== variant) {
    setRenderedVariant(variant);
    setOpen(!isPerformance(variant));
  }

  const [renderedTheme, setRenderedTheme] = useState(theme);

  if (renderedTheme !== theme) {
    const level = nearestLevel(renderedTheme, knobX.get());
    setRenderedTheme(theme);
    knobX.set(notchX(theme, level));
  }

  const handleToggle = () => setOpen((was) => !was);
  const Card = CARDS[variant];

  const handleFramePointerDown = (event: React.PointerEvent) => {
    if (!open) {
      return;
    }

    if (event.target instanceof Element && event.target.closest("[data-effort-control]")) {
      return;
    }

    setOpen(false);
  };

  const popover = (
    <AnimatePresence>
      {open && (
        <motion.div
          key={`${variant}-${theme}`}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 4 }}
          transition={CARD_POP}
          style={{ transformOrigin: "bottom right", width: CARD_WIDTH }}
          className="absolute right-0 bottom-full mb-2.5"
        >
          <Card knobX={knobX} theme={theme} />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      onPointerDown={handleFramePointerDown}
      className={`relative flex h-full w-full items-end justify-end overflow-hidden ${EFFORT_THEMES[theme].frame}`}
    >
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
