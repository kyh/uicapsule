"use client";

// Sakuga Slider: a range slider with a cloud behind the thumb.
// The value rides in a bubble that leans with the drag. The thumb stretches into a teardrop and
// lags on a spring. Drag fast and a bank of cumulus rolls up behind it with speed lines and chips,
// and シュッ. Let go at speed and a crescent flies on ahead, with two puffs left behind.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import {
  Spring,
  at,
  burst,
  clamp,
  later,
  lines,
  puff,
  rnd,
  sfx,
  shards,
  slash,
  ticks,
  wob,
} from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

export interface SakugaSliderProps {
  // controlled value; leave it out and use defaultValue for an uncontrolled slider
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  // shown after the number in the bubble
  unit?: string;
  // what a screen reader calls it
  label?: string;
  // sent with its form
  name?: string;
  disabled?: boolean;
  // while it moves
  onValueChange?: (value: number) => void;
  // when it is let go
  onValueCommit?: (value: number) => void;
  className?: string;
  // e.g. { "--sk-slider-width": "320px" }
  style?: CSSProperties;
}

const BOX =
  "relative h-[46px] w-(--sk-slider-width,230px) max-w-full has-[input:focus-visible]:rounded-[8px] has-[input:focus-visible]:outline-[2.5px] has-[input:focus-visible]:outline-offset-[6px] has-[input:focus-visible]:outline-(--sk-acc)";
const TRACK =
  "absolute inset-x-0 top-[16px] h-[14px] overflow-hidden rounded-[7px] bg-(--sk-card) [border:var(--sk-bw)_solid_var(--sk-ink)]";
const BUBBLE =
  "absolute -top-[30px] -left-[9px] min-w-[46px] origin-[50%_160%] rounded-[9px] bg-(--sk-card) px-[4px] py-[3px] text-center font-[-apple-system,'Segoe_UI',system-ui,sans-serif] text-[13px] leading-[1.1] font-extrabold whitespace-nowrap will-change-transform [border:2.6px_solid_var(--sk-ink)] after:absolute after:top-full after:left-1/2 after:-ml-[5px] after:border-[5px] after:border-t-[7px] after:border-transparent after:border-t-(--sk-ink) after:content-['']";
const THUMB =
  "absolute top-[9px] left-0 size-[28px] rounded-full bg-white will-change-transform [border:var(--sk-bw)_solid_var(--sk-ink)]";
const INPUT =
  "absolute inset-x-0 -inset-y-[8px] m-0 h-[calc(100%+16px)] w-full cursor-ew-resize opacity-0 disabled:cursor-not-allowed";

// the cloud bank, the speed line and the odd chip a fast drag leaves behind the thumb
const trail = (c: { x: number; y: number }, dir: number, big: number) => {
  const px = c.x - dir * rnd(14, 30);
  const py = c.y - rnd(2, 12) - big * 8;
  const size = rnd(6, 9) + big * 9;
  const vx = -dir * rnd(26, 70);
  const vy = -rnd(22, 58) * (0.5 + big);
  const life = rnd(0.7, 1.15);
  puff(px, py, { life, n: 4, size, vx, vy });
  lines(c.x - dir * 16, c.y + rnd(-4, 12), {
    dir: dir > 0 ? Math.PI : 0,
    len: 50 + big * 50,
    life: 0.24,
    n: 1,
    spread: 2,
  });
  if (Math.random() < 0.3) {
    shards(c.x - dir * 20, c.y + 6, {
      arc: 1,
      dir: dir > 0 ? Math.PI + 0.5 : -0.5,
      n: 1,
      size: 3.5,
      speed: 120,
    });
  }
};

// where the native input says the value is, as a fraction of the track
const fracOf = (r: HTMLInputElement) => {
  const lo = Number(r.min) || 0;
  const hi = r.max === "" ? 100 : Number(r.max);
  return hi > lo ? (Number(r.value) - lo) / (hi - lo) : 0;
};

export const SakugaSlider = ({
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  unit = "%",
  label = "Slider",
  name,
  disabled = false,
  onValueChange,
  onValueCommit,
  className = "",
  style,
}: SakugaSliderProps) => {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const box = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const spring = useRef(new Spring(0, 420, 30));
  const sim = useRef({ acc: 0, peak: 0, said: 0, started: false, t: 0 });
  const commit = useRef(onValueCommit);

  // where the value sits, as a fraction of the track
  const target = max > min ? (clamp(current, min, max) - min) / (max - min) : 0;

  // the thumb chases the value on its spring, except the first time, when it starts there
  useLayoutEffect(() => {
    spring.current.to = target;
    if (!sim.current.started) {
      sim.current.started = true;
      spring.current.x = target;
    }
  }, [target]);

  useEffect(() => {
    commit.current = onValueCommit;
  });

  // React's onChange is the native input event; the native change (let go) is wired here
  useEffect(() => {
    const r = input.current;
    if (!r) {
      return;
    }
    const release = () => {
      const th = thumb.current;
      const s = sim.current;
      if (th) {
        const c = at(th);
        const dir = Math.sign(s.peak) || 1;
        if (Math.abs(s.peak) > 1.3) {
          slash(c.x + dir * 34, c.y, {
            ang: dir > 0 ? 0 : Math.PI,
            col: "#b8b3ff",
            len: 150,
            life: 0.5,
            thick: 12,
          });
          burst(c.x + dir * 4, c.y, { life: 0.28, r: 24, spikes: 11 });
          shards(c.x + dir * 10, c.y, { arc: 2.4, dir: dir > 0 ? 0 : Math.PI, n: 4, size: 4 });
          ticks(c.x + dir * 52, c.y - 30, { dir: dir > 0 ? -0.6 : -2.5, len: 10, n: 3, r: 4 });
          later(520, () => {
            puff(c.x - dir * 60, c.y - 34, { life: 0.8, n: 4, size: 11, vy: -10 });
            puff(c.x - dir * 22, c.y - 22, { life: 0.6, n: 3, size: 6, vy: -8 });
            wob(c.x - dir * 82, c.y - 34, { dir: -1, r: 9 });
          });
        }
        const f = fracOf(r);
        if (f >= 1 || f <= 0) {
          shards(c.x, c.y, { arc: 2, dir: dir > 0 ? Math.PI : 0, n: 5 });
        }
      }
      s.peak = 0;
      commit.current?.(r.valueAsNumber);
    };
    r.addEventListener("change", release);
    return () => r.removeEventListener("change", release);
  }, []);

  useFrame((dt) => {
    const b = box.current;
    const th = thumb.current;
    const val = bubble.current;
    if (!b || !th || !val) {
      return;
    }
    const s = sim.current;
    s.t += dt;
    const W = b.clientWidth - 28;
    const x = spring.current.step(dt);
    const { v } = spring.current;
    const st = 1 + Math.min(1.5, Math.abs(v) * 0.3);
    th.style.transformOrigin = v > 0 ? "100% 50%" : "0 50%";
    th.style.transform = `translateX(${x * W}px) scale(${st}, ${1 / Math.sqrt(st)})`;
    val.style.transform = `translateX(${x * W - (val.offsetWidth - 46) / 2}px) rotate(${clamp(-v * 5, -14, 14)}deg)`;
    b.style.setProperty("--v", String(clamp(x)));
    if (Math.abs(v) > Math.abs(s.peak)) {
      s.peak = v;
    } else {
      s.peak *= 0.96;
    }
    if (Math.abs(v) > 0.35) {
      // fast: a bank of cloud rolls up behind the thumb, with speed lines and chips
      s.acc += dt * Math.abs(v) * 20;
      const c = at(th);
      const dir = Math.sign(v);
      const big = Math.min(1, Math.abs(v) / 2.4);
      while (s.acc > 1) {
        s.acc -= 1;
        trail(c, dir, big);
      }
      if (Math.abs(v) > 1.5 && s.t - s.said > 1.1) {
        s.said = s.t;
        sfx("shu", c.x - dir * 6, c.y - 78, {
          col: "#5a4fd8",
          edge: "#ffffff",
          life: 0.75,
          rot: -0.16,
          size: 104,
        });
      }
    }
  });

  return (
    <span
      className={`relative isolate mt-[30px] inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) ${FONT_BODY} ${className}`}
      style={style}
    >
      <SakugaStyle />
      <div ref={box} className={`${BOX} ${disabled ? "opacity-50" : ""}`}>
        <div className={TRACK}>
          {/* a div, not the original's <i>: the host app styles a bare .block class */}
          <div className="h-full w-[calc(var(--v,0)*100%+6px)] max-w-full bg-(--sk-pri)" />
        </div>
        <span ref={bubble} aria-hidden className={BUBBLE}>
          {current}
          {unit}
        </span>
        <span ref={thumb} className={THUMB} />
        <input
          ref={input}
          type="range"
          className={INPUT}
          min={min}
          max={max}
          step={step}
          value={current}
          name={name}
          disabled={disabled}
          aria-label={label}
          onChange={(e) => {
            const next = e.currentTarget.valueAsNumber;
            setInner(next);
            onValueChange?.(next);
          }}
        />
      </div>
    </span>
  );
};
