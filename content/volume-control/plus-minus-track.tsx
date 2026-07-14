"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MinusIcon, PlusIcon } from "lucide-react";

import type { MotionValue } from "motion/react";

import { HUD_INNER_WIDTH } from "./macos-chrome";
import { clampVolume, DETENT_STEP, snapVolume, VOLUME_MAX, VOLUME_MIN } from "./volume-scale";

const FIELD_WIDTH = HUD_INNER_WIDTH;
const FIELD_HEIGHT = 150;
const COLS = 5;
const ROWS = 3;
const HOLES = COLS * ROWS;

/** What a hit is worth. Both directions cost the same — the minus is not a
 * penalty, it's just the other button, and it counts exactly as much. */
const STEP = DETENT_STEP;

/** How long a button stays up at volume 0, and at volume 100. The louder it gets,
 * the less time you have — the last twenty points are a scramble. */
const SHOW_MS_LOUD = 520;
const SHOW_MS_QUIET = 1000;
/** Pill size shrinks the same way. */
const SIZE_QUIET = 54;
const SIZE_LOUD = 38;

/** How often a minus comes up instead of a plus. Enough to keep you honest. */
const MINUS_ODDS = 0.38;

const POP = { type: "spring", stiffness: 520, damping: 26 } as const;

type Mole = { id: number; hole: number; kind: "plus" | "minus" };

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

type PlusMinusTrackProps = {
  volume: MotionValue<number>;
};

/**
 * The + and − are still there. They just won't hold still.
 *
 * They surface for a moment, somewhere in the grid, and drop back down whether or
 * not you got to them. Hit the + and you gain five; hit the − — and you will,
 * because it looks exactly as inviting — and you lose five. The louder it gets,
 * the faster they duck and the smaller they are, so the last stretch to 100 is a
 * fight you're supposed to lose at least once.
 */
export const PlusMinusTrack = ({ volume }: PlusMinusTrackProps) => {
  const reduceMotion = useReducedMotion();
  const [mole, setMole] = useState<Mole | null>(null);
  const [level, setLevel] = useState(() => Math.round(volume.get()));

  const nextId = useRef(0);
  const timer = useRef(0);
  const lastHole = useRef(-1);
  /** The loop reads the volume, and the volume changes on every hit — so it reads
   * it from a ref rather than closing over a stale render's copy. */
  const levelRef = useRef(level);
  /** A hit has to be able to summon the next pop, and it lives outside the effect
   * that defines the loop. This is the doorbell. */
  const popRef = useRef(() => {});
  /** Pops already scored, so an exiting pill can't be scored twice. */
  const whacked = useRef(new Set<number>());

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  // Reduced motion gets what it should have had all along: two buttons that stay
  // where you left them.
  useEffect(() => {
    if (reduceMotion) return;

    const pop = () => {
      // Never the same hole twice running — a pill that reappears under a resting
      // cursor is a gift, and this control does not give gifts.
      const drift = 1 + Math.floor(Math.random() * (HOLES - 1));
      const hole =
        lastHole.current < 0
          ? Math.floor(Math.random() * HOLES)
          : (lastHole.current + drift) % HOLES;
      lastHole.current = hole;

      const kind = Math.random() < MINUS_ODDS ? "minus" : "plus";
      nextId.current += 1;
      setMole({ id: nextId.current, hole, kind });

      // Louder means less time to react. The window closes as you climb.
      const loudness = clampVolume(levelRef.current) / VOLUME_MAX;
      timer.current = window.setTimeout(
        () => {
          setMole(null);
          timer.current = window.setTimeout(pop, 180);
        },
        lerp(SHOW_MS_QUIET, SHOW_MS_LOUD, loudness),
      );
    };

    popRef.current = pop;
    pop();
    return () => window.clearTimeout(timer.current);
  }, [reduceMotion]);

  const apply = (delta: number) => {
    const next = clampVolume(snapVolume(levelRef.current) + delta);
    levelRef.current = next;
    setLevel(next);
    volume.set(next);
  };

  const whack = (hit: Mole) => {
    // A pill is still on screen — and still clickable — for as long as its exit
    // animation runs. Without this, a fast enough hand scores the same pop over
    // and over on its way down the hole.
    if (whacked.current.has(hit.id)) return;
    whacked.current.add(hit.id);

    window.clearTimeout(timer.current);
    setMole(null);
    apply(hit.kind === "plus" ? STEP : -STEP);
    // The next one comes up quicker than if this had timed out. No rest.
    timer.current = window.setTimeout(() => popRef.current(), 200);
  };

  if (reduceMotion) {
    return (
      <div className="flex items-center justify-center gap-4">
        <StaticButton kind="minus" onClick={() => apply(-STEP)} />
        <span
          role="slider"
          tabIndex={0}
          aria-label="Volume"
          aria-valuemin={VOLUME_MIN}
          aria-valuemax={VOLUME_MAX}
          aria-valuenow={level}
          onKeyDown={(event) => {
            const delta = event.key === "ArrowRight" ? STEP : event.key === "ArrowLeft" ? -STEP : 0;
            if (delta === 0) return;
            event.preventDefault();
            apply(delta);
          }}
          className="text-[28px] tabular-nums text-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {level}
        </span>
        <StaticButton kind="plus" onClick={() => apply(STEP)} />
      </div>
    );
  }

  const loudness = clampVolume(level) / VOLUME_MAX;
  const size = lerp(SIZE_QUIET, SIZE_LOUD, loudness);

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Volume"
      aria-valuemin={VOLUME_MIN}
      aria-valuemax={VOLUME_MAX}
      aria-valuenow={level}
      onKeyDown={(event) => {
        const delta = event.key === "ArrowRight" ? STEP : event.key === "ArrowLeft" ? -STEP : 0;
        if (delta === 0) return;
        // The keyboard is the cheat code: the buttons stop running from you.
        event.preventDefault();
        apply(delta);
      }}
      style={{ width: FIELD_WIDTH, height: FIELD_HEIGHT }}
      className="relative grid rounded-2xl bg-neutral-950/80 p-2 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <div
        className="grid size-full"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: HOLES }, (_, hole) => (
          <div key={hole} className="relative flex items-center justify-center">
            <span aria-hidden className="size-2 rounded-full bg-white/[0.06]" />

            <AnimatePresence>
              {mole?.hole === hole && (
                <motion.button
                  key={mole.id}
                  type="button"
                  aria-label={mole.kind === "plus" ? "Louder" : "Quieter"}
                  onPointerDown={() => whack(mole)}
                  initial={{ opacity: 0, scale: 0.4, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 8 }}
                  transition={POP}
                  style={{ width: size, height: size }}
                  className={`absolute flex cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                    mole.kind === "plus"
                      ? "bg-emerald-400/90 shadow-[0_0_18px_rgba(52,211,153,0.45)]"
                      : "bg-rose-400/90 shadow-[0_0_18px_rgba(251,113,133,0.45)]"
                  }`}
                >
                  {mole.kind === "plus" ? (
                    <PlusIcon className="size-5 text-neutral-950" />
                  ) : (
                    <MinusIcon className="size-5 text-neutral-950" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const StaticButton = ({ kind, onClick }: { kind: "plus" | "minus"; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={kind === "plus" ? "Louder" : "Quieter"}
    className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-neutral-800 text-neutral-100 outline-none hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-white/70"
  >
    {kind === "plus" ? <PlusIcon className="size-5" /> : <MinusIcon className="size-5" />}
  </button>
);
