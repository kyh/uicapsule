"use client";

// Sakuga Checkbox: tick it and two crescents swing round the box, crystals fly, the tick draws
// itself, and ズザッ lands in dotted letters. Untick it and it goes out in a small puff.
// Base UI's Checkbox owns the state, the form input and the ARIA; wrap it in a <label> to label it.
// Setting `checked` from code plays no effects; only a person ticking it does.

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "cn";
import { useLayoutEffect, useRef } from "react";

import { Spring, at, dotted, kira, later, lines, puff, sfx, shards, slash } from "./sakuga-core";
import { SakugaStyle, useFrame } from "./sakuga-react";

type SakugaCheckboxProps = Omit<CheckboxPrimitive.Root.Props, "className"> & {
  className?: string;
};

const ROOT =
  "grid h-[38px] w-[38px] flex-none cursor-pointer place-items-center rounded-[9px] bg-(--sk-card) shadow-(--sk-sh) will-change-transform [--sk-dash:30] [-webkit-tap-highlight-color:transparent] [border:var(--sk-bw)_solid_var(--sk-ink)] focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) focus-visible:outline-solid data-checked:[--sk-dash:0] data-disabled:cursor-not-allowed data-disabled:opacity-50";
const TICK =
  "h-[26px] w-[26px] fill-none stroke-(--sk-tick) stroke-[4.6] [stroke-dasharray:30] [stroke-dashoffset:var(--sk-dash)] [stroke-linecap:round] [stroke-linejoin:round] [transition:stroke-dashoffset_.24s_cubic-bezier(.2,.9,.3,1)_.08s]";

// the reaction to a person ticking or unticking it
const land = (box: HTMLElement | null, s: Spring, checked: boolean) => {
  if (!box) {
    return;
  }
  s.x = 0.68;
  const c = at(box);
  if (checked) {
    slash(c.x + 8, c.y + 2, { ang: -0.42, len: 150, life: 0.5, thick: 13 });
    slash(c.x - 6, c.y + 12, { ang: 2.72, len: 110, life: 0.55, thick: 7 });
    lines(c.x - 34, c.y + 26, { dir: 2.75, len: 60, n: 6, spread: 14 });
    shards(c.x, c.y, { arc: 6.28, grav: 260, n: 6, size: 6, speed: 190 });
    later(380, () => kira(c.x + 24, c.y - 22, { r: 9 }));
    sfx("zuza", c.x + 30, c.y - 62, { rot: -0.12, size: 112, ...dotted() });
  } else {
    puff(c.x, c.y, { life: 0.4, n: 3, size: 7 });
  }
};

// the box a tick sits in
const boxOf = (tick: SVGSVGElement | null) =>
  tick?.closest<HTMLElement>('[role="checkbox"]') ?? null;

const SakugaCheckbox = ({ className, checked, onCheckedChange, ...props }: SakugaCheckboxProps) => {
  const tick = useRef<SVGSVGElement>(null);
  const s = useRef(new Spring(1, 600, 13));
  // what a person just asked an owned box for: it reacts once the owner agrees
  const hand = useRef<boolean | null>(null);

  // Base UI only calls this for a person's tick
  const change = (next: boolean, details: CheckboxPrimitive.Root.ChangeEventDetails) => {
    onCheckedChange?.(next, details);
    if (details.isCanceled) {
      return;
    }
    if (checked === undefined) {
      land(boxOf(tick.current), s.current, next);
    } else {
      hand.current = next;
      // a refused tick changes nothing, so no render would clear the mark
      later(0, () => {
        hand.current = null;
      });
    }
  };

  useLayoutEffect(() => {
    if (checked !== undefined && hand.current === checked) {
      land(boxOf(tick.current), s.current, checked);
    }
    hand.current = null;
  }, [checked]);

  useFrame((dt) => {
    const y = s.current.step(dt);
    const el = boxOf(tick.current);
    if (el) {
      el.style.transform = Math.abs(y - 1) < 0.001 ? "" : `scale(${y}) rotate(${(1 - y) * 20}deg)`;
    }
  });

  return (
    <>
      <SakugaStyle />
      <CheckboxPrimitive.Root
        data-slot="sakuga-checkbox"
        className={cn(ROOT, className)}
        checked={checked}
        onCheckedChange={change}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          data-slot="sakuga-checkbox-indicator"
          keepMounted
          className="[display:contents]"
        >
          <svg ref={tick} viewBox="0 0 20 20" aria-hidden className={TICK}>
            <path d="M3.5 10.5l4.5 4.5 8.5-10" />
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </>
  );
};

export { SakugaCheckbox };
