"use client";

// Sakuga Stepper: a number stepper. Step it and the number is kicked the way it went and springs
// back, with wedges off that side and a hollow カチッ. Step fast and it stops saying so: speed lines
// and small puffs trail behind the number instead. At the limit the number stays put and the whole
// pill jolts against the wall, with wobble marks on that side. While a side is held the whole pill
// squashes toward the other end, and it repeats until it meets the wall.

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";

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
  // names the spinbutton; left out when aria-labelledby points at a visible label
  label?: string;
  // put on the spinbutton, for a <label htmlFor> or a describedby
  id?: string;
  "aria-labelledby"?: string;
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
  id,
  "aria-labelledby": labelledBy,
  disabled = false,
  className = "",
}: SakugaStepperProps) => {
  const [inner, setInner] = useState(() => clamp(defaultValue, min, max));
  const current = value ?? inner;
  const digits = Math.max(places(step), places(min));

  const pill = useRef<HTMLDivElement>(null);
  const spin = useRef<HTMLSpanElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const less = useRef<HTMLButtonElement>(null);
  const more = useRef<HTMLButtonElement>(null);
  const lessRef = useSquashy(less, PRESS);
  const moreRef = useSquashy(more, PRESS);

  const kick = useRef(new Spring(0, 440, 13));
  const tall = useRef(new Spring(1, 520, 13));
  const jolt = useRef(new Spring(0, 460, 12));
  const lean = useRef(new Spring(0, 260, 10));
  const press = useRef(new Spring(1, 520, 15));
  // what a held repeat reads: it outlives the render that started it
  const propsRef = useRef({ current, digits, disabled, max, min, onValueChange, step, value });
  // the value as of the last step, so the repeats of one hold each count
  const live = useRef(current);
  const beat = useRef({ bumped: -9, heat: 0, hold: 0, said: -9, stepped: -9 });
  // a pointer press has already stepped; the click that follows it must not step again
  const swallow = useRef(false);
  // controlled: the hit waits for the parent to show the value it was asked for
  const asked = useRef<{ dir: number; to: number } | null>(null);

  useEffect(() => {
    propsRef.current = { current, digits, disabled, max, min, onValueChange, step, value };
  });

  // a hold must not go on stepping a stepper that has gone
  useEffect(() => {
    const b = beat.current;
    return () => {
      b.hold += 1;
    };
  }, []);

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
    const o = propsRef.current;
    if (o.disabled) {
      return false;
    }
    const next = Number(clamp(target, o.min, o.max).toFixed(o.digits));
    if (next === live.current) {
      bump(dir);
      return false;
    }
    live.current = next;
    if (o.value === undefined) {
      setInner(next);
      o.onValueChange?.(next);
      hit(dir);
    } else {
      asked.current = { dir, to: next };
      o.onValueChange?.(next);
    }
    return true;
  };

  // every gesture starts from what is shown, so a parent that says no is not stepped past
  const begin = () => {
    live.current = propsRef.current.current;
    asked.current = null;
  };

  const nudge = (dir: number) => go(live.current + dir * propsRef.current.step, dir);

  const letGo = () => {
    beat.current.hold += 1;
    press.current.to = 1;
  };

  // a press steps at once; held, it repeats until it meets the wall
  const hold = (dir: number, e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || propsRef.current.disabled) {
      return;
    }
    // a mouse press should not draw the keyboard ring
    spin.current?.focus({ focusVisible: false });
    swallow.current = true;
    beat.current.hold += 1;
    const n = beat.current.hold;
    if (pill.current) {
      pill.current.style.transformOrigin = dir > 0 ? "0 50%" : "100% 50%";
    }
    press.current.to = 0.9;
    begin();
    if (!nudge(dir)) {
      return;
    }
    const again = () => {
      const o = propsRef.current;
      // controlled, and the parent has not shown the last step: it said no
      const refused = o.value !== undefined && o.current !== live.current;
      if (n === beat.current.hold && !refused && nudge(dir)) {
        later(85, again);
      }
    };
    later(420, again);
  };

  // a click with no press before it: the keyboard, or assistive technology
  const tap = (dir: number) => {
    if (swallow.current) {
      swallow.current = false;
      return;
    }
    const s = dir > 0 ? moreRef.current : lessRef.current;
    if (s && !disabled) {
      s.s.x = Math.min(s.s.x, 0.8);
      s.s.v += 4;
    }
    begin();
    nudge(dir);
  };

  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    const big = bigStep ?? step * 10;
    const moves = new Map([
      ["ArrowDown", { dir: -1, to: current - step }],
      ["ArrowUp", { dir: 1, to: current + step }],
      ["End", { dir: 1, to: max }],
      ["Home", { dir: -1, to: min }],
      ["PageDown", { dir: -1, to: current - big }],
      ["PageUp", { dir: 1, to: current + big }],
    ]);
    const move = moves.get(e.key);
    if (!move || e.altKey || e.ctrlKey || e.metaKey || !Number.isFinite(move.to)) {
      return;
    }
    e.preventDefault();
    begin();
    go(move.to, move.dir);
  };

  useFrame((dt) => {
    lessRef.current?.step(dt);
    moreRef.current?.step(dt);
    const k = kick.current.step(dt);
    const y = tall.current.step(dt);
    const j = jolt.current.step(dt);
    const r = lean.current.step(dt);
    const w = press.current.step(dt);
    if (num.current) {
      const still = Math.abs(k) < 0.05 && Math.abs(y - 1) < 0.001;
      num.current.style.transform = still
        ? ""
        : `translateY(${k.toFixed(2)}px) scale(${(1 / y).toFixed(3)}, ${y.toFixed(3)})`;
    }
    if (pill.current) {
      const still = Math.abs(j) < 0.05 && Math.abs(r) < 0.02 && Math.abs(w - 1) < 0.001;
      pill.current.style.transform = still
        ? ""
        : `translateX(${j.toFixed(2)}px) rotate(${r.toFixed(2)}deg) scale(${(1 + (1 - w) * 0.3).toFixed(3)}, ${w.toFixed(3)})`;
    }
  });

  // let go off the button: no click follows
  const leave = () => {
    swallow.current = false;
    letGo();
  };

  // controlled: the number is kicked when the parent shows the value that was asked for
  useEffect(() => {
    const want = asked.current;
    if (want && want.to === current) {
      asked.current = null;
      hit(want.dir);
    }
  });

  const shown = current.toFixed(digits);
  const side = (dir: number) => ({
    "aria-disabled": (dir > 0 ? current >= max : current <= min) || undefined,
    disabled,
    onClick: () => tap(dir),
    // focus goes to the spinbutton, which holds the keys
    onMouseDown: (e: MouseEvent<HTMLButtonElement>) => e.preventDefault(),
    onPointerCancel: leave,
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => hold(dir, e),
    onPointerLeave: leave,
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
          ref={spin}
          id={id}
          aria-disabled={disabled || undefined}
          aria-label={labelledBy ? undefined : label}
          aria-labelledby={labelledBy}
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
