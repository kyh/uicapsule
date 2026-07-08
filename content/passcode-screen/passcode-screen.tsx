"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Delete, Lock, LockOpen } from "lucide-react";
import { AnimatePresence, motion, useAnimate } from "motion/react";

const CORRECT_CODE = "1234";
const CODE_LENGTH = 4;

const KEYS: { digit: string; letters: string }[] = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
];

export const PasscodeScreen = () => {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [scope, animate] = useAnimate();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const queue = useCallback((callback: () => void, delay: number) => {
    timersRef.current.push(setTimeout(callback, delay));
  }, []);

  const pressDigit = useCallback(
    (digit: string) => {
      if (unlocked) return;
      setCode((previous) => {
        if (previous.length >= CODE_LENGTH) return previous;
        const next = previous + digit;
        if (next.length === CODE_LENGTH) {
          if (next === CORRECT_CODE) {
            queue(() => {
              setUnlocked(true);
              queue(() => {
                setUnlocked(false);
                setCode("");
              }, 2400);
            }, 250);
          } else {
            queue(() => {
              if (scope.current) {
                void animate(
                  scope.current,
                  { x: [0, -14, 14, -10, 10, -5, 5, 0] },
                  { duration: 0.45, ease: "easeInOut" },
                );
              }
              queue(() => setCode(""), 350);
            }, 200);
          }
        }
        return next;
      });
    },
    [animate, queue, scope, unlocked],
  );

  return (
    <div className="relative h-[620px] w-[340px] overflow-hidden rounded-[44px] bg-[#0c0e18] shadow-2xl shadow-black/60 ring-8 ring-black select-none">
      {/* Wallpaper */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        animate={{ opacity: unlocked ? 1 : 0.55 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute -top-16 -right-20 size-72 rounded-full bg-[#6366f1]/40 blur-3xl" />
        <div className="absolute bottom-10 -left-16 size-64 rounded-full bg-[#06b6d4]/30 blur-3xl" />
      </motion.div>

      <div className="relative flex h-full flex-col items-center px-8 pt-16">
        <motion.div
          key={unlocked ? "open" : "closed"}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.45 }}
          className="text-white"
        >
          {unlocked ? <LockOpen className="size-7" /> : <Lock className="size-7 opacity-80" />}
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          {unlocked ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className="mt-8 text-center"
            >
              <p className="text-[22px] font-semibold text-white">Welcome back</p>
              <p className="mt-1 text-[13px] text-white/50">Unlocked</p>
            </motion.div>
          ) : (
            <motion.div
              key="entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <p className="mt-5 text-[16px] font-medium text-white">Enter Passcode</p>

              <div ref={scope} className="mt-6 flex gap-5">
                {Array.from({ length: CODE_LENGTH }, (_, index) => (
                  <motion.span
                    key={index}
                    animate={{
                      scale: index === code.length - 1 ? [1.4, 1] : 1,
                      backgroundColor:
                        index < code.length ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
                    }}
                    transition={{ duration: 0.18 }}
                    className="size-3.5 rounded-full ring-1 ring-white/80"
                  />
                ))}
              </div>

              <div className="mt-9 grid grid-cols-3 gap-x-6 gap-y-4">
                {KEYS.map((key) => (
                  <motion.button
                    type="button"
                    key={key.digit}
                    onClick={() => pressDigit(key.digit)}
                    whileTap={{ backgroundColor: "rgba(255,255,255,0.35)", scale: 0.96 }}
                    className="flex size-[68px] flex-col items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors duration-300"
                  >
                    <span className="text-[26px] leading-none font-light text-white">
                      {key.digit}
                    </span>
                    <span className="mt-0.5 h-3 text-[9px] font-semibold tracking-[0.15em] text-white/60">
                      {key.letters}
                    </span>
                  </motion.button>
                ))}
                <span />
                <motion.button
                  type="button"
                  onClick={() => pressDigit("0")}
                  whileTap={{ backgroundColor: "rgba(255,255,255,0.35)", scale: 0.96 }}
                  className="flex size-[68px] items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors duration-300"
                >
                  <span className="text-[26px] font-light text-white">0</span>
                </motion.button>
                <button
                  type="button"
                  aria-label="Delete digit"
                  onClick={() => setCode((previous) => previous.slice(0, -1))}
                  className="flex size-[68px] items-center justify-center text-white/70 transition-colors hover:text-white"
                >
                  <Delete className="size-6" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!unlocked && (
          <p className="absolute bottom-7 text-[11px] text-white/30">
            Try 1234 — anything else shakes
          </p>
        )}
      </div>
    </div>
  );
};
