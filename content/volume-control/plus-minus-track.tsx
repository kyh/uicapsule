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

const STEP = DETENT_STEP;

const SHOW_MS_LOUD = 520;
const SHOW_MS_QUIET = 1000;
const SIZE_QUIET = 54;
const SIZE_LOUD = 38;

const MINUS_ODDS = 0.38;

const POP = { damping: 26, stiffness: 520, type: "spring" } as const;

interface Mole {
  id: number;
  hole: number;
  kind: "plus" | "minus";
}

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

const keyDelta = (key: string) => {
  if (key === "ArrowRight") {
    return STEP;
  }

  if (key === "ArrowLeft") {
    return -STEP;
  }

  return 0;
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

interface PlusMinusTrackProps {
  volume: MotionValue<number>;
}

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
  const levelRef = useRef(level);

  const popRef = useRef<(() => void) | null>(null);

  const whacked = useRef(new Set<number>());

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const pop = () => {
      const drift = 1 + Math.floor(Math.random() * (HOLES - 1));

      const hole =
        lastHole.current < 0
          ? Math.floor(Math.random() * HOLES)
          : (lastHole.current + drift) % HOLES;

      lastHole.current = hole;

      const kind = Math.random() < MINUS_ODDS ? "minus" : "plus";
      nextId.current += 1;
      setMole({ hole, id: nextId.current, kind });

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
    if (whacked.current.has(hit.id)) {
      return;
    }

    whacked.current.add(hit.id);

    window.clearTimeout(timer.current);
    setMole(null);
    apply(hit.kind === "plus" ? STEP : -STEP);
    timer.current = window.setTimeout(() => popRef.current?.(), 200);
  };

  if (reduceMotion) {
    return (
      <div className="flex items-center justify-center gap-4">
        <StaticButton kind="minus" onClick={() => apply(-STEP)} />
        <span
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a range input would be the honest slider this piece refuses to be; the keyboard contract is the same
          role="slider"
          tabIndex={0}
          aria-label="Volume"
          aria-valuemin={VOLUME_MIN}
          aria-valuemax={VOLUME_MAX}
          aria-valuenow={level}
          onKeyDown={(event) => {
            const delta = keyDelta(event.key);

            if (delta === 0) {
              return;
            }

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
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the whack-a-mole field is the slider; a range input can't host the buttons
      role="slider"
      tabIndex={0}
      aria-label="Volume"
      aria-valuemin={VOLUME_MIN}
      aria-valuemax={VOLUME_MAX}
      aria-valuenow={level}
      onKeyDown={(event) => {
        const delta = keyDelta(event.key);

        if (delta === 0) {
          return;
        }

        event.preventDefault();
        apply(delta);
      }}
      style={{ height: FIELD_HEIGHT, width: FIELD_WIDTH }}
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
                  style={{ height: size, width: size }}
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
