"use client";

import { useRef } from "react";
import { motion, useMotionValueEvent } from "motion/react";
import {
  ArrowUpIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  FolderIcon,
  GitBranchIcon,
  LaptopIcon,
  MicIcon,
  PlusIcon,
} from "lucide-react";

import type { MotionValue } from "motion/react";
import type { ReactNode } from "react";

import { DEFAULT_LEVEL, labelAt, nearestLevel, notchX } from "./effort-scale";

/** The chip's two sizes. Its right edge is pinned, so opening grows it leftward
 * until it lines up under the card. */
const CHIP_CLOSED_WIDTH = 200;
export const CHIP_OPEN_WIDTH = 440;

const CHIP_MORPH = { type: "spring", stiffness: 420, damping: 36 } as const;

/** The cost estimate doesn't move with the dial — only the level beside it does. */
const STATIC_SOL = "5.6 Sol";

type ComposerChromeProps = {
  /** Knob offset in px. The effort chip reads whatever the dial settles on. */
  knobX: MotionValue<number>;
  /** The chip is the one live control down here: it opens and closes the card. */
  onToggle: () => void;
  open: boolean;
  /** The card, anchored to the chip's right edge so the two line up. */
  popover: ReactNode;
};

/**
 * The composer the picker lives in. The prompt box itself never moves — the trick
 * is in the chip: opening the card widens it leftward from a compact pill into a
 * bar the width of the card above it. Everything here is scenery except the chip.
 */
export const ComposerChrome = ({ knobX, onToggle, open, popover }: ComposerChromeProps) => {
  // Same trick as the dial's aria mirror: the label only changes when the knob
  // crosses a notch, so it's written to the DOM instead of re-rendering React.
  const labelRef = useRef<HTMLSpanElement>(null);
  useMotionValueEvent(knobX, "change", (x) => {
    if (labelRef.current) labelRef.current.textContent = labelAt(nearestLevel(x));
  });
  const restingX = notchX(DEFAULT_LEVEL);

  return (
    <div className="select-none">
      <div aria-hidden className="flex items-center gap-7 px-4 pb-4 text-[17px] text-neutral-300">
        <span className="flex items-center gap-2.5">
          <FolderIcon className="size-5 text-neutral-400" />
          loremllm
        </span>
        <span className="flex items-center gap-2.5">
          <LaptopIcon className="size-5 text-neutral-400" />
          Local
        </span>
        <span className="flex items-center gap-2.5">
          <GitBranchIcon className="size-5 text-neutral-400" />
          main
        </span>
      </div>

      <div className="rounded-[26px] bg-neutral-800 px-5 pt-5 pb-4">
        <p aria-hidden className="mb-10 text-[17px] text-neutral-500">
          Do anything
        </p>

        <div className="flex items-center gap-4">
          <PlusIcon aria-hidden className="size-6 shrink-0 text-neutral-400" />
          <span aria-hidden className="flex items-center gap-2.5 text-[17px] text-neutral-400">
            <CircleCheckIcon className="size-5" />
            Approve for me
          </span>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              {popover}

              <motion.button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                animate={{ width: open ? CHIP_OPEN_WIDTH : CHIP_CLOSED_WIDTH }}
                transition={CHIP_MORPH}
                // Closed, the chip is bare text — it only takes on a surface once it
                // widens into the bar under the card.
                className={`flex h-12 cursor-pointer items-center rounded-full px-5 text-[17px] outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 ${
                  open ? "bg-neutral-700/60" : "hover:bg-white/5"
                }`}
              >
                <span className="flex flex-1 items-center justify-center gap-1.5 truncate">
                  <span className="text-neutral-100">{STATIC_SOL}</span>
                  <span ref={labelRef} className="text-neutral-400">
                    {labelAt(nearestLevel(restingX))}
                  </span>
                </span>
                <ChevronDownIcon
                  className={`size-5 shrink-0 text-neutral-400 transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </motion.button>
            </div>

            <MicIcon aria-hidden className="size-6 shrink-0 text-neutral-400" />
            <span
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-700"
            >
              <ArrowUpIcon className="size-6 text-neutral-200" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
