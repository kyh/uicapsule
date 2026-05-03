"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Ring } from "./ring";
import { Timer } from "./timer";

type View = "idle" | "ring" | "timer";
type VariantKey = View | `${View}-${View}`;
type AnimationVariant = {
  scale?: number;
  scaleX?: number;
  y?: number;
  bounce?: number;
};

const views: View[] = ["idle", "ring", "timer"];

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
    }
  }, [view]);

  return (
    <div className="h-[200px]">
      <div className="relative flex h-full w-full flex-col justify-between">
        <motion.div
          layout
          transition={{
            type: "spring",
            bounce: BOUNCE_VARIANTS[variantKey],
          }}
          style={{ borderRadius: 32 }}
          className="mx-auto w-fit min-w-[100px] overflow-hidden rounded-full bg-black"
        >
          <motion.div
            transition={{
              type: "spring",
              bounce: BOUNCE_VARIANTS[variantKey],
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
        <div className="flex w-full justify-center gap-4">
          {views.map((v) => (
            <button
              type="button"
              className="h-10 w-32 rounded-full bg-white px-2.5 py-1.5 text-sm font-medium text-gray-900 capitalize shadow-sm ring-1 ring-gray-300/50 ring-inset hover:bg-gray-50"
              onClick={() => {
                setView(v);
                setVariantKey(`${view}-${v}`);
              }}
              key={v}
            >
              {v}
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
