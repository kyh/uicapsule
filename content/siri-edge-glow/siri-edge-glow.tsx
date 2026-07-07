"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const GLOW_CONIC =
  "conic-gradient(from 0deg, #f472b6, #a78bfa, #38bdf8, #34d399, #fbbf24, #fb7185, #f472b6)";

export const SiriEdgeGlow = () => {
  const [listening, setListening] = useState(false);

  return (
    <div className="relative h-[620px] w-[340px] select-none">
      <div className="relative h-full w-full overflow-hidden rounded-[44px] bg-[#0d0f16] shadow-2xl shadow-black/60 ring-8 ring-black">
        {/* Mock home content */}
        <motion.div
          animate={{ opacity: listening ? 0.7 : 1, scale: listening ? 0.985 : 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 p-6 pt-14"
        >
          <p className="text-[13px] font-medium text-white/40">Tuesday, July 7</p>
          <p className="mt-1 text-[34px] leading-tight font-semibold tracking-tight text-white">
            Good
            <br />
            morning, Kai
          </p>
          <div className="mt-6 space-y-3">
            {[
              ["Standup", "9:30 – 9:45 AM"],
              ["Design crit", "11:00 AM – 12:00 PM"],
              ["Capsule review", "2:00 – 2:30 PM"],
            ].map(([title, time]) => (
              <div key={title} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/[0.06]">
                <p className="text-[14px] font-medium text-white">{title}</p>
                <p className="mt-0.5 text-[12px] text-white/40">{time}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Edge glow: rotating conic ring masked to the bezel */}
        <AnimatePresence>
          {listening && (
            <motion.div
              key="glow"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-[36px]"
              style={{
                maskImage:
                  "radial-gradient(ellipse 68% 64% at 50% 50%, transparent 78%, black 97%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 68% 64% at 50% 50%, transparent 78%, black 97%)",
              }}
            >
              <motion.div
                className="absolute inset-[-45%] blur-2xl"
                style={{ background: GLOW_CONIC }}
                animate={{ rotate: 360 }}
                transition={{ duration: 7, ease: "linear", repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-[-45%] opacity-70 blur-3xl"
                style={{ background: GLOW_CONIC }}
                animate={{ rotate: -360, scale: [1, 1.06, 1] }}
                transition={{
                  rotate: { duration: 11, ease: "linear", repeat: Infinity },
                  scale: { duration: 2.4, ease: "easeInOut", repeat: Infinity },
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inner breathing rim */}
        <AnimatePresence>
          {listening && (
            <motion.div
              key="rim"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 2.4, ease: "easeInOut", repeat: Infinity } }}
              className="pointer-events-none absolute inset-[3px] rounded-[40px] ring-2 ring-white/25"
            />
          )}
        </AnimatePresence>

        {/* Siri pill */}
        <div className="absolute inset-x-0 bottom-6 flex justify-center">
          <AnimatePresence mode="popLayout">
            {listening ? (
              <motion.div
                key="prompt"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: "spring", duration: 0.45, bounce: 0.3 }}
                className="rounded-full bg-white/12 px-5 py-2.5 text-[14px] text-white backdrop-blur-xl ring-1 ring-white/15"
              >
                How can I help?
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.8 } }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-white/30"
              >
                Press the side button
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Side button */}
      <motion.button
        type="button"
        aria-pressed={listening}
        aria-label={listening ? "Stop Siri" : "Summon Siri"}
        onClick={() => setListening((previous) => !previous)}
        whileTap={{ scale: 0.92, x: 2 }}
        animate={listening ? { backgroundColor: "#a78bfa" } : { backgroundColor: "#3f3f46" }}
        className="absolute top-36 -right-[13px] h-20 w-[6px] rounded-r-md"
      />
    </div>
  );
};
