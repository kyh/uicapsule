"use client";

import { useEffect, useRef, useState, type FC } from "react";
import { motion } from "motion/react";

/**
 * Streaming markdown — the LLM answer render. Tokens arrive in jittered
 * bursts, each word blur-fades in, structure (headings, lists, code)
 * assembles live, and a breathing cursor rides the stream head.
 */

type Inline = { text: string; bold?: boolean; code?: boolean };
type Block =
  | { type: "h2"; inlines: Inline[] }
  | { type: "p"; inlines: Inline[] }
  | { type: "li"; inlines: Inline[] }
  | { type: "fence"; lines: string[] };

/** The canned answer, pre-structured (parsing markdown live isn't the point). */
const b = (text: string): Inline => ({ text, bold: true });
const c = (text: string): Inline => ({ text, code: true });
const t = (text: string): Inline => ({ text });

const BLOCKS: Block[] = [
  { type: "h2", inlines: [t("Why springs beat duration curves")] },
  {
    type: "p",
    inlines: [
      t("A spring doesn't know how long it will take — it only knows "),
      b("where it is"),
      t(" and "),
      b("how fast it's moving"),
      t(". That's what makes interruption feel free."),
    ],
  },
  {
    type: "li",
    inlines: [b("Stiffness"), t(" sets urgency — how hard the value is pulled home.")],
  },
  {
    type: "li",
    inlines: [b("Damping"), t(" bleeds energy; too little and the settle wobbles.")],
  },
  {
    type: "li",
    inlines: [
      t("Velocity carries across gestures, so a flick hands its momentum to the "),
      c("animate"),
      t(" call."),
    ],
  },
  {
    type: "fence",
    lines: ["animate(x, 0, {", '  type: "spring",', "  stiffness: 220,", "  damping: 24,", "})"],
  },
  {
    type: "p",
    inlines: [
      t(
        "Tune by feel: raise stiffness until it's responsive, then add damping until it stops embarrassing itself.",
      ),
    ],
  },
];

/** Split inlines into word tokens, preserving style. */
const tokenize = (inlines: Inline[]): Inline[] => {
  const tokens: Inline[] = [];
  for (const inline of inlines) {
    for (const word of inline.text.split(/(?<=\s)/)) {
      if (word.length > 0) tokens.push({ ...inline, text: word });
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
        type: "fence",
        lines: block.lines,
        tokens: block.lines.flatMap((line) =>
          `${line}\n`
            .split(/(?<=\s)/)
            .filter((w) => w.length > 0)
            .map((w) => t(w)),
        ),
      }
    : { type: block.type, tokens: tokenize(block.inlines) },
);

const TOTAL = FLAT.reduce((sum, block) => sum + block.tokens.length, 0);

const Word: FC<{ token: Inline }> = ({ token }) => (
  <motion.span
    initial={{ opacity: 0, filter: "blur(5px)" }}
    animate={{ opacity: 1, filter: "blur(0px)" }}
    transition={{ duration: 0.32 }}
    className={
      token.code
        ? "rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[12px] text-[#9ecbff]"
        : token.bold
          ? "font-semibold text-white"
          : undefined
    }
  >
    {token.text}
  </motion.span>
);

const Cursor: FC = () => (
  <motion.span
    aria-hidden
    animate={{ opacity: [1, 0.35, 1], scale: [1, 0.92, 1] }}
    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
    className="ml-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] rounded-[2px] bg-[#9ecbff]"
  />
);

export const StreamingMarkdown = () => {
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCount(0);
    let n = 0;
    const step = () => {
      // Jittered bursts: 1–3 tokens every 50–170ms, like a real stream.
      n = Math.min(TOTAL, n + 1 + Math.floor(Math.random() * 3));
      setCount(n);
      if (n < TOTAL) {
        timerRef.current = setTimeout(step, 50 + Math.random() * 120);
      }
    };
    timerRef.current = setTimeout(step, 350);
  };

  useEffect(() => {
    run();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const done = count >= TOTAL;

  // Walk blocks, spending `count` tokens; the cursor rides the last
  // block that has any visible tokens.
  let remaining = count;
  let tailIndex = 0;
  {
    let spent = 0;
    FLAT.forEach((block, index) => {
      if (spent < count) tailIndex = index;
      spent += block.tokens.length;
    });
  }

  return (
    <div className="w-[560px] rounded-3xl bg-[#101116] p-7 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.span
            animate={done ? { scale: 1 } : { scale: [1, 1.25, 1] }}
            transition={done ? {} : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className={`size-2 rounded-full ${done ? "bg-emerald-400" : "bg-[#9ecbff]"}`}
          />
          <span className="text-[11px] font-medium tracking-wide text-white/45 uppercase">
            {done ? "Complete" : "Streaming"}
          </span>
        </div>
        <button
          type="button"
          onClick={run}
          className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/[0.12]"
        >
          Restart
        </button>
      </div>

      {/* Answer body */}
      <div className="min-h-[300px] text-[13.5px] leading-[1.75] text-white/75">
        {FLAT.map((block, blockIndex) => {
          if (remaining <= 0) return null;
          const visible = block.tokens.slice(0, remaining);
          const isTail = blockIndex === tailIndex;
          remaining -= block.tokens.length;

          if (block.type === "fence") {
            // Rebuild visible code text, then re-split into lines.
            const text = visible.map((token) => token.text).join("");
            const lines = text.split("\n");
            return (
              <motion.pre
                key={`b${String(blockIndex)}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="my-3 overflow-x-auto rounded-xl bg-black/45 p-4 font-mono text-[12px] leading-[1.7] text-[#9ecbff] ring-1 ring-white/[0.06]"
              >
                {lines.join("\n")}
                {isTail && !done && <Cursor />}
              </motion.pre>
            );
          }

          const Tag = block.type === "h2" ? "h2" : block.type === "li" ? "li" : "p";
          const className =
            block.type === "h2"
              ? "mb-2 text-[17px] font-bold tracking-tight text-white"
              : block.type === "li"
                ? "my-1 ml-4 list-disc pl-1 marker:text-white/30"
                : "my-2.5";
          return (
            <Tag key={`b${String(blockIndex)}`} className={className}>
              {visible.map((token, tokenIndex) => (
                <Word key={`t${String(tokenIndex)}`} token={token} />
              ))}
              {isTail && !done && <Cursor />}
            </Tag>
          );
        })}
        {count === 0 && (
          <p className="text-white/30">
            <Cursor />
          </p>
        )}
      </div>
    </div>
  );
};
