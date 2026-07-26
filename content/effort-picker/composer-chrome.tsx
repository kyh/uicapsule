"use client";

import { motion } from "motion/react";
import {
  ArrowUpIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  CornerDownLeftIcon,
  FolderIcon,
  GitBranchIcon,
  LaptopIcon,
  MicIcon,
  PlusIcon,
} from "lucide-react";

import type { ReactNode } from "react";
import type { MotionValue } from "motion/react";

import type { EffortTheme } from "./effort-theme";

import { LevelLabel } from "./effort-dial";
import { CARD_WIDTH } from "./effort-scale";
import { EFFORT_THEMES } from "./effort-theme";

/** ChatGPT's chip has two sizes. Its right edge is pinned, so opening grows it
 * leftward until it lines up under the card. Claude's chip doesn't grow — the
 * card just arrives above it. */
const CHIP_CLOSED_WIDTH = 200;
const CHIP_MORPH = { type: "spring", stiffness: 420, damping: 36 } as const;

/** The cost estimate doesn't move with the dial — only the level beside it does. */
const STATIC_SOL = "5.6 Sol";
const MODEL_NAME = "Fable 5";

type ComposerChromeProps = {
  /** Knob offset in px. The effort chip reads whatever the dial settles on. */
  knobX: MotionValue<number>;
  theme: EffortTheme;
  /** The chip is the one live control down here: it opens and closes the card. */
  onToggle: () => void;
  open: boolean;
  /** The card, anchored to the chip's right edge so the two line up. */
  popover: ReactNode;
};

/**
 * The composer the picker lives in. Each theme gets its own shell rather than one
 * shell wearing two coats: the two apps don't just paint their controls
 * differently, they *put them in different places* — ChatGPT keeps the effort chip
 * inside the prompt box, Claude parks it on a rail underneath.
 */
export const ComposerChrome = (props: ComposerChromeProps) =>
  props.theme === "claude" ? <ClaudeComposer {...props} /> : <CodexComposer {...props} />;

/**
 * The prompt box never moves — the trick is in the chip: opening the card widens
 * it leftward from a compact pill into a bar the width of the card above it.
 * Everything here is scenery except the chip.
 */
const CodexComposer = ({ knobX, theme, onToggle, open, popover }: ComposerChromeProps) => {
  const tokens = EFFORT_THEMES[theme];

  return (
    <div className="select-none">
      <div aria-hidden className={`flex items-center gap-7 px-4 pb-4 text-[17px] text-neutral-300`}>
        <span className="flex items-center gap-2.5">
          <FolderIcon className={`size-5 ${tokens.muted}`} />
          loremllm
        </span>
        <span className="flex items-center gap-2.5">
          <LaptopIcon className={`size-5 ${tokens.muted}`} />
          Local
        </span>
        <span className="flex items-center gap-2.5">
          <GitBranchIcon className={`size-5 ${tokens.muted}`} />
          main
        </span>
      </div>

      <div className="rounded-[26px] bg-neutral-800 px-5 pt-5 pb-4">
        <p aria-hidden className={`mb-10 text-[17px] ${tokens.faint}`}>
          Do anything
        </p>

        <div className="flex items-center gap-4">
          <PlusIcon aria-hidden className={`size-6 shrink-0 ${tokens.muted}`} />
          <span aria-hidden className={`flex items-center gap-2.5 text-[17px] ${tokens.muted}`}>
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
                animate={{ width: open ? CARD_WIDTH : CHIP_CLOSED_WIDTH }}
                transition={CHIP_MORPH}
                // Closed, the chip is bare text — it only takes on a surface once it
                // widens into the bar under the card.
                className={`flex h-12 cursor-pointer items-center rounded-full px-5 text-[17px] outline-none focus-visible:ring-2 ${
                  tokens.ring
                } ${open ? "bg-neutral-700/60" : "hover:bg-white/5"}`}
              >
                <span className="flex flex-1 items-center justify-center gap-1.5 truncate">
                  <span className={tokens.text}>{STATIC_SOL}</span>
                  <LevelLabel knobX={knobX} theme={theme} className={tokens.muted} />
                </span>
                <ChevronDownIcon
                  className={`size-5 shrink-0 transition-transform duration-200 ${tokens.muted} ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </motion.button>
            </div>

            <MicIcon aria-hidden className={`size-6 shrink-0 ${tokens.muted}`} />
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

/**
 * Claude keeps the prompt box clean and hangs the model rail below it, right
 * aligned. The effort chip is the last thing before the send button and it never
 * changes size — so the card, pinned to that chip's right edge, is the only thing
 * on screen that moves when you open it.
 */
const ClaudeComposer = ({ knobX, theme, onToggle, open, popover }: ComposerChromeProps) => {
  const tokens = EFFORT_THEMES[theme];
  /** Session chips and the model rail share one pill: 24px tall, 6px radius, 6px
   * of padding either side — doubled. */
  const pill = "flex h-12 items-center gap-3 rounded-xl px-3 text-[26px]";

  return (
    <div className="select-none">
      {/* Long enough to survive the crop: the frame swallows the first 180px, so a
          two-chip rail would vanish entirely into the overhang. */}
      <div aria-hidden className={`mb-2.5 flex items-center gap-2.5 ${tokens.text}`}>
        <span className={`${pill} bg-white/8`}>
          <FolderIcon className="size-6" />
          loremllm
        </span>
        <span className={`${pill} bg-white/8`}>
          <GitBranchIcon className="size-6" />
          main
        </span>
        <span className={`${pill} bg-white/8`}>
          <PlusIcon className="size-6" />
        </span>
      </div>

      {/* Same surface and same inset stroke as the popover card — in this app the
          prompt box and the card are the same material, lit the same way. */}
      <div
        aria-hidden
        className="flex items-center gap-4 rounded-[20px] bg-[#2c2c2a] px-5 py-6 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08)]"
      >
        <p className={`flex-1 text-[28px] ${tokens.muted}`}>Describe a task or ask a question</p>
        <CornerDownLeftIcon className={`size-7 shrink-0 ${tokens.faint}`} />
      </div>

      <div className="mt-2.5 flex h-14 items-center gap-2.5">
        <span aria-hidden className={`flex items-center gap-5 px-3 text-[24px] ${tokens.text}`}>
          Accept edits
          <PlusIcon className="size-6" />
          <MicIcon className="size-6" />
        </span>

        <span aria-hidden className={`ml-auto px-3 text-[24px] ${tokens.text}`}>
          {MODEL_NAME}
        </span>

        <div className="relative">
          {popover}

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            // The chip never resizes — open, it just takes on a surface, and the
            // card lands above it.
            className={`flex h-10 cursor-pointer items-center rounded-[10px] px-3 text-[24px] text-white outline-none focus-visible:ring-2 ${
              tokens.ring
            } ${open ? "bg-white/12" : "hover:bg-white/8"}`}
          >
            <LevelLabel knobX={knobX} theme={theme} />
          </button>
        </div>

        <span aria-hidden className="size-10 shrink-0 rounded-full border-[3px] border-white/20" />
      </div>
    </div>
  );
};
