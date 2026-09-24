"use client";

import { useRef, useState } from "react";
import type { FC } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Citation beams — hover a citation marker and a beam draws across to the
 * source card, which lifts while the exact supporting passage sweeps
 * highlighted. Provenance you can see.
 */

interface Source {
  id: number;
  title: string;
  domain: string;
  /** snippet parts: [before, passage, after] — the middle highlights */
  snippet: [string, string, string];
}

const SOURCES: Source[] = [
  {
    domain: "nature.com",
    id: 1,
    snippet: [
      "During stage-2 sleep, ",
      "spindle density predicted next-day recall accuracy",
      " across all 44 participants.",
    ],
    title: "Sleep spindles and memory consolidation",
  },
  {
    domain: "sleepjournal.org",
    id: 2,
    snippet: [
      "One night of total deprivation ",
      "reduced hippocampal encoding capacity by roughly 40%",
      ", persisting after caffeine.",
    ],
    title: "The cost of the all-nighter",
  },
  {
    domain: "med.stanford.edu",
    id: 3,
    snippet: [
      "A 26-minute nap ",
      "restored declarative memory performance to baseline",
      " in the afternoon cohort.",
    ],
    title: "Naps as micro-consolidation",
  },
];

const BEAM_COLOR = "#7dd3fc";
// A background (not an overlay box) so the sweep follows the passage across line wraps.
const HIGHLIGHT = "linear-gradient(rgb(125 211 252 / 0.18), rgb(125 211 252 / 0.18))";

const Cite: FC<{
  id: number;
  active: boolean;
  onActivate: (id: number, marker: HTMLElement) => void;
  onClear: () => void;
}> = ({ id, active, onActivate, onClear }) => (
  <button
    type="button"
    onMouseEnter={(event) => onActivate(id, event.currentTarget)}
    onMouseLeave={onClear}
    onFocus={(event) => onActivate(id, event.currentTarget)}
    onBlur={onClear}
    className={`mx-0.5 inline-flex size-[18px] -translate-y-[2px] items-center justify-center rounded-md text-[10px] font-bold transition-colors ${
      active ? "bg-[#7dd3fc] text-black" : "bg-white/[0.08] text-[#7dd3fc] hover:bg-white/[0.14]"
    }`}
  >
    {id}
  </button>
);

export const CitationBeams = () => {
  const [active, setActive] = useState<number | null>(null);
  const [beam, setBeam] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef(new Map<number, HTMLDivElement>());

  const activate = (id: number, marker: HTMLElement) => {
    const container = containerRef.current;
    const card = cardRefs.current.get(id);
    if (!container || !card) {
      return;
    }
    const c = container.getBoundingClientRect();
    const m = marker.getBoundingClientRect();
    const t = card.getBoundingClientRect();
    // Client rects include ancestor transforms; the SVG draws in the container's own units.
    const scale = c.width / container.offsetWidth || 1;
    setActive(id);
    setBeam({
      x1: (m.right - c.left) / scale + 2,
      x2: (t.left - c.left) / scale - 2,
      y1: (m.top - c.top + m.height / 2) / scale,
      y2: (t.top - c.top + t.height / 2) / scale,
    });
  };

  const clear = () => {
    setActive(null);
    setBeam(null);
  };

  const path = beam
    ? `M ${String(beam.x1)} ${String(beam.y1)} C ${String(beam.x1 + 70)} ${String(beam.y1)}, ${String(beam.x2 - 70)} ${String(beam.y2)}, ${String(beam.x2)} ${String(beam.y2)}`
    : "";

  return (
    <div
      ref={containerRef}
      className="relative flex w-[720px] gap-6 rounded-3xl bg-[#101116] p-7 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none"
    >
      <div className="w-[340px] shrink-0">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.2em] text-white/35 uppercase">
          Answer · 3 sources
        </p>
        <p className="text-[14.5px] leading-[1.95] text-white/80">
          Sleep is when memory does its filing. Spindle activity during light sleep tracks how well
          you’ll recall new material tomorrow
          <Cite id={1} active={active === 1} onActivate={activate} onClear={clear} />; skip a night
          entirely and the hippocampus encodes roughly 40% less
          <Cite id={2} active={active === 2} onActivate={activate} onClear={clear} />. Even a
          half-hour nap claws a surprising amount of that capacity back
          <Cite id={3} active={active === 3} onActivate={activate} onClear={clear} />.
        </p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3">
        {SOURCES.map((source) => (
          <motion.div
            key={source.id}
            ref={(el) => {
              if (el) {
                cardRefs.current.set(source.id, el);
              } else {
                cardRefs.current.delete(source.id);
              }
            }}
            animate={{
              scale: active === source.id ? 1.03 : 1,
              x: active === source.id ? -4 : 0,
            }}
            transition={{ damping: 28, stiffness: 400, type: "spring" }}
            className={`rounded-xl p-3.5 ring-1 transition-shadow ${
              active === source.id
                ? "bg-[#171b26] shadow-lg shadow-[#7dd3fc]/10 ring-[#7dd3fc]/45"
                : "bg-white/[0.03] ring-white/[0.07]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex size-[16px] items-center justify-center rounded text-[9px] font-bold ${
                  active === source.id ? "bg-[#7dd3fc] text-black" : "bg-white/[0.08] text-white/50"
                }`}
              >
                {source.id}
              </span>
              <p className="truncate text-[12px] font-semibold text-white/85">{source.title}</p>
            </div>
            <p className="mt-0.5 text-[10px] text-white/35">{source.domain}</p>
            <p className="mt-1.5 text-[11.5px] leading-[1.65] text-white/55">
              {source.snippet[0]}
              <motion.span
                initial={false}
                animate={{ backgroundSize: active === source.id ? "100% 100%" : "0% 100%" }}
                transition={{ duration: active === source.id ? 0.45 : 0.15, ease: "easeOut" }}
                className={`rounded-[3px] bg-no-repeat transition-colors duration-200 ${
                  active === source.id ? "text-[#bfe7ff]" : ""
                }`}
                style={{ backgroundImage: HIGHLIGHT }}
              >
                {source.snippet[1]}
              </motion.span>
              {source.snippet[2]}
            </p>
          </motion.div>
        ))}
      </div>
      <svg className="pointer-events-none absolute inset-0 z-10 size-full">
        <defs>
          <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={BEAM_COLOR} stopOpacity="0.15" />
            <stop offset="55%" stopColor={BEAM_COLOR} stopOpacity="0.9" />
            <stop offset="100%" stopColor={BEAM_COLOR} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <AnimatePresence>
          {beam && (
            <motion.path
              key={`${String(beam.x1)}-${String(beam.y2)}`}
              d={path}
              fill="none"
              stroke="url(#beam-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ opacity: 0.9, pathLength: 0 }}
              animate={{ opacity: 1, pathLength: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 6px ${BEAM_COLOR}66)` }}
            />
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
};
