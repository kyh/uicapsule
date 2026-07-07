"use client";

import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { Camera } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const LINGER_MS = 4500;

// The "wallpaper" is pure CSS so the thumbnail can be an exact copy.
const Scene: FC = () => (
  <div className="absolute inset-0 overflow-hidden bg-[#0b1120]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,#fbbf24_0%,#f97316_18%,transparent_40%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#312e81_0%,transparent_60%)]" />
    {/* Mountain silhouettes */}
    <div
      className="absolute bottom-0 left-[-30%] h-64 w-[90%] bg-[#1e2749]"
      style={{ clipPath: "polygon(0 100%, 50% 0, 100% 100%)" }}
    />
    <div
      className="absolute bottom-0 right-[-25%] h-52 w-[80%] bg-[#141b36]"
      style={{ clipPath: "polygon(0 100%, 45% 8%, 100% 100%)" }}
    />
    <div className="absolute right-0 bottom-0 left-0 h-24 bg-gradient-to-t from-[#0b1120]/80 to-transparent" />
    <p className="absolute top-12 left-6 text-[13px] font-medium text-white/60">Golden hour</p>
    <p className="absolute top-[68px] left-6 text-[24px] font-semibold tracking-tight text-white">
      Dolomites, Italy
    </p>
  </div>
);

type Shot = { id: number };

export const ScreenshotCapture = () => {
  const [flashKey, setFlashKey] = useState(0);
  const [shot, setShot] = useState<Shot | null>(null);
  const nextIdRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const capture = useCallback(() => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setFlashKey(id);
    setShot({ id });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShot(null), LINGER_MS);
  }, []);

  return (
    <div className="relative h-[620px] w-[340px] overflow-hidden rounded-[44px] shadow-2xl shadow-black/60 ring-8 ring-black select-none">
      <Scene />

      {/* Flash */}
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

      {/* Thumbnail: an exact CSS copy of the scene, shrinking into the corner */}
      <AnimatePresence>
        {shot && (
          <motion.div
            key={shot.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.9, right: 0.05 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40) setShot(null);
            }}
            initial={{ scale: 1, x: 0, y: 0, borderRadius: 36 }}
            animate={{ scale: 0.2, x: -119, y: 218, borderRadius: 12 }}
            exit={{ x: -420, opacity: 0, transition: { duration: 0.25, ease: "easeIn" } }}
            transition={{ type: "spring", duration: 0.65, bounce: 0.22, delay: 0.12 }}
            className="absolute inset-0 z-20 cursor-grab overflow-hidden shadow-2xl shadow-black/80 ring-4 ring-white active:cursor-grabbing"
          >
            <Scene />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capture control */}
      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center">
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

      <p className="pointer-events-none absolute inset-x-0 bottom-[70px] z-10 text-center text-[11px] text-white/35">
        Capture, then swipe the thumbnail away
      </p>
    </div>
  );
};
