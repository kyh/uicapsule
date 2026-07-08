"use client";

import { useEffect, useState, type FC } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Next-episode card — the streaming autoplay ritual. Credits roll, the card
 * slides in with a countdown ring around Play, and hitting zero (or pressing
 * Play) hard-cuts to the next episode's title card. "Watch credits" dismisses
 * the card and lets the credits breathe.
 */

const COUNTDOWN_SECONDS = 5;

type Episode = {
  number: number;
  title: string;
  art: string;
};

const EPISODES: Episode[] = [
  {
    number: 4,
    title: "The Long Signal",
    art: "linear-gradient(135deg,#1e2f55 0%,#0e1830 60%,#060a16 100%)",
  },
  {
    number: 5,
    title: "Half-Life of a Secret",
    art: "linear-gradient(135deg,#5a2440 0%,#2a1030 55%,#0d0616 100%)",
  },
];

const CREDITS = [
  ["Created by", "Mara Ellison"],
  ["Directed by", "J. Okafor"],
  ["Written by", "Tessa Lin"],
  ["Cinematography", "R. Vasquez"],
  ["Original Score", "Noor Adly"],
  ["Edited by", "Sam Petrov"],
  ["Production Design", "Ivy Chen"],
  ["Costume Design", "L. Moreau"],
];

type Phase = "credits" | "dismissed" | "next";

const CountdownRing: FC<{ running: boolean; onDone: () => void }> = ({ running, onDone }) => (
  <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90">
    <circle cx="18" cy="18" r="16.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
    <motion.circle
      cx="18"
      cy="18"
      r="16.5"
      fill="none"
      stroke="#fff"
      strokeWidth="2.5"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: running ? 1 : 0 }}
      transition={{ duration: COUNTDOWN_SECONDS, ease: "linear" }}
      onAnimationComplete={() => {
        if (running) onDone();
      }}
    />
  </svg>
);

export const NextEpisodeCard = () => {
  const [phase, setPhase] = useState<Phase>("credits");
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  const current = EPISODES[0];
  const next = EPISODES[1];

  // Tick the visible number alongside the ring.
  useEffect(() => {
    if (phase !== "credits") return undefined;
    setSecondsLeft(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  if (!current || !next) return null;

  return (
    <div className="relative h-[360px] w-[620px] overflow-hidden rounded-3xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      <AnimatePresence mode="wait">
        {phase === "next" ? (
          /* ——— Next episode title card ——— */
          <motion.div
            key="next"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
            style={{ background: next.art }}
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="absolute bottom-10 left-10"
            >
              <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50 uppercase">
                Episode {next.number}
              </p>
              <p className="mt-1.5 text-[26px] font-bold tracking-tight text-white">{next.title}</p>
            </motion.div>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={() => setPhase("credits")}
              className="absolute top-4 right-4 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur transition-colors hover:bg-white/20"
            >
              Replay demo
            </motion.button>
          </motion.div>
        ) : (
          /* ——— Credits over the current episode ——— */
          <motion.div
            key="credits"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
            style={{ background: current.art }}
          >
            {/* Rolling credits */}
            <motion.div
              initial={{ y: 120 }}
              animate={{ y: -560 }}
              transition={{ duration: 34, ease: "linear", repeat: Infinity }}
              className="absolute left-10 flex flex-col gap-7"
            >
              <div>
                <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase">
                  Episode {current.number}
                </p>
                <p className="mt-1 text-[17px] font-semibold text-white/85">{current.title}</p>
              </div>
              {CREDITS.map(([role, name]) => (
                <div key={role}>
                  <p className="text-[9px] tracking-[0.22em] text-white/35 uppercase">{role}</p>
                  <p className="mt-0.5 text-[13px] font-medium text-white/75">{name}</p>
                </div>
              ))}
            </motion.div>

            {/* The card */}
            <AnimatePresence>
              {phase === "credits" && (
                <motion.div
                  initial={{ opacity: 0, x: 56 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                  transition={{ type: "spring", stiffness: 320, damping: 30, delay: 0.6 }}
                  className="absolute right-6 bottom-6 w-[264px] overflow-hidden rounded-2xl bg-[#16181f]/95 shadow-2xl shadow-black/70 ring-1 ring-white/12 backdrop-blur"
                >
                  <div className="relative h-[120px]" style={{ background: next.art }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#16181f] via-transparent to-transparent" />
                    <p className="absolute bottom-2.5 left-4 text-[10px] font-semibold tracking-[0.18em] text-white/55 uppercase">
                      Next episode
                    </p>
                  </div>
                  <div className="px-4 pt-1 pb-4">
                    <p className="truncate text-[14px] font-semibold text-white">
                      {next.number}. {next.title}
                    </p>
                    <div className="mt-3 flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPhase("next")}
                        className="relative flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-[13px] font-semibold text-black transition-transform active:scale-95"
                      >
                        <span className="relative flex size-6 items-center justify-center">
                          <CountdownRing
                            running={phase === "credits"}
                            onDone={() => setPhase("next")}
                          />
                          <span className="text-[11px] font-bold tabular-nums">{secondsLeft}</span>
                        </span>
                        Play now
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhase("dismissed")}
                        className="h-11 rounded-xl bg-white/10 px-3.5 text-[12px] font-medium text-white/80 transition-colors hover:bg-white/15"
                      >
                        Watch credits
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dismissed state affordance */}
            {phase === "dismissed" && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setPhase("next")}
                className="absolute right-6 bottom-6 rounded-full bg-white/10 px-4 py-2 text-[12px] font-medium text-white/75 backdrop-blur transition-colors hover:bg-white/20"
              >
                Next episode ▸
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
