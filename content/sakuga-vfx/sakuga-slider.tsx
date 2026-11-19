"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";

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
import type { Styled } from "./sakuga-react";

type SakugaSliderProps = Styled<SliderPrimitive.Root.Props<number>> & {
  unit?: string;
};

const NATIVE_THUMB = 16;

const ROOT =
  "group/sakuga-slider relative isolate mt-[30px] inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink)";

const BOX =
  "relative h-[46px] w-(--sk-slider-width,230px) max-w-full group-data-disabled/sakuga-slider:opacity-50 has-[input:focus-visible]:rounded-[8px] has-[input:focus-visible]:outline-[2.5px] has-[input:focus-visible]:outline-offset-[6px] has-[input:focus-visible]:outline-(--sk-acc)";

const TRACK =
  "absolute inset-x-0 top-[16px] h-[14px] overflow-hidden rounded-[7px] border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card)";

const BUBBLE =
  "absolute -top-[30px] -left-[9px] min-w-[46px] origin-[50%_160%] rounded-[9px] border-[2.6px] border-(--sk-ink) bg-(--sk-card) px-[4px] py-[3px] text-center [font-family:-apple-system,'Segoe_UI',system-ui,sans-serif] text-[13px] leading-[1.1] font-extrabold whitespace-nowrap will-change-transform after:absolute after:top-full after:left-1/2 after:-ml-[5px] after:border-[5px] after:border-t-[7px] after:border-transparent after:border-t-(--sk-ink) after:content-['']";

const CONTROL =
  "absolute inset-x-0 -inset-y-[8px] cursor-ew-resize touch-none px-[8px] data-disabled:cursor-not-allowed";

const THUMB =
  "pointer-events-none size-[28px] rounded-full border-[length:var(--sk-bw)] border-(--sk-ink) bg-white will-change-transform";

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

interface Chase {
  frac: number;
  started: boolean;
  value: number;
}

const SliderChase = ({
  value,
  frac,
  springRef,
  chaseRef,
}: {
  value: number;
  frac: number;
  springRef: RefObject<Spring>;
  chaseRef: RefObject<Chase>;
}) => {
  useLayoutEffect(() => {
    const chase = chaseRef.current;
    chase.value = value;
    chase.frac = frac;
    springRef.current.to = frac;

    if (!chase.started) {
      chase.started = true;
      springRef.current.x = frac;
    }
  }, [value, frac, springRef, chaseRef]);

  return null;
};

const SakugaSlider = ({
  className,
  unit = "%",
  min = 0,
  max = 100,
  value,
  defaultValue = 50,
  onValueChange,
  onValueCommitted,
  "aria-label": ariaLabel,
  ...props
}: SakugaSliderProps) => {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const box = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLOutputElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const spring = useRef(new Spring(0, 420, 30));
  const sim = useRef({ acc: 0, peak: 0, said: 0, t: 0 });
  const chase = useRef<Chase>({ frac: 0, started: false, value: min });
  const press = useRef({ from: Number.NaN, onThumb: false });
  const fracOf = (v: number) => (max > min ? (clamp(v, min, max) - min) / (max - min) : 0);

  useEffect(() => {
    if (value !== undefined) {
      return;
    }

    const restore = (e: Event) => {
      if (
        e.target === input.current?.form &&
        chase.current.value !== clamp(defaultValue, min, max)
      ) {
        chase.current.started = false;
        spring.current.v = 0;
        sim.current.peak = 0;
        setInner(defaultValue);
      }
    };

    document.addEventListener("reset", restore);

    return () => document.removeEventListener("reset", restore);
  }, [value, defaultValue, min, max]);

  const pressDown = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const left = r.left + chase.current.frac * (r.width - NATIVE_THUMB);
    const top = r.top + (r.height - NATIVE_THUMB) / 2;
    press.current = {
      from: chase.current.value,
      onThumb:
        e.clientX > left - 1 &&
        e.clientX < left + NATIVE_THUMB &&
        e.clientY >= top &&
        e.clientY < top + NATIVE_THUMB,
    };
  };

  const release = (next: number) => {
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

      const f = fracOf(next);

      if (f >= 1 || f <= 0) {
        shards(c.x, c.y, { arc: 2, dir: dir > 0 ? Math.PI : 0, n: 5 });
      }
    }

    s.peak = 0;
  };

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
    <SliderPrimitive.Root<number>
      data-slot="sakuga-slider"
      className={cn(ROOT, FONT_BODY, className)}
      min={min}
      max={max}
      value={current}
      onValueChange={(next, details) => {
        if (details.reason === "track-press" && press.current.onThumb) {
          details.cancel();

          return;
        }

        onValueChange?.(next, details);

        if (!details.isCanceled && value === undefined) {
          setInner(next);
          chase.current.value = next;
          chase.current.frac = fracOf(next);
          spring.current.to = chase.current.frac;
        }
      }}
      onValueCommitted={(next, details) => {
        onValueCommitted?.(next, details);
        const byPointer = details.reason === "drag" || details.reason === "track-press";

        if (!(byPointer && next === press.current.from)) {
          release(next);
        }
      }}
      {...props}
    >
      <SakugaStyle />
      <div ref={box} data-slot="sakuga-slider-box" className={BOX}>
        <SliderPrimitive.Track data-slot="sakuga-slider-track" className={TRACK}>
          <SliderPrimitive.Indicator
            data-slot="sakuga-slider-indicator"
            className="max-w-full bg-(--sk-pri)"
            style={{ height: "100%", width: "calc(var(--v, 0) * 100% + 6px)" }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Value
          ref={bubble}
          aria-hidden
          data-slot="sakuga-slider-value"
          className={BUBBLE}
        >
          {(_, values) => {
            const shown = values[0] ?? min;

            return (
              <>
                <SliderChase
                  value={shown}
                  frac={fracOf(shown)}
                  springRef={spring}
                  chaseRef={chase}
                />
                {`${shown}${unit}`}
              </>
            );
          }}
        </SliderPrimitive.Value>
        <SliderPrimitive.Thumb
          ref={thumb}
          data-slot="sakuga-slider-thumb"
          inputRef={input}
          aria-label={ariaLabel}
          getAriaValueText={(formatted) => `${formatted}${unit}`}
          className={THUMB}
          style={{ insetInlineStart: 0, top: 9, translate: "none" }}
        />
        <SliderPrimitive.Control
          data-slot="sakuga-slider-control"
          className={CONTROL}
          onPointerDownCapture={pressDown}
        />
      </div>
    </SliderPrimitive.Root>
  );
};

export { SakugaSlider };
