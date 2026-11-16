"use client";

// Sakuga Radio: a radio group. The picked dot springs in, a fan of wedges goes off it, two puffs
// drift away, and a hollow ポン pops up.
// Underneath are real radio inputs, so the arrow keys move between them, and with a name the group
// is sent with its form. Setting `value` from code plays no effects; only a person picking does.

import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

import { Spring, at, hollow, later, lines, puff, sfx, ticks } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

export interface SakugaRadioOption {
  value: string;
  label: ReactNode;
}

interface SakugaRadioProps {
  options?: readonly SakugaRadioOption[];
  // what a screen reader calls the group
  label?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  // sent with its form under this name
  name?: string;
  disabled?: boolean;
  className?: string;
}

const OPTIONS: readonly SakugaRadioOption[] = [
  { label: "Option A", value: "a" },
  { label: "Option B", value: "b" },
];

const HOST = `relative isolate inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) [-webkit-tap-highlight-color:transparent] ${FONT_BODY}`;
const LABEL =
  "flex cursor-pointer items-center gap-[12px] select-none has-disabled:cursor-not-allowed has-disabled:opacity-50";
const INPUT = "peer absolute m-0 h-px w-px opacity-0";
const DOT =
  "grid h-[32px] w-[32px] flex-none place-items-center rounded-full bg-(--sk-card) will-change-transform [border:var(--sk-bw)_solid_var(--sk-ink)] peer-focus-visible:outline-[2.5px] peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-(--sk-acc) peer-focus-visible:outline-solid after:h-[19px] after:w-[19px] after:[scale:var(--d,0)] after:rounded-full after:bg-(--sk-pri) after:content-['']";

const Row = ({
  option,
  name,
  checked,
  disabled,
  handRef,
  onPick,
}: {
  option: SakugaRadioOption;
  name: string;
  checked: boolean;
  disabled: boolean;
  // the value a person just picked, so its dot (and the one it replaces) springs instead of jumping
  handRef: RefObject<string | null>;
  onPick: (value: string) => void;
}) => {
  const inp = useRef<HTMLInputElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const s = useRef(new Spring(0, 520, 14));

  // picked from code (or at the start): the dot is simply there, or not
  useLayoutEffect(() => {
    if (handRef.current === null) {
      s.current.to = checked ? 1 : 0;
      s.current.x = s.current.to;
      dot.current?.style.setProperty("--d", s.current.x.toFixed(3));
    }
  }, [checked, handRef]);

  useFrame((dt) => {
    s.current.to = inp.current?.checked ? 1 : 0;
    dot.current?.style.setProperty("--d", Math.max(0, s.current.step(dt)).toFixed(3));
  });

  const change = () => {
    if (dot.current) {
      const c = at(dot.current);
      ticks(c.x, c.y, { dir: -2.3, fan: 0.36, len: 15, life: 0.5, n: 4, r: 20 });
      lines(c.x - 26, c.y + 18, { dir: 2.6, len: 26, n: 3, spread: 6 });
      puff(c.x + 26, c.y - 22, { life: 0.7, n: 3, size: 8, vx: 16, vy: -14 });
      later(120, () => puff(c.x + 78, c.y + 2, { life: 0.6, n: 3, size: 7, vx: 10, vy: -10 }));
      sfx("pon", c.x + 70, c.y - 76, { life: 0.8, rot: 0.06, size: 86, ...hollow() });
    }
    onPick(option.value);
  };

  return (
    <label className={LABEL}>
      <input
        ref={inp}
        type="radio"
        name={name}
        value={option.value}
        checked={checked}
        disabled={disabled}
        className={INPUT}
        onChange={change}
      />
      <span ref={dot} className={DOT} />
      {option.label}
    </label>
  );
};

export const SakugaRadio = ({
  options,
  label = "Options",
  value,
  defaultValue,
  onValueChange,
  name,
  disabled = false,
  className = "",
}: SakugaRadioProps) => {
  const own = useId();
  // with no options it shows the original's two, the first one picked
  const [inner, setInner] = useState(defaultValue ?? (options ? "" : "a"));
  const picked = value ?? inner;
  const hand = useRef<string | null>(null);

  const pick = (next: string) => {
    hand.current = next;
    // the rows read the mark as they re-render; by the next frame a change is from code again
    later(0, () => {
      hand.current = null;
    });
    setInner(next);
    onValueChange?.(next);
  };

  return (
    <span className={`${HOST} ${className}`}>
      <SakugaStyle />
      <div role="radiogroup" aria-label={label} className="grid gap-[12px]">
        {(options ?? OPTIONS).map((option) => (
          <Row
            key={option.value}
            option={option}
            name={name ?? own}
            checked={option.value === picked}
            disabled={disabled}
            handRef={hand}
            onPick={pick}
          />
        ))}
      </div>
    </span>
  );
};
