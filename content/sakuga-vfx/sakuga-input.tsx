"use client";

// Sakuga Input: a text field that kicks up dust. Focus it and wedges fly off the corner; every key
// throws a puff of dust (and now and then a chip) from where the caret is, and the box gives a little.
// It is Base UI's Input, so it takes a name from aria-label, a <label htmlFor> or a Field.Label.

import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import { useRef } from "react";

import { Spring, at, puff, rnd, shards, ticks } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

// The font family is kept outside cn: tailwind-merge reads an arbitrary font-[…] as a weight and
// would drop either it or the weight.
type SakugaInputProps = Omit<InputPrimitive.Props, "className"> & { className?: string };

// the width of the text before the caret, in the input's own font; a password is measured over dots
const beforeCaret = (inp: HTMLInputElement, ruler: CanvasRenderingContext2D | null) => {
  if (!ruler) {
    return 0;
  }
  const cs = getComputedStyle(inp);
  const caret = inp.selectionStart ?? inp.value.length;
  ruler.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return ruler.measureText(inp.type === "password" ? "•".repeat(caret) : inp.value.slice(0, caret))
    .width;
};

const SakugaInput = ({
  className,
  autoComplete = "off",
  onFocus,
  onInput,
  ...props
}: SakugaInputProps) => {
  // the field a person is in: the one the spring moves
  const live = useRef<HTMLInputElement | null>(null);
  const give = useRef(new Spring(1, 700, 16));
  const ruler = useRef<CanvasRenderingContext2D | null>(null);

  useFrame((dt) => {
    const inp = live.current;
    if (!inp) {
      return;
    }
    const y = give.current.step(dt);
    inp.style.transform = Math.abs(y - 1) < 0.0006 ? "" : `scale(${y})`;
  });

  return (
    <>
      <SakugaStyle />
      <InputPrimitive
        data-slot="sakuga-input"
        autoComplete={autoComplete}
        className={`${FONT_BODY} ${cn(
          "w-(--sk-input-width,230px) max-w-full rounded-(--sk-r) border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) px-[16px] py-[13px] align-middle text-[16px] leading-[1.4] font-semibold text-(--sk-ink) caret-(--sk-ink) shadow-(--sk-sh) outline-none will-change-transform placeholder:text-(--sk-dim) focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) focus-visible:outline-solid disabled:opacity-50",
          className,
        )}`}
        {...props}
        onFocus={(e) => {
          live.current = e.currentTarget;
          const c = at(e.currentTarget, 1, 0);
          give.current.x = 1.04;
          ticks(c.x - 6, c.y - 4, { dir: -1.05, fan: 0.36, len: 17, life: 0.5, n: 3, r: 5 });
          onFocus?.(e);
        }}
        // every key kicks up a little dust where the caret is
        onInput={(e) => {
          const inp = e.currentTarget;
          live.current = inp;
          if (!ruler.current) {
            ruler.current = document.createElement("canvas").getContext("2d");
          }
          const c = at(inp, 0, 0.5);
          const x = c.x + 18 + Math.min(c.w - 38, beforeCaret(inp, ruler.current));
          give.current.x = 0.985;
          // size is drawn before vx, as in the original, so a seeded run matches it frame for frame
          const size = rnd(4, 6);
          const vx = rnd(-10, 10);
          puff(x, c.y + 10, { life: 0.4, n: 2, size, vx, vy: -22 });
          if (rnd() < 0.35) {
            shards(x, c.y + 6, { life: 0.5, n: 2, size: 3, speed: 110 });
          }
          onInput?.(e);
        }}
      />
    </>
  );
};

export { SakugaInput };
