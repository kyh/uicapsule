"use client";

import { useEffect, useRef, useState, type FC } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Seek filmstrip — the tvOS scrub interaction. Dragging the timeline pauses
 * playback and raises a filmstrip of preview frames above the playhead;
 * releasing commits the seek. The "video" is a synthetic day-cycle scene
 * rendered as a pure function of time, so every preview frame is exact.
 */

/** Full playback loop, in seconds of real time. */
const LOOP_SECONDS = 48;
const FRAME_OFFSETS = [-0.09, -0.045, 0, 0.045, 0.09];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const mixHex = (a: string, b: string, u: number) => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return `rgb(${String(Math.round(lerp(ar, br, u)))},${String(Math.round(lerp(ag, bg, u)))},${String(Math.round(lerp(ab, bb, u)))})`;
};

type SkyStop = { t: number; top: string; horizon: string; light: number };

// A 24-hour cycle: midnight → dawn → noon → dusk → midnight.
const SKY: SkyStop[] = [
  { t: 0, top: "#04061a", horizon: "#0c1233", light: 0.1 },
  { t: 0.2, top: "#1d2a5e", horizon: "#e2814f", light: 0.45 },
  { t: 0.32, top: "#3f7fd4", horizon: "#bcd9f2", light: 0.95 },
  { t: 0.5, top: "#3b8fe2", horizon: "#d6ecfa", light: 1 },
  { t: 0.68, top: "#4a72c4", horizon: "#f2b263", light: 0.85 },
  { t: 0.8, top: "#251d4f", horizon: "#d4543a", light: 0.4 },
  { t: 1, top: "#04061a", horizon: "#0c1233", light: 0.1 },
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
  if (!a || !b) return { top: "#000000", horizon: "#000000", light: 0 };
  const u = b.t === a.t ? 0 : (clamped - a.t) / (b.t - a.t);
  return {
    top: mixHex(a.top, b.top, u),
    horizon: mixHex(a.horizon, b.horizon, u),
    light: lerp(a.light, b.light, u),
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
      {/* Sun / moon */}
      <div
        className="absolute rounded-full"
        style={{
          left: `${String(orb.x)}%`,
          top: `${String(orb.y)}%`,
          width: "14%",
          aspectRatio: "1",
          transform: "translate(-50%, -50%)",
          background: orb.day
            ? "radial-gradient(circle, #fff7db 30%, #ffd76a 60%, transparent 72%)"
            : "radial-gradient(circle, #e8edf5 38%, #b9c4d8 55%, transparent 66%)",
          opacity: orb.day ? 1 : 0.9,
        }}
      />
      {/* Hills — brightness follows daylight */}
      <div
        className="absolute inset-x-0 bottom-0 h-[46%]"
        style={{
          clipPath:
            "polygon(0 58%, 16% 30%, 34% 52%, 52% 18%, 70% 46%, 86% 28%, 100% 50%, 100% 100%, 0 100%)",
          background: mixHex("#0a0f1e", "#31543c", sky.light),
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{
          clipPath:
            "polygon(0 40%, 22% 68%, 40% 34%, 62% 66%, 80% 40%, 100% 62%, 100% 100%, 0 100%)",
          background: mixHex("#060a14", "#1d3527", sky.light),
        }}
      />
    </div>
  );
};

export const SeekFilmstrip = () => {
  const [playedT, setPlayedT] = useState(0.3);
  const [playing, setPlaying] = useState(true);
  const [scrub, setScrub] = useState<{ t: number } | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const wasPlayingRef = useRef(false);

  // Playback loop.
  useEffect(() => {
    if (!playing || scrub) return undefined;
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
  }, [playing, scrub]);

  const tFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return clamp01((clientX - rect.left) / rect.width);
  };

  const shownT = scrub ? scrub.t : playedT;

  return (
    <div className="w-[620px] overflow-hidden rounded-3xl bg-[#101116] shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      {/* Video surface */}
      <div className="relative h-[280px]">
        <Frame t={shownT} />
        {/* Dim while scrubbing, like tvOS */}
        <motion.div
          aria-hidden
          animate={{ opacity: scrub ? 0.35 : 0 }}
          className="pointer-events-none absolute inset-0 bg-black"
        />
        <div className="absolute top-4 left-5 text-[12px] font-medium text-white/85 drop-shadow">
          One Day — timelapse
        </div>
      </div>

      {/* Controls */}
      <div className="relative px-6 pt-5 pb-6">
        {/* Filmstrip riser */}
        <AnimatePresence>
          {scrub && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
              className="pointer-events-none absolute -top-[64px] z-10 flex -translate-x-1/2 items-end gap-1.5"
              style={{
                left: `calc(24px + ${String(scrub.t * 100)}% * 0.9226)`,
              }}
            >
              {FRAME_OFFSETS.map((offset) => {
                const frameT = clamp01(scrub.t + offset);
                const center = offset === 0;
                return (
                  <div
                    key={offset}
                    className={`relative overflow-hidden rounded-md ${
                      center
                        ? "h-[64px] w-[112px] shadow-xl ring-2 shadow-black/60 ring-white"
                        : "h-[46px] w-[80px] opacity-60 ring-1 ring-white/20"
                    }`}
                  >
                    <Frame t={frameT} />
                    {center && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/55 px-1.5 py-px text-[10px] font-medium text-white tabular-nums">
                        {timeLabel(frameT)}
                      </span>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        <div
          ref={trackRef}
          className="relative h-8 cursor-pointer touch-none"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            wasPlayingRef.current = playing;
            setPlaying(false);
            setScrub({ t: tFromPointer(event.clientX) });
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              setScrub({ t: tFromPointer(event.clientX) });
            }
          }}
          onPointerUp={(event) => {
            const t = tFromPointer(event.clientX);
            setPlayedT(t);
            setScrub(null);
            setPlaying(wasPlayingRef.current);
          }}
        >
          <div className="absolute top-1/2 right-0 left-0 h-[5px] -translate-y-1/2 rounded-full bg-white/12">
            <div
              className="h-full rounded-full bg-white/85"
              style={{ width: `${String(shownT * 100)}%` }}
            />
          </div>
          {/* Playhead */}
          <motion.div
            animate={{ scale: scrub ? 1.5 : 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-1/2 size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md shadow-black/50"
            style={{ left: `${String(shownT * 100)}%` }}
          />
        </div>

        {/* Time + transport */}
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-white/70 tabular-nums">
            {timeLabel(shownT)}
          </span>
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            className="rounded-full bg-white/10 px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/15"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <span className="text-[12px] text-white/35 tabular-nums">24:00</span>
        </div>
      </div>
    </div>
  );
};
