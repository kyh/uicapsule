"use client";

import { useEffect, useState } from "react";
import type { FC } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Streaming markdown — the LLM answer render. Tokens arrive in jittered
 * bursts, each word blur-fades in, structure (headings, lists, code)
 * assembles live, and a breathing cursor rides the stream head.
 */

interface Inline {
  text: string;
  bold?: boolean;
  code?: boolean;
}
type Block =
  | { type: "h2"; inlines: Inline[] }
  | { type: "p"; inlines: Inline[] }
  | { type: "li"; inlines: Inline[] }
  | { type: "fence"; lines: string[] };

/** The canned answer, pre-structured (parsing markdown live isn't the point). */
const b = (text: string): Inline => ({ bold: true, text });
const c = (text: string): Inline => ({ code: true, text });
const t = (text: string): Inline => ({ text });

const BLOCKS: Block[] = [
  { inlines: [t("Why springs beat duration curves")], type: "h2" },
  {
    inlines: [
      t("A spring doesn't know how long it will take — it only knows "),
      b("where it is"),
      t(" and "),
      b("how fast it's moving"),
      t(". That's what makes interruption feel free."),
    ],
    type: "p",
  },
  {
    inlines: [b("Stiffness"), t(" sets urgency — how hard the value is pulled home.")],
    type: "li",
  },
  {
    inlines: [b("Damping"), t(" bleeds energy; too little and the settle wobbles.")],
    type: "li",
  },
  {
    inlines: [
      t("Velocity carries across gestures, so a flick hands its momentum to the "),
      c("animate"),
      t(" call."),
    ],
    type: "li",
  },
  {
    lines: ["animate(x, 0, {", '  type: "spring",', "  stiffness: 220,", "  damping: 24,", "})"],
    type: "fence",
  },
  {
    inlines: [
      t(
        "Tune by feel: raise stiffness until it's responsive, then add damping until it stops embarrassing itself.",
      ),
    ],
    type: "p",
  },
];

/** Split inlines into word tokens, preserving style. */
const tokenize = (inlines: Inline[]): Inline[] => {
  const tokens: Inline[] = [];
  for (const inline of inlines) {
    for (const word of inline.text.split(/(?<=\s)/u)) {
      if (word.length > 0) {
        tokens.push({ ...inline, text: word });
      }
    }
  }
  return tokens;
};

type FlatBlock =
  | { type: "h2" | "p" | "li"; tokens: Inline[] }
  | { type: "fence"; tokens: Inline[]; lines: string[] };

const FLAT: FlatBlock[] = BLOCKS.map((block) =>
  block.type === "fence"
    ? {
        lines: block.lines,
        tokens: block.lines.flatMap((line) =>
          `${line}\n`
            .split(/(?<=\s)/u)
            .filter((w) => w.length > 0)
            .map((w) => t(w)),
        ),
        type: "fence",
      }
    : { tokens: tokenize(block.inlines), type: block.type },
);

const OFFSETS: number[] = FLAT.map((_, index) =>
  FLAT.slice(0, index).reduce((sum, block) => sum + block.tokens.length, 0),
);

const TOTAL = FLAT.reduce((sum, block) => sum + block.tokens.length, 0);

const tokenClass = (token: Inline): string | undefined => {
  if (token.code) {
    return "rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[12px] text-[#9ecbff]";
  }
  if (token.bold) {
    return "font-semibold text-white";
  }
  return undefined;
};

const PROSE = {
  h2: { Tag: "h2", className: "mb-2 text-[17px] font-bold tracking-tight text-white" },
  li: { Tag: "li", className: "my-1 ml-4 list-disc pl-1 marker:text-white/30" },
  p: { Tag: "p", className: "my-2.5" },
} as const;

const Word: FC<{ token: Inline; reduced: boolean }> = ({ token, reduced }) => (
  <motion.span
    initial={reduced ? { opacity: 0 } : { filter: "blur(5px)", opacity: 0 }}
    animate={reduced ? { opacity: 1 } : { filter: "blur(0px)", opacity: 1 }}
    transition={{ duration: reduced ? 0.12 : 0.32 }}
    className={tokenClass(token)}
  >
    {token.text}
  </motion.span>
);

const Cursor: FC<{ reduced: boolean }> = ({ reduced }) => (
  <motion.span
    aria-hidden
    animate={reduced ? { opacity: 1 } : { opacity: [1, 0.35, 1], scale: [1, 0.92, 1] }}
    transition={reduced ? {} : { duration: 1.1, ease: "easeInOut", repeat: Infinity }}
    className="ml-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] rounded-[2px] bg-[#9ecbff]"
  />
);

const StreamingAnswer: FC<{ onRestart: () => void }> = ({ onRestart }) => {
  const [count, setCount] = useState(0);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    let n = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const step = () => {
      // Jittered bursts: 1–3 tokens every 50–170ms, like a real stream.
      n = Math.min(TOTAL, n + 1 + Math.floor(Math.random() * 3));
      setCount(n);
      if (n < TOTAL) {
        timer = setTimeout(step, 50 + Math.random() * 120);
      }
    };
    timer = setTimeout(step, 350);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const done = count >= TOTAL;
  const tailIndex = OFFSETS.findLastIndex((offset) => offset < count);

  return (
    <div className="w-[560px] rounded-3xl bg-[#101116] p-7 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.span
            animate={done || reduced ? { scale: 1 } : { scale: [1, 1.25, 1] }}
            transition={
              done || reduced ? {} : { duration: 1.4, ease: "easeInOut", repeat: Infinity }
            }
            className={`size-2 rounded-full ${done ? "bg-emerald-400" : "bg-[#9ecbff]"}`}
          />
          <span className="text-[11px] font-medium tracking-wide text-white/45 uppercase">
            {done ? "Complete" : "Streaming"}
          </span>
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/[0.12]"
        >
          Restart
        </button>
      </div>

      <div className="min-h-[408px] text-[13.5px] leading-[1.75] text-white/75">
        {FLAT.map((block, blockIndex) => {
          const offset = OFFSETS[blockIndex] ?? 0;
          if (offset >= count) {
            return null;
          }
          const visible = block.tokens.slice(0, count - offset);
          const isTail = blockIndex === tailIndex;

          if (block.type === "fence") {
            return (
              <motion.pre
                key={`b${String(blockIndex)}`}
                initial={{ opacity: 0, y: reduced ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="my-3 overflow-x-auto rounded-xl bg-black/45 p-4 font-mono text-[12px] leading-[1.7] text-[#9ecbff] ring-1 ring-white/[0.06]"
              >
                {visible.map((token) => token.text).join("")}
                {isTail && !done && <Cursor reduced={reduced} />}
              </motion.pre>
            );
          }

          const { Tag, className } = PROSE[block.type];
          return (
            <Tag key={`b${String(blockIndex)}`} className={className}>
              {visible.map((token, tokenIndex) => (
                <Word key={`t${String(tokenIndex)}`} token={token} reduced={reduced} />
              ))}
              {isTail && !done && <Cursor reduced={reduced} />}
            </Tag>
          );
        })}
        {count === 0 && (
          <p className="text-white/30">
            <Cursor reduced={reduced} />
          </p>
        )}
      </div>
    </div>
  );
};

export const StreamingMarkdown = () => {
  const [runId, setRunId] = useState(0);
  return <StreamingAnswer key={runId} onRestart={() => setRunId((id) => id + 1)} />;
};
