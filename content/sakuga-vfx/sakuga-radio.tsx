"use client";

// Sakuga Radio: a radio group. The picked dot springs in, a fan of wedges goes off it, two puffs
// drift away, and a hollow ポン pops up.
// Underneath are real radio inputs, so the arrow keys move between them, and with a name the group
// is sent with its form. Setting `value` from code plays no effects; only a person picking does.

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

import { Spring, at, hollow, later, lines, puff, sfx, ticks } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

export interface SakugaRadioOption {
  value: string;
  label: ReactNode;
}

interface SakugaRadioProps {
  options?: readonly SakugaRadioOption[];
  // what a screen reader calls the group; left out when aria-labelledby names it instead
  label?: string;
  id?: string;
  "aria-labelledby"?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  // sent with its form under this name; with none, the group stays out of the form
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

// the reaction to a person picking this dot
const pop = (dot: HTMLElement | null) => {
  if (!dot) {
    return;
  }
  const c = at(dot);
  ticks(c.x, c.y, { dir: -2.3, fan: 0.36, len: 15, life: 0.5, n: 4, r: 20 });
  lines(c.x - 26, c.y + 18, { dir: 2.6, len: 26, n: 3, spread: 6 });
  puff(c.x + 26, c.y - 22, { life: 0.7, n: 3, size: 8, vx: 16, vy: -14 });
  later(120, () => puff(c.x + 78, c.y + 2, { life: 0.6, n: 3, size: 7, vx: 10, vy: -10 }));
  sfx("pon", c.x + 70, c.y - 76, { life: 0.8, rot: 0.06, size: 86, ...hollow() });
};

const Row = ({
  option,
  name,
  inForm,
  checked,
  owned,
  disabled,
  handRef,
  onPick,
}: {
  option: SakugaRadioOption;
  name: string;
  inForm: boolean;
  checked: boolean;
  // the value belongs to an owner, who may refuse a pick: the dot reacts once it has agreed
  owned: boolean;
  disabled: boolean;
  // the value a person just picked, so its dot (and the one it replaces) springs instead of jumping
  handRef: RefObject<string | null>;
  onPick: (value: string) => void;
}) => {
  const inp = useRef<HTMLInputElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const s = useRef(new Spring(0, 520, 14));

  useLayoutEffect(() => {
    if (handRef.current === null) {
      // picked from code (or at the start): the dot is simply there, or not
      s.current.to = checked ? 1 : 0;
      s.current.x = s.current.to;
      s.current.v = 0;
      dot.current?.style.setProperty("--d", s.current.x.toFixed(3));
    } else if (owned && checked && handRef.current === option.value) {
      pop(dot.current);
    }
  }, [checked, handRef, owned, option.value]);

  useFrame((dt) => {
    s.current.to = inp.current?.checked ? 1 : 0;
    dot.current?.style.setProperty("--d", Math.max(0, s.current.step(dt)).toFixed(3));
  });

  const change = () => {
    if (!owned) {
      pop(dot.current);
    }
    onPick(option.value);
  };

  return (
    <label className={LABEL}>
      <input
        ref={inp}
        type="radio"
        name={name}
        // an unnamed group keeps its inputs out of the form around it, as the original's shadow root did
        form={inForm ? undefined : ""}
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
  id,
  "aria-labelledby": labelledBy,
  value,
  defaultValue,
  onValueChange,
  name,
  disabled = false,
  className = "",
}: SakugaRadioProps) => {
  const own = useId();
  const shown = options ?? OPTIONS;
  // with no options it shows the original's two, the first one picked
  const first = defaultValue ?? (options ? "" : "a");
  const [inner, setInner] = useState(first);
  // a pick whose option has gone is forgotten, so it does not come back with the option
  if (inner !== "" && !shown.some((option) => option.value === inner)) {
    setInner("");
  }
  const asked = value ?? inner;
  const picked = shown.some((option) => option.value === asked) ? asked : "";
  const hand = useRef<string | null>(null);
  const group = useRef<HTMLDivElement>(null);

  // its form's reset puts it back where it started, without the effects
  useEffect(() => {
    const form = group.current?.closest("form");
    if (!form) {
      return;
    }
    // on the next frame, after the form has reset its own inputs
    const back = () =>
      later(0, () => {
        const to = value ?? first;
        setInner(first);
        for (const inp of group.current?.querySelectorAll("input") ?? []) {
          inp.checked = inp.value === to;
        }
      });
    form.addEventListener("reset", back);
    return () => form.removeEventListener("reset", back);
  }, [value, first]);

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
      <div
        ref={group}
        id={id}
        role="radiogroup"
        aria-label={labelledBy === undefined ? label : undefined}
        aria-labelledby={labelledBy}
        className="grid gap-[12px]"
      >
        {shown.map((option) => (
          <Row
            key={option.value}
            option={option}
            name={name ?? own}
            inForm={name !== undefined}
            checked={option.value === picked}
            owned={value !== undefined}
            disabled={disabled}
            handRef={hand}
            onPick={pick}
          />
        ))}
      </div>
    </span>
  );
};
