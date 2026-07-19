"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import { RotateCcwIcon, ZapIcon } from "lucide-react";

import type { MotionValue } from "motion/react";

import { DialTrough, Sparks } from "./effort-dial";
import {
  KNOB_SIZE,
  labelAt,
  nearestLevel,
  notchX,
  percentToX,
  TRACK_TRAVEL,
  TRACK_WIDTH,
} from "./effort-scale";
import { averagePercent, FLAT_WORDS, LYRIC_LINES, VERSE_BEATS } from "./karaoke-lyrics";

/** The original track sits at 85 BPM. Every cue below lands on that grid. */
const BEAT_MS = 60_000 / 85;
const COUNTDOWN_BEATS = 3;
const COUNT_IN_MS = BEAT_MS * COUNTDOWN_BEATS;
/** Beat between the last word and the dial committing. */
const COMMIT_DELAY_MS = 700;

const DIAL_SPRING = { type: "spring", stiffness: 260, damping: 24 } as const;
const COMMIT_SPRING = { type: "spring", stiffness: 180, damping: 18 } as const;

type Burst = { id: number; percent: number };
type CountdownCount = 3 | 2 | 1;

type TakeState =
  | { status: "countdown"; count: CountdownCount }
  | { status: "singing"; matched: number }
  | { status: "complete"; level: number };

const promptForCountdown = (count: CountdownCount) => (count === 1 ? "Let's go!" : "You ready?!");

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
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [take, setTake] = useState<TakeState>({ status: "countdown", count: 3 });
  const [scolding, setScolding] = useState(false);
  const reduceMotion = useReducedMotion();

  const cardShake = useMotionValue(0);
  const burstId = useRef(0);
  const timers = useRef<number[]>([]);
  const reduceMotionRef = useRef(Boolean(reduceMotion));

  useEffect(() => {
    reduceMotionRef.current = Boolean(reduceMotion);
  }, [reduceMotion]);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  }, []);
  const after = useCallback((ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms));
  }, []);

  // The line on screen is the one the *last landed word* belongs to, not the one
  // the next word belongs to. Reading ahead flipped the line the instant a bar's
  // final word landed, so that word was never seen lit — every bar looked like it
  // skipped its last word, and the closing bar was cut off entirely by the commit.
  const matched =
    take.status === "singing" ? take.matched : take.status === "complete" ? FLAT_WORDS.length : 0;
  const currentLineIndex =
    matched === 0 ? 0 : (FLAT_WORDS[matched - 1]?.lineIndex ?? LYRIC_LINES.length - 1);

  const run = useCallback(() => {
    clearTimers();
    setBursts([]);
    setScolding(false);
    setTake({ status: "countdown", count: 3 });
    onDone(false);
    if (reduceMotionRef.current) knobX.set(0);
    else void animate(knobX, 0, DIAL_SPRING);

    after(BEAT_MS, () => setTake({ status: "countdown", count: 2 }));
    after(BEAT_MS * 2, () => setTake({ status: "countdown", count: 1 }));
    after(COUNT_IN_MS, () => setTake({ status: "singing", matched: 0 }));

    // Cues are song beats, not a uniform word ticker. Short bars breathe while the
    // dense final bar runs faster, matching the recorded cadence without drift.
    FLAT_WORDS.forEach((word, index) => {
      after(COUNT_IN_MS + word.cueBeat * BEAT_MS, () => {
        setTake({ status: "singing", matched: index + 1 });
        if (word.percent === undefined) return;

        const landed = word.percent;
        if (reduceMotionRef.current) {
          knobX.set(percentToX(landed));
          return;
        }
        void animate(knobX, percentToX(landed), DIAL_SPRING);
        burstId.current += 1;
        const burst = { id: burstId.current, percent: landed };
        setBursts((current) => [...current, burst]);
        after(800, () => setBursts((current) => current.filter((item) => item.id !== burst.id)));
      });
    });

    after(COUNT_IN_MS + VERSE_BEATS * BEAT_MS + COMMIT_DELAY_MS, () => {
      const average = averagePercent(
        FLAT_WORDS.flatMap((word) => (word.percent === undefined ? [] : [word.percent])),
      );
      // The average is a percentage, but the dial only has notches — so the take
      // settles on the nearest one. That rounding IS the joke: perform six bars of
      // precise percentages and the machine shrugs them into "Medium".
      const level = nearestLevel(percentToX(average));
      setTake({ status: "complete", level });
      onDone(true);
      if (reduceMotionRef.current) knobX.set(notchX(level));
      else void animate(knobX, notchX(level), COMMIT_SPRING);

      // One last burst, on the notch it actually landed on.
      if (reduceMotionRef.current) return;
      burstId.current += 1;
      const finale = { id: burstId.current, percent: (notchX(level) / TRACK_TRAVEL) * 100 };
      setBursts((current) => [...current, finale]);
      after(900, () => setBursts((current) => current.filter((item) => item.id !== finale.id)));
    });
  }, [after, clearTimers, knobX, onDone]);

  useEffect(() => {
    run();
    return clearTimers;
  }, [run, clearTimers]);

  // Walking out mid-verse is not a thing you get to do. The shell bumps the nonce
  // when the chip is clicked before the take lands; the card answers by refusing.
  const firstNonce = useRef(scoldNonce);
  useEffect(() => {
    if (scoldNonce === firstNonce.current) return;
    setScolding(true);
    if (!reduceMotionRef.current) {
      void animate(cardShake, [0, -9, 8, -6, 4, -2, 0], { duration: 0.45, ease: "easeOut" });
    }
    const timer = window.setTimeout(() => setScolding(false), 2200);
    return () => window.clearTimeout(timer);
  }, [scoldNonce, cardShake]);

  const activeLine = LYRIC_LINES[currentLineIndex];
  const lineStart = FLAT_WORDS.findIndex((word) => word.lineIndex === currentLineIndex);
  const landedLabel = take.status === "complete" ? labelAt(take.level) : null;

  return (
    <motion.div
      style={{ x: cardShake }}
      className="relative rounded-[28px] border border-white/10 bg-neutral-800/95 p-5 shadow-2xl shadow-black/60"
    >
      <div className="relative mb-4 flex h-8 items-center justify-between gap-3">
        <p className="text-[15px] font-medium text-neutral-100">Reasoning effort</p>

        {/* The right slot carries the state of the take: how far in you are, the
            refusal if you try to bail, and only once it lands, the way to run it back. */}
        <AnimatePresence mode="wait" initial={false}>
          {take.status === "complete" ? (
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
          ) : take.status === "countdown" ? null : (
            <motion.span
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex shrink-0 items-center gap-1 text-[13px] tabular-nums text-neutral-400"
            >
              Bar
              {/* The counter scrolls with the verse: the bar you just finished lifts
                  away while the one you're on rises to take its place. */}
              <span className="relative flex h-4 w-2 items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={currentLineIndex}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 9 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -9 }}
                    transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {currentLineIndex + 1}
                  </motion.span>
                </AnimatePresence>
              </span>
              of {LYRIC_LINES.length}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="relative mb-4 h-16">
        <AnimatePresence>
          {take.status === "complete" && <CompletionGlow reduceMotion={Boolean(reduceMotion)} />}
        </AnimatePresence>

        <div
          aria-live="polite"
          className="relative z-10 flex h-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-900/70 px-4"
        >
          <AnimatePresence>
            {take.status === "complete" && !reduceMotion && <CompletionShimmer />}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {take.status === "countdown" ? (
              <div
                key="countdown"
                className="relative z-20 flex w-full items-center justify-between gap-4"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.p
                    key={promptForCountdown(take.count)}
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, transform: "translateY(8px) scale(0.96)" }
                    }
                    animate={{ opacity: 1, transform: "translateY(0) scale(1)" }}
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, transform: "translateY(-8px) scale(1.03)" }
                    }
                    transition={{ duration: reduceMotion ? 0.1 : 0.2, ease: "easeOut" }}
                    className="text-left text-[17px] font-medium text-neutral-100"
                  >
                    {promptForCountdown(take.count)}
                  </motion.p>
                </AnimatePresence>

                <span className="relative flex h-8 min-w-5 shrink-0 items-center justify-end overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={take.count}
                      aria-label={`Starts in ${take.count}`}
                      initial={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, transform: "translateY(-7px) scale(1.15)" }
                      }
                      animate={{ opacity: 1, transform: "translateY(0) scale(1)" }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, transform: "translateY(7px) scale(0.9)" }
                      }
                      transition={{ duration: reduceMotion ? 0.1 : 0.18, ease: "easeOut" }}
                      className="block min-w-5 text-right text-[18px] leading-none font-semibold tabular-nums text-violet-300"
                    >
                      {take.count}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </div>
            ) : take.status === "singing" ? (
              // Bars scroll like a teleprompter: the outgoing line lifts, blurs and
              // fades while the next one rises into focus underneath it.
              <motion.p
                key={currentLineIndex}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14, filter: "blur(5px)" }}
                transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: [0.4, 0, 0.2, 1] }}
                // Pinned to the panel rather than laid out in it: popLayout yanks the
                // outgoing bar out of flow, and a shrink-wrapped bar re-wraps mid-exit.
                // Same width in, same width out — a bar that wraps, wraps the whole time.
                className="absolute inset-x-4 inset-y-0 z-20 flex flex-wrap content-center items-center justify-center gap-x-1.5 text-center text-[15px] font-medium"
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
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={
                  reduceMotion ? { duration: 0.1 } : { type: "spring", stiffness: 320, damping: 20 }
                }
                className="relative z-20 flex items-center justify-center"
              >
                {!reduceMotion && (
                  <motion.span
                    aria-hidden
                    className="absolute size-3 rounded-full bg-violet-500/60 blur-md"
                    initial={{ scale: 0.4, opacity: 0.9 }}
                    animate={{ scale: [0.4, 14, 11], opacity: [0.9, 0.35, 0.18] }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                )}
                <p className="relative flex items-baseline gap-1.5 text-[17px] font-medium">
                  <span className="text-neutral-400">Landed on</span>
                  <span className="text-violet-300">{landedLabel}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative" style={{ width: TRACK_WIDTH, height: KNOB_SIZE }}>
        <DialTrough knobX={knobX} />

        <AnimatePresence>
          {!reduceMotion &&
            bursts.map((burst) => <Sparks key={burst.id} percent={burst.percent} />)}
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

/**
 * The bloom that escapes the lyric panel. It stays close to the edge — a rim of
 * light leaking out from behind the verdict, not a flare washing over the card.
 */
const CompletionGlow = ({ reduceMotion }: { reduceMotion: boolean }) => (
  <motion.div
    aria-hidden
    className="pointer-events-none absolute -inset-2 z-0"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.span
      className="absolute inset-2 rounded-2xl bg-violet-500/40 blur-xl"
      initial={{ opacity: 0 }}
      animate={reduceMotion ? { opacity: [0, 0.3, 0.14] } : { opacity: [0, 0.7, 0.22] }}
      transition={{ duration: reduceMotion ? 0.5 : 1.1, times: [0, 0.24, 1], ease: "easeOut" }}
    />
  </motion.div>
);

/**
 * Everything else is clipped to the lyric panel: the verse burns off, the panel
 * catches the light for a beat, and a single specular sweep crosses it.
 */
const CompletionShimmer = () => (
  <motion.div
    aria-hidden
    className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.span
      className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(196,181,253,0.32),rgba(139,92,246,0.18)_45%,transparent_75%)] mix-blend-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.35, 0] }}
      transition={{ duration: 1.1, times: [0, 0.18, 0.55, 1], ease: "easeOut" }}
    />
    <motion.span
      className="absolute inset-px rounded-[15px] border border-violet-300/50 shadow-[inset_0_0_20px_rgba(167,139,250,0.3)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.4, 0] }}
      transition={{ duration: 1.4, times: [0, 0.14, 0.55, 1], ease: "easeOut" }}
    />
    <motion.span
      className="absolute top-1/2 left-1/2 h-px w-2/3 origin-center bg-gradient-to-r from-transparent via-violet-100 to-transparent shadow-[0_0_10px_rgba(196,181,253,0.7)] mix-blend-screen"
      initial={{ transform: "translate(-50%, -50%) scaleX(0)", opacity: 0 }}
      animate={{
        transform: [
          "translate(-50%, -50%) scaleX(0)",
          "translate(-50%, -50%) scaleX(1)",
          "translate(-50%, -50%) scaleX(0.7)",
        ],
        opacity: [0, 0.7, 0],
      }}
      transition={{ duration: 0.8, times: [0, 0.3, 1], ease: "easeOut" }}
    />
    <motion.span
      className="absolute top-1/2 left-1/2 h-32 w-16 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-md mix-blend-screen"
      initial={{ transform: "translate(-360%, -50%) rotate(14deg)", opacity: 0 }}
      animate={{
        transform: [
          "translate(-360%, -50%) rotate(14deg)",
          "translate(-200%, -50%) rotate(14deg)",
          "translate(120%, -50%) rotate(14deg)",
          "translate(300%, -50%) rotate(14deg)",
        ],
        opacity: [0, 1, 1, 0],
      }}
      transition={{ duration: 1.1, times: [0, 0.2, 0.78, 1], ease: "easeInOut" }}
    />
    <FinaleGlints />
  </motion.div>
);

/** Sparse, panel-bound — a few catches of light, not a firework. */
const FINALE_GLINTS = [
  { x: -148, y: -16, delay: 0.1 },
  { x: -92, y: 16, delay: 0.18 },
  { x: 78, y: -18, delay: 0.28 },
  { x: 142, y: 12, delay: 0.36 },
];

const FinaleGlints = () => (
  <>
    {FINALE_GLINTS.map((glint) => {
      const destination = `translate(calc(-50% + ${glint.x}px), calc(-50% + ${glint.y}px))`;
      return (
        <motion.span
          key={`${glint.x}-${glint.y}`}
          className="absolute top-1/2 left-1/2 size-4 mix-blend-screen"
          initial={{ transform: "translate(-50%, -50%) scale(0) rotate(0deg)", opacity: 0 }}
          animate={{
            transform: [
              "translate(-50%, -50%) scale(0) rotate(0deg)",
              `${destination} scale(1) rotate(45deg)`,
              `${destination} scale(0.2) rotate(90deg)`,
            ],
            opacity: [0, 0.85, 0],
          }}
          transition={{ duration: 0.66, delay: glint.delay, times: [0, 0.45, 1], ease: "easeOut" }}
        >
          <span className="absolute top-1/2 inset-x-0 h-px bg-violet-100 shadow-[0_0_6px_rgba(221,214,254,0.8)]" />
          <span className="absolute left-1/2 inset-y-0 w-px bg-violet-100 shadow-[0_0_6px_rgba(221,214,254,0.8)]" />
        </motion.span>
      );
    })}
  </>
);
