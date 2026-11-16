"use client";

// Sakuga Radio Group: the picked dot springs in, a fan of wedges goes off it, two puffs drift
// away, and a hollow ポン pops up.
// Base UI's RadioGroup and Radio own the value, the form inputs, the arrow keys and the ARIA; wrap
// each item in a <label> to label it. Setting `value` from code plays no effects; only a person
// picking does.

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cn } from "cn";
import { createContext, use, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  // each item, by its value: its reaction, and its hidden form input
  itemsRef: RefObject<Map<unknown, Item>>;
}
interface Item {
  pop: () => void;
  input: () => HTMLInputElement | null;
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
  defaultValue,
  onValueChange,
  ...props
}: SakugaRadioGroupProps<Value>) => {
  const handRef = useRef<{ value: unknown } | null>(null);
  const itemsRef = useRef(new Map<unknown, Item>());
  const picks = useMemo(() => ({ handRef, itemsRef }), []);
  // The group holds the pick when no parent does, so a form reset can put the starting one back.
  // null is no pick: the primitive stays controlled from the first render.
  const [own, setOwn] = useState<Value | null>(defaultValue ?? null);

  // Base UI only calls this for a person's pick, by pointer or by arrow key
  const change = (next: Value, details: RadioGroupPrimitive.ChangeEventDetails) => {
    onValueChange?.(next, details);
    if (details.isCanceled) {
      return;
    }
    if (value === undefined) {
      setOwn(next);
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
      itemsRef.current.get(next)?.pop();
    }
  };

  // an owned value reacts once the owner has agreed
  useLayoutEffect(() => {
    if (value !== undefined && handRef.current?.value === value) {
      itemsRef.current.get(value)?.pop();
    }
  }, [value]);

  // Base UI leaves a form's reset to the browser, which moves only the hidden inputs, so the group
  // would go on showing the old pick. Put the starting pick back; a change from code plays nothing.
  useEffect(() => {
    const [first] = itemsRef.current.values();
    const form = first?.input()?.form;
    if (value !== undefined || !form) {
      return;
    }
    const back = () => setOwn(defaultValue ?? null);
    form.addEventListener("reset", back);
    return () => form.removeEventListener("reset", back);
  }, [value, defaultValue]);

  return (
    <PicksContext value={picks}>
      <SakugaStyle />
      <RadioGroupPrimitive
        data-slot="sakuga-radio-group"
        className={cn(GROUP, className)}
        // SAFETY: the primitive reads null as no pick (it tests `== null`); only its type leaves null out.
        value={value === undefined ? (own as Value) : value}
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
  inputRef,
  ref,
  ...props
}: SakugaRadioGroupItemProps<Value>) => {
  const root = useRef<HTMLElement>(null);
  const rigRef = useRef(makeRig());
  const input = useRef<HTMLInputElement>(null);
  const setRoot = useMergedRef<HTMLElement>(root, ref);
  const setInput = useMergedRef(input, inputRef);
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
    const items = picks?.itemsRef.current;
    items?.set(value, { input: () => input.current, pop: () => pop(root.current) });
    return () => {
      items?.delete(value);
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
      inputRef={setInput}
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
