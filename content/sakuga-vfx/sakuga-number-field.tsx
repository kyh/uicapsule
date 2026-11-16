"use client";

// Sakuga Number Field: a number stepper on Base UI's NumberField. Step it and the number is kicked
// the way it went and springs back, with wedges off that side and a hollow カチッ. Step fast and it
// stops saying so: speed lines and small puffs trail behind the number instead. At the limit the
// number stays put and the whole pill jolts against the wall, with wobble marks on that side. While
// a side is held the whole pill squashes toward the other end.
//
//   <SakugaNumberField defaultValue={5} min={0} max={9}>
//     <SakugaNumberFieldGroup>
//       <SakugaNumberFieldDecrement />
//       <SakugaNumberFieldInput aria-label="Copies" />
//       <SakugaNumberFieldIncrement />
//     </SakugaNumberFieldGroup>
//   </SakugaNumberField>
//
// The parts share one set of springs through the root, so a step on a button can kick the number
// and jolt the pill. Typing a number is quiet; only a step a person made, and that took, reacts.

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { cn } from "cn";
import { createContext, use, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

import { Spring, at, clock, hollow, later, lines, puff, rnd, sfx, ticks, wob } from "./sakuga-core";
import {
  FONT_BODY,
  FONT_DISPLAY,
  SakugaStyle,
  useFrame,
  useMergedRef,
  useSquashy,
} from "./sakuga-react";
import type { Styled } from "./sakuga-react";

// What the parts share: the elements the reactions move, the springs that move them, and the
// field's value and limits as the root last rendered them.
interface Rig {
  pill: HTMLElement | null;
  // the number as it is drawn, which the kick moves, and the input laid over it
  num: HTMLElement | null;
  input: HTMLElement | null;
  kick: Spring;
  tall: Spring;
  jolt: Spring;
  lean: Spring;
  press: Spring;
  value: number | null;
  min: number | undefined;
  max: number | undefined;
  off: boolean;
  heat: number;
  stepped: number;
  said: number;
  bumped: number;
  // which press this is, and how many steps it has made
  hold: number;
  holdSteps: number;
  // the number is kicked the way it was stepped
  hit: (dir: number) => void;
  // nothing changed: the pill meets the wall on that side
  bump: (dir: number) => void;
}

const makeRig = (): Rig => {
  const rig: Rig = {
    bump: (dir) => {
      const p = rig.pill;
      if (!p || clock.now - rig.bumped < 0.16) {
        return;
      }
      rig.bumped = clock.now;
      rig.heat = 0;
      rig.jolt.x = dir * 7;
      rig.jolt.v = 0;
      rig.lean.x = dir * 2.4;
      const q = at(p);
      wob(q.x + dir * (q.w / 2 + 9), q.y + 3, { dir });
    },
    bumped: -9,
    heat: 0,
    hit: (dir) => {
      const p = rig.pill;
      const n = rig.num;
      if (!p || !n) {
        return;
      }
      const t = clock.now;
      rig.heat = t - rig.stepped < 0.3 ? Math.min(5, rig.heat + 1) : 0;
      rig.stepped = t;
      const { heat } = rig;
      rig.kick.x = -dir * (8 + heat * 1.4);
      rig.kick.v = 0;
      rig.tall.x = 1.26 + heat * 0.03;
      const c = at(n);
      const q = at(p);
      // the shadow hangs 7px under the pill, so what goes below clears it
      const ahead = dir > 0 ? q.y - q.h / 2 - 12 : q.y + q.h / 2 + 19;
      const behind = dir > 0 ? q.y + q.h / 2 + 17 : q.y - q.h / 2 - 10;
      ticks(c.x, ahead, {
        dir: (-dir * Math.PI) / 2,
        fan: 0.5,
        len: 15 + heat,
        life: 0.5,
        n: 3,
        r: 4,
      });
      if (heat === 0 && t - rig.said > 0.9) {
        rig.said = t;
        sfx("kachi", c.x + dir * 64, q.y - q.h / 2 - 34, {
          life: 0.7,
          rot: dir > 0 ? -0.08 : 0.07,
          size: 70,
          ...hollow(),
        });
      }
      if (heat > 0) {
        lines(c.x, behind, {
          dir: (dir * Math.PI) / 2,
          len: 18 + heat * 6,
          life: 0.25,
          n: 2 + Math.min(2, heat),
          spread: 13,
        });
      }
      if (heat > 1 && heat % 2 === 0) {
        const drift = rnd(-12, 12);
        puff(c.x + drift, behind + dir * 4, {
          life: 0.6,
          n: 3,
          size: 5 + heat * 0.8,
          vx: drift * 1.5,
          vy: dir * 14,
        });
      }
    },
    hold: 0,
    holdSteps: 0,
    input: null,
    jolt: new Spring(0, 460, 12),
    kick: new Spring(0, 440, 13),
    lean: new Spring(0, 260, 10),
    max: undefined,
    min: undefined,
    num: null,
    off: false,
    pill: null,
    press: new Spring(1, 520, 15),
    said: -9,
    stepped: -9,
    tall: new Spring(1, 520, 13),
    value: null,
  };
  return rig;
};

const RigContext = createContext<RefObject<Rig> | null>(null);

const useRig = () => {
  const rigRef = use(RigContext);
  if (!rigRef) {
    throw new Error("SakugaNumberField parts must be inside <SakugaNumberField>");
  }
  return rigRef;
};

// the steps a person makes; typing, pasting and blur formatting are quiet
const STEPS = new Set(["decrement-press", "increment-press", "keyboard", "scrub", "wheel"]);

// One frame of the springs: the number's kick and stretch, and the pill's jolt, lean and press.
const stepRig = (rig: Rig, dt: number) => {
  const k = rig.kick.step(dt);
  const y = rig.tall.step(dt);
  const j = rig.jolt.step(dt);
  const r = rig.lean.step(dt);
  const w = rig.press.step(dt);
  if (rig.num) {
    const still = Math.abs(k) < 0.05 && Math.abs(y - 1) < 0.001;
    rig.num.style.transform = still
      ? ""
      : `translateY(${k.toFixed(2)}px) scale(${(1 / y).toFixed(3)}, ${y.toFixed(3)})`;
  }
  if (rig.pill) {
    const still = Math.abs(j) < 0.05 && Math.abs(r) < 0.02 && Math.abs(w - 1) < 0.001;
    rig.pill.style.transform = still
      ? ""
      : `translateX(${j.toFixed(2)}px) rotate(${r.toFixed(2)}deg) scale(${(1 + (1 - w) * 0.3).toFixed(3)}, ${w.toFixed(3)})`;
  }
};

const SakugaNumberField = ({
  className,
  children,
  value: valueProp,
  defaultValue,
  onValueChange,
  inputRef,
  step = 1,
  largeStep,
  ...props
}: Styled<NumberFieldPrimitive.Root.Props>) => {
  const rigRef = useMemo(() => ({ current: makeRig() }), []);
  // The root holds the value when no parent does, so a form reset can put the default back.
  const [own, setOwn] = useState(defaultValue ?? null);
  const owned = valueProp !== undefined;
  const value = owned ? valueProp : own;
  // owned by a parent: the hit waits for the parent to show the value it was asked for
  const asked = useRef<{ dir: number; to: number } | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const fieldRef = useMergedRef(field, inputRef);
  const { min, max, disabled = false, readOnly = false } = props;

  useEffect(() => {
    const rig = rigRef.current;
    rig.value = value;
    rig.min = min;
    rig.max = max;
    rig.off = disabled || readOnly;
    const want = asked.current;
    asked.current = null;
    if (want && want.to === value) {
      rig.hit(want.dir);
    }
  }, [value, min, max, disabled, readOnly, rigRef]);

  // A form reset puts the default back, and plays nothing.
  useEffect(() => {
    const form = field.current?.form;
    if (!form || owned) {
      return;
    }
    const reset = () => setOwn(defaultValue ?? null);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [owned, defaultValue]);

  useFrame((dt) => stepRig(rigRef.current, dt));

  return (
    <NumberFieldPrimitive.Root
      data-slot="sakuga-number-field"
      className={cn(
        "relative isolate inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink)",
        FONT_BODY,
        className,
      )}
      value={value}
      step={step}
      // PageUp and PageDown, and Shift with an arrow, move by ten steps unless told otherwise
      largeStep={largeStep ?? (step === "any" ? undefined : step * 10)}
      inputRef={fieldRef}
      onValueChange={(next, details) => {
        onValueChange?.(next, details);
        if (details.isCanceled) {
          return;
        }
        const rig = rigRef.current;
        const from = rig.value;
        if (!owned) {
          setOwn(next);
          rig.value = next;
        }
        if (next === null || !STEPS.has(details.reason)) {
          return;
        }
        const dir = details.direction ?? Math.sign(next - (from ?? next));
        if (dir === 0) {
          return;
        }
        if (owned) {
          asked.current = { dir, to: next };
        } else {
          rig.hit(dir);
        }
        // Held onto the limit, Base UI's repeat just stops; the pill still meets the wall when
        // the next step would have come (60ms into a repeat, 400ms after a first press).
        if (details.reason.endsWith("-press")) {
          rig.holdSteps += 1;
          if (next === (dir > 0 ? max : min)) {
            const n = rig.hold;
            later(rig.holdSteps > 1 ? 60 : 400, () => {
              if (n === rig.hold && rig.press.to < 1) {
                rig.bump(dir);
              }
            });
          }
        }
      }}
      {...props}
    >
      <SakugaStyle />
      <RigContext value={rigRef}>{children}</RigContext>
    </NumberFieldPrimitive.Root>
  );
};

// The pill. It owns the press squash and the jolt against the wall.
const SakugaNumberFieldGroup = ({
  className,
  ref,
  ...props
}: Styled<NumberFieldPrimitive.Group.Props>) => {
  const rigRef = useRig();
  const pillRef = useMergedRef((node: HTMLDivElement | null) => {
    rigRef.current.pill = node;
  }, ref);
  return (
    <NumberFieldPrimitive.Group
      data-slot="sakuga-number-field-group"
      className={cn(
        "group/sk-nf flex items-center rounded-(--sk-r) border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) shadow-(--sk-sh) will-change-transform not-data-quiet:has-[:focus-visible]:outline-[2.5px] not-data-quiet:has-[:focus-visible]:outline-offset-[3px] not-data-quiet:has-[:focus-visible]:outline-(--sk-acc) not-data-quiet:has-[:focus-visible]:outline-solid data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
      ref={pillRef}
    />
  );
};

const PRESS = { low: 0.56, wide: 0.5 };
// At its limit a side button's glyph greys out, but not when the whole field is off: that dims as one.
const SIDE =
  "grid h-[44px] w-[46px] flex-none cursor-pointer touch-manipulation place-items-center will-change-transform outline-none select-none data-disabled:cursor-not-allowed data-disabled:text-(--sk-track) group-data-disabled/sk-nf:text-(--sk-ink)!";
const GLYPH =
  "pointer-events-none h-[20px] w-[20px] fill-none stroke-current stroke-[3.4] [stroke-linecap:round]";

type SideProps = Styled<NumberFieldPrimitive.Increment.Props>;

// What both side buttons add to Base UI's: the glyph squash, the pill's press, and the wall.
const useSide = (
  dir: number,
  {
    onClick,
    onPointerCancel,
    onPointerDownCapture,
    onPointerLeave,
    onPointerUp,
    ref,
    ...props
  }: SideProps,
) => {
  const rigRef = useRig();
  const el = useRef<HTMLButtonElement>(null);
  const sideRef = useMergedRef(el, ref);
  const sqRef = useSquashy(el, PRESS);
  useFrame((dt) => sqRef.current?.step(dt));
  const letGo = () => {
    rigRef.current.press.to = 1;
    rigRef.current.hold += 1;
  };
  const handlers: Pick<
    SideProps,
    "onClick" | "onPointerCancel" | "onPointerDownCapture" | "onPointerLeave" | "onPointerUp"
  > = {
    onClick: (e) => {
      onClick?.(e);
      // a click with no press before it (the keyboard, assistive technology) still pops the glyph
      const s = sqRef.current;
      if (s && e.detail === 0 && e.currentTarget.dataset.disabled === undefined) {
        s.s.x = Math.min(s.s.x, 0.8);
        s.s.v += 4;
      }
    },
    onPointerCancel: (e) => {
      onPointerCancel?.(e);
      letGo();
    },
    // on the way down, because Base UI keeps a press on a stepper at its limit to itself
    onPointerDownCapture: (e) => {
      onPointerDownCapture?.(e);
      const rig = rigRef.current;
      const s = sqRef.current;
      if (e.button !== 0 || rig.off) {
        // Base UI keeps a disabled stepper focusable, so the glyph's own listener cannot tell
        if (s) {
          s.s.to = 1;
        }
        return;
      }
      if (rig.pill) {
        rig.pill.style.transformOrigin = dir > 0 ? "0 50%" : "100% 50%";
        // a mouse press puts focus in the input; that should not draw the keyboard ring or a
        // caret, unless the input already had them
        if (document.activeElement !== rig.input) {
          rig.pill.toggleAttribute("data-quiet", true);
        }
      }
      rig.press.to = 0.9;
      rig.hold += 1;
      rig.holdSteps = 0;
      // at the limit Base UI steps nothing, and the pill says so
      if (e.currentTarget.dataset.disabled !== undefined) {
        rig.bump(dir);
      }
    },
    onPointerLeave: (e) => {
      onPointerLeave?.(e);
      letGo();
    },
    onPointerUp: (e) => {
      onPointerUp?.(e);
      letGo();
    },
  };
  return { ...props, ...handlers, ref: sideRef };
};

const SakugaNumberFieldDecrement = ({ className, children, ...props }: SideProps) => (
  <NumberFieldPrimitive.Decrement
    data-slot="sakuga-number-field-decrement"
    className={cn(SIDE, className)}
    {...useSide(-1, props)}
  >
    {children ?? (
      <svg aria-hidden viewBox="0 0 20 20" className={GLYPH}>
        <path d="M4 10h12" />
      </svg>
    )}
  </NumberFieldPrimitive.Decrement>
);

const SakugaNumberFieldIncrement = ({ className, children, ...props }: SideProps) => (
  <NumberFieldPrimitive.Increment
    data-slot="sakuga-number-field-increment"
    className={cn(SIDE, className)}
    {...useSide(1, props)}
  >
    {children ?? (
      <svg aria-hidden viewBox="0 0 20 20" className={GLYPH}>
        <path d="M4 10h12M10 4v12" />
      </svg>
    )}
  </NumberFieldPrimitive.Increment>
);

const NUMBER = cn(
  "text-[21px] leading-[1.1] font-extrabold tracking-[-0.01em] tabular-nums italic",
  FONT_DISPLAY,
);

// which way a key would step, when the value has nowhere left to go that way
const wallFor = (key: string, { value, min, max }: Rig) => {
  if (value === null) {
    return 0;
  }
  if ((key === "ArrowUp" || key === "End") && max !== undefined && value >= max) {
    return 1;
  }
  if ((key === "ArrowDown" || key === "Home") && min !== undefined && value <= min) {
    return -1;
  }
  return 0;
};

// The number: a real input you can type in. This part draws its own element (a cell that carries
// the dividers, with the input inside), so it takes no `render`.
const SakugaNumberFieldInput = ({
  className,
  onBlur,
  onKeyDown,
  onPointerDown,
  ref,
  ...props
}: Omit<Styled<NumberFieldPrimitive.Input.Props>, "render">) => {
  const rigRef = useRig();
  const inputRef = useMergedRef((node: HTMLInputElement | null) => {
    rigRef.current.input = node;
  }, ref);
  const loud = () => {
    rigRef.current.pill?.toggleAttribute("data-quiet", false);
  };
  return (
    <NumberFieldPrimitive.Input
      data-slot="sakuga-number-field-input"
      className={cn(
        NUMBER,
        // Laid exactly over the drawn number, with the same type, so the caret and a selection
        // sit on its digits. Its own text is clear and it stays still: the kick moves the
        // drawn number alone, which a browser scales as it does any plain text. It reaches
        // 10px into the cell's padding, and its text area runs on to the right edge.
        "absolute inset-y-0 -inset-x-[10px] box-border h-full w-[calc(100%+20px)] rounded-none bg-transparent py-0 pr-0 pl-[10px] text-left text-transparent caret-(--sk-ink) outline-none selection:text-(--sk-ink) group-data-quiet/sk-nf:caret-transparent data-disabled:cursor-not-allowed",
        className,
      )}
      // The cell takes its width from the drawn number, so typing never shifts the pill until
      // the number outgrows the cell. Empty, it keeps the width of one digit.
      render={(input, state) => (
        // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- not a control of its own: a press on the cell's padding only passes focus to the input inside it
        <span
          data-slot="sakuga-number-field-cell"
          className="relative grid h-[44px] min-w-[64px] cursor-text place-items-center border-x-[2.4px] border-(--sk-ink) px-[10px] group-data-disabled/sk-nf:cursor-not-allowed"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              loud();
              rigRef.current.input?.focus();
            }
          }}
        >
          <span className={cn(NUMBER, "relative")}>
            <span
              ref={(node) => {
                rigRef.current.num = node;
              }}
              aria-hidden
              className={cn(
                "block whitespace-pre will-change-transform",
                state.inputValue === "" && "invisible",
              )}
            >
              {state.inputValue || "0"}
            </span>
            <input {...input} />
          </span>
        </span>
      )}
      onBlur={(e) => {
        onBlur?.(e);
        loud();
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        loud();
        const rig = rigRef.current;
        if (rig.off || e.ctrlKey || e.metaKey || e.altKey) {
          return;
        }
        if (e.key === "PageUp" || e.key === "PageDown") {
          // Base UI's large step is Shift with an arrow; the page keys ask it for the same step
          e.preventDefault();
          e.currentTarget.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles: true,
              cancelable: true,
              key: e.key === "PageUp" ? "ArrowUp" : "ArrowDown",
              shiftKey: true,
            }),
          );
          return;
        }
        const dir = wallFor(e.key, rig);
        if (dir !== 0) {
          rig.bump(dir);
        }
      }}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        loud();
      }}
      {...props}
      ref={inputRef}
    />
  );
};

export {
  SakugaNumberField,
  SakugaNumberFieldDecrement,
  SakugaNumberFieldGroup,
  SakugaNumberFieldIncrement,
  SakugaNumberFieldInput,
};
