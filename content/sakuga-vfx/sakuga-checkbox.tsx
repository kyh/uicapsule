"use client";

// Sakuga Checkbox: tick it and two crescents swing round the box, crystals fly, the tick draws
// itself, and ズザッ lands in dotted letters. Untick it and it goes out in a small puff.
// Underneath is a real checkbox: the children are its label, and with a name it is sent with its form.
// Setting `checked` from code plays no effects; only a person ticking it does.

import { useLayoutEffect, useRef } from "react";
import type { ChangeEvent, ComponentProps, ReactNode } from "react";

import { Spring, at, dotted, kira, later, lines, puff, sfx, shards, slash } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

type SakugaCheckboxProps = Omit<ComponentProps<"input">, "type" | "children"> & {
  // the label; clicking it ticks the box
  children?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
};

const HOST = `relative isolate inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) [-webkit-tap-highlight-color:transparent] ${FONT_BODY}`;
const LABEL =
  "flex cursor-pointer items-center gap-[12px] select-none has-disabled:cursor-not-allowed has-disabled:opacity-50";
const INPUT = "peer absolute m-0 h-px w-px opacity-0";
const BOX =
  "grid h-[38px] w-[38px] flex-none place-items-center rounded-[9px] bg-(--sk-card) shadow-(--sk-sh) will-change-transform [--sk-dash:30] [border:var(--sk-bw)_solid_var(--sk-ink)] peer-checked:[--sk-dash:0] peer-focus-visible:outline-[2.5px] peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-(--sk-acc) peer-focus-visible:outline-solid";
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

export const SakugaCheckbox = ({
  children,
  className = "",
  checked,
  onChange,
  onCheckedChange,
  ...rest
}: SakugaCheckboxProps) => {
  const box = useRef<HTMLSpanElement>(null);
  const s = useRef(new Spring(1, 600, 13));
  // what a person just asked an owned box for: it reacts once the owner agrees
  const hand = useRef<boolean | null>(null);

  const change = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.currentTarget.checked;
    if (checked === undefined) {
      land(box.current, s.current, next);
    } else {
      hand.current = next;
      // a refused tick changes nothing, so no render would clear the mark
      later(0, () => {
        hand.current = null;
      });
    }
    onChange?.(e);
    onCheckedChange?.(next);
  };

  useLayoutEffect(() => {
    if (checked !== undefined && hand.current === checked) {
      land(box.current, s.current, checked);
    }
    hand.current = null;
  }, [checked]);

  useFrame((dt) => {
    const y = s.current.step(dt);
    if (box.current) {
      box.current.style.transform =
        Math.abs(y - 1) < 0.001 ? "" : `scale(${y}) rotate(${(1 - y) * 20}deg)`;
    }
  });

  return (
    <span className={`${HOST} ${className}`}>
      <SakugaStyle />
      <label className={LABEL}>
        <input {...rest} type="checkbox" checked={checked} className={INPUT} onChange={change} />
        <span ref={box} className={BOX}>
          <svg viewBox="0 0 20 20" aria-hidden className={TICK}>
            <path d="M3.5 10.5l4.5 4.5 8.5-10" />
          </svg>
        </span>
        {children}
      </label>
    </span>
  );
};
