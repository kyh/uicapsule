"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import { DumbbellIcon, RotateCcwIcon, VideoOffIcon } from "lucide-react";

import type { MotionValue } from "motion/react";

import type { EffortTheme } from "./effort-theme";

import { CurlFanfare, fanfarePower, FANFARE_MS } from "./curl-fanfare";
import { DialTrough, knobBoxStyle, KnobSkin, Sparks } from "./effort-dial";
import { clamp, KNOB_SIZE, percentToX, TRACK_WIDTH } from "./effort-scale";
import { EFFORT_THEMES, labelAt, nearestLevel, notchX } from "./effort-theme";
import { usePoseCurls } from "./use-pose-curls";

import type { PoseStatus } from "./use-pose-curls";

/** The whole take, in milliseconds. Long enough to hurt, short enough to redo. */
const SET_MS = 10_000;
const COUNT_MS = 900;
/** Effort a completed curl buys you, in percent. One arm is watched, so this is
 * the whole of your income. Just over a full notch, so every rep visibly moves
 * the verdict — and the ladder it sets against the drain below: five curls in
 * the set is Medium-ish, eight is Ultra. */
const CURL_GAIN = 27;
/** Effort the machine takes back every second, whatever you're doing. Against the
 * gain above, holding a level costs a curl every 2.7 seconds — anything less and
 * the dial walks backwards while you watch it. */
const DRAIN_PER_SEC = 10;

const COMMIT_SPRING = { damping: 18, stiffness: 180, type: "spring" } as const;
const KNOB_PUMP = { damping: 18, stiffness: 700, type: "spring" } as const;
/** Looser than the per-rep pump and thrown from much further out: the landing
 * kick is the one the whole take has been building to. */
const KNOB_SLAM = { damping: 11, stiffness: 420, type: "spring" } as const;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
/** Power below which the verdict keeps its halo and drops the rest of its
 * ceremony. Four curls is a result, not an occasion. */
const SUNBURST_FLOOR = 0.45;

type CountdownCount = 3 | 2 | 1;
interface Burst {
  id: number;
  percent: number;
}

type TakeState =
  | { status: "arming" }
  | { status: "countdown"; count: CountdownCount }
  | { status: "lifting" }
  | { status: "complete"; level: number };

const COUNTDOWN_PROMPTS: Record<CountdownCount, string> = {
  1: "Curl!",
  2: "Arm down",
  3: "Get in frame",
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

interface VerdictProps {
  label: string;
  power: number;
  reduceMotion: boolean;
  reps: number;
}

const Verdict = ({ label, power, reduceMotion, reps }: VerdictProps) => (
  <motion.div
    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={reduceMotion ? { duration: 0.1 } : { damping: 20, stiffness: 320, type: "spring" }}
    className="relative flex flex-col items-center gap-1.5"
  >
    {!reduceMotion && (
      <>
        {/* A halo that blows open and then stays, dimmed — the
            verdict keeps a light on it for as long as it's up. */}
        <motion.span
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(167,139,250,0.75) 0%, rgba(139,92,246,0.4) 34%, rgba(109,40,217,0.16) 56%, transparent 72%)",
            height: lerp(140, 256, power),
            width: lerp(140, 256, power),
          }}
          initial={{ opacity: 0, scale: 0.25 }}
          animate={{
            opacity: [0, lerp(0.45, 1, power), lerp(0.3, 0.65, power)],
            scale: [0.25, 1.15, 1],
          }}
          transition={{ duration: 0.85, ease: "easeOut", times: [0, 0.35, 1] }}
        />
        {/* A sunburst, turning slowly. It's a repeating conic
            gradient masked back to a disc — twelve wedges of light
            behind the word, which is the cheapest way to make a
            static label look like it's radiating. Reserved for the
            top half of the track: a Light take gets the halo and
            nothing to stand in front of. */}
        {power >= SUNBURST_FLOOR && (
          <motion.span
            aria-hidden
            className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
            style={{
              backgroundImage:
                "repeating-conic-gradient(rgba(196,181,253,0.34) 0deg 8deg, transparent 8deg 30deg)",
              maskImage: "radial-gradient(circle, #000 0%, rgba(0,0,0,0.55) 42%, transparent 70%)",
            }}
            initial={{ opacity: 0, rotate: -14, scale: 0.4 }}
            animate={{ opacity: [0, power, power * 0.4], rotate: 12, scale: 1 }}
            transition={{ duration: 2.4, ease: "easeOut", times: [0, 0.14, 1] }}
          />
        )}
        {[0, 0.13].slice(0, power >= SUNBURST_FLOOR ? 2 : 1).map((delay) => (
          <motion.span
            key={delay}
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-200/70 shadow-[0_0_24px_rgba(167,139,250,0.6)]"
            initial={{ height: 40, opacity: 0, width: 40 }}
            animate={{
              height: lerp(150, 300, power),
              opacity: [0, lerp(0.5, 0.85, power), 0],
              width: lerp(150, 300, power),
            }}
            transition={{
              delay,
              duration: 1,
              ease: [0.16, 1, 0.3, 1],
              times: [0, 0.12, 1],
            }}
          />
        ))}
      </>
    )}
    <p className="relative flex flex-col items-center gap-0.5">
      <span className="text-[13px] tracking-wide text-neutral-400 uppercase">Landed on</span>
      {/* The word itself gets the pop, a beat behind the card's:
          the fireworks announce it, then it arrives. */}
      <motion.span
        initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          damping: 13,
          delay: reduceMotion ? 0 : 0.08,
          stiffness: 520,
          type: "spring",
        }}
        // White, not violet: the sunburst behind it is violet and
        // bright, and the word has to stay the lightest thing on
        // the card or the ceremony swallows the verdict. It grows
        // with the take as well — Ultra should be a headline and
        // Light shouldn't be.
        style={{
          filter: `drop-shadow(0 0 ${lerp(12, 26, power)}px rgba(139,92,246,0.95))`,
          fontSize: lerp(20, 30, power),
        }}
        className="leading-none font-semibold text-white"
      >
        {label}
      </motion.span>
    </p>
    <p className="relative text-[13px] tabular-nums text-neutral-400">
      {reps} {reps === 1 ? "curl" : "curls"} in 10 seconds
    </p>
  </motion.div>
);

interface CameraOverlaysProps {
  error: string | null;
  failed: boolean;
  power: number;
  reduceMotion: boolean;
  reps: number;
  status: PoseStatus;
  take: TakeState;
  theme: EffortTheme;
}

const CameraOverlays = ({
  error,
  failed,
  power,
  reduceMotion,
  reps,
  status,
  take,
  theme,
}: CameraOverlaysProps) => (
  <AnimatePresence mode="wait" initial={false}>
    {failed && (
      <Overlay key="error">
        <VideoOffIcon className="size-6 text-rose-400" />
        <p className="max-w-[280px] text-center text-[13px] text-neutral-300">
          {error ?? "The camera said no."} Effort cannot be verified.
        </p>
      </Overlay>
    )}
    {!failed && take.status === "arming" && (
      <Overlay key="arming">
        <p className="text-[15px] font-medium text-neutral-100">
          {status === "tracking" ? "Show me an arm" : "Waking the camera…"}
        </p>
      </Overlay>
    )}
    {!failed && take.status === "countdown" && (
      <Overlay key="countdown">
        <span className="text-[44px] leading-none font-semibold tabular-nums text-violet-300 drop-shadow-[0_2px_12px_rgba(139,92,246,0.55)]">
          {take.count}
        </span>
        <p className="text-[15px] font-medium text-neutral-100">{COUNTDOWN_PROMPTS[take.count]}</p>
      </Overlay>
    )}
    {!failed && take.status === "complete" && (
      <Overlay key="landed">
        <Verdict
          label={labelAt(theme, take.level)}
          power={power}
          reduceMotion={reduceMotion}
          reps={reps}
        />
      </Overlay>
    )}
  </AnimatePresence>
);

interface CurlCardProps {
  knobX: MotionValue<number>;
  theme: EffortTheme;
}

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
export const CurlCard = ({ knobX, theme }: CurlCardProps) => {
  const [take, setTake] = useState<TakeState>({ status: "arming" });
  const [reps, setReps] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  /** The landing fireworks, mounted for exactly as long as they burn. */
  const [celebrating, setCelebrating] = useState(false);
  const reduceMotion = Boolean(useReducedMotion());

  const cardPop = useMotionValue(1);
  const knobScale = useMotionValue(1);
  const timerScale = useMotionValue(1);
  const timerRef = useRef<HTMLSpanElement>(null);
  const effortRef = useRef(0);
  const burstId = useRef(0);
  /** The rep handler is called from the detection loop, which knows nothing about
   * React's render cycle — it reads the phase through a ref. */
  const phaseRef = useRef<TakeState["status"]>("arming");
  const reduceMotionRef = useRef(reduceMotion);

  useEffect(() => {
    phaseRef.current = take.status;
  }, [take.status]);
  useEffect(() => {
    reduceMotionRef.current = reduceMotion;
  }, [reduceMotion]);

  const handleRep = useCallback(() => {
    if (phaseRef.current !== "lifting") {
      return;
    }
    effortRef.current = clamp(effortRef.current + CURL_GAIN, 0, 100);
    knobX.set(percentToX(effortRef.current));
    setReps((count) => count + 1);

    if (reduceMotionRef.current) {
      return;
    }
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

  const run = useCallback(() => {
    effortRef.current = 0;
    setReps(0);
    setBursts([]);
    setCelebrating(false);
    setTake({ status: "arming" });
    timerScale.set(1);
    cardPop.set(1);
    knobScale.set(1);
    if (reduceMotionRef.current) {
      knobX.set(0);
    } else {
      void animate(knobX, 0, COMMIT_SPRING);
    }
  }, [knobX, timerScale, cardPop, knobScale]);

  // The fireworks tear themselves down. Nothing in `CurlFanfare` loops, so the
  // only reason to keep three dozen animated spans mounted past their last
  // frame would be forgetting to unmount them.
  useEffect(() => {
    if (!celebrating) {
      return;
    }
    const timer = window.setTimeout(() => setCelebrating(false), FANFARE_MS);
    return () => window.clearTimeout(timer);
  }, [celebrating]);

  // Start the count-in only after the camera detects an arm.
  if (take.status === "arming" && status === "tracking" && posed) {
    setTake({ count: 3, status: "countdown" });
  }

  useEffect(() => {
    if (take.status !== "countdown") {
      return;
    }
    const { count } = take;
    const timer = window.setTimeout(() => {
      if (count === 1) {
        setTake({ status: "lifting" });
      } else {
        setTake({ count: count === 3 ? 2 : 1, status: "countdown" });
      }
    }, COUNT_MS);
    return () => window.clearTimeout(timer);
  }, [take]);

  // The set itself: one loop, draining effort and the clock together. Both are
  // written straight to the DOM / motion values — a ten second countdown that
  // re-renders the card sixty times a second would be a strange way to spend a
  // frame budget the pose model is already using.
  useEffect(() => {
    if (take.status !== "lifting") {
      return;
    }

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
      if (timerRef.current) {
        timerRef.current.textContent = (remaining / 1000).toFixed(1);
      }

      if (remaining > 0) {
        frame = requestAnimationFrame(tick);
        return;
      }

      // Time's up. The dial has notches, not percentages, so the last thing the
      // set does is round away most of what you just earned.
      const level = nearestLevel(theme, percentToX(effortRef.current));
      setTake((current) =>
        current.status === "lifting" ? { level, status: "complete" } : current,
      );
      if (reduceMotionRef.current) {
        knobX.set(notchX(theme, level));
      } else {
        // The drain writes knobX every frame, so the value arrives at the commit
        // carrying real velocity — a spring that inherits it hurls the knob clean
        // off the end of the track. The take is over; it starts from rest.
        void animate(knobX, notchX(theme, level), { ...COMMIT_SPRING, velocity: 0 });
        // The knob doesn't just arrive at the notch, it lands on it: a slam the
        // card feels, with the fireworks going off from the point of impact.
        // `velocity: 0` for the same reason the commit above needs it, and then
        // some: a `set()` one tick before an `animate()` reads as a jump of 0.55
        // in a single frame, so the spring inherits a velocity of ~33/s. Left to
        // pick that up, this one underdamped spring blew the knob to 36× its own
        // size — a white disc wider than the card, for about a fifth of a second.
        //
        // How hard it lands is the take's own doing: at the bottom of the track
        // this is a nudge and the card barely moves, at the top it's a slam.
        const power = fanfarePower(theme, level);
        knobScale.set(lerp(1.16, 1.55, power));
        void animate(knobScale, 1, { ...KNOB_SLAM, velocity: 0 });
        void animate(cardPop, [1, lerp(1.008, 1.035, power), 0.997, 1], {
          duration: 0.6,
          ease: "easeOut",
        });
        setCelebrating(true);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [take.status, knobX, knobScale, cardPop, timerScale, theme]);

  // How much of the ceremony the take earned, 0 at the bottom notch and 1 at the
  // top. Everything the card itself does for the landing is scaled by it, the
  // same way `CurlFanfare` scales the fireworks.
  const power = take.status === "complete" ? fanfarePower(theme, take.level) : 0;
  const live = take.status === "lifting";

  return (
    <motion.div style={{ scale: cardPop }} className={`relative p-5 ${EFFORT_THEMES[theme].card}`}>
      <div className="mb-4 flex h-8 items-center justify-between gap-3">
        <p className="text-[15px] font-medium text-neutral-100">Reasoning effort</p>

        <AnimatePresence mode="wait" initial={false}>
          {(take.status === "complete" || failed) && (
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
          )}
          {live && !failed && (
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
          )}
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
          <CameraOverlays
            error={error}
            failed={failed}
            power={power}
            reduceMotion={reduceMotion}
            reps={reps}
            status={status}
            take={take}
            theme={theme}
          />
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

        {/* Flashbulb. The camera has been pointed at you for ten seconds; when
            the clock stops, it takes the photo. */}
        {celebrating && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-violet-50 mix-blend-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, lerp(0.1, 0.42, power), 0] }}
            transition={{ duration: 0.55, ease: "easeOut", times: [0, 0.07, 1] }}
          />
        )}
      </div>

      <div className="relative" style={{ height: KNOB_SIZE, width: TRACK_WIDTH }}>
        <DialTrough knobX={knobX} theme={theme} />

        <AnimatePresence>
          {!reduceMotion &&
            bursts.map((burst) => <Sparks key={burst.id} percent={burst.percent} />)}
        </AnimatePresence>

        {/* The knob kicks on every rep — the only thing on the card that answers
            your body faster than the drain can undo it. */}
        <motion.div
          aria-hidden
          className="absolute"
          style={{ ...knobBoxStyle(theme), scale: knobScale, x: knobX }}
        >
          <KnobSkin theme={theme} />
        </motion.div>
      </div>

      {/* Last child, and deliberately: the fanfare is lit from in front of the
          card, so it goes over the camera, the verdict and the dial alike. Every
          layer of it blends screen, which brightens what's underneath instead of
          hiding it — the word you earned stays legible through the fireworks. */}
      {celebrating && take.status === "complete" && (
        <CurlFanfare level={take.level} theme={theme} />
      )}
    </motion.div>
  );
};
