"use client";

// Sakuga Input: a text field that kicks up dust. Focus it and wedges fly off the corner; every key
// throws a puff of dust (and now and then a chip) from where the caret is, and the box gives a little.

import { useImperativeHandle, useRef } from "react";
import type { ComponentProps, FocusEvent, InputEvent } from "react";

import { Spring, at, puff, rnd, shards, ticks } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

const TYPES = ["text", "email", "search", "url", "tel", "password"] as const;

type SakugaInputProps = Omit<ComponentProps<"input">, "type"> & {
  // what a screen reader calls it
  label?: string;
  type?: (typeof TYPES)[number];
};

const INPUT =
  "w-(--sk-input-width,230px) max-w-full rounded-(--sk-r) border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) px-[16px] py-[13px] text-[16px] leading-[1.4] font-semibold text-(--sk-ink) caret-(--sk-ink) shadow-(--sk-sh) outline-none will-change-transform placeholder:text-(--sk-dim) focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) focus-visible:outline-solid disabled:opacity-50";

export const SakugaInput = ({
  label = "Text",
  type = "text",
  autoComplete = "off",
  className = "",
  onFocus,
  onInput,
  ref,
  ...rest
}: SakugaInputProps) => {
  const el = useRef<HTMLInputElement | null>(null);
  const give = useRef(new Spring(1, 700, 16));
  const ruler = useRef<CanvasRenderingContext2D | null>(null);
  useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(ref, () => el.current);

  useFrame((dt) => {
    const inp = el.current;
    if (!inp) {
      return;
    }
    const y = give.current.step(dt);
    inp.style.transform = Math.abs(y - 1) < 0.0006 ? "" : `scale(${y})`;
  });

  const focus = (e: FocusEvent<HTMLInputElement>) => {
    const c = at(e.currentTarget, 1, 0);
    give.current.x = 1.04;
    ticks(c.x - 6, c.y - 4, { dir: -1.05, fan: 0.36, len: 17, life: 0.5, n: 3, r: 5 });
    onFocus?.(e);
  };

  // every key kicks up a little dust where the caret is
  const dust = (e: InputEvent<HTMLInputElement>) => {
    const inp = e.currentTarget;
    if (!ruler.current) {
      ruler.current = document.createElement("canvas").getContext("2d");
    }
    const m = ruler.current;
    const cs = getComputedStyle(inp);
    const caret = inp.selectionStart ?? inp.value.length;
    const before = inp.type === "password" ? "•".repeat(caret) : inp.value.slice(0, caret);
    let width = 0;
    if (m) {
      m.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ({ width } = m.measureText(before));
    }
    const c = at(inp, 0, 0.5);
    const x = c.x + 18 + Math.min(c.w - 38, width);
    give.current.x = 0.985;
    // size is drawn before vx, as in the original, so a seeded run matches it frame for frame
    const size = rnd(4, 6);
    const vx = rnd(-10, 10);
    puff(x, c.y + 10, { life: 0.4, n: 2, size, vx, vy: -22 });
    if (rnd() < 0.35) {
      shards(x, c.y + 6, { life: 0.5, n: 2, size: 3, speed: 110 });
    }
    onInput?.(e);
  };

  return (
    <span
      className={`relative isolate inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) ${FONT_BODY}`}
    >
      <SakugaStyle />
      <input
        aria-label={label}
        {...rest}
        ref={el}
        type={TYPES.includes(type) ? type : "text"}
        autoComplete={autoComplete}
        className={`${INPUT} ${className}`}
        onFocus={focus}
        onInput={dust}
      />
    </span>
  );
};
