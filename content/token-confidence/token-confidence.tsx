"use client";

import { useEffect, useState } from "react";
import type { FC } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

/**
 * Token confidence — generated text that shows its work. Each token's
 * certainty renders as opacity and weight; shaky words get a dotted
 * underline, and clicking one fans out the alternatives the model almost
 * said, with their probabilities. Pick one to swap it in.
 */

interface Alternative {
  text: string;
  p: number;
}

interface Token {
  id: string;
  text: string;
  /** 0..1 — model certainty for this token */
  p: number;
  alternatives?: Alternative[];
}

const INITIAL: Token[] = [
  { id: "t1", p: 0.99, text: "The first computer “bug” was a" },
  {
    alternatives: [
      { p: 0.96, text: "moth" },
      { p: 0.03, text: "beetle" },
      { p: 0.01, text: "fly" },
    ],
    id: "t2",
    p: 0.96,
    text: "moth",
  },
  { id: "t3", p: 0.98, text: "found in the Harvard" },
  {
    alternatives: [
      { p: 0.68, text: "Mark II" },
      { p: 0.24, text: "Mark I" },
      { p: 0.08, text: "ENIAC" },
    ],
    id: "t4",
    p: 0.68,
    text: "Mark II",
  },
  { id: "t5", p: 0.93, text: "relay calculator in" },
  {
    alternatives: [
      { p: 0.58, text: "1947," },
      { p: 0.27, text: "1945," },
      { p: 0.15, text: "1946," },
    ],
    id: "t6",
    p: 0.58,
    text: "1947,",
  },
  { id: "t7", p: 0.97, text: "taped into the logbook by" },
  {
    alternatives: [
      { p: 0.81, text: "Grace Hopper's" },
      { p: 0.13, text: "Howard Aiken's" },
      { p: 0.06, text: "the operations" },
    ],
    id: "t8",
    p: 0.81,
    text: "Grace Hopper's",
  },
  { id: "t9", p: 0.95, text: "team with the note “first actual case of bug being found.”" },
];

const weightFor = (p: number) => {
  if (p > 0.9) {
    return 500;
  }
  if (p > 0.75) {
    return 450;
  }
  return 400;
};

const styleFor = (p: number) => ({
  fontWeight: weightFor(p),
  opacity: 0.45 + p * 0.55,
});

const barColor = (p: number) => {
  if (p > 0.75) {
    return "bg-emerald-400/80";
  }
  if (p > 0.4) {
    return "bg-amber-400/80";
  }
  return "bg-red-400/70";
};

const TokenSpan: FC<{
  token: Token;
  open: boolean;
  onToggle: () => void;
  onPick: (alternative: Alternative) => void;
}> = ({ token, open, onToggle, onPick }) => {
  const uncertain = token.p < 0.9 && token.alternatives;

  // Plain filler tokens flow as normal inline text so lines wrap naturally;
  // only interactive tokens need an inline-block anchor for the popover.
  if (!token.alternatives) {
    return (
      <>
        <motion.span animate={styleFor(token.p)} className="text-white">
          {token.text}
        </motion.span>{" "}
      </>
    );
  }

  return (
    <span data-token-id={token.id} className="relative mr-[0.32em] inline-block">
      {uncertain ? (
        <motion.button
          type="button"
          layout
          animate={styleFor(token.p)}
          onClick={onToggle}
          aria-expanded={open}
          className={`cursor-pointer rounded-[3px] text-white underline decoration-amber-300/50 decoration-dotted underline-offset-4 transition-colors hover:bg-amber-300/10 ${
            open ? "bg-amber-300/15" : ""
          }`}
        >
          {token.text}
        </motion.button>
      ) : (
        <motion.span layout animate={styleFor(token.p)} className="rounded-[3px] text-white">
          {token.text}
        </motion.span>
      )}
      <AnimatePresence>
        {open && token.alternatives && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 }, y: 4 }}
            transition={{ damping: 30, stiffness: 480, type: "spring" }}
            className="absolute bottom-full left-1/2 z-20 mb-2 w-[224px] -translate-x-1/2 rounded-xl bg-[#1b1e27] p-1.5 shadow-2xl shadow-black/60 ring-1 ring-white/12"
          >
            <p className="px-2 pt-1 pb-1.5 text-[9.5px] font-semibold tracking-[0.14em] text-white/35 uppercase">
              The model also considered
            </p>
            {token.alternatives.map((alternative, index) => (
              <motion.button
                key={alternative.text}
                type="button"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * index }}
                onClick={() => onPick(alternative)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.07] ${
                  alternative.text === token.text ? "bg-white/[0.05]" : ""
                }`}
              >
                <span className="flex-1 truncate text-[12.5px] text-white/85">
                  {alternative.text}
                </span>
                <span className="h-[4px] w-12 overflow-hidden rounded-full bg-white/10">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${String(alternative.p * 100)}%` }}
                    transition={{ delay: 0.1 + 0.04 * index, duration: 0.3 }}
                    className={`inline-block h-full align-top rounded-full ${barColor(alternative.p)}`}
                  />
                </span>
                <span className="w-8 text-right text-[10px] text-white/40 tabular-nums">
                  {Math.round(alternative.p * 100)}%
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export const TokenConfidence = () => {
  const [tokens, setTokens] = useState<Token[]>(INITIAL);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (openId === null) {
      return;
    }
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(`[data-token-id="${openId}"]`)) {
        return;
      }
      setOpenId(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenId(null);
      }
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openId]);

  const pick = (id: string, alternative: Alternative) => {
    setTokens((current) =>
      current.map((token) =>
        token.id === id ? { ...token, p: alternative.p, text: alternative.text } : token,
      ),
    );
    setOpenId(null);
  };

  const meanConfidence = tokens.reduce((sum, token) => sum + token.p, 0) / tokens.length;

  return (
    <MotionConfig reducedMotion="user">
      <div className="w-[560px] rounded-3xl bg-[#101116] p-7 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-white">Answer</p>
            <p className="text-[11px] text-white/40">
              Dotted words are guesses — click to see what else it almost said
            </p>
          </div>
          <div className="text-right">
            <p className="text-[16px] font-bold text-white tabular-nums">
              {Math.round(meanConfidence * 100)}%
            </p>
            <p className="text-[9.5px] tracking-wide text-white/35 uppercase">mean conf.</p>
          </div>
        </div>

        <div className="text-[16.5px] leading-[2.05]">
          {tokens.map((token) => (
            <TokenSpan
              key={token.id}
              token={token}
              open={openId === token.id}
              onToggle={() => setOpenId((current) => (current === token.id ? null : token.id))}
              onPick={(alternative) => pick(token.id, alternative)}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span className="text-[10px] text-white/35">guessing</span>
          <div className="h-[5px] flex-1 rounded-full bg-gradient-to-r from-red-400/60 via-amber-400/60 to-emerald-400/70" />
          <span className="text-[10px] text-white/35">confident</span>
        </div>
      </div>
    </MotionConfig>
  );
};
