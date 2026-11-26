"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Wifi } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { PhoneFrame } from "./phone-frame";
import type { ClayTone } from "./phone-frame";

interface Person {
  id: string;
  name: string;
  initials: string;
  gradient: string;
  x: number;
  y: number;
}

const PEOPLE: Person[] = [
  {
    gradient: "from-[#60a5fa] to-[#2563eb]",
    id: "riley",
    initials: "RC",
    name: "Riley",
    x: -72,
    y: -372,
  },
  {
    gradient: "from-[#f0a58f] to-[#c76b52]",
    id: "nova",
    initials: "NV",
    name: "Nova",
    x: 100,
    y: -290,
  },
  {
    gradient: "from-[#a78bfa] to-[#7c3aed]",
    id: "mia",
    initials: "MT",
    name: "Mia",
    x: 108,
    y: -118,
  },
  {
    gradient: "from-[#34d399] to-[#059669]",
    id: "sam",
    initials: "SO",
    name: "Sam",
    x: -96,
    y: -186,
  },
];

type SendPhase = "sending" | "sent";

type SendState = { id: string; phase: SendPhase } | null;

const PHASE_LABEL: Record<SendPhase, string> = { sending: "Sending…", sent: "Sent" };

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const statusFor = (phase: SendPhase, photoCount: number) =>
  phase === "sending" ? `Sending ${plural(photoCount, "photo")}…` : "Delivered";

const nearbyLabel = (count: number) => `${count} ${count === 1 ? "person" : "people"} nearby`;

const RING_CIRCUMFERENCE = 2 * Math.PI * 30;

interface AirdropRadarProps {
  /** How many nearby people surface on the radar, 1 to 4. */
  peopleCount?: number;
  /** Concentric pulses in flight at once. */
  ringCount?: number;
  /** Seconds one pulse takes to expand and fade. */
  pulseDuration?: number;
  /** Pulse rings and the AirDrop glyph. */
  ringColor?: string;
  /** Seconds the progress ring takes to wrap an avatar. */
  sendDuration?: number;
  /** Seconds the "Sent" check holds before the radar resets. */
  sentHold?: number;
  sendingColor?: string;
  sentColor?: string;
  photoCount?: number;
  /** The sender's avatar, up to three characters. */
  ownerInitials?: string;
  title?: string;
  hint?: string;
  tone?: ClayTone;
  screenColor?: string;
}

export const AirdropRadar = ({
  peopleCount = PEOPLE.length,
  ringCount = 3,
  pulseDuration = 3.6,
  ringColor = "#38bdf8",
  sendDuration = 1.9,
  sentHold = 2.2,
  sendingColor = "#0a84ff",
  sentColor = "#30d158",
  photoCount = 3,
  ownerInitials = "KL",
  title = "AirDrop",
  hint = "Tap someone to send",
  tone = "slate",
  screenColor = "#08101d",
}: AirdropRadarProps) => {
  const [send, setSend] = useState<SendState>(null);
  const people = PEOPLE.slice(0, Math.max(1, Math.min(PEOPLE.length, Math.round(peopleCount))));
  const rings = Array.from({ length: Math.max(1, Math.round(ringCount)) }, (_, ring) => ring);
  const ringSpread = rings.length > 1 ? 1 / (rings.length - 1) : 0;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, []);

  const share = useCallback(
    (id: string) => {
      setSend({ id, phase: "sending" });
      timersRef.current.push(
        setTimeout(() => {
          setSend({ id, phase: "sent" });
          timersRef.current.push(
            setTimeout(() => {
              setSend(null);
            }, sentHold * 1000),
          );
        }, sendDuration * 1000),
      );
    },
    [sendDuration, sentHold],
  );

  return (
    <PhoneFrame tone={tone} className="bg-[#08101d]">
      <div aria-hidden className="absolute inset-0" style={{ backgroundColor: screenColor }} />
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2">
        {rings.map((ring) => (
          <motion.span
            key={`${ring}-${rings.length}-${pulseDuration}`}
            aria-hidden
            className="absolute top-1/2 left-1/2 rounded-full border"
            style={{
              borderColor: `color-mix(in srgb, ${ringColor} 40%, transparent)`,
              height: 80,
              width: 80,
              x: "-50%",
              y: "-50%",
            }}
            animate={
              reduceMotion === true
                ? { opacity: 0.4 - ring * ringSpread * 0.2, scale: 2.4 + ring * ringSpread * 4.8 }
                : { opacity: [0.55, 0], scale: [1, 9] }
            }
            transition={
              reduceMotion === true
                ? { duration: 0 }
                : {
                    delay: (ring * pulseDuration) / rings.length,
                    duration: pulseDuration,
                    ease: "easeOut",
                    repeat: Infinity,
                  }
            }
          />
        ))}
        {people.map((person, index) => {
          const state = send?.id === person.id ? send.phase : null;
          const dimmed = send !== null && send.id !== person.id;

          return (
            <motion.button
              type="button"
              key={person.id}
              onClick={() => {
                share(person.id);
              }}
              animate={{ opacity: dimmed ? 0.35 : 1, scale: dimmed ? 0.92 : 1 }}
              transition={{ bounce: 0.3, duration: 0.45, type: "spring" }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: 40 + person.x, top: 40 + person.y }}
              disabled={send !== null}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  bounce: 0.4,
                  delay: 0.3 + index * 0.18,
                  duration: 0.5,
                  type: "spring",
                }}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="relative grid size-[60px] place-items-center">
                  <svg viewBox="0 0 68 68" className="absolute inset-0 size-[60px] -rotate-90">
                    <AnimatePresence>
                      {state && (
                        <motion.circle
                          cx="34"
                          cy="34"
                          r="30"
                          fill="none"
                          stroke={state === "sent" ? sentColor : sendingColor}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={RING_CIRCUMFERENCE}
                          initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                          animate={{
                            strokeDashoffset: state === "sent" ? 0 : RING_CIRCUMFERENCE * 0.02,
                          }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: state === "sent" ? 0.2 : sendDuration,
                            ease: "easeInOut",
                          }}
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
                        transition={{ bounce: 0.55, duration: 0.35, type: "spring" }}
                        className="grid size-full place-items-center rounded-full"
                        style={{ backgroundColor: sentColor }}
                      >
                        <Check className="size-6 text-white" strokeWidth={3} />
                      </motion.span>
                    ) : (
                      person.initials
                    )}
                  </span>
                </span>
                <span className="text-[11px] font-medium text-white/70">
                  {state ? PHASE_LABEL[state] : person.name}
                </span>
              </motion.span>
            </motion.button>
          );
        })}
        <div className="relative grid size-20 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/15 backdrop-blur-xl">
          <div className="grid size-14 place-items-center rounded-full bg-gradient-to-b from-[#8b93a3] to-[#5b6472] text-[16px] font-semibold text-white">
            {ownerInitials.slice(0, 3)}
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-[58px]">
        <div>
          <p className="text-[20px] font-bold text-white">{title}</p>
          <p className="mt-0.5 text-[12px] text-white/45">
            {send ? statusFor(send.phase, photoCount) : nearbyLabel(people.length)}
          </p>
        </div>
        <span
          className="grid size-9 place-items-center rounded-full bg-white/[0.08]"
          style={{ color: ringColor }}
        >
          <Wifi className="size-4" />
        </span>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-[11px] text-white/30">
        {hint}
      </p>
    </PhoneFrame>
  );
};
