"use client";

import { useEffect, useRef, useState } from "react";
import type { FC, ReactNode } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";

/**
 * Semantic zoom — pinch a document between abstraction levels instead of
 * scrolling it. Headline ↔ summary ↔ full memo. Zooming in dives "into"
 * the text (outgoing level scales past you, incoming rises to meet you),
 * and anchor phrases morph between levels via shared layout.
 */

type Level = 0 | 1 | 2;

const LEVEL_LABELS = ["Headline", "Summary", "Full memo"] as const;
const WHEEL_THRESHOLD = 130;

/** Anchor phrases that persist across levels and morph between them. */
const Anchor: FC<{ id: string; children: ReactNode }> = ({ id, children }) => (
  <motion.span
    layoutId={id}
    layout="position"
    className="inline-block font-semibold text-[#8ec8ff]"
    transition={{ damping: 30, stiffness: 350, type: "spring" }}
  >
    {children}
  </motion.span>
);

const HeadlineLevel: FC = () => (
  <div className="flex h-full flex-col items-start justify-center">
    <p className="text-[11px] font-semibold tracking-[0.22em] text-white/35 uppercase">
      Q3 investor memo
    </p>
    <h2 className="mt-3 text-[30px] leading-[1.15] font-bold tracking-tight text-white">
      <Anchor id="atlas">Atlas</Anchor> turned profitable — <Anchor id="revenue">revenue</Anchor>{" "}
      finally outran <Anchor id="churn">churn</Anchor>.
    </h2>
  </div>
);

const SummaryLevel: FC = () => (
  <div className="flex h-full flex-col justify-center gap-4">
    <p className="text-[11px] font-semibold tracking-[0.22em] text-white/35 uppercase">
      The quarter in three lines
    </p>
    <ul className="space-y-3 text-[15px] leading-relaxed text-white/80">
      <li className="flex gap-3">
        <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#8ec8ff]/60" />
        <span>
          <Anchor id="revenue">Revenue</Anchor> grew 18% QoQ to $4.2M, the third straight quarter of
          acceleration.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#8ec8ff]/60" />
        <span>
          Logo <Anchor id="churn">churn</Anchor> halved to 1.1% after the onboarding rebuild.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#8ec8ff]/60" />
        <span>
          <Anchor id="atlas">Atlas</Anchor> Teams launched to 40 design partners; first expansion
          revenue lands in Q4.
        </span>
      </li>
    </ul>
  </div>
);

const FullLevel: FC = () => (
  <div className="flex h-full flex-col justify-center gap-3.5 text-[13px] leading-[1.8] text-white/70">
    <p className="text-[11px] font-semibold tracking-[0.22em] text-white/35 uppercase">Full memo</p>
    <p>
      Q3 was the quarter the model clicked. <Anchor id="revenue">Revenue</Anchor> closed at $4.2M,
      up 18% on Q2, and for the first time gross margin expanded alongside it — infra spend held
      flat while seats grew. We exited the quarter cash-flow positive, two quarters ahead of plan.
    </p>
    <p>
      The quieter story is retention. The onboarding rebuild shipped in July; logo{" "}
      <Anchor id="churn">churn</Anchor> fell from 2.3% to 1.1% by September, and week-four
      activation now predicts twelve-month retention within two points. Growth is no longer
      refilling a leaky bucket.
    </p>
    <p>
      <Anchor id="atlas">Atlas</Anchor> Teams — shared workspaces, roles, audit log — launched to 40
      design partners. Early usage says teams expand seats roughly 2.4× faster than solo accounts.
      That’s the Q4 bet.
    </p>
  </div>
);

const LEVELS: Record<Level, FC> = { 0: HeadlineLevel, 1: SummaryLevel, 2: FullLevel };

const toLevel = (value: number): Level => {
  if (value <= 0) {
    return 0;
  }
  if (value >= 2) {
    return 2;
  }
  return 1;
};

interface View {
  level: Level;
  direction: 1 | -1;
}

const step = (view: View, next: number): View => {
  const level = toLevel(next);
  if (level === view.level) {
    return view;
  }
  return { direction: level > view.level ? 1 : -1, level };
};

export const SemanticZoom = () => {
  const [view, setView] = useState<View>({ direction: 1, level: 0 });
  const { level, direction } = view;
  const rootRef = useRef<HTMLDivElement | null>(null);

  const go = (next: number) => setView((current) => step(current, next));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    let accumulated = 0;
    // React registers wheel listeners as passive, so preventDefault (which stops
    // the browser's own pinch-zoom) needs a native listener.
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      event.preventDefault();
      accumulated += event.deltaY;
      if (Math.abs(accumulated) < WHEEL_THRESHOLD) {
        return;
      }
      // Pinch out (negative delta) zooms in, toward more detail.
      const delta = accumulated < 0 ? 1 : -1;
      accumulated = 0;
      setView((current) => step(current, current.level + delta));
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, []);

  const Body = LEVELS[level];

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={rootRef}
        className="w-[600px] rounded-3xl bg-[#101116] p-7 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1 rounded-full bg-white/[0.06] p-1">
            {LEVEL_LABELS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => go(index)}
                className={`relative rounded-full px-3.5 py-1.5 text-[11px] font-medium transition-colors ${
                  level === index ? "text-black" : "text-white/55 hover:text-white/80"
                }`}
              >
                {level === index && (
                  <motion.span
                    layoutId="level-pill"
                    className="absolute inset-0 rounded-full bg-white"
                    transition={{ damping: 35, stiffness: 500, type: "spring" }}
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
          <span className="text-[10px] text-white/30">⌘ scroll to zoom</span>
        </div>

        <LayoutGroup>
          <div className="relative h-[280px] overflow-hidden">
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              <motion.div
                key={level}
                custom={direction}
                variants={{
                  center: { filter: "blur(0px)", opacity: 1, scale: 1 },
                  enter: (dir: number) => ({
                    filter: "blur(6px)",
                    opacity: 0,
                    scale: dir > 0 ? 0.82 : 1.16,
                  }),
                  exit: (dir: number) => ({
                    filter: "blur(6px)",
                    opacity: 0,
                    scale: dir > 0 ? 1.16 : 0.82,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ damping: 30, stiffness: 260, type: "spring" }}
                className="absolute inset-0"
              >
                <Body />
              </motion.div>
            </AnimatePresence>
          </div>
        </LayoutGroup>

        <div className="mt-5 flex items-center gap-2">
          {([0, 1, 2] as const).map((index) => (
            <button
              key={index}
              type="button"
              aria-label={`Zoom to ${LEVEL_LABELS[index]}`}
              onClick={() => go(index)}
              className="group flex-1 py-1"
            >
              <motion.span
                animate={{
                  backgroundColor:
                    index <= level ? "rgba(142,200,255,0.75)" : "rgba(255,255,255,0.1)",
                }}
                className="block h-[3px] rounded-full transition-transform group-hover:scale-y-150"
              />
            </button>
          ))}
        </div>
      </div>
    </MotionConfig>
  );
};
