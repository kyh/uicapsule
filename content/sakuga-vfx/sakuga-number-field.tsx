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
import { createContext, use, useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";

import { Spring, at, clock, hollow, lines, puff, rnd, sfx, ticks, wob } from "./sakuga-core";
import { FONT_BODY, FONT_DISPLAY, SakugaStyle, useFrame, useSquashy } from "./sakuga-react";

type Styled<Props> = Omit<Props, "className"> & { className?: string };

// What the parts share: the elements the reactions move, and the springs that move them.
interface Rig {
  root: HTMLElement | null;
  pill: HTMLElement | null;
  num: HTMLElement | null;
  kick: Spring;
  tall: Spring;
  jolt: Spring;
  lean: Spring;
  press: Spring;
  heat: number;
  stepped: number;
  said: number;
  bumped: number;
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
    jolt: new Spring(0, 460, 12),
    kick: new Spring(0, 440, 13),
    lean: new Spring(0, 260, 10),
    num: null,
    pill: null,
    press: new Spring(1, 520, 15),
    root: null,
    said: -9,
    stepped: -9,
    tall: new Spring(1, 520, 13),
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

const SakugaNumberField = ({
  className,
  children,
  value,
  onValueChange,
  ...props
}: Styled<NumberFieldPrimitive.Root.Props>) => {
  const rigRef = useMemo(() => ({ current: makeRig() }), []);
  // the value last seen, to tell which way a step went
  const seen = useRef(value ?? props.defaultValue ?? null);
  // owned by a parent: the hit waits for the parent to show the value it was asked for
  const asked = useRef<{ dir: number; to: number } | null>(null);

  useEffect(() => {
    if (value === undefined) {
      return;
    }
    seen.current = value;
    const want = asked.current;
    asked.current = null;
    if (want && want.to === value) {
      rigRef.current.hit(want.dir);
    }
  }, [value, rigRef]);

  useFrame((dt) => {
    const rig = rigRef.current;
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
  });

  return (
    <NumberFieldPrimitive.Root
      data-slot="sakuga-number-field"
      className={cn(
        "relative isolate inline-block align-middle text-[15px] leading-[1.4] [font-weight:500] text-(--sk-ink)",
        FONT_BODY,
        className,
      )}
      value={value}
      onValueChange={(next, details) => {
        onValueChange?.(next, details);
        const from = seen.current;
        if (details.isCanceled || next === null || !STEPS.has(details.reason)) {
          if (value === undefined && !details.isCanceled) {
            seen.current = next;
          }
          return;
        }
        const dir = details.direction ?? Math.sign(next - (from ?? next));
        if (value === undefined) {
          seen.current = next;
          if (dir !== 0) {
            rigRef.current.hit(dir);
          }
        } else if (dir !== 0) {
          asked.current = { dir, to: next };
        }
      }}
      {...props}
      ref={(el) => {
        rigRef.current.root = el;
      }}
    >
      <SakugaStyle />
      <RigContext value={rigRef}>{children}</RigContext>
    </NumberFieldPrimitive.Root>
  );
};

// The pill. It owns the press squash and the jolt against the wall.
const SakugaNumberFieldGroup = ({
  className,
  ...props
}: Styled<NumberFieldPrimitive.Group.Props>) => {
  const rigRef = useRig();
  return (
    <NumberFieldPrimitive.Group
      data-slot="sakuga-number-field-group"
      className={cn(
        "group/sk-nf flex items-center rounded-(--sk-r) bg-(--sk-card) shadow-(--sk-sh) [border:var(--sk-bw)_solid_var(--sk-ink)] will-change-transform not-data-quiet:has-[:focus-visible]:outline-[2.5px] not-data-quiet:has-[:focus-visible]:outline-offset-[3px] not-data-quiet:has-[:focus-visible]:outline-(--sk-acc) not-data-quiet:has-[:focus-visible]:outline-solid data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
      ref={(el) => {
        rigRef.current.pill = el;
      }}
    />
  );
};

const PRESS = { low: 0.56, wide: 0.5 };
const SIDE =
  "grid h-[44px] w-[46px] flex-none cursor-pointer touch-manipulation place-items-center will-change-transform outline-none select-none data-disabled:cursor-not-allowed data-disabled:text-(--sk-track) group-data-disabled/sk-nf:text-(--sk-ink)!";
const GLYPH =
  "pointer-events-none h-[20px] w-[20px] fill-none stroke-current stroke-[3.4] [stroke-linecap:round]";

type SideProps = Styled<NumberFieldPrimitive.Increment.Props>;

// What both side buttons add to Base UI's: the glyph squash, the pill's press, and the wall.
const useSide = (dir: number, { onClick, onPointerDownCapture, ...props }: SideProps) => {
  const rigRef = useRig();
  const el = useRef<HTMLButtonElement>(null);
  const sqRef = useSquashy(el, PRESS);
  useFrame((dt) => sqRef.current?.step(dt));
  const letGo = () => {
    rigRef.current.press.to = 1;
  };
  return {
    ...props,
    onClick: (e: Parameters<NonNullable<SideProps["onClick"]>>[0]) => {
      onClick?.(e);
      // a click with no press before it (the keyboard, assistive technology) still pops the glyph
      const s = sqRef.current;
      if (s && e.detail === 0 && !e.currentTarget.matches("[data-disabled]")) {
        s.s.x = Math.min(s.s.x, 0.8);
        s.s.v += 4;
      }
    },
    onPointerCancel: letGo,
    // on the way down, because Base UI keeps a press on a stepper at its limit to itself
    onPointerDownCapture: (e: Parameters<NonNullable<SideProps["onPointerDownCapture"]>>[0]) => {
      onPointerDownCapture?.(e);
      const rig = rigRef.current;
      const s = sqRef.current;
      const off = rig.pill?.matches("[data-disabled], [data-readonly]") ?? true;
      if (e.button !== 0 || off) {
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
        if (document.activeElement !== rig.num) {
          rig.pill.toggleAttribute("data-quiet", true);
        }
      }
      rig.press.to = 0.9;
      // at the limit Base UI steps nothing, and the pill says so
      if (e.currentTarget.matches("[data-disabled]")) {
        rig.bump(dir);
      }
    },
    onPointerLeave: letGo,
    onPointerUp: letGo,
    ref: el,
  };
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

// The weights are written as properties: cn's merge reads the font stack as a font utility and
// would drop a font-weight class next to it.
const NUMBER = `text-[21px] leading-[1.1] [font-weight:800] tracking-[-0.01em] tabular-nums italic ${FONT_DISPLAY}`;

// which way a key would step, when the value has nowhere left to go that way
const wallFor = (key: string, field: HTMLInputElement) => {
  if (field.value === "") {
    return 0;
  }
  const now = Number(field.value);
  if ((key === "ArrowUp" || key === "End") && field.max !== "" && now >= Number(field.max)) {
    return 1;
  }
  if ((key === "ArrowDown" || key === "Home") && field.min !== "" && now <= Number(field.min)) {
    return -1;
  }
  return 0;
};

// The number: a real input you can type in. It sits in a cell that carries the dividers, so the
// kick moves the number and not the lines.
const SakugaNumberFieldInput = ({
  className,
  onBlur,
  onKeyDown,
  onPointerDown,
  ...props
}: Styled<NumberFieldPrimitive.Input.Props>) => {
  const rigRef = useRig();
  const loud = () => {
    rigRef.current.pill?.toggleAttribute("data-quiet", false);
  };
  return (
    <NumberFieldPrimitive.Input
      data-slot="sakuga-number-field-input"
      className={cn(
        NUMBER,
        "absolute inset-0 h-full w-full rounded-none bg-transparent p-0 text-center text-(--sk-ink) outline-none will-change-transform group-data-quiet/sk-nf:caret-transparent disabled:cursor-not-allowed",
        className,
      )}
      // The cell carries the dividers and takes its width from the number, as text would; the
      // input lies over it, so typing never shifts the pill until the number outgrows the cell.
      render={(input, state) => (
        <span className="relative grid h-[44px] min-w-[64px] place-items-center px-[10px] [border-inline:2.4px_solid_var(--sk-ink)]">
          <span aria-hidden className={cn(NUMBER, "invisible whitespace-pre")}>
            {state.inputValue || "0"}
          </span>
          <input {...input} />
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
        const field = rig.root?.querySelector<HTMLInputElement>("input[type=number]");
        if (field && !field.disabled && !field.readOnly && !e.ctrlKey && !e.metaKey) {
          const dir = wallFor(e.key, field);
          if (dir !== 0) {
            rig.bump(dir);
          }
        }
      }}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        loud();
      }}
      {...props}
      ref={(el) => {
        rigRef.current.num = el;
      }}
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
