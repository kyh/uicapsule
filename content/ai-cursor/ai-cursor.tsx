"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/**
 * AI cursor — a second presence in your document, multiplayer-style. It
 * flies to a phrase, sweeps a selection over it, retypes it tighter, and
 * moves on. Ghost dots trail it with increasing spring lag.
 */

interface Word {
  id: number;
  text: string;
  /** transient render states driven by the edit runner */
  selected?: boolean;
  fresh?: boolean;
}

const SOURCE =
  "Our team is really very excited to share that we have recieve approval to move forward. In order to hit the deadline we will need to prioritise agressively, and we beleive the plan below gives us a good chance.";

const EDITS: { find: string; replace: string }[] = [
  { find: "recieve", replace: "received" },
  { find: "really very excited", replace: "thrilled" },
  { find: "In order to", replace: "To" },
  { find: "beleive", replace: "believe" },
];

const sleep = (ms: number) =>
  // oxlint-disable-next-line promise/avoid-new -- a browser timer has no promise-returning form to await
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** Locate a phrase in the doc, ignoring (but remembering) trailing punctuation. */
const findPhrase = (words: Word[], phrase: string) => {
  const tokens = phrase.split(" ");
  const start = words.findIndex((_, index) =>
    tokens.every((token, k) => words[index + k]?.text.replace(/[.,]$/u, "") === token),
  );
  if (start === -1) {
    return null;
  }
  const targets = words.slice(start, start + tokens.length);
  const lastWord = targets.at(-1);
  const trailing = (lastWord && /[.,]$/u.exec(lastWord.text)?.[0]) ?? "";
  return { targets, trailing };
};

let nextId = 1000;

export const AiCursor = () => {
  const [words, setWords] = useState<Word[]>(() =>
    SOURCE.split(" ").map((text, index) => ({ id: index, text })),
  );
  const [status, setStatus] = useState("reading…");
  const wordRefs = useRef(new Map<number, HTMLSpanElement>());
  const wordsRef = useRef(words);
  const reduced = useReducedMotion() ?? false;
  const reducedRef = useRef(reduced);

  useEffect(() => {
    wordsRef.current = words;
    reducedRef.current = reduced;
  });

  // Cursor target + laggy ghost trail.
  const targetX = useMotionValue(220);
  const targetY = useMotionValue(140);
  const x = useSpring(targetX, { damping: 20, stiffness: 170 });
  const y = useSpring(targetY, { damping: 20, stiffness: 170 });
  const ghost1X = useSpring(x, { damping: 22, stiffness: 120 });
  const ghost1Y = useSpring(y, { damping: 22, stiffness: 120 });
  const ghost2X = useSpring(ghost1X, { damping: 24, stiffness: 90 });
  const ghost2Y = useSpring(ghost1Y, { damping: 24, stiffness: 90 });

  useEffect(() => {
    let alive = true;

    // Layout offsets (relative to the positioned doc), not client rects, so the
    // cursor still lands when an ancestor is scaled or transformed.
    const measure = (id: number) => {
      const el = wordRefs.current.get(id);
      if (!el) {
        return null;
      }
      return { h: el.offsetHeight, w: el.offsetWidth, x: el.offsetLeft, y: el.offsetTop };
    };

    const run = async () => {
      await sleep(1200);
      for (;;) {
        if (!alive) {
          return;
        }
        for (const edit of EDITS) {
          if (!alive) {
            return;
          }
          const found = findPhrase(wordsRef.current, edit.find);
          if (!found) {
            continue;
          }
          const { targets, trailing } = found;

          // Fly to the phrase.
          setStatus("spotted something");
          const pos = measure(targets[0]?.id ?? 0);
          if (pos) {
            targetX.set(pos.x + pos.w / 2);
            targetY.set(pos.y + pos.h + 4);
          }
          await sleep(700);
          if (!alive) {
            return;
          }

          // Sweep the selection.
          setStatus(`tightening “${edit.find}”`);
          for (const target of targets) {
            const { id } = target;
            setWords((w) => w.map((word) => (word.id === id ? { ...word, selected: true } : word)));
            await sleep(160);
            if (!alive) {
              return;
            }
          }
          await sleep(450);
          if (!alive) {
            return;
          }

          // Replace: collapse selection into one fresh word, then type it.
          const freshId = nextId;
          nextId += 1;
          const replacement = edit.replace + trailing;
          setWords((w) => {
            const from = w.findIndex((word) => word.id === targets[0]?.id);
            if (from === -1) {
              return w;
            }
            const copy = [...w];
            copy.splice(from, targets.length, { fresh: true, id: freshId, text: "" });
            return copy;
          });
          for (let k = 1; k <= replacement.length; k += 1) {
            setWords((w) =>
              w.map((word) =>
                word.id === freshId ? { ...word, text: replacement.slice(0, k) } : word,
              ),
            );
            // Keep the cursor pinned to the growing word.
            const grown = measure(freshId);
            if (grown) {
              targetX.set(grown.x + grown.w + 6);
              targetY.set(grown.y + grown.h + 2);
            }
            await sleep(55);
            if (!alive) {
              return;
            }
          }
          await sleep(350);
          setWords((w) =>
            w.map((word) => (word.id === freshId ? { ...word, fresh: false } : word)),
          );
          if (!alive) {
            return;
          }
        }

        // Park, admire, reset.
        setStatus("done — 4 edits");
        targetX.set(430);
        targetY.set(30);
        await sleep(2800);
        if (!alive || reducedRef.current) {
          return;
        }
        setWords(SOURCE.split(" ").map((text, index) => ({ id: index, text })));
        setStatus("reading…");
        await sleep(1400);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [targetX, targetY]);

  return (
    <div className="w-[600px] rounded-3xl bg-[#101116] shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-7 py-4">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-white">Launch announcement</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/40">
            Draft
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-full bg-[#3b82f6] text-[10px] font-bold text-white ring-2 ring-[#101116]">
            K
          </span>
          <span className="flex size-6 items-center justify-center rounded-full bg-[#c084fc] text-[10px] font-bold text-black ring-2 ring-[#101116]">
            ✦
          </span>
        </div>
      </div>

      <div className="relative min-h-[220px] px-7 py-6">
        <p className="text-[15.5px] leading-[2] text-white/80">
          {words.map((word) => (
            <span
              key={word.id}
              ref={(el) => {
                if (el) {
                  wordRefs.current.set(word.id, el);
                } else {
                  wordRefs.current.delete(word.id);
                }
              }}
              className={`rounded-[3px] transition-colors duration-200 ${
                word.selected ? "bg-[#c084fc]/30 text-white" : ""
              } ${word.fresh ? "bg-[#c084fc]/15 font-medium text-[#d8b4fe]" : ""}`}
            >
              {word.text}
              {word.text.length > 0 ? " " : ""}
            </span>
          ))}
        </p>

        {!reduced && (
          <>
            <motion.span
              aria-hidden
              style={{ x: ghost2X, y: ghost2Y }}
              className="pointer-events-none absolute top-0 left-0 size-2 rounded-full bg-[#c084fc]/20"
            />
            <motion.span
              aria-hidden
              style={{ x: ghost1X, y: ghost1Y }}
              className="pointer-events-none absolute top-0 left-0 size-2.5 rounded-full bg-[#c084fc]/35"
            />
          </>
        )}

        <motion.div
          style={reduced ? { x: targetX, y: targetY } : { x, y }}
          className="pointer-events-none absolute top-0 left-0 z-10"
        >
          <svg viewBox="0 0 24 24" className="size-[18px] -rotate-12 drop-shadow">
            <path
              d="M5 2l14 8.5-6.2 1.6L9.5 18 5 2z"
              className="fill-[#c084fc] stroke-[#101116]"
              strokeWidth="1.2"
            />
          </svg>
          <motion.span
            layout={!reduced}
            className="ml-3 inline-block rounded-full bg-[#c084fc] px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap text-black shadow-lg shadow-black/40"
          >
            Co-writer · {status}
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
};
