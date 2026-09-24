"use client";

import { useEffect, useState } from "react";
import type { FC } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Transcript settle — live dictation. Interim words arrive shimmering and
 * unsure (the recognizer keeps rewriting them), then each phrase commits:
 * words snap solid with a tiny settle. Watch "sent the dek" become
 * "send the deck".
 */

interface Segment {
  /** Interim hypotheses, in arrival order — the last one is what commits. */
  steps: string[][];
}

const SCRIPT: Segment[] = [
  {
    steps: [
      ["Remind"],
      ["Remind", "me", "too"],
      ["Remind", "me", "to", "sent", "the"],
      ["Remind", "me", "to", "send", "the", "deck"],
    ],
  },
  {
    steps: [
      ["to", "pria"],
      ["to", "pria", "before", "the"],
      ["to", "Priya", "before", "the", "standup"],
    ],
  },
  {
    steps: [
      ["tomorrow"],
      ["tomorrow", "—", "actually,"],
      ["tomorrow", "—", "actually,", "make", "that"],
      ["tomorrow", "—", "actually,", "make", "that", "Thursday."],
    ],
  },
];

const INTERIM_MS = 340;
const COMMIT_PAUSE_MS = 420;
const RESTART_PAUSE_MS = 2600;

interface Committed {
  id: string;
  text: string;
}

/** An unconfirmed word — shimmers and wobbles until the recognizer commits. */
const InterimWord: FC<{ text: string; index: number; still: boolean }> = ({
  text,
  index,
  still,
}) => (
  <motion.span
    initial={still ? false : { filter: "blur(3px)", opacity: 0, y: 4 }}
    animate={
      still
        ? { filter: "blur(0.4px)", opacity: 0.6, y: 0 }
        : {
            filter: "blur(0.4px)",
            opacity: [0.45, 0.75, 0.45],
            y: [0.5, -0.5, 0.5],
          }
    }
    transition={{
      filter: { duration: 0.2 },
      opacity: { delay: index * 0.13, duration: 1.3, ease: "easeInOut", repeat: Infinity },
      y: { delay: index * 0.13, duration: 1.3, ease: "easeInOut", repeat: Infinity },
    }}
    className="mr-[0.32em] inline-block text-white/70 italic"
  >
    {text}
  </motion.span>
);

/** A confirmed word — lands with a small vertical settle and goes solid. */
const SettledWord: FC<{ text: string; still: boolean }> = ({ text, still }) => (
  <motion.span
    initial={still ? false : { filter: "blur(1.5px)", opacity: 0.55, y: -2.5 }}
    animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
    transition={{ damping: 30, stiffness: 500, type: "spring" }}
    className="mr-[0.32em] inline-block text-white"
  >
    {text}
  </motion.span>
);

export const TranscriptSettle = () => {
  const [committed, setCommitted] = useState<Committed[]>([]);
  const [interim, setInterim] = useState<string[]>([]);
  const [listening, setListening] = useState(true);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, delay: number) => {
      timers.push(setTimeout(fn, delay));
    };

    const play = () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      timers.length = 0;
      setCommitted([]);
      setInterim([]);
      setListening(true);

      let at = 600;
      for (const [segmentIndex, segment] of SCRIPT.entries()) {
        for (const step of segment.steps) {
          schedule(() => setInterim(step), at);
          at += INTERIM_MS;
        }
        const final = segment.steps.at(-1) ?? [];
        schedule(() => {
          setInterim([]);
          setCommitted((current) => [
            ...current,
            ...final.map((word, wordIndex) => ({
              id: `${String(segmentIndex)}-${String(wordIndex)}`,
              text: word,
            })),
          ]);
        }, at);
        at += COMMIT_PAUSE_MS;
      }

      schedule(() => setListening(false), at + 200);
      schedule(play, at + RESTART_PAUSE_MS);
    };

    play();
    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, []);

  const pulsing = listening && !reduceMotion;

  return (
    <div className="w-[520px] overflow-hidden rounded-3xl bg-[#101116] shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      <div className="min-h-[190px] px-7 pt-7 pb-4 text-[17px] leading-[1.9] font-medium tracking-[-0.01em]">
        {committed.map((word) => (
          <SettledWord key={word.id} text={word.text} still={reduceMotion} />
        ))}
        {interim.map((word, index) => (
          <InterimWord
            key={`${String(index)}-${word}`}
            text={word}
            index={index}
            still={reduceMotion}
          />
        ))}
        {listening && interim.length === 0 && committed.length === 0 && (
          <span className="text-white/30">Listening…</span>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4">
        <div className="relative flex size-9 items-center justify-center rounded-full bg-[#e5484d]">
          {pulsing && (
            <motion.span
              aria-hidden
              animate={{ opacity: [0.45, 0], scale: [1, 1.65] }}
              transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-[#e5484d]"
            />
          )}
          <svg viewBox="0 0 24 24" className="relative size-4 fill-white">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
          </svg>
        </div>

        <div className="flex h-8 flex-1 items-center gap-[3px]">
          {Array.from({ length: 32 }, (_, index) => (
            <motion.span
              key={index}
              animate={
                pulsing
                  ? { scaleY: [0.25, 0.4 + ((index * 37) % 23) / 26, 0.25] }
                  : { scaleY: 0.18 }
              }
              transition={
                pulsing
                  ? {
                      duration: 0.7 + ((index * 13) % 9) / 10,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }
                  : { duration: 0.3 }
              }
              className="h-full flex-1 origin-center rounded-full bg-white/25"
            />
          ))}
        </div>

        <span
          className={`text-[11px] font-medium tracking-wide uppercase ${
            listening ? "text-[#e5484d]" : "text-white/35"
          }`}
        >
          {listening ? "Rec" : "Done"}
        </span>
      </div>
    </div>
  );
};
