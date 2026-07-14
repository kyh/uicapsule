"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue } from "motion/react";
import { RotateCcwIcon, ZapIcon } from "lucide-react";

import type { MotionValue } from "motion/react";

import { DialTrough } from "./effort-dial";
import {
  KNOB_SIZE,
  labelAt,
  nearestLevel,
  notchX,
  TRACK_TRAVEL,
  TRACK_WIDTH,
} from "./effort-scale";
import { averagePercent, FLAT_WORDS, LYRIC_LINES } from "./karaoke-lyrics";

/** Beat before the performance kicks off, so the card has a moment to land. */
const COUNT_IN_MS = 2000;
/** One word of the verse. */
const WORD_MS = 220;
/** Extra breath at the end of each bar. */
const BAR_REST_MS = 400;
/** Beat between the last word and the dial committing. */
const COMMIT_DELAY_MS = 700;

const DIAL_SPRING = { type: "spring", stiffness: 260, damping: 24 } as const;
const COMMIT_SPRING = { type: "spring", stiffness: 180, damping: 18 } as const;

const percentToX = (percent: number) => (percent / 100) * TRACK_TRAVEL;

type Burst = { id: number; percent: number };

type KaraokeCardProps = {
  knobX: MotionValue<number>;
  /**
   * Bumped by the shell every time the user tries to bail out through the chip
   * mid-verse. There's no close button on the card, so this is the only way the
   * card learns it's being walked out on — and it answers by refusing.
   */
  scoldNonce: number;
  /** True once the verse lands and the average is committed; the shell needs it
   * to know whether letting the user close is allowed. */
  onDone: (done: boolean) => void;
};

/**
 * You don't set this dial. You perform for it — or rather, it performs for you.
 *
 * The whole take is on rails: a count-in, then the verse fills itself in word by
 * word, each percentage kicking the needle and throwing sparks. Nothing commits
 * until the last bar lands, and the effort you end up with is the *average* of
 * every percentage in the verse — perform the entire thing and you still land
 * somewhere unremarkable. Try to leave early and it refuses to let you.
 */
export const KaraokeCard = ({ knobX, scoldNonce, onDone }: KaraokeCardProps) => {
  const [matched, setMatched] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [committed, setCommitted] = useState<number | null>(null);
  const [scolding, setScolding] = useState(false);

  const cardShake = useMotionValue(0);
  const burstId = useRef(0);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  }, []);
  const after = useCallback((ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms));
  }, []);

  const currentLineIndex = Math.min(
    FLAT_WORDS[matched]?.lineIndex ?? LYRIC_LINES.length - 1,
    LYRIC_LINES.length - 1,
  );

  const run = useCallback(() => {
    clearTimers();
    setMatched(0);
    setBursts([]);
    setCommitted(null);
    void animate(knobX, 0, DIAL_SPRING);

    // The take is scheduled up front rather than driven by a ticking cursor: every
    // word already knows when it lands, so the timing can't drift mid-verse.
    let elapsed = COUNT_IN_MS;
    FLAT_WORDS.forEach((word, index) => {
      elapsed += WORD_MS;
      const isLastOfBar = FLAT_WORDS[index + 1]?.lineIndex !== word.lineIndex;
      if (isLastOfBar) elapsed += BAR_REST_MS;

      after(elapsed, () => {
        setMatched(index + 1);
        if (word.percent === undefined) return;

        const landed = word.percent;
        void animate(knobX, percentToX(landed), DIAL_SPRING);
        burstId.current += 1;
        const burst = { id: burstId.current, percent: landed };
        setBursts((current) => [...current, burst]);
        after(800, () => setBursts((current) => current.filter((item) => item.id !== burst.id)));
      });
    });

    after(elapsed + COMMIT_DELAY_MS, () => {
      const average = averagePercent(FLAT_WORDS.flatMap((w) => (w.percent ? [w.percent] : [])));
      // The average is a percentage, but the dial only has notches — so the take
      // settles on the nearest one. That rounding IS the joke: perform six bars of
      // precise percentages and the machine shrugs them into "High".
      const level = nearestLevel(percentToX(average));
      setCommitted(level);
      onDone(true);
      void animate(knobX, notchX(level), COMMIT_SPRING);

      // One last burst, on the notch it actually landed on.
      burstId.current += 1;
      const finale = { id: burstId.current, percent: (notchX(level) / TRACK_TRAVEL) * 100 };
      setBursts((current) => [...current, finale]);
      after(900, () => setBursts((current) => current.filter((item) => item.id !== finale.id)));
    });
  }, [after, clearTimers, knobX, onDone]);

  useEffect(() => {
    onDone(false);
    run();
    return clearTimers;
  }, [run, clearTimers, onDone]);

  // Walking out mid-verse is not a thing you get to do. The shell bumps the nonce
  // when the chip is clicked before the take lands; the card answers by refusing.
  const firstNonce = useRef(scoldNonce);
  useEffect(() => {
    if (scoldNonce === firstNonce.current) return;
    setScolding(true);
    void animate(cardShake, [0, -9, 8, -6, 4, -2, 0], { duration: 0.45, ease: "easeOut" });
    const timer = window.setTimeout(() => setScolding(false), 2200);
    return () => window.clearTimeout(timer);
  }, [scoldNonce, cardShake]);

  const activeLine = LYRIC_LINES[currentLineIndex];
  const lineStart = FLAT_WORDS.findIndex((word) => word.lineIndex === currentLineIndex);
  const landedLabel = committed === null ? null : labelAt(committed);

  return (
    <motion.div
      style={{ x: cardShake }}
      className="relative rounded-[28px] border border-white/10 bg-neutral-800/95 p-5 shadow-2xl shadow-black/60"
    >
      <div className="mb-4 flex h-8 items-center justify-between gap-3">
        <p className="text-[15px] font-medium text-neutral-100">Reasoning effort</p>

        {/* The right slot carries the state of the take: how far in you are, the
            refusal if you try to bail, and only once it lands, the way to run it back. */}
        <AnimatePresence mode="wait" initial={false}>
          {committed !== null ? (
            <motion.button
              key="again"
              type="button"
              onClick={run}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.16 }}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-violet-500/60 bg-violet-500/10 px-3 py-1.5 text-[13px] text-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            >
              <RotateCcwIcon className="size-3.5 text-violet-300" />
              Again
              <ZapIcon className="size-3.5 text-violet-300" />
            </motion.button>
          ) : scolding ? (
            <motion.span
              key="scold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="shrink-0 text-[13px] text-rose-400"
            >
              Please finish the lyrics.
            </motion.span>
          ) : (
            <motion.span
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="shrink-0 text-[13px] tabular-nums text-neutral-400"
            >
              Bar {currentLineIndex + 1} of {LYRIC_LINES.length}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="relative mb-4 flex h-16 items-center justify-center overflow-hidden rounded-2xl bg-neutral-900/70 px-4">
        <AnimatePresence mode="popLayout">
          {committed === null ? (
            <motion.p
              key={currentLineIndex}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-[15px] font-medium"
            >
              {activeLine?.words.map((word, index) => {
                const done = lineStart + index < matched;
                const isPercent = word.percent !== undefined;
                return (
                  <span
                    key={`${currentLineIndex}-${lineStart + index}`}
                    className={
                      isPercent
                        ? done
                          ? "text-violet-400"
                          : "text-violet-400/30"
                        : done
                          ? "text-neutral-100"
                          : "text-neutral-600"
                    }
                  >
                    {word.text}
                  </span>
                );
              })}
            </motion.p>
          ) : (
            // The verse gives way to the verdict. It arrives with a flare behind it,
            // because six bars of arithmetic deserve at least a bit of ceremony.
            <motion.div
              key="landed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className="relative flex items-center justify-center"
            >
              <motion.span
                aria-hidden
                className="absolute size-3 rounded-full bg-violet-500/60 blur-md"
                initial={{ scale: 0.4, opacity: 0.9 }}
                animate={{ scale: [0.4, 14, 11], opacity: [0.9, 0.35, 0.18] }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
              <p className="relative flex items-baseline gap-1.5 text-[17px] font-medium">
                <span className="text-neutral-400">Landed on</span>
                <span className="text-violet-300">{landedLabel}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative" style={{ width: TRACK_WIDTH, height: KNOB_SIZE }}>
        <DialTrough knobX={knobX} />

        <AnimatePresence>
          {bursts.map((burst) => (
            <Sparks key={burst.id} percent={burst.percent} />
          ))}
        </AnimatePresence>

        <motion.div
          aria-hidden
          className="absolute rounded-full bg-white shadow-lg"
          style={{ top: 0, left: 0, width: KNOB_SIZE, height: KNOB_SIZE, x: knobX }}
        />
      </div>
    </motion.div>
  );
};

const SPARK_ANGLES = [-140, -110, -75, -45, 45, 75, 110, 140];

/** A hit of confetti at the notch the percentage just claimed. */
const Sparks = ({ percent }: { percent: number }) => (
  <motion.span
    aria-hidden
    className="absolute top-1/2 size-0"
    style={{ left: percentToX(percent) + KNOB_SIZE / 2 }}
  >
    <motion.span
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-400"
      initial={{ width: 10, height: 10, opacity: 0.9 }}
      animate={{ width: 64, height: 64, opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    />
    {SPARK_ANGLES.map((angle) => (
      <motion.span
        key={angle}
        className="absolute size-1 rounded-full bg-violet-300"
        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
        animate={{
          x: Math.cos((angle * Math.PI) / 180) * 30,
          y: Math.sin((angle * Math.PI) / 180) * 26,
          opacity: 0,
          scale: 0.4,
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    ))}
  </motion.span>
);
