"use client";

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

interface Picks {
  handRef: RefObject<{ value: unknown } | null>;
  itemsRef: RefObject<Map<unknown, Item>>;
}

interface Item {
  pop: () => void;
  input: () => HTMLInputElement | null;
}

const PicksContext = createContext<Picks | null>(null);

const GROUP = "grid gap-[12px]";

const ITEM =
  "grid h-[32px] w-[32px] flex-none cursor-pointer place-items-center rounded-full border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) will-change-transform [-webkit-tap-highlight-color:transparent] focus-visible:outline-none [&:focus-visible:not([data-by-pointer])]:outline-[2.5px] [&:focus-visible:not([data-by-pointer])]:outline-offset-[3px] [&:focus-visible:not([data-by-pointer])]:outline-(--sk-acc) [&:focus-visible:not([data-by-pointer])]:outline-solid data-disabled:cursor-not-allowed data-disabled:opacity-50";

const DOT = "h-[19px] w-[19px] [scale:var(--d,0)] rounded-full bg-(--sk-pri)";

interface Rig {
  s: Spring;
  was: boolean | null;
}

const makeRig = () => {
  const rig: Rig = { s: new Spring(0, 520, 14), was: null };

  return rig;
};

const isOn = (root: HTMLElement | null) => root?.getAttribute("aria-checked") === "true";

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
  const [own, setOwn] = useState<Value | null>(defaultValue ?? null);

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
    later(0, () =>
      later(0, () => {
        if (handRef.current === mark) {
          handRef.current = null;
        }
      }),
    );

    if (value === undefined) {
      itemsRef.current.get(next)?.pop();
    }
  };

  useLayoutEffect(() => {
    if (value !== undefined && handRef.current?.value === value) {
      itemsRef.current.get(value)?.pop();
    }
  }, [value]);

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
