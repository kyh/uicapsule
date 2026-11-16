"use client";

// Sakuga Rating: five stars that pop in one after another. The last one lit gets a fan of wedges
// and a hollow ポン; five stars gets a burst behind it as well.
// Clicking the lit star again clears it. With a name, it is sent with its form.

import { useLayoutEffect, useReducer, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";

import type { Layer } from "./sakuga-core";

import {
  Spring,
  at,
  burst,
  clamp,
  hollow,
  kira,
  later,
  puff,
  sfx,
  shards,
  ticks,
} from "./sakuga-core";
import { BACK_CANVAS, FONT_BODY, SakugaStyle, useBackLayer, useFrame } from "./sakuga-react";

export interface SakugaRatingProps {
  // 0 to 5; setting it from code lights the stars without the effects
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  // what a screen reader calls the group
  label?: string;
  // the id of an element that names the group; with it, no aria-label is set
  "aria-labelledby"?: string;
  // sent with its form (nothing when 0)
  name?: string;
  disabled?: boolean;
  className?: string;
}

const STARS = [1, 2, 3, 4, 5] as const;
const STEPS = new Map([
  ["ArrowDown", -1],
  ["ArrowLeft", -1],
  ["ArrowRight", 1],
  ["ArrowUp", 1],
]);
const score = (n: number | undefined) => clamp(Math.round(n ?? 0) || 0, 0, 5);

interface Pop {
  b: HTMLButtonElement;
  spring: Spring;
  layer: RefObject<Layer | null>;
  i: number;
  n: number;
  was: number;
  // the change this pop belongs to, and the counter of changes: a newer change drops it
  turn: number;
  turns: RefObject<number>;
}

const glint = (b: HTMLElement, x: number, y: number) => {
  if (b.isConnected) {
    kira(x, y, { r: 8 });
  }
};

const light = ({ b, spring, layer, i, n, was, turn, turns }: Pop) => {
  // the score moved on, or the control left the page, before this star's turn came
  if (turn !== turns.current || !b.isConnected) {
    return;
  }
  b.toggleAttribute("data-lit", i < n);
  if (!(i < n && i >= was)) {
    return;
  }
  spring.x = 0.35;
  const c = at(b);
  puff(c.x, c.y + 14, { life: 0.4, n: 2, size: 5 });
  if (i !== n - 1) {
    return;
  }
  ticks(c.x, c.y, {
    dir: -Math.PI / 2,
    fan: 0.698,
    len: n === 5 ? 26 : 17,
    life: 0.55,
    n: 9,
    r: 20,
  });
  if (n === 5) {
    burst(c.x, c.y, { layer: layer.current ?? undefined, life: 0.4, r: 46 });
    shards(c.x, c.y, { arc: 6.28, n: 6, size: 5 });
  }
  sfx("pon", c.x + 20, c.y - 56, { life: 0.85, rot: 0.08, size: n === 5 ? 120 : 92, ...hollow() });
  later(300, () => glint(b, c.x - 22, c.y - 30));
};

// they light one after another
const queue = (pop: Pop) => later(Math.max(0, pop.i - pop.was) * 60, () => light(pop));

export const SakugaRating = ({
  value,
  defaultValue = 0,
  onValueChange,
  label = "Rating",
  "aria-labelledby": labelledBy,
  name,
  disabled = false,
  className = "",
}: SakugaRatingProps) => {
  const [own, setOwn] = useState(() => score(defaultValue));
  const rated = value === undefined ? own : score(value);
  // what the server renders lit. It never changes, so React leaves data-lit alone afterwards
  // and the staggered lighting owns it.
  const [first] = useReducer((kept: number) => kept, rated);

  const [attachBack, backRef] = useBackLayer();
  const stars = useRef<(HTMLButtonElement | null)[]>([]);
  const springs = useRef(STARS.map(() => new Spring(1, 560, 12)));
  // what the stars show, and the score a click or key just asked for (that one gets the effects)
  const shown = useRef(0);
  const asked = useRef(-1);
  const turns = useRef(0);

  useLayoutEffect(() => {
    const quiet = asked.current !== rated;
    const was = shown.current;
    asked.current = -1;
    shown.current = rated;
    turns.current += 1;
    const turn = turns.current;
    for (const [i, b] of stars.current.entries()) {
      const spring = springs.current[i];
      if (quiet) {
        b?.toggleAttribute("data-lit", i < rated);
      } else if (b && spring) {
        queue({ b, i, layer: backRef, n: rated, spring, turn, turns, was });
      }
    }
  }, [rated, backRef]);

  useFrame((dt) => {
    for (const [i, b] of stars.current.entries()) {
      const y = springs.current[i]?.step(dt) ?? 1;
      if (b) {
        b.style.transform =
          Math.abs(y - 1) < 0.001 ? "" : `scale(${y}) rotate(${(1 - y) * -34}deg)`;
      }
    }
  });

  const rate = (n: number) => {
    asked.current = n;
    if (value === undefined) {
      setOwn(n);
    }
    onValueChange?.(n);
    // a pick the parent turned down must not lend its effects to a later change from code
    queueMicrotask(() => {
      asked.current = -1;
    });
  };

  const keydown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const d = STEPS.get(e.key);
    if (!d) {
      return;
    }
    e.preventDefault();
    const n = clamp((rated || (d > 0 ? 0 : 2)) + d, 1, 5);
    rate(n);
    stars.current[n - 1]?.focus();
  };

  return (
    <span
      className={`relative isolate inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) ${FONT_BODY} ${className}`}
    >
      <SakugaStyle />
      <canvas ref={attachBack} aria-hidden className={BACK_CANVAS} />
      <div
        role="radiogroup"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        className="flex"
      >
        {STARS.map((n, i) => (
          <button
            key={n}
            ref={(node) => {
              stars.current[i] = node;
            }}
            type="button"
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a star can be cleared by clicking it again, which a native radio cannot do
            role="radio"
            aria-checked={n === rated}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            tabIndex={(rated ? n === rated : i === 0) ? 0 : -1}
            disabled={disabled}
            data-lit={n <= first ? "" : undefined}
            className="group size-[44px] cursor-pointer p-[2px] will-change-transform focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => rate(rated === n ? 0 : n)}
            onKeyDown={keydown}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="inline size-full overflow-visible fill-(--sk-card) stroke-(--sk-ink) stroke-[2.3] align-baseline [stroke-linejoin:round] group-data-lit:fill-(--sk-pri)"
            >
              <path d="M12 2.6l2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-.9z" />
            </svg>
          </button>
        ))}
      </div>
      {name && rated > 0 && !disabled && <input type="hidden" name={name} value={rated} />}
    </span>
  );
};
