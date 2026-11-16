"use client";

// Sakuga Stepper: a number stepper. Step it and the number is kicked the way it went and springs
// back, with wedges off that side and a hollow カチッ. Step fast and it stops saying so: speed lines
// and small puffs trail behind the number instead. At the limit the number stays put and the whole
// pill jolts against the wall, with wobble marks on that side.

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import {
  Spring,
  at,
  clamp,
  clock,
  hollow,
  later,
  lines,
  puff,
  rnd,
  sfx,
  ticks,
  wob,
} from "./sakuga-core";
import { FONT_BODY, FONT_DISPLAY, SakugaStyle, useFrame, useSquashy } from "./sakuga-react";

export interface SakugaStepperProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  // what PageUp and PageDown move by; ten steps unless given
  bigStep?: number;
  // sent with a form under this name
  name?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const PRESS = { low: 0.56, wide: 0.5 };
const SIDE =
  "grid h-[44px] w-[46px] flex-none cursor-pointer outline-none touch-manipulation place-items-center will-change-transform select-none aria-disabled:cursor-not-allowed aria-disabled:text-(--sk-track) disabled:cursor-not-allowed";
const GLYPH =
  "pointer-events-none h-[20px] w-[20px] fill-none stroke-current stroke-[3.4] [stroke-linecap:round]";

const places = (n: number) => `${n}`.split(".")[1]?.length ?? 0;

export const SakugaStepper = ({
  value,
  defaultValue = 1,
  onValueChange,
  min = 0,
  max = 10,
  step = 1,
  bigStep,
  name,
  label = "Quantity",
  disabled = false,
  className = "",
}: SakugaStepperProps) => {
  const [inner, setInner] = useState(() => clamp(defaultValue, min, max));
  const current = value ?? inner;
  const digits = Math.max(places(step), places(min));

  const pill = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const less = useRef<HTMLButtonElement>(null);
  const more = useRef<HTMLButtonElement>(null);
  const lessRef = useSquashy(less, PRESS);
  const moreRef = useSquashy(more, PRESS);

  const kick = useRef(new Spring(0, 440, 13));
  const tall = useRef(new Spring(1, 520, 13));
  const jolt = useRef(new Spring(0, 460, 12));
  const lean = useRef(new Spring(0, 260, 10));
  // the value as of the last step, so two steps inside one render both count
  const live = useRef(current);
  const beat = useRef({ bumped: -9, heat: 0, hold: 0, said: -9, stepped: -9 });
  const repeated = useRef(false);

  useEffect(() => {
    live.current = current;
  }, [current]);

  // the hit: the number goes the way it was stepped
  const hit = (dir: number) => {
    const p = pill.current;
    const n = num.current;
    if (!p || !n) {
      return;
    }
    const b = beat.current;
    const t = clock.now;
    b.heat = t - b.stepped < 0.3 ? Math.min(5, b.heat + 1) : 0;
    b.stepped = t;
    const { heat } = b;
    kick.current.x = -dir * (8 + heat * 1.4);
    kick.current.v = 0;
    tall.current.x = 1.26 + heat * 0.03;
    const c = at(n);
    const q = at(p);
    // the shadow hangs 7px under the pill, so what goes below clears it
    const ahead = dir > 0 ? q.y - q.h / 2 - 12 : q.y + q.h / 2 + 19;
    const behind = dir > 0 ? q.y + q.h / 2 + 17 : q.y - q.h / 2 - 10;
    ticks(c.x, ahead, {
      dir: (-dir * Math.PI) / 2,
      fan: 0.5,
      len: 15 + heat,
      life: 0.5,
      n: 3,
      r: 4,
    });
    if (heat === 0 && t - b.said > 0.9) {
      b.said = t;
      sfx("kachi", c.x + dir * 64, q.y - q.h / 2 - 34, {
        life: 0.7,
        rot: dir > 0 ? -0.08 : 0.07,
        size: 70,
        ...hollow(),
      });
    }
    if (heat > 0) {
      lines(c.x, behind, {
        dir: (dir * Math.PI) / 2,
        len: 18 + heat * 6,
        life: 0.25,
        n: 2 + Math.min(2, heat),
        spread: 13,
      });
    }
    if (heat > 1 && heat % 2 === 0) {
      const drift = rnd(-12, 12);
      puff(c.x + drift, behind + dir * 4, {
        life: 0.6,
        n: 3,
        size: 5 + heat * 0.8,
        vx: drift * 1.5,
        vy: dir * 14,
      });
    }
  };

  // the wall: nothing changes, and the pill says so
  const bump = (dir: number) => {
    const p = pill.current;
    const b = beat.current;
    if (!p || clock.now - b.bumped < 0.16) {
      return;
    }
    b.bumped = clock.now;
    b.heat = 0;
    jolt.current.x = dir * 7;
    jolt.current.v = 0;
    lean.current.x = dir * 2.4;
    const q = at(p);
    wob(q.x + dir * (q.w / 2 + 9), q.y + 3, { dir });
  };

  // returns whether the value moved
  const go = (target: number, dir: number) => {
    if (disabled) {
      return false;
    }
    const next = Number(clamp(target, min, max).toFixed(digits));
    if (next === live.current) {
      bump(dir);
      return false;
    }
    live.current = next;
    if (value === undefined) {
      setInner(next);
    }
    onValueChange?.(next);
    hit(dir);
    return true;
  };

  const nudge = (dir: number) => go(live.current + dir * step, dir);

  // held down, it repeats until it meets the wall
  const hold = (dir: number) => {
    beat.current.hold += 1;
    const n = beat.current.hold;
    repeated.current = false;
    const again = () => {
      if (n !== beat.current.hold) {
        return;
      }
      repeated.current = true;
      if (nudge(dir)) {
        later(85, again);
      }
    };
    later(420, again);
  };
  const letGo = () => {
    beat.current.hold += 1;
  };

  const tap = (dir: number) => {
    if (repeated.current) {
      repeated.current = false;
      return;
    }
    const s = dir > 0 ? moreRef.current : lessRef.current;
    if (s && !disabled) {
      s.s.x = Math.min(s.s.x, 0.8);
      s.s.v += 4;
    }
    nudge(dir);
  };

  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    const big = bigStep ?? step * 10;
    const moves = new Map([
      ["ArrowDown", { dir: -1, to: live.current - step }],
      ["ArrowUp", { dir: 1, to: live.current + step }],
      ["End", { dir: 1, to: max }],
      ["Home", { dir: -1, to: min }],
      ["PageDown", { dir: -1, to: live.current - big }],
      ["PageUp", { dir: 1, to: live.current + big }],
    ]);
    const move = moves.get(e.key);
    if (!move || e.altKey || e.ctrlKey || e.metaKey || !Number.isFinite(move.to)) {
      return;
    }
    e.preventDefault();
    go(move.to, move.dir);
  };

  useFrame((dt) => {
    lessRef.current?.step(dt);
    moreRef.current?.step(dt);
    const k = kick.current.step(dt);
    const y = tall.current.step(dt);
    const j = jolt.current.step(dt);
    const r = lean.current.step(dt);
    if (num.current) {
      const still = Math.abs(k) < 0.05 && Math.abs(y - 1) < 0.001;
      num.current.style.transform = still
        ? ""
        : `translateY(${k.toFixed(2)}px) scale(${(1 / y).toFixed(3)}, ${y.toFixed(3)})`;
    }
    if (pill.current) {
      const still = Math.abs(j) < 0.05 && Math.abs(r) < 0.02;
      pill.current.style.transform = still
        ? ""
        : `translateX(${j.toFixed(2)}px) rotate(${r.toFixed(2)}deg)`;
    }
  });

  const shown = current.toFixed(digits);
  const side = (dir: number) => ({
    "aria-disabled": (dir > 0 ? current >= max : current <= min) || undefined,
    disabled,
    onClick: () => tap(dir),
    onPointerCancel: letGo,
    onPointerDown: () => hold(dir),
    onPointerLeave: letGo,
    onPointerUp: letGo,
    tabIndex: -1,
  });

  return (
    <span
      className={`relative isolate inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) ${FONT_BODY} ${className}`}
    >
      <SakugaStyle />
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- the keys belong to the spinbutton inside; this catches them when a side button holds focus after a click */}
      <div
        ref={pill}
        data-off={disabled || undefined}
        className="flex items-center rounded-(--sk-r) bg-(--sk-card) shadow-(--sk-sh) [border:var(--sk-bw)_solid_var(--sk-ink)] will-change-transform has-[:focus-visible]:outline-[2.5px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-(--sk-acc) has-[:focus-visible]:outline-solid data-off:cursor-not-allowed data-off:opacity-50"
        onKeyDown={keys}
      >
        <button ref={less} type="button" aria-label="Decrease" className={SIDE} {...side(-1)}>
          <svg aria-hidden viewBox="0 0 20 20" className={GLYPH}>
            <path d="M4 10h12" />
          </svg>
        </button>
        <span
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a number input brings its own spinners, wheel stepping and a caret; this value is only ever stepped
          role="spinbutton"
          aria-disabled={disabled || undefined}
          aria-label={label}
          aria-valuemax={Number.isFinite(max) ? max : undefined}
          aria-valuemin={Number.isFinite(min) ? min : undefined}
          aria-valuenow={current}
          aria-valuetext={shown}
          tabIndex={disabled ? -1 : 0}
          className="grid h-[44px] min-w-[64px] place-items-center px-[10px] outline-none select-none [border-inline:2.4px_solid_var(--sk-ink)]"
        >
          <span
            ref={num}
            className={`text-[21px] leading-[1.1] font-extrabold tracking-[-0.01em] tabular-nums italic will-change-transform ${FONT_DISPLAY}`}
          >
            {shown}
          </span>
        </span>
        <button ref={more} type="button" aria-label="Increase" className={SIDE} {...side(1)}>
          <svg aria-hidden viewBox="0 0 20 20" className={GLYPH}>
            <path d="M4 10h12M10 4v12" />
          </svg>
        </button>
      </div>
      {name !== undefined && <input type="hidden" name={name} value={shown} disabled={disabled} />}
    </span>
  );
};
