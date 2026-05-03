"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { ExpandedWidget, expandedWidgetOptions, type ExpandedWidgetView } from "./expanded-widgets";
import { Ring } from "./ring";
import { Timer } from "./timer";

type BaseView = "idle" | "ring" | "timer";
type View = BaseView | ExpandedWidgetView;
type VariantKey = View | `${View}-${View}`;
type AnimationVariant = {
  scale?: number;
  scaleX?: number;
  y?: number;
  bounce?: number;
};

const baseViews: { view: BaseView; label: string }[] = [
  { view: "idle", label: "idle" },
  { view: "ring", label: "ring" },
  { view: "timer", label: "timer" },
];
const views: { view: View; label: string }[] = [...baseViews, ...expandedWidgetOptions];

export default function DynamicIsland() {
  const [view, setView] = useState<View>("idle");
  const [variantKey, setVariantKey] = useState<VariantKey>("idle");

  const content = useMemo(() => {
    switch (view) {
      case "ring":
        return <Ring />;
      case "timer":
        return <Timer />;
      case "idle":
        return <div className="h-7" />;
      default:
        return <ExpandedWidget view={view} />;
    }
  }, [view]);

  return (
    <div className="h-[260px]">
      <div className="relative flex h-full w-full flex-col justify-between">
        <motion.div
          layout
          transition={{
            type: "spring",
            bounce: BOUNCE_VARIANTS[variantKey] ?? 0.4,
          }}
          style={{ borderRadius: 32 }}
          className="mx-auto w-fit min-w-[100px] overflow-hidden rounded-full bg-black"
        >
          <motion.div
            transition={{
              type: "spring",
              bounce: BOUNCE_VARIANTS[variantKey] ?? 0.4,
            }}
            initial={{
              scale: 0.9,
              opacity: 0,
              filter: "blur(5px)",
              originX: 0.5,
              originY: 0.5,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              filter: "blur(0px)",
              originX: 0.5,
              originY: 0.5,
              transition: {
                delay: 0.05,
              },
            }}
            key={view}
          >
            {content}
          </motion.div>
        </motion.div>

        <div className="pointer-events-none absolute top-0 left-1/2 flex h-[200px] w-[300px] -translate-x-1/2 items-start justify-center">
          <AnimatePresence mode="popLayout" custom={ANIMATION_VARIANTS[variantKey]}>
            <motion.div initial={{ opacity: 0 }} exit="exit" variants={variants} key={view}>
              {content}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mx-auto flex max-w-[720px] flex-wrap justify-center gap-2 px-3">
          {views.map(({ view: v, label }) => (
            <button
              type="button"
              className="h-8 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-900 capitalize shadow-sm ring-1 ring-gray-300/50 ring-inset hover:bg-gray-50 aria-pressed:bg-[#ec4899] aria-pressed:text-white"
              aria-pressed={view === v}
              onClick={() => {
                setView(v);
                setVariantKey(`${view}-${v}`);
              }}
              key={v}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const variants = {
  exit: (transition: AnimationVariant = {}) => {
    return {
      ...transition,
      opacity: [1, 0],
      filter: "blur(5px)",
    };
  },
};

const ANIMATION_VARIANTS: Partial<Record<VariantKey, AnimationVariant>> = {
  "ring-idle": {
    scale: 0.9,
    scaleX: 0.9,
    bounce: 0.5,
  },
  "timer-ring": {
    scale: 0.7,
    y: -7.5,
    bounce: 0.35,
  },
  "ring-timer": {
    scale: 1.4,
    y: 7.5,
    bounce: 0.35,
  },
  "timer-idle": {
    scale: 0.7,
    y: -7.5,
    bounce: 0.3,
  },
};

const BOUNCE_VARIANTS: Partial<Record<VariantKey, number>> = {
  idle: 0.5,
  "ring-idle": 0.5,
  "timer-ring": 0.35,
  "ring-timer": 0.35,
  "timer-idle": 0.3,
  "idle-timer": 0.3,
  "idle-ring": 0.5,
};
