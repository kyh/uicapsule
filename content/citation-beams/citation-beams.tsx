"use client";

import { useRef, useState, type FC, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Citation beams — hover a citation marker and a beam draws across to the
 * source card, which lifts while the exact supporting passage sweeps
 * highlighted. Provenance you can see.
 */

type Source = {
  id: number;
  title: string;
  domain: string;
  /** snippet parts: [before, passage, after] — the middle highlights */
  snippet: [string, string, string];
};

const SOURCES: Source[] = [
  {
    id: 1,
    title: "Sleep spindles and memory consolidation",
    domain: "nature.com",
    snippet: [
      "During stage-2 sleep, ",
      "spindle density predicted next-day recall accuracy",
      " across all 44 participants.",
    ],
  },
  {
    id: 2,
    title: "The cost of the all-nighter",
    domain: "sleepjournal.org",
    snippet: [
      "One night of total deprivation ",
      "reduced hippocampal encoding capacity by roughly 40%",
      ", persisting after caffeine.",
    ],
  },
  {
    id: 3,
    title: "Naps as micro-consolidation",
    domain: "med.stanford.edu",
    snippet: [
      "A 26-minute nap ",
      "restored declarative memory performance to baseline",
      " in the afternoon cohort.",
    ],
  },
];

const BEAM_COLOR = "#7dd3fc";

export const CitationBeams = () => {
  const [active, setActive] = useState<number | null>(null);
  const [beam, setBeam] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef(new Map<number, HTMLDivElement>());

  const activate = (id: number, marker: HTMLElement) => {
    const container = containerRef.current;
    const card = cardRefs.current.get(id);
    if (!container || !card) return;
    const c = container.getBoundingClientRect();
    const m = marker.getBoundingClientRect();
    const t = card.getBoundingClientRect();
    setActive(id);
    setBeam({
      x1: m.right - c.left + 2,
      y1: m.top - c.top + m.height / 2,
      x2: t.left - c.left - 2,
      y2: t.top - c.top + t.height / 2,
    });
  };

  const clear = () => {
    setActive(null);
    setBeam(null);
  };

  const Cite: FC<{ id: number; children?: ReactNode }> = ({ id }) => (
    <button
      type="button"
      onMouseEnter={(event) => activate(id, event.currentTarget)}
      onMouseLeave={clear}
      onFocus={(event) => activate(id, event.currentTarget)}
      onBlur={clear}
      className={`mx-0.5 inline-flex size-[18px] -translate-y-[2px] items-center justify-center rounded-md text-[10px] font-bold transition-colors ${
        active === id
          ? "bg-[#7dd3fc] text-black"
          : "bg-white/[0.08] text-[#7dd3fc] hover:bg-white/[0.14]"
      }`}
    >
      {id}
    </button>
  );

  const path = beam
    ? `M ${String(beam.x1)} ${String(beam.y1)} C ${String(beam.x1 + 70)} ${String(beam.y1)}, ${String(beam.x2 - 70)} ${String(beam.y2)}, ${String(beam.x2)} ${String(beam.y2)}`
    : "";

  return (
    <div
      ref={containerRef}
      className="relative flex w-[720px] gap-6 rounded-3xl bg-[#101116] p-7 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none"
    >
      {/* Answer pane */}
      <div className="w-[340px] shrink-0">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.2em] text-white/35 uppercase">
          Answer · 3 sources
        </p>
        <p className="text-[14.5px] leading-[1.95] text-white/80">
          Sleep is when memory does its filing. Spindle activity during light sleep tracks how well
          you'll recall new material tomorrow
          <Cite id={1} />; skip a night entirely and the hippocampus encodes roughly 40% less
          <Cite id={2} />. Even a half-hour nap claws a surprising amount of that capacity back
          <Cite id={3} />.
        </p>
      </div>

      {/* Sources pane */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        {SOURCES.map((source) => (
          <motion.div
            key={source.id}
            ref={(el) => {
              if (el) cardRefs.current.set(source.id, el);
              else cardRefs.current.delete(source.id);
            }}
            animate={{
              scale: active === source.id ? 1.03 : 1,
              x: active === source.id ? -4 : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
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
              <span className="relative inline">
                <AnimatePresence>
                  {active === source.id && (
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-x-0 -inset-y-0.5 origin-left rounded-[3px] bg-[#7dd3fc]/18"
                    />
                  )}
                </AnimatePresence>
                <span
                  className={`relative transition-colors duration-200 ${
                    active === source.id ? "text-[#bfe7ff]" : ""
                  }`}
                >
                  {source.snippet[1]}
                </span>
              </span>
              {source.snippet[2]}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Beam overlay */}
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
              initial={{ pathLength: 0, opacity: 0.9 }}
              animate={{ pathLength: 1, opacity: 1 }}
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
