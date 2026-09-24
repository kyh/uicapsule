"use client";

import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";

/**
 * Seek filmstrip — the tvOS scrub interaction. Grabbing the timeline pauses
 * playback and unfolds it into a fixed filmstrip; the scrub head glides over
 * it with a single preview frame floating above. The picture holds the
 * committed frame and only jumps on release. The "video" is a synthetic
 * day-cycle scene rendered as a pure function of time, so every preview
 * frame is exact.
 */

/** Full playback loop, in seconds of real time. */
const LOOP_SECONDS = 48;
const TRACK_WIDTH = 572;
const PREVIEW_WIDTH = 176;
const PREVIEW_HEIGHT = 99;
const STRIP = Array.from({ length: 12 }, (_, i) => (i + 0.5) / 12);
const SPRING: Transition = { damping: 32, stiffness: 420, type: "spring" };
const INSTANT: Transition = { duration: 0 };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const hexToRgb = (hex: string): [number, number, number] => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

const mixHex = (a: string, b: string, u: number) => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return `rgb(${String(Math.round(lerp(ar, br, u)))},${String(Math.round(lerp(ag, bg, u)))},${String(Math.round(lerp(ab, bb, u)))})`;
};

interface SkyStop {
  t: number;
  top: string;
  horizon: string;
  light: number;
}

// A 24-hour cycle: midnight → dawn → noon → dusk → midnight.
const SKY: SkyStop[] = [
  { horizon: "#0c1233", light: 0.1, t: 0, top: "#04061a" },
  { horizon: "#e2814f", light: 0.45, t: 0.2, top: "#1d2a5e" },
  { horizon: "#bcd9f2", light: 0.95, t: 0.32, top: "#3f7fd4" },
  { horizon: "#d6ecfa", light: 1, t: 0.5, top: "#3b8fe2" },
  { horizon: "#f2b263", light: 0.85, t: 0.68, top: "#4a72c4" },
  { horizon: "#d4543a", light: 0.4, t: 0.8, top: "#251d4f" },
  { horizon: "#0c1233", light: 0.1, t: 1, top: "#04061a" },
];

const skyAt = (t: number) => {
  const clamped = clamp01(t);
  let upper = SKY.length - 1;
  for (let i = 1; i < SKY.length; i += 1) {
    if ((SKY[i]?.t ?? 1) >= clamped) {
      upper = i;
      break;
    }
  }
  const a = SKY[upper - 1];
  const b = SKY[upper];
  if (!a || !b) {
    return { horizon: "#000000", light: 0, top: "#000000" };
  }
  const u = b.t === a.t ? 0 : (clamped - a.t) / (b.t - a.t);
  return {
    horizon: mixHex(a.horizon, b.horizon, u),
    light: lerp(a.light, b.light, u),
    top: mixHex(a.top, b.top, u),
  };
};

/** Sun (day) or moon (night) position along an arc. */
const orbAt = (t: number) => {
  const day = t >= 0.25 && t <= 0.79;
  // Map the day window (or the wrapped night window) onto 0..1.
  const u = day ? (t - 0.25) / 0.54 : ((t + 1 - 0.79) % 1) / 0.46;
  return {
    day,
    x: lerp(8, 92, u),
    y: 78 - Math.sin(u * Math.PI) * 58,
  };
};

const timeLabel = (t: number) => {
  const minutes = Math.round(clamp01(t) * 24 * 60) % (24 * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

/** One rendered "video frame" at time t — pure CSS, no assets. */
const Frame: FC<{ t: number }> = ({ t }) => {
  const sky = skyAt(t);
  const orb = orbAt(t);
  return (
    <div
      className="relative size-full overflow-hidden"
      style={{
        background: `linear-gradient(to bottom, ${sky.top} 0%, ${sky.horizon} 78%, ${sky.horizon} 100%)`,
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          aspectRatio: "1",
          background: orb.day
            ? "radial-gradient(circle, #fff7db 30%, #ffd76a 60%, transparent 72%)"
            : "radial-gradient(circle, #e8edf5 38%, #b9c4d8 55%, transparent 66%)",
          left: `${String(orb.x)}%`,
          opacity: orb.day ? 1 : 0.9,
          top: `${String(orb.y)}%`,
          transform: "translate(-50%, -50%)",
          width: "14%",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[46%]"
        style={{
          background: mixHex("#0a0f1e", "#31543c", sky.light),
          clipPath:
            "polygon(0 58%, 16% 30%, 34% 52%, 52% 18%, 70% 46%, 86% 28%, 100% 50%, 100% 100%, 0 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{
          background: mixHex("#060a14", "#1d3527", sky.light),
          clipPath:
            "polygon(0 40%, 22% 68%, 40% 34%, 62% 66%, 80% 40%, 100% 62%, 100% 100%, 0 100%)",
        }}
      />
    </div>
  );
};

export const SeekFilmstrip = () => {
  const [playedT, setPlayedT] = useState(0.3);
  // null until the viewer chooses; reduced motion means the timelapse doesn't autoplay.
  const [playChoice, setPlayChoice] = useState<boolean | null>(null);
  const reduced = useReducedMotion() ?? false;
  const playing = playChoice ?? !reduced;
  const [scrubT, setScrubT] = useState<number | null>(null);
  const scrubbing = scrubT !== null;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    if (!playing || scrubbing) {
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPlayedT((current) => (current + dt / LOOP_SECONDS) % 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, scrubbing]);

  const tFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) {
      return 0;
    }
    return clamp01((clientX - rect.left) / rect.width);
  };

  const endScrub = (commitT: number | null) => {
    if (commitT !== null) {
      setPlayedT(commitT);
    }
    setScrubT(null);
    setPlayChoice(wasPlayingRef.current);
  };

  const headT = scrubT ?? playedT;
  const previewLeft = Math.min(
    TRACK_WIDTH - PREVIEW_WIDTH,
    Math.max(0, headT * TRACK_WIDTH - PREVIEW_WIDTH / 2),
  );
  const spring = reduced ? INSTANT : SPRING;

  return (
    <MotionConfig reducedMotion="user">
      <div className="w-[620px] overflow-hidden rounded-3xl bg-[#101116] shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
        <div className="relative h-[300px]">
          <Frame t={playedT} />
          <motion.div
            aria-hidden
            animate={{ opacity: scrubbing ? 0.3 : 0 }}
            className="pointer-events-none absolute inset-0 bg-black"
          />
          <div className="absolute top-4 left-5 text-[12px] font-medium text-white/85 drop-shadow">
            One Day — timelapse
          </div>
        </div>

        <div className="px-6 pt-4 pb-5">
          <div className="relative" style={{ width: TRACK_WIDTH }}>
            <AnimatePresence>
              {scrubT !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 6 }}
                  transition={spring}
                  className="pointer-events-none absolute bottom-[calc(100%+10px)] z-10 origin-bottom overflow-hidden rounded-lg shadow-2xl ring-2 shadow-black/70 ring-white"
                  style={{ height: PREVIEW_HEIGHT, left: previewLeft, width: PREVIEW_WIDTH }}
                >
                  <Frame t={scrubT} />
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-black/60 px-1.5 py-px text-[11px] font-medium text-white tabular-nums">
                    {timeLabel(scrubT)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              ref={trackRef}
              className="relative flex h-[44px] cursor-pointer touch-none items-center"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                wasPlayingRef.current = playing;
                setPlayChoice(false);
                setScrubT(tFromPointer(event.clientX));
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  setScrubT(tFromPointer(event.clientX));
                }
              }}
              onPointerUp={(event) => endScrub(tFromPointer(event.clientX))}
              onPointerCancel={() => endScrub(null)}
            >
              <motion.div
                animate={{ height: scrubbing ? 40 : 5 }}
                initial={false}
                transition={spring}
                className="relative flex w-full gap-[2px] overflow-hidden rounded-md bg-white/12"
              >
                {STRIP.map((t) => (
                  <motion.div
                    key={t}
                    animate={{ opacity: scrubbing ? 1 : 0 }}
                    initial={false}
                    className="h-full flex-1"
                  >
                    <Frame t={t} />
                  </motion.div>
                ))}
                <div
                  className="absolute inset-y-0 left-0 bg-white/85"
                  style={{ opacity: scrubbing ? 0 : 1, width: `${String(playedT * 100)}%` }}
                />
                <div
                  className="absolute inset-y-0 right-0 bg-black/45"
                  style={{
                    opacity: scrubbing ? 1 : 0,
                    width: `${String((1 - headT) * 100)}%`,
                  }}
                />
              </motion.div>
              <motion.div
                animate={{ height: scrubbing ? 52 : 13, width: scrubbing ? 3 : 13 }}
                initial={false}
                transition={spring}
                className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md shadow-black/60"
                style={{ left: `${String(headT * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[12px] font-medium text-white/70 tabular-nums">
              {timeLabel(playedT)}
            </span>
            <button
              type="button"
              onClick={() => setPlayChoice(!playing)}
              className="rounded-full bg-white/10 px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/15"
            >
              {playing ? "Pause" : "Play"}
            </button>
            <span className="text-[12px] text-white/35 tabular-nums">24:00</span>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};
