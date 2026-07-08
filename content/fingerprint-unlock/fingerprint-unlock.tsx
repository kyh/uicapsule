"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Fingerprint, MessageCircle, Music2, Phone } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const HOLD_MS = 650;
const SENSOR = "50% 74%";

type Phase = "locked" | "reading" | "unlocked";

export const FingerprintUnlock = () => {
  const [phase, setPhase] = useState<Phase>("locked");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const queue = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  const startRead = useCallback(() => {
    setPhase("reading");
    queue(() => {
      setPhase((current) => {
        if (current !== "reading") return current;
        queue(() => setPhase("locked"), 3200);
        return "unlocked";
      });
    }, HOLD_MS);
  }, [queue]);

  const cancelRead = useCallback(() => {
    setPhase((current) => (current === "reading" ? "locked" : current));
  }, []);

  return (
    <div className="relative h-[620px] w-[340px] overflow-hidden rounded-[44px] bg-black shadow-2xl shadow-black/60 ring-8 ring-black select-none">
      {/* Unlocked home, revealed by the ripple */}
      <motion.div
        animate={{
          clipPath: phase === "unlocked" ? `circle(130% at ${SENSOR})` : `circle(0% at ${SENSOR})`,
        }}
        transition={
          phase === "unlocked"
            ? { duration: 0.65, ease: [0.2, 0.8, 0.3, 1] }
            : { duration: 0.4, ease: "easeIn" }
        }
        className="absolute inset-0 bg-[#101422]"
      >
        <div aria-hidden className="absolute inset-0">
          <div className="absolute -top-16 -left-16 size-64 rounded-full bg-[#2563eb]/35 blur-3xl" />
          <div className="absolute right-0 bottom-24 size-56 rounded-full bg-[#7c3aed]/25 blur-3xl" />
        </div>
        <div className="relative px-6 pt-14">
          <p className="text-[13px] text-white/50">Welcome back</p>
          <p className="text-[26px] font-semibold text-white">Kai</p>
          <div className="mt-6 grid grid-cols-4 gap-4">
            {[
              ["Phone", Phone, "from-[#5ff777] to-[#0eb531]"],
              ["Chat", MessageCircle, "from-[#4aa8f0] to-[#1d63d8]"],
              ["Camera", Camera, "from-[#3f4650] to-[#16181d]"],
              ["Music", Music2, "from-[#ff8787] to-[#e8390e]"],
            ].map(([label, Icon, gradient]) => (
              <div key={String(label)} className="flex flex-col items-center gap-1.5">
                <span
                  className={`grid size-13 place-items-center rounded-[18px] bg-gradient-to-b shadow-lg shadow-black/30 ${String(gradient)}`}
                >
                  <Icon className="size-6 text-white" />
                </span>
                <span className="text-[10px] text-white/60">{String(label)}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Lock screen */}
      <AnimatePresence>
        {phase !== "unlocked" && (
          <motion.div
            key="lock"
            initial={false}
            exit={{ opacity: 0, transition: { delay: 0.45, duration: 0.25 } }}
            className="absolute inset-0 flex flex-col items-center bg-[#07080d] pt-20"
          >
            <p className="text-[15px] text-white/50">Monday, July 7</p>
            <p className="mt-1 text-[64px] leading-none font-semibold tracking-tight text-white">
              9:41
            </p>

            {/* Sensor */}
            <div className="absolute bottom-[112px] flex flex-col items-center">
              <motion.button
                type="button"
                aria-label="Fingerprint sensor — press and hold"
                onPointerDown={startRead}
                onPointerUp={cancelRead}
                onPointerLeave={cancelRead}
                animate={phase === "reading" ? { scale: 1.12 } : { scale: 1 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="relative grid size-20 place-items-center rounded-full"
              >
                {/* Reading pulse rings */}
                <AnimatePresence>
                  {phase === "reading" && (
                    <>
                      {[0, 1].map((ring) => (
                        <motion.span
                          key={ring}
                          aria-hidden
                          initial={{ scale: 0.7, opacity: 0.6 }}
                          animate={{ scale: 1.9, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            delay: ring * 0.45,
                            ease: "easeOut",
                          }}
                          className="absolute inset-0 rounded-full border border-sky-400/60"
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>
                <motion.span
                  animate={{
                    backgroundColor:
                      phase === "reading" ? "rgba(56,189,248,0.18)" : "rgba(255,255,255,0.06)",
                  }}
                  className="absolute inset-0 rounded-full ring-1 ring-white/15"
                />
                <Fingerprint
                  className={`relative size-9 transition-colors duration-300 ${
                    phase === "reading" ? "text-sky-300" : "text-white/60"
                  }`}
                />
              </motion.button>
              <p className="mt-3 text-[11px] text-white/35">
                {phase === "reading" ? "Reading…" : "Hold the sensor"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
