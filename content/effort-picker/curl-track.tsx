"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import { DumbbellIcon, RotateCcwIcon, VideoOffIcon } from "lucide-react";

import type { MotionValue } from "motion/react";

import { DialTrough, Sparks } from "./effort-dial";
import {
  clamp,
  KNOB_SIZE,
  labelAt,
  nearestLevel,
  notchX,
  percentToX,
  TRACK_WIDTH,
} from "./effort-scale";
import { usePoseCurls } from "./use-pose-curls";

/** The whole take, in milliseconds. Long enough to hurt, short enough to redo. */
const SET_MS = 10_000;
const COUNT_MS = 900;
/** Effort a completed curl buys you, in percent. One arm is watched, so this is
 * the whole of your income. */
const CURL_GAIN = 18;
/** Effort the machine takes back every second, whatever you're doing. Against the
 * gain above, holding a level costs a curl roughly every 1.8 seconds and climbing
 * costs about one a second — anything less and the dial walks backwards while you
 * watch it. */
const DRAIN_PER_SEC = 10;

const COMMIT_SPRING = { type: "spring", stiffness: 180, damping: 18 } as const;
const KNOB_PUMP = { type: "spring", stiffness: 700, damping: 18 } as const;

type CountdownCount = 3 | 2 | 1;
type Burst = { id: number; percent: number };

type TakeState =
  | { status: "arming" }
  | { status: "countdown"; count: CountdownCount }
  | { status: "lifting" }
  | { status: "complete"; level: number };

const promptForCountdown = (count: CountdownCount) =>
  count === 3 ? "Get in frame" : count === 2 ? "Arm down" : "Curl!";

type CurlCardProps = {
  knobX: MotionValue<number>;
  /** Bumped by the shell when someone tries to leave through the chip mid-set. */
  scoldNonce: number;
  /** True once the set is scored — or once the camera has refused, since holding
   * someone hostage to a permission dialog they already dismissed isn't a bit. */
  onDone: (done: boolean) => void;
};

/**
 * The effort picker as a physical exam. There is no knob to drag — there's a
 * camera, a ten second clock, and your arms.
 *
 * MediaPipe watches one elbow — whichever it can see best. Every curl pumps the
 * dial a little way up the track; the track leaks the whole time, so the needle
 * is only ever as high as your last few seconds of work. Whatever's left when the
 * clock runs out gets rounded to the nearest notch, and that's the effort the
 * model gets. Stop curling for two seconds and you have talked yourself down to
 * Light.
 */
export const CurlCard = ({ knobX, scoldNonce, onDone }: CurlCardProps) => {
  const [take, setTake] = useState<TakeState>({ status: "arming" });
  const [reps, setReps] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [scolding, setScolding] = useState(false);
  const reduceMotion = useReducedMotion();

  const cardShake = useMotionValue(0);
  const knobScale = useMotionValue(1);
  const timerScale = useMotionValue(1);
  const timerRef = useRef<HTMLSpanElement>(null);
  const effortRef = useRef(0);
  const burstId = useRef(0);
  /** The rep handler is called from the detection loop, which knows nothing about
   * React's render cycle — it reads the phase through a ref. */
  const phaseRef = useRef<TakeState["status"]>("arming");
  const reduceMotionRef = useRef(Boolean(reduceMotion));

  useEffect(() => {
    phaseRef.current = take.status;
  }, [take.status]);
  useEffect(() => {
    reduceMotionRef.current = Boolean(reduceMotion);
  }, [reduceMotion]);

  const handleRep = useCallback(() => {
    if (phaseRef.current !== "lifting") return;
    effortRef.current = clamp(effortRef.current + CURL_GAIN, 0, 100);
    knobX.set(percentToX(effortRef.current));
    setReps((count) => count + 1);

    if (reduceMotionRef.current) return;
    // The knob takes the hit: a kick on every rep, settling back while the drain
    // quietly walks it left again.
    knobScale.set(1.18);
    void animate(knobScale, 1, KNOB_PUMP);
    burstId.current += 1;
    const burst = { id: burstId.current, percent: effortRef.current };
    setBursts((current) => [...current, burst]);
    window.setTimeout(
      () => setBursts((current) => current.filter((item) => item.id !== burst.id)),
      700,
    );
  }, [knobX, knobScale]);

  const { videoRef, canvasRef, status, error, posed, retry } = usePoseCurls({
    enabled: true,
    onRep: handleRep,
  });

  const failed = status === "error";
  // A dead camera is a finished take as far as the shell is concerned: the chip
  // has to let you back out of a card that can never score you.
  useEffect(() => {
    if (failed) onDone(true);
  }, [failed, onDone]);

  const run = useCallback(() => {
    effortRef.current = 0;
    setReps(0);
    setBursts([]);
    setScolding(false);
    setTake({ status: "arming" });
    onDone(false);
    timerScale.set(1);
    if (reduceMotionRef.current) knobX.set(0);
    else void animate(knobX, 0, COMMIT_SPRING);
  }, [knobX, onDone, timerScale]);

  // The count-in waits for the camera to actually find a pair of arms. Counting
  // "3, 2, 1" at an empty room and then scoring the empty room is a bug wearing
  // a bit's clothing.
  useEffect(() => {
    if (take.status !== "arming" || status !== "tracking" || !posed) return;
    setTake({ status: "countdown", count: 3 });
  }, [take.status, status, posed]);

  useEffect(() => {
    if (take.status !== "countdown") return;
    const { count } = take;
    const timer = window.setTimeout(() => {
      if (count === 1) setTake({ status: "lifting" });
      else setTake({ status: "countdown", count: count === 3 ? 2 : 1 });
    }, COUNT_MS);
    return () => window.clearTimeout(timer);
  }, [take]);

  // The set itself: one loop, draining effort and the clock together. Both are
  // written straight to the DOM / motion values — a ten second countdown that
  // re-renders the card sixty times a second would be a strange way to spend a
  // frame budget the pose model is already using.
  useEffect(() => {
    if (take.status !== "lifting") return;

    let frame = 0;
    const startedAt = performance.now();
    let previous = startedAt;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const delta = (now - previous) / 1000;
      previous = now;

      effortRef.current = clamp(effortRef.current - DRAIN_PER_SEC * delta, 0, 100);
      knobX.set(percentToX(effortRef.current));

      const remaining = Math.max(0, SET_MS - elapsed);
      timerScale.set(remaining / SET_MS);
      if (timerRef.current) timerRef.current.textContent = (remaining / 1000).toFixed(1);

      if (remaining > 0) {
        frame = requestAnimationFrame(tick);
        return;
      }

      // Time's up. The dial has notches, not percentages, so the last thing the
      // set does is round away most of what you just earned.
      const level = nearestLevel(percentToX(effortRef.current));
      setTake((current) =>
        current.status === "lifting" ? { status: "complete", level } : current,
      );
      if (reduceMotionRef.current) knobX.set(notchX(level));
      // The drain writes knobX every frame, so the value arrives at the commit
      // carrying real velocity — a spring that inherits it hurls the knob clean
      // off the end of the track. The take is over; it starts from rest.
      else void animate(knobX, notchX(level), { ...COMMIT_SPRING, velocity: 0 });
      onDone(true);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [take.status, knobX, timerScale, onDone]);

  // Walking out mid-set is not a thing you get to do.
  const firstNonce = useRef(scoldNonce);
  useEffect(() => {
    if (scoldNonce === firstNonce.current) return;
    setScolding(true);
    if (!reduceMotionRef.current) {
      void animate(cardShake, [0, -9, 8, -6, 4, -2, 0], { duration: 0.45, ease: "easeOut" });
    }
    const timer = window.setTimeout(() => setScolding(false), 2200);
    return () => window.clearTimeout(timer);
  }, [scoldNonce, cardShake]);

  const landedLabel = take.status === "complete" ? labelAt(take.level) : null;
  const live = take.status === "lifting";

  return (
    <motion.div
      style={{ x: cardShake }}
      className="relative rounded-[28px] border border-white/10 bg-neutral-800/95 p-5 shadow-2xl shadow-black/60"
    >
      <div className="mb-4 flex h-8 items-center justify-between gap-3">
        <p className="text-[15px] font-medium text-neutral-100">Reasoning effort</p>

        <AnimatePresence mode="wait" initial={false}>
          {take.status === "complete" || failed ? (
            <motion.button
              key="again"
              type="button"
              onClick={failed ? retry : run}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.16 }}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-violet-500/60 bg-violet-500/10 px-3 py-1.5 text-[13px] text-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            >
              <RotateCcwIcon className="size-3.5 text-violet-300" />
              {failed ? "Retry camera" : "Again"}
            </motion.button>
          ) : scolding ? (
            <motion.span
              key="scold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="shrink-0 text-[13px] text-rose-400"
            >
              Finish your set.
            </motion.span>
          ) : live ? (
            <motion.span
              key="reps"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex shrink-0 items-center gap-1.5 text-[13px] tabular-nums text-neutral-400"
            >
              <DumbbellIcon className="size-3.5 text-violet-300" />
              {reps} {reps === 1 ? "rep" : "reps"}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      {/* The camera is the card's face, and it's square: a letterboxed strip of a
          webcam is a status light, but a full frame of you is a mirror. It stays on
          through the verdict — you should have to watch yourself be told you
          managed Medium. */}
      <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-neutral-900/70">
        <video
          ref={videoRef}
          muted
          playsInline
          aria-hidden
          className="size-full -scale-x-100 object-cover"
        />
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 size-full -scale-x-100 object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-neutral-950/40"
        />

        <div aria-live="polite" className="absolute inset-0">
          <AnimatePresence mode="wait" initial={false}>
            {failed ? (
              <Overlay key="error">
                <VideoOffIcon className="size-6 text-rose-400" />
                <p className="max-w-[280px] text-center text-[13px] text-neutral-300">
                  {error ?? "The camera said no."} Effort cannot be verified.
                </p>
              </Overlay>
            ) : take.status === "arming" ? (
              <Overlay key="arming">
                <p className="text-[15px] font-medium text-neutral-100">
                  {status === "tracking" ? "Show me an arm" : "Waking the camera…"}
                </p>
              </Overlay>
            ) : take.status === "countdown" ? (
              <Overlay key="countdown">
                <span className="text-[44px] leading-none font-semibold tabular-nums text-violet-300 drop-shadow-[0_2px_12px_rgba(139,92,246,0.55)]">
                  {take.count}
                </span>
                <p className="text-[15px] font-medium text-neutral-100">
                  {promptForCountdown(take.count)}
                </p>
              </Overlay>
            ) : take.status === "complete" ? (
              <Overlay key="landed">
                <motion.div
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={
                    reduceMotion
                      ? { duration: 0.1 }
                      : { type: "spring", stiffness: 320, damping: 20 }
                  }
                  className="relative flex flex-col items-center gap-1"
                >
                  {!reduceMotion && (
                    <motion.span
                      aria-hidden
                      className="absolute size-3 rounded-full bg-violet-500/60 blur-md"
                      initial={{ scale: 0.4, opacity: 0.9 }}
                      animate={{ scale: [0.4, 14, 11], opacity: [0.9, 0.35, 0.18] }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  )}
                  <p className="relative flex items-baseline gap-1.5 text-[17px] font-medium">
                    <span className="text-neutral-400">Landed on</span>
                    <span className="text-violet-300">{landedLabel}</span>
                  </p>
                  <p className="relative text-[13px] tabular-nums text-neutral-500">
                    {reps} {reps === 1 ? "curl" : "curls"} in 10 seconds
                  </p>
                </motion.div>
              </Overlay>
            ) : null}
          </AnimatePresence>
        </div>

        {/* The clock: a bar that empties, and the number it's emptying towards. */}
        <AnimatePresence>
          {live && (
            <motion.div
              key="clock"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-3 bottom-3 flex items-center gap-2.5"
            >
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                <motion.span
                  className="block h-full origin-left rounded-full bg-violet-400"
                  style={{ scaleX: timerScale }}
                />
              </span>
              <span className="text-[13px] font-medium tabular-nums text-neutral-100">
                <span ref={timerRef}>10.0</span>s
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative" style={{ width: TRACK_WIDTH, height: KNOB_SIZE }}>
        <DialTrough knobX={knobX} />

        <AnimatePresence>
          {!reduceMotion &&
            bursts.map((burst) => <Sparks key={burst.id} percent={burst.percent} />)}
        </AnimatePresence>

        {/* The knob kicks on every rep — the only thing on the card that answers
            your body faster than the drain can undo it. */}
        <motion.div
          aria-hidden
          className="absolute rounded-full bg-white shadow-lg"
          style={{
            top: 0,
            left: 0,
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            x: knobX,
            scale: knobScale,
          }}
        />
      </div>
    </motion.div>
  );
};

const Overlay = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18 }}
    className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-950/45 px-4 backdrop-blur-[2px]"
  >
    {children}
  </motion.div>
);
