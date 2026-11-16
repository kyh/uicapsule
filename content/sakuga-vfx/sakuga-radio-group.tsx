"use client";

// Sakuga Radio Group: the picked dot springs in, a fan of wedges goes off it, two puffs drift
// away, and a hollow ポン pops up.
// Base UI's RadioGroup and Radio own the value, the form inputs, the arrow keys and the ARIA; wrap
// each item in a <label> to label it. Setting `value` from code plays no effects; only a person
// picking does.

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cn } from "cn";
import { createContext, use, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";

import { Spring, at, hollow, later, lines, puff, sfx, ticks } from "./sakuga-core";
import { SakugaStyle, useFrame, useMergedRef } from "./sakuga-react";
import type { Styled } from "./sakuga-react";

type SakugaRadioGroupProps<Value> = Styled<RadioGroupPrimitive.Props<Value>>;
type SakugaRadioGroupItemProps<Value> = Styled<RadioPrimitive.Root.Props<Value>>;

// How an item learns that a person picked it: the group holds the value, so it tells the item.
interface Picks {
  // set while a person's pick is landing, so the dots spring instead of jumping
  handRef: RefObject<{ value: unknown } | null>;
  // each item's reaction, by its value
  popsRef: RefObject<Map<unknown, () => void>>;
}
const PicksContext = createContext<Picks | null>(null);

const GROUP = "grid gap-[12px]";
// The ring is for the keyboard. A click on a radio that already has focus moves no focus, so the
// browser would leave the ring up; data-by-pointer takes it down, as a native radio does.
const ITEM =
  "grid h-[32px] w-[32px] flex-none cursor-pointer place-items-center rounded-full border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) will-change-transform [-webkit-tap-highlight-color:transparent] focus-visible:outline-none [&:focus-visible:not([data-by-pointer])]:outline-[2.5px] [&:focus-visible:not([data-by-pointer])]:outline-offset-[3px] [&:focus-visible:not([data-by-pointer])]:outline-(--sk-acc) [&:focus-visible:not([data-by-pointer])]:outline-solid data-disabled:cursor-not-allowed data-disabled:opacity-50";
const DOT = "h-[19px] w-[19px] [scale:var(--d,0)] rounded-full bg-(--sk-pri)";

// The dot's spring, and whether it was picked the last time it looked.
interface Rig {
  s: Spring;
  was: boolean | null;
}

const makeRig = (): Rig => ({ s: new Spring(0, 520, 14), was: null });

const isOn = (root: HTMLElement | null) => root?.getAttribute("aria-checked") === "true";

// the reaction to a person picking this dot
const pop = (root: HTMLElement | null) => {
  if (!root) {
    return;
  }
  const c = at(root);
  ticks(c.x, c.y, { dir: -2.3, fan: 0.36, len: 15, life: 0.5, n: 4, r: 20 });
  lines(c.x - 26, c.y + 18, { dir: 2.6, len: 26, n: 3, spread: 6 });
  puff(c.x + 26, c.y - 22, { life: 0.7, n: 3, size: 8, vx: 16, vy: -14 });
  later(120, () => puff(c.x + 78, c.y + 2, { life: 0.6, n: 3, size: 7, vx: 10, vy: -10 }));
  sfx("pon", c.x + 70, c.y - 76, { life: 0.8, rot: 0.06, size: 86, ...hollow() });
};

const SakugaRadioGroup = <Value,>({
  className,
  value,
  onValueChange,
  ...props
}: SakugaRadioGroupProps<Value>) => {
  const handRef = useRef<{ value: unknown } | null>(null);
  const popsRef = useRef(new Map<unknown, () => void>());
  const picks = useMemo(() => ({ handRef, popsRef }), []);

  // Base UI only calls this for a person's pick, by pointer or by arrow key
  const change = (next: Value, details: RadioGroupPrimitive.ChangeEventDetails) => {
    onValueChange?.(next, details);
    if (details.isCanceled) {
      return;
    }
    const mark = { value: next };
    handRef.current = mark;
    // the dots read the mark on the next frame; the frame after, a change is from code again
    later(0, () =>
      later(0, () => {
        if (handRef.current === mark) {
          handRef.current = null;
        }
      }),
    );
    // an owner can still refuse the pick, so only its own value reacts before the answer
    if (value === undefined) {
      popsRef.current.get(next)?.();
    }
  };

  // an owned value reacts once the owner has agreed
  useLayoutEffect(() => {
    if (value !== undefined && handRef.current?.value === value) {
      popsRef.current.get(value)?.();
    }
  }, [value]);

  return (
    <PicksContext value={picks}>
      <SakugaStyle />
      <RadioGroupPrimitive
        data-slot="sakuga-radio-group"
        className={cn(GROUP, className)}
        value={value}
        onValueChange={change}
        {...props}
      />
    </PicksContext>
  );
};

const SakugaRadioGroupItem = <Value,>({
  className,
  value,
  onPointerDown,
  onKeyDown,
  onBlur,
  ref,
  ...props
}: SakugaRadioGroupItemProps<Value>) => {
  const root = useRef<HTMLElement>(null);
  const rigRef = useRef(makeRig());
  const setRoot = useMergedRef<HTMLElement>(root, ref);
  const picks = use(PicksContext);

  // at the start the dot is simply there, or not
  useLayoutEffect(() => {
    const rig = rigRef.current;
    rig.was = isOn(root.current);
    rig.s.to = rig.was ? 1 : 0;
    rig.s.x = rig.s.to;
    root.current?.style.setProperty("--d", rig.s.x.toFixed(3));
  }, []);

  useEffect(() => {
    const pops = picks?.popsRef.current;
    pops?.set(value, () => pop(root.current));
    return () => {
      pops?.delete(value);
    };
  }, [picks, value]);

  useFrame((dt) => {
    const rig = rigRef.current;
    if (!root.current) {
      return;
    }
    const on = isOn(root.current);
    if (on !== rig.was) {
      rig.was = on;
      rig.s.to = on ? 1 : 0;
      // picked from code: no spring
      if (!picks?.handRef.current) {
        rig.s.x = rig.s.to;
        rig.s.v = 0;
      }
    }
    root.current.style.setProperty("--d", Math.max(0, rig.s.step(dt)).toFixed(3));
  });

  return (
    <RadioPrimitive.Root
      ref={setRoot}
      data-slot="sakuga-radio-group-item"
      className={cn(ITEM, className)}
      value={value}
      onPointerDown={(e) => {
        e.currentTarget.dataset.byPointer = "";
        onPointerDown?.(e);
      }}
      onKeyDown={(e) => {
        delete e.currentTarget.dataset.byPointer;
        onKeyDown?.(e);
      }}
      onBlur={(e) => {
        delete e.currentTarget.dataset.byPointer;
        onBlur?.(e);
      }}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="sakuga-radio-group-indicator"
        keepMounted
        className={DOT}
      />
    </RadioPrimitive.Root>
  );
};

export { SakugaRadioGroup, SakugaRadioGroupItem };
