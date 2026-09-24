"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Fingerprint, MessageCircle, Music2, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const HOLD_MS = 650;
const SENSOR = "50% 74%";

type Phase = "locked" | "reading" | "unlocked";

interface HomeApp {
  label: string;
  icon: LucideIcon;
  gradient: string;
}

const HOME_APPS: HomeApp[] = [
  { gradient: "from-[#5ff777] to-[#0eb531]", icon: Phone, label: "Phone" },
  { gradient: "from-[#4aa8f0] to-[#1d63d8]", icon: MessageCircle, label: "Chat" },
  { gradient: "from-[#3f4650] to-[#16181d]", icon: Camera, label: "Camera" },
  { gradient: "from-[#ff8787] to-[#e8390e]", icon: Music2, label: "Music" },
];

export const FingerprintUnlock = () => {
  const [phase, setPhase] = useState<Phase>("locked");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduceMotion = useReducedMotion() ?? false;

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const queue = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  const startRead = useCallback(() => {
    setPhase("reading");
    queue(() => {
      setPhase((current) => {
        if (current !== "reading") {
          return current;
        }
        queue(() => setPhase("locked"), 3200);
        return "unlocked";
      });
    }, HOLD_MS);
  }, [queue]);

  const cancelRead = useCallback(() => {
    setPhase((current) => {
      if (current !== "reading") {
        return current;
      }
      clearTimers();
      return "locked";
    });
  }, [clearTimers]);

  return (
    <div className="relative h-[620px] w-[340px] overflow-hidden rounded-[44px] bg-black shadow-2xl shadow-black/60 ring-8 ring-black select-none">
      <motion.div
        animate={{
          clipPath: phase === "unlocked" ? `circle(130% at ${SENSOR})` : `circle(0% at ${SENSOR})`,
        }}
        transition={
          phase === "unlocked"
            ? { duration: 0.65, ease: [0.2, 0.8, 0.3, 1] }
            : { duration: 0.4, ease: "easeIn" }
        }
        className="absolute inset-0 z-10 bg-[#101422]"
      >
        <div aria-hidden className="absolute inset-0">
          <div className="absolute -top-16 -left-16 size-64 rounded-full bg-[#2563eb]/35 blur-3xl" />
          <div className="absolute right-0 bottom-24 size-56 rounded-full bg-[#7c3aed]/25 blur-3xl" />
        </div>
        <div className="relative px-6 pt-14">
          <p className="text-[13px] text-white/50">Welcome back</p>
          <p className="text-[26px] font-semibold text-white">Kai</p>
          <div className="mt-6 grid grid-cols-4 gap-4">
            {HOME_APPS.map((app) => (
              <div key={app.label} className="flex flex-col items-center gap-1.5">
                <span
                  className={`grid size-13 place-items-center rounded-[18px] bg-gradient-to-b shadow-lg shadow-black/30 ${app.gradient}`}
                >
                  <app.icon className="size-6 text-white" />
                </span>
                <span className="text-[10px] text-white/60">{app.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

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

            <div className="absolute bottom-[112px] flex flex-col items-center">
              <motion.button
                type="button"
                aria-label="Fingerprint sensor — press and hold"
                onPointerDown={startRead}
                onPointerUp={cancelRead}
                onPointerLeave={cancelRead}
                onKeyDown={(event) => {
                  if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                    event.preventDefault();
                    startRead();
                  }
                }}
                onKeyUp={(event) => {
                  if (event.key === " " || event.key === "Enter") {
                    cancelRead();
                  }
                }}
                animate={phase === "reading" ? { scale: 1.12 } : { scale: 1 }}
                transition={{ duration: 0.3, type: "spring" }}
                className="relative grid size-20 place-items-center rounded-full"
              >
                <AnimatePresence>
                  {phase === "reading" && !reduceMotion && (
                    <>
                      {[0, 1].map((ring) => (
                        <motion.span
                          key={ring}
                          aria-hidden
                          initial={{ opacity: 0.6, scale: 0.7 }}
                          animate={{ opacity: 0, scale: 1.9 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            delay: ring * 0.45,
                            duration: 0.9,
                            ease: "easeOut",
                            repeat: Infinity,
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
