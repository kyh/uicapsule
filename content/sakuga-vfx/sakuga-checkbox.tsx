"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "cn";
import { useEffect, useLayoutEffect, useRef } from "react";

import { Spring, at, dotted, kira, later, lines, puff, sfx, shards, slash } from "./sakuga-core";
import { SakugaStyle, useFrame, useMergedRef } from "./sakuga-react";
import type { Styled } from "./sakuga-react";

type SakugaCheckboxProps = Styled<CheckboxPrimitive.Root.Props>;

const ROOT =
  "grid h-[38px] w-[38px] flex-none cursor-pointer place-items-center rounded-[9px] border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) shadow-(--sk-sh) will-change-transform [--sk-dash:30] [-webkit-tap-highlight-color:transparent] focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) focus-visible:outline-solid data-checked:[--sk-dash:0] data-disabled:cursor-not-allowed data-disabled:opacity-50";

const TICK =
  "h-[26px] w-[26px] fill-none stroke-(--sk-tick) stroke-[4.6] [stroke-dasharray:30] [stroke-dashoffset:var(--sk-dash)] [stroke-linecap:round] [stroke-linejoin:round] [transition:stroke-dashoffset_.24s_cubic-bezier(.2,.9,.3,1)_.08s]";

interface Rig {
  s: Spring;
  hand: boolean | null;
  quiet: boolean;
}

const makeRig = () => {
  const rig: Rig = { hand: null, quiet: false, s: new Spring(1, 600, 13) };

  return rig;
};

const land = (box: HTMLElement | null, rig: Rig, checked: boolean) => {
  if (!box) {
    return;
  }

  rig.s.x = 0.68;
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

const SakugaCheckbox = ({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  inputRef,
  ref,
  ...props
}: SakugaCheckboxProps) => {
  const root = useRef<HTMLElement>(null);
  const rigRef = useRef(makeRig());
  const input = useRef<HTMLInputElement>(null);
  const setRoot = useMergedRef<HTMLElement>(root, ref);
  const setInput = useMergedRef(input, inputRef);

  const change = (next: boolean, details: CheckboxPrimitive.Root.ChangeEventDetails) => {
    onCheckedChange?.(next, details);
    const rig = rigRef.current;

    if (details.isCanceled || rig.quiet) {
      return;
    }

    if (checked === undefined) {
      land(root.current, rig, next);

      return;
    }

    rig.hand = next;
    later(0, () => {
      rig.hand = null;
    });
  };

  useLayoutEffect(() => {
    const rig = rigRef.current;

    if (checked !== undefined && rig.hand === checked) {
      land(root.current, rig, checked);
    }

    rig.hand = null;
  }, [checked]);

  useEffect(() => {
    const hidden = input.current;
    const form = hidden?.form;

    if (checked !== undefined || !hidden || !form) {
      return;
    }

    const back = () => {
      if (hidden.checked !== Boolean(defaultChecked)) {
        rigRef.current.quiet = true;
        hidden.click();
        rigRef.current.quiet = false;
      }
    };

    form.addEventListener("reset", back);

    return () => form.removeEventListener("reset", back);
  }, [checked, defaultChecked]);

  useFrame((dt) => {
    const y = rigRef.current.s.step(dt);

    if (root.current) {
      root.current.style.transform =
        Math.abs(y - 1) < 0.001 ? "" : `scale(${y}) rotate(${(1 - y) * 20}deg)`;
    }
  });

  return (
    <>
      <SakugaStyle />
      <CheckboxPrimitive.Root
        ref={setRoot}
        inputRef={setInput}
        data-slot="sakuga-checkbox"
        className={cn(ROOT, className)}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={change}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          data-slot="sakuga-checkbox-indicator"
          keepMounted
          className="[display:contents]"
        >
          <svg viewBox="0 0 20 20" aria-hidden className={TICK}>
            <path d="M3.5 10.5l4.5 4.5 8.5-10" />
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </>
  );
};

export { SakugaCheckbox };
