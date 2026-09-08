"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Transition } from "motion/react";

import { ExpandedWidget, expandedWidgetOptions } from "./expanded-widgets";
import type { ExpandedWidgetView } from "./expanded-widgets";
import { Ring } from "./ring";
import { Timer } from "./timer";

type BaseView = "idle" | "ring" | "timer";
type View = BaseView | ExpandedWidgetView;
type VariantKey = View | `${View}-${View}`;
interface AnimationVariant {
  scale?: number;
  scaleX?: number;
  y?: number;
  bounce?: number;
}

const baseViews: { view: BaseView; label: string }[] = [
  { label: "idle", view: "idle" },
  { label: "ring", view: "ring" },
  { label: "timer", view: "timer" },
];
const views: { view: View; label: string }[] = [...baseViews, ...expandedWidgetOptions];

const variants = {
  exit: (transition: AnimationVariant = {}) => ({
    ...transition,
    filter: "blur(5px)",
    opacity: [1, 0],
  }),
};

const ANIMATION_VARIANTS = new Map<VariantKey, AnimationVariant>([
  ["ring-idle", { bounce: 0.5, scale: 0.9, scaleX: 0.9 }],
  ["timer-ring", { bounce: 0.35, scale: 0.7, y: -7.5 }],
  ["ring-timer", { bounce: 0.35, scale: 1.4, y: 7.5 }],
  ["timer-idle", { bounce: 0.3, scale: 0.7, y: -7.5 }],
]);

// Fallback for pairs the table below does not name (e.g. expanded ↔ expanded).
const DEFAULT_BOUNCE = 0.4;

const BOUNCE_VARIANTS = new Map<VariantKey, number>([
  ["idle", 0.5],
  ["ring-idle", 0.5],
  ["timer-ring", 0.35],
  ["ring-timer", 0.35],
  ["timer-idle", 0.3],
  ["idle-timer", 0.3],
  ["idle-ring", 0.5],
]);

const viewContent = (view: View) => {
  switch (view) {
    case "ring": {
      return <Ring />;
    }
    case "timer": {
      return <Timer />;
    }
    case "idle": {
      return <div className="h-7" />;
    }
    default: {
      return <ExpandedWidget view={view} />;
    }
  }
};

const DynamicIsland = () => {
  const [view, setView] = useState<View>("idle");
  const [variantKey, setVariantKey] = useState<VariantKey>("idle");

  const content = viewContent(view);
  const spring: Transition = {
    bounce: BOUNCE_VARIANTS.get(variantKey) ?? DEFAULT_BOUNCE,
    type: "spring",
  };

  return (
    <div className="h-[260px]">
      <div className="relative flex h-full w-full flex-col justify-between">
        <motion.div
          layout
          transition={spring}
          style={{ borderRadius: 32 }}
          className="mx-auto w-fit min-w-[100px] overflow-hidden rounded-full bg-black"
        >
          <motion.div
            transition={spring}
            initial={{
              filter: "blur(5px)",
              opacity: 0,
              originX: 0.5,
              originY: 0.5,
              scale: 0.9,
            }}
            animate={{
              filter: "blur(0px)",
              opacity: 1,
              originX: 0.5,
              originY: 0.5,
              scale: 1,
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
          <AnimatePresence mode="popLayout" custom={ANIMATION_VARIANTS.get(variantKey)}>
            <motion.div initial={{ opacity: 0 }} exit="exit" variants={variants} key={view}>
              {content}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mx-auto flex max-w-[720px] flex-wrap justify-center gap-2 px-3">
          {views.map(({ view: v, label }) => (
            <button
              type="button"
              className="h-8 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-900 capitalize shadow-sm ring-1 ring-gray-300/50 ring-inset hover:bg-gray-50 aria-pressed:bg-black aria-pressed:text-white aria-pressed:ring-white/20 aria-pressed:hover:bg-black"
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
};

export default DynamicIsland;
