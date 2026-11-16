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
import { SakugaStyle, useFrame } from "./sakuga-react";

type SakugaRadioGroupProps<Value> = Omit<RadioGroupPrimitive.Props<Value>, "className"> & {
  className?: string;
};
type SakugaRadioGroupItemProps<Value> = Omit<RadioPrimitive.Root.Props<Value>, "className"> & {
  className?: string;
};

// How an item learns that a person picked it: the group holds the value, so it tells the item.
interface Picks {
  // set while a person's pick is landing, so the dots spring instead of jumping
  handRef: RefObject<{ value: unknown } | null>;
  // each item, by its value: its reaction, and its hidden form input
  itemsRef: RefObject<Map<unknown, { pop: () => void; input: () => HTMLInputElement | null }>>;
}
const PicksContext = createContext<Picks | null>(null);

const ITEM =
  "grid h-[32px] w-[32px] flex-none cursor-pointer place-items-center rounded-full bg-(--sk-card) will-change-transform [-webkit-tap-highlight-color:transparent] [border:var(--sk-bw)_solid_var(--sk-ink)] focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) focus-visible:outline-solid data-disabled:cursor-not-allowed data-disabled:opacity-50";
const DOT = "h-[19px] w-[19px] [scale:var(--d,0)] rounded-full bg-(--sk-pri)";

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

// the hidden form input Base UI renders beside a control
const inputAfter = (control: Element | null) => {
  let next = control?.nextElementSibling ?? null;
  while (next && !(next instanceof HTMLInputElement && next.type !== "hidden")) {
    next = next.nextElementSibling;
  }
  return next instanceof HTMLInputElement ? next : null;
};

// the circle a dot sits in
const circleOf = (dot: HTMLElement | null) => dot?.closest<HTMLElement>('[role="radio"]') ?? null;

const SakugaRadioGroup = <Value,>({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: SakugaRadioGroupProps<Value>) => {
  const handRef = useRef<{ value: unknown } | null>(null);
  const itemsRef = useRef(
    new Map<unknown, { pop: () => void; input: () => HTMLInputElement | null }>(),
  );
  const picks = useMemo(() => ({ handRef, itemsRef }), []);
  // set while its form's reset puts it back, so that change plays nothing
  const quiet = useRef(false);

  // Base UI only calls this for a person's pick, by pointer or by arrow key
  const change = (next: Value, details: RadioGroupPrimitive.ChangeEventDetails) => {
    onValueChange?.(next, details);
    if (details.isCanceled || quiet.current) {
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
      itemsRef.current.get(next)?.pop();
    }
  };

  // an owned value reacts once the owner has agreed
  useLayoutEffect(() => {
    if (value !== undefined && handRef.current?.value === value) {
      itemsRef.current.get(value)?.pop();
    }
  }, [value]);

  // Base UI leaves a form's reset to the browser, which only moves the hidden inputs. Pick the
  // starting value again, through its input, just before the browser resets them.
  useEffect(() => {
    const [first] = itemsRef.current.values();
    const form = first?.input()?.form;
    if (value !== undefined || !form) {
      return;
    }
    const back = () => {
      const input = itemsRef.current.get(defaultValue)?.input();
      if (input && !input.checked) {
        quiet.current = true;
        input.click();
        quiet.current = false;
      }
    };
    form.addEventListener("reset", back);
    return () => form.removeEventListener("reset", back);
  }, [value, defaultValue]);

  return (
    <PicksContext value={picks}>
      <SakugaStyle />
      <RadioGroupPrimitive
        data-slot="sakuga-radio-group"
        className={cn("grid gap-[12px]", className)}
        value={value}
        defaultValue={defaultValue}
        onValueChange={change}
        {...props}
      />
    </PicksContext>
  );
};

const SakugaRadioGroupItem = <Value,>({
  className,
  value,
  ...props
}: SakugaRadioGroupItemProps<Value>) => {
  const dot = useRef<HTMLSpanElement>(null);
  const s = useRef(new Spring(0, 520, 14));
  const was = useRef<boolean | null>(null);
  const picks = use(PicksContext);

  // at the start the dot is simply there, or not
  useLayoutEffect(() => {
    const el = circleOf(dot.current);
    const on = el?.getAttribute("aria-checked") === "true";
    was.current = on;
    s.current.to = on ? 1 : 0;
    s.current.x = s.current.to;
    el?.style.setProperty("--d", s.current.x.toFixed(3));
  }, []);

  useEffect(() => {
    const items = picks?.itemsRef.current;
    items?.set(value, {
      input: () => inputAfter(circleOf(dot.current)),
      pop: () => pop(circleOf(dot.current)),
    });
    return () => {
      items?.delete(value);
    };
  }, [picks, value]);

  useFrame((dt) => {
    const el = circleOf(dot.current);
    if (!el) {
      return;
    }
    const on = el.getAttribute("aria-checked") === "true";
    if (on !== was.current) {
      was.current = on;
      s.current.to = on ? 1 : 0;
      // picked from code: no spring
      if (!picks?.handRef.current) {
        s.current.x = s.current.to;
        s.current.v = 0;
      }
    }
    el.style.setProperty("--d", Math.max(0, s.current.step(dt)).toFixed(3));
  });

  return (
    <RadioPrimitive.Root
      data-slot="sakuga-radio-group-item"
      className={cn(ITEM, className)}
      value={value}
      {...props}
    >
      <RadioPrimitive.Indicator
        ref={dot}
        data-slot="sakuga-radio-group-indicator"
        keepMounted
        className={DOT}
      />
    </RadioPrimitive.Root>
  );
};

export { SakugaRadioGroup, SakugaRadioGroupItem };
