"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Wifi } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type Person = {
  id: string;
  name: string;
  initials: string;
  gradient: string;
  x: number;
  y: number;
};

const PEOPLE: Person[] = [
  {
    id: "riley",
    name: "Riley",
    initials: "RC",
    gradient: "from-[#60a5fa] to-[#2563eb]",
    x: -45,
    y: -178,
  },
  {
    id: "nova",
    name: "Nova",
    initials: "NV",
    gradient: "from-[#f0a58f] to-[#c76b52]",
    x: 120,
    y: -225,
  },
  {
    id: "mia",
    name: "Mia",
    initials: "MT",
    gradient: "from-[#a78bfa] to-[#7c3aed]",
    x: 138,
    y: -85,
  },
  {
    id: "sam",
    name: "Sam",
    initials: "SO",
    gradient: "from-[#34d399] to-[#059669]",
    x: -68,
    y: -75,
  },
];

type SendState = { id: string; phase: "sending" | "sent" } | null;

const RING_CIRCUMFERENCE = 2 * Math.PI * 30;

export const AirdropRadar = () => {
  const [send, setSend] = useState<SendState>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const share = useCallback((id: string) => {
    setSend({ id, phase: "sending" });
    timersRef.current.push(
      setTimeout(() => {
        setSend({ id, phase: "sent" });
        timersRef.current.push(setTimeout(() => setSend(null), 2200));
      }, 1900),
    );
  }, []);

  return (
    <div className="relative h-[620px] w-[340px] overflow-hidden rounded-[44px] bg-[#0b0d14] shadow-2xl shadow-black/60 ring-8 ring-black select-none">
      {/* Radar origin: you, bottom center */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
        {/* Ripples */}
        {[0, 1, 2].map((ring) => (
          <motion.span
            key={ring}
            aria-hidden
            className="absolute top-1/2 left-1/2 rounded-full border border-sky-400/40"
            style={{ width: 80, height: 80, x: "-50%", y: "-50%" }}
            animate={{ scale: [1, 6.2], opacity: [0.55, 0] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              delay: ring * 1.05,
              ease: "easeOut",
            }}
          />
        ))}

        {/* People on the radar */}
        {PEOPLE.map((person, index) => {
          const state = send?.id === person.id ? send.phase : null;
          const dimmed = send !== null && send.id !== person.id;
          return (
            <motion.button
              type="button"
              key={person.id}
              onClick={() => share(person.id)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: dimmed ? 0.35 : 1, scale: dimmed ? 0.92 : 1 }}
              transition={{
                type: "spring",
                duration: 0.5,
                bounce: 0.4,
                delay: 0.3 + index * 0.18,
              }}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
              style={{ left: 40 + person.x, top: 40 + person.y }}
              disabled={send !== null}
            >
              <span className="relative grid size-[60px] place-items-center">
                {/* Progress ring */}
                <svg viewBox="0 0 68 68" className="absolute inset-0 size-[60px] -rotate-90">
                  <AnimatePresence>
                    {state && (
                      <motion.circle
                        cx="34"
                        cy="34"
                        r="30"
                        fill="none"
                        stroke={state === "sent" ? "#30d158" : "#0a84ff"}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={RING_CIRCUMFERENCE}
                        initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                        animate={{
                          strokeDashoffset: state === "sent" ? 0 : RING_CIRCUMFERENCE * 0.02,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: state === "sent" ? 0.2 : 1.9, ease: "easeInOut" }}
                      />
                    )}
                  </AnimatePresence>
                </svg>
                <span
                  className={`grid size-[52px] place-items-center rounded-full bg-gradient-to-b text-[15px] font-semibold text-white ${person.gradient}`}
                >
                  {state === "sent" ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.35, bounce: 0.55 }}
                      className="grid size-full place-items-center rounded-full bg-[#30d158]"
                    >
                      <Check className="size-6 text-white" strokeWidth={3} />
                    </motion.span>
                  ) : (
                    person.initials
                  )}
                </span>
              </span>
              <span className="text-[11px] font-medium text-white/70">
                {state === "sending" ? "Sending…" : state === "sent" ? "Sent" : person.name}
              </span>
            </motion.button>
          );
        })}

        {/* You */}
        <div className="relative grid size-20 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/15 backdrop-blur-xl">
          <div className="grid size-14 place-items-center rounded-full bg-gradient-to-b from-[#8b93a3] to-[#5b6472] text-[16px] font-semibold text-white">
            KL
          </div>
        </div>
      </div>

      {/* Sheet header */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-7">
        <div>
          <p className="text-[20px] font-bold text-white">AirDrop</p>
          <p className="mt-0.5 text-[12px] text-white/45">
            {send?.phase === "sending"
              ? "Sending 3 photos…"
              : send?.phase === "sent"
                ? "Delivered"
                : "4 people nearby"}
          </p>
        </div>
        <span className="grid size-9 place-items-center rounded-full bg-white/[0.08] text-sky-400">
          <Wifi className="size-4" />
        </span>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-[11px] text-white/30">
        Tap someone to send
      </p>
    </div>
  );
};
