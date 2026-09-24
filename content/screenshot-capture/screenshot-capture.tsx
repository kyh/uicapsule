"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { Camera } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

import { PhoneFrame, SCREEN_HEIGHT, SCREEN_WIDTH } from "./phone-frame";

const LINGER_MS = 4500;
const THUMB_SCALE = 0.2;
const THUMB_INSET = 17;
const THUMB_BOTTOM = 30;
const thumbX = THUMB_INSET - (SCREEN_WIDTH * (1 - THUMB_SCALE)) / 2;
const thumbY = (SCREEN_HEIGHT * (1 - THUMB_SCALE)) / 2 - THUMB_BOTTOM;

// The "wallpaper" is pure CSS so the thumbnail can be an exact copy.
const Scene: FC = () => (
  <div className="absolute inset-0 overflow-hidden bg-[#0b1120]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,#fbbf24_0%,#f97316_18%,transparent_40%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#312e81_0%,transparent_60%)]" />
    <div
      className="absolute bottom-0 left-[-30%] h-80 w-[90%] bg-[#1e2749]"
      style={{ clipPath: "polygon(0 100%, 50% 0, 100% 100%)" }}
    />
    <div
      className="absolute bottom-0 right-[-25%] h-64 w-[80%] bg-[#141b36]"
      style={{ clipPath: "polygon(0 100%, 45% 8%, 100% 100%)" }}
    />
    <div className="absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-[#0b1120]/80 to-transparent" />
    <p className="absolute top-[76px] left-6 text-[13px] font-medium text-white/60">Golden hour</p>
    <p className="absolute top-[96px] left-6 text-[26px] font-semibold tracking-tight text-white">
      Dolomites, Italy
    </p>
  </div>
);

interface Shot {
  id: number;
}

export const ScreenshotCapture = () => {
  const [flashKey, setFlashKey] = useState(0);
  const [shot, setShot] = useState<Shot | null>(null);
  const nextIdRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const capture = useCallback(() => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setFlashKey(id);
    setShot({ id });
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setShot(null), LINGER_MS);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <PhoneFrame className="bg-[#0b1120]">
        <Scene />

        <AnimatePresence>
          {flashKey > 0 && (
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
              dragElastic={{ left: 0.9, right: 0.05 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -40) {
                  setShot(null);
                }
              }}
              initial={{ borderRadius: 50, scale: 1, x: 0, y: 0 }}
              animate={{ borderRadius: 40, scale: THUMB_SCALE, x: thumbX, y: thumbY }}
              exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeIn" }, x: -420 }}
              transition={{ bounce: 0.22, delay: 0.12, duration: 0.65, type: "spring" }}
              className="absolute inset-0 z-20 cursor-grab overflow-hidden shadow-2xl shadow-black/80 ring-[10px] ring-white active:cursor-grabbing"
            >
              <Scene />
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
            Screenshot
          </motion.button>
        </div>

        <AnimatePresence>
          {!shot && (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 bottom-[92px] z-10 text-center text-[11px] text-white/35"
            >
              Capture, then swipe the thumbnail away
            </motion.p>
          )}
        </AnimatePresence>
      </PhoneFrame>
    </MotionConfig>
  );
};
