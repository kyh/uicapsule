"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Transition } from "motion/react";

import { ExpandedWidget } from "./expanded-widgets";
import type { ExpandedWidgetCopy, ExpandedWidgetView } from "./expanded-widgets";
import { Ring } from "./ring";
import { Timer } from "./timer";

type BaseView = "idle" | "ring" | "timer";

export type DynamicIslandView = BaseView | ExpandedWidgetView;

type View = DynamicIslandView;

type VariantKey = View | `${View}-${View}`;

interface AnimationVariant {
  scale?: number;
  scaleX?: number;
  y?: number;
  bounce?: number;
}

export const DYNAMIC_ISLAND_VIEWS: readonly View[] = [
  "idle",
  "ring",
  "timer",
  "music",
  "call",
  "memo",
  "recording",
  "incoming",
  "flight",
];

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

const DEFAULT_BOUNCE = 0.4;

const MAX_BOUNCE = 0.9;

const BOUNCE_VARIANTS = new Map<VariantKey, number>([
  ["idle", 0.5],
  ["ring-idle", 0.5],
  ["timer-ring", 0.35],
  ["ring-timer", 0.35],
  ["timer-idle", 0.3],
  ["idle-timer", 0.3],
  ["idle-ring", 0.5],
]);

const viewContent = (view: View, copy: ExpandedWidgetCopy) => {
  if (view === "ring") {
    return <Ring />;
  }

  if (view === "timer") {
    return <Timer />;
  }

  if (view === "idle") {
    return <div className="h-7" />;
  }

  return <ExpandedWidget copy={copy} view={view} />;
};

/** Props for {@link DynamicIsland}. */
export interface DynamicIslandProps extends Partial<ExpandedWidgetCopy> {
  /** The activity the island shows; changing it morphs from the previous one. */
  view?: View;
  /** Multiplies each transition's spring bounce (capped at 0.9). */
  springiness?: number;
  /** Spring duration of the island morph, in seconds. */
  duration?: number;
}

const DynamicIsland = ({
  view = "idle",
  springiness = 1,
  duration = 0.8,
  callerName = "Mike Wheeler",
  songArtist = "The New Abnormal",
  songTitle = "Selfless",
}: DynamicIslandProps) => {
  const [shownView, setShownView] = useState<View>(view);
  const [variantKey, setVariantKey] = useState<VariantKey>(view);

  if (shownView !== view) {
    setShownView(view);
    setVariantKey(`${shownView}-${view}`);
  }

  const content = viewContent(view, { callerName, songArtist, songTitle });

  const spring: Transition = {
    bounce: Math.min((BOUNCE_VARIANTS.get(variantKey) ?? DEFAULT_BOUNCE) * springiness, MAX_BOUNCE),
    duration,
    type: "spring",
  };

  return (
    <div className="h-[260px]">
      <div className="relative h-full w-full">
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
      </div>
    </div>
  );
};

export default DynamicIsland;
