"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { Camera } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

import { PhoneFrame, SCREEN_HEIGHT, SCREEN_WIDTH } from "./phone-frame";
import type { ClayTone } from "./phone-frame";

const THUMB_INSET = 17;
const THUMB_BOTTOM = 30;
const DISMISS_OFFSET = 40;

export type ThumbnailCorner = "left" | "right";

interface SceneProps {
  eyebrow: string;
  title: string;
}

const Scene: FC<SceneProps> = ({ eyebrow, title }) => (
  <div className="absolute inset-0 overflow-hidden bg-[#1a0e1c]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,#fbbf24_0%,#f97316_18%,transparent_40%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#8a3350_0%,transparent_60%)]" />
    <div
      className="absolute bottom-0 left-[-30%] h-80 w-[90%] bg-[#3a2036]"
      style={{ clipPath: "polygon(0 100%, 50% 0, 100% 100%)" }}
    />
    <div
      className="absolute bottom-0 right-[-25%] h-64 w-[80%] bg-[#26142a]"
      style={{ clipPath: "polygon(0 100%, 45% 8%, 100% 100%)" }}
    />
    <div className="absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-[#1a0e1c]/80 to-transparent" />
    <p className="absolute top-[76px] left-6 text-[13px] font-medium text-white/60">{eyebrow}</p>
    <p className="absolute top-[96px] left-6 text-[26px] font-semibold tracking-tight text-white">
      {title}
    </p>
  </div>
);

interface Shot {
  id: number;
}

export interface ScreenshotCaptureProps {
  /** Spring bounce of the shrink into the thumbnail. */
  bounce?: number;
  /** Corner the thumbnail docks in; it swipes away toward that edge. */
  corner?: ThumbnailCorner;
  /** Small label above the scene title. */
  eyebrow?: string;
  /** White flash on capture. */
  flash?: boolean;
  /** Hint shown while no thumbnail is on screen; empty hides it. */
  hint?: string;
  /** Copy on the capture button. */
  label?: string;
  /** How long the thumbnail lingers before leaving on its own. */
  lingerMs?: number;
  /** Color of the thumbnail's border. */
  ringColor?: string;
  /** Scene title on the phone screen. */
  title?: string;
  /** Thumbnail size as a fraction of the screen. */
  thumbScale?: number;
  tone?: ClayTone;
}

export const ScreenshotCapture = ({
  bounce = 0.22,
  corner = "left",
  eyebrow = "Golden hour",
  flash = true,
  hint = "Capture, then swipe the thumbnail away",
  label = "Screenshot",
  lingerMs = 4500,
  ringColor = "#ffffff",
  title = "Dolomites, Italy",
  thumbScale = 0.2,
  tone = "espresso",
}: ScreenshotCaptureProps) => {
  const [flashKey, setFlashKey] = useState(0);
  const [shot, setShot] = useState<Shot | null>(null);
  const nextIdRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null && timerRef.current !== 0) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const side = corner === "left" ? -1 : 1;
  const thumbX = side * ((SCREEN_WIDTH * (1 - thumbScale)) / 2 - THUMB_INSET);
  const thumbY = (SCREEN_HEIGHT * (1 - thumbScale)) / 2 - THUMB_BOTTOM;

  const capture = useCallback(() => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setFlashKey(id);
    setShot({ id });

    if (timerRef.current !== null && timerRef.current !== 0) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setShot(null);
    }, lingerMs);
  }, [lingerMs]);

  return (
    <MotionConfig reducedMotion="user">
      <PhoneFrame className="bg-[#1a0e1c]" tone={tone}>
        <Scene eyebrow={eyebrow} title={title} />

        <AnimatePresence>
          {flash && flashKey > 0 && (
            <motion.div
              key={flashKey}
              aria-hidden
              initial={{ opacity: 0.95 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 z-30 bg-white"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {shot && (
            <motion.div
              key={shot.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={side < 0 ? { left: 0.9, right: 0.05 } : { left: 0.05, right: 0.9 }}
              onDragEnd={(_, info) => {
                if (info.offset.x * side > DISMISS_OFFSET) {
                  setShot(null);
                }
              }}
              initial={{ borderRadius: 50, scale: 1, x: 0, y: 0 }}
              animate={{ borderRadius: 40, scale: thumbScale, x: thumbX, y: thumbY }}
              exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeIn" }, x: side * 420 }}
              transition={{ bounce, delay: 0.12, duration: 0.65, type: "spring" }}
              style={{ boxShadow: `0 0 0 10px ${ringColor}, 0 25px 50px -12px rgb(0 0 0 / 0.8)` }}
              className="absolute inset-0 z-20 cursor-grab overflow-hidden active:cursor-grabbing"
            >
              <Scene eyebrow={eyebrow} title={title} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-10 z-10 flex justify-center">
          <motion.button
            type="button"
            onClick={capture}
            whileTap={{ scale: 0.92 }}
            className="flex items-center gap-2 rounded-full bg-white/12 px-4 py-2.5 text-[13px] font-medium text-white backdrop-blur-xl ring-1 ring-white/20 transition-colors hover:bg-white/20"
          >
            <Camera className="size-4" />
            {label}
          </motion.button>
        </div>

        <AnimatePresence>
          {!shot && hint !== "" && (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 bottom-[92px] z-10 text-center text-[11px] text-white/35"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </PhoneFrame>
    </MotionConfig>
  );
};
