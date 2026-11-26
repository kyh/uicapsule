"use client";

import { cn } from "cn";
import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { ComponentProps, KeyboardEvent, RefObject } from "react";

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
import type { Layer } from "./sakuga-core";
import { BACK_CANVAS, FONT_BODY, SakugaStyle, useBackLayer, useFrame } from "./sakuga-react";

const noop = () => null;

type SakugaRatingProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> & {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  name?: string;
  disabled?: boolean;
};

const STEPS = new Map([
  ["ArrowDown", -1],
  ["ArrowLeft", -1],
  ["ArrowRight", 1],
  ["ArrowUp", 1],
]);

interface Pop {
  b: HTMLButtonElement;
  spring: Spring;
  layer: RefObject<Layer | null>;
  i: number;
  n: number;
  was: number;
  full: boolean;
  turn: number;
  turns: RefObject<number>;
}

const glint = (b: HTMLElement, x: number, y: number) => {
  if (b.isConnected) {
    kira(x, y, { r: 8 });
  }
};

const light = ({ b, spring, layer, i, n, was, full, turn, turns }: Pop) => {
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

  ticks(c.x, c.y, { dir: -Math.PI / 2, fan: 0.698, len: full ? 26 : 17, life: 0.55, n: 9, r: 20 });

  if (full) {
    burst(c.x, c.y, { layer: layer.current ?? undefined, life: 0.4, r: 46 });
    shards(c.x, c.y, { arc: 6.28, n: 6, size: 5 });
  }

  sfx("pon", c.x + 20, c.y - 56, { life: 0.85, rot: 0.08, size: full ? 120 : 92, ...hollow() });
  later(300, () => {
    glint(b, c.x - 22, c.y - 30);
  });
};

const queue = (pop: Pop) => {
  later(Math.max(0, pop.i - pop.was) * 60, () => {
    light(pop);
  });
};

const SakugaRating = ({
  className,
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  name,
  disabled = false,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  ...props
}: SakugaRatingProps) => {
  const score = (n: number) => clamp(Math.round(n) || 0, 0, max);
  const [own, setOwn] = useState(defaultValue);
  const rated = score(value ?? own);
  const [first] = useReducer((kept: number) => kept, rated);

  const [attachBack, backRef] = useBackLayer();
  const stars = useRef<(HTMLButtonElement | null)[]>([]);
  const springs = useRef<Spring[]>([]);
  const shown = useRef(0);
  const asked = useRef(-1);
  const turns = useRef(0);
  const field = useRef<HTMLInputElement>(null);

  const owned = value !== undefined;
  useEffect(() => {
    const form = field.current?.form;

    if (!form || owned) {
      return noop;
    }

    const reset = () => {
      setOwn(defaultValue);
    };

    form.addEventListener("reset", reset);

    return () => {
      form.removeEventListener("reset", reset);
    };
  }, [owned, defaultValue]);

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
        queue({ b, full: rated === max, i, layer: backRef, n: rated, spring, turn, turns, was });
      }
    }
  }, [rated, max, backRef]);

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
    queueMicrotask(() => {
      asked.current = -1;
    });
  };

  const keydown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const d = STEPS.get(e.key);

    if (d === undefined || d === 0) {
      return;
    }

    e.preventDefault();
    const n = clamp((rated || (d > 0 ? 0 : 2)) + d, 1, max);
    rate(n);
    stars.current[n - 1]?.focus();
  };

  return (
    <div
      role="radiogroup"
      data-slot="sakuga-rating"
      data-disabled={disabled ? "" : undefined}
      aria-label={labelledBy !== undefined && labelledBy !== "" ? undefined : (label ?? "Rating")}
      aria-labelledby={labelledBy}
      aria-disabled={disabled || undefined}
      className={cn(
        "relative isolate inline-flex align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink)",
        FONT_BODY,
        className,
      )}
      {...props}
    >
      <SakugaStyle />
      <canvas ref={attachBack} aria-hidden className={BACK_CANVAS} />
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;

        return (
          <button
            key={n}
            ref={(node) => {
              stars.current[i] = node;

              springs.current[i] ??= new Spring(1, 560, 12);
            }}
            type="button"
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a star can be cleared by clicking it again, which a native radio cannot do
            role="radio"
            data-slot="sakuga-rating-star"
            aria-checked={n === rated}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            tabIndex={(rated ? n === rated : i === 0) ? 0 : -1}
            disabled={disabled}
            data-disabled={disabled ? "" : undefined}
            data-lit={n <= first ? "" : undefined}
            className="group size-[44px] cursor-pointer p-[2px] will-change-transform focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) data-disabled:cursor-not-allowed data-disabled:opacity-50"
            onClick={() => {
              rate(rated === n ? 0 : n);
            }}
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
        );
      })}
      <input
        ref={field}
        type="hidden"
        name={name}
        value={rated}
        disabled={disabled || rated === 0}
      />
    </div>
  );
};

export { SakugaRating };
