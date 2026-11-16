"use client";

// Sakuga Button: a button that reacts like an anime impact frame.
// Primary: press and it squashes flat with wedges above it. Let go and the button inverts for one
// frame and tilts, a spiky burst goes off behind it with crystals and four clouds, ドン! lands above
// it, then it springs tall and smoke rings drift off. Turn `done` on and a check lands with a glint.
// Secondary: a small squash and three wedges at the corner.
// Base UI's Button owns the element: its type, disabled state and `render`.

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "cn";
import { useImperativeHandle, useLayoutEffect, useRef } from "react";

import {
  Spring,
  at,
  burst,
  donut,
  kira,
  later,
  lines,
  puff,
  rnd,
  sfx,
  shards,
  ticks,
  wob,
} from "./sakuga-core";
import {
  BACK_CANVAS,
  FONT_BODY,
  FONT_DISPLAY,
  SakugaStyle,
  useBackLayer,
  useFrame,
  useSquashy,
} from "./sakuga-react";

type SakugaButtonProps = Omit<ButtonPrimitive.Props, "className"> & {
  className?: string;
  variant?: "primary" | "secondary";
  // primary only: a check lands on the button with a glint when this turns true, and leaves when
  // it turns false. A click clears the check, so turn it false again before the next run.
  done?: boolean;
};

const CLOUDS = [
  [-1, -0.5],
  [1, -1],
  [-1, 0.9],
  [1, 1],
] as const;

const BUTTON = `relative cursor-pointer touch-manipulation rounded-(--sk-r) bg-(--sk-card) px-[30px] py-[14px] text-[19px] leading-[1.1] font-extrabold tracking-[-0.01em] text-(--sk-ink) italic will-change-transform select-none focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) data-disabled:cursor-not-allowed data-disabled:opacity-45 data-inv:bg-(--sk-ink) data-inv:text-(--sk-card) data-inv:shadow-none! ${FONT_DISPLAY}`;
const PRIMARY = "[border:var(--sk-bw)_solid_var(--sk-btn-line)] shadow-(--sk-btn-sh)";
const SECONDARY = "[border:var(--sk-bw)_solid_var(--sk-alt-line)] shadow-(--sk-alt-sh)";

const SakugaButton = ({
  variant = "primary",
  done = false,
  children,
  className,
  onClick,
  onPointerDown,
  ref,
  ...props
}: SakugaButtonProps) => {
  const primary = variant === "primary";
  const el = useRef<HTMLButtonElement>(null);
  const [attachBack, backRef] = useBackLayer();
  const sqRef = useSquashy(el, primary ? { low: 0.5, wide: 0.24 } : { low: 0.72, wide: 0.3 });
  const ok = useRef(new Spring(0, 420, 14));
  const seq = useRef(0);
  // whether the check is on the button
  const checked = useRef(done);

  const impact = () => {
    const b = el.current;
    const s = sqRef.current;
    if (!b || !s) {
      return;
    }
    const c = at(b);
    seq.current += 1;
    const n = seq.current;
    ok.current.to = 0;
    ok.current.x = 0;
    checked.current = false;
    s.s.x = Math.min(s.s.x, 0.6);
    s.pop.x = 1.24;
    s.tilt.x = -5;
    // the impact frame
    b.dataset.inv = "";
    later(190, () => {
      delete b.dataset.inv;
    });
    burst(c.x, c.y, { layer: backRef.current ?? undefined, life: 0.48, r: 98, spikes: 17 });
    shards(c.x, c.y, { arc: 6.28, grav: 300, life: 0.95, n: 11, size: 9, speed: 260 });
    for (const [dx, dy] of CLOUDS) {
      // size is drawn before life, as in the original, so a seeded run matches it frame for frame
      const size = rnd(12, 16);
      const life = rnd(0.75, 1.05);
      puff(c.x + dx * (c.w / 2 + 6), c.y + dy * 26, {
        life,
        n: 5,
        size,
        vx: dx * 46,
        vy: dy * 30 - 6,
      });
    }
    sfx("don", c.x + 10, c.y - 84, { life: 1.05, rot: -0.12, size: 176 });
    ticks(c.x - 96, c.y - 70, { dir: -2.4, len: 22, life: 0.45, n: 2, r: 4 });
    ticks(c.x + 110, c.y - 60, { dir: -0.7, len: 22, life: 0.45, n: 2, r: 4 });
    later(200, () => {
      if (n !== seq.current) {
        return;
      }
      s.s.x = 1.22;
      wob(c.x - c.w / 2 - 8, c.y, { dir: -1 });
      wob(c.x + c.w / 2 + 8, c.y, { dir: 1 });
      donut(c.x + 6, c.y - 44, { life: 1.25, r: 30, vx: 22, vy: -52 });
      later(90, () => donut(c.x + 54, c.y - 50, { life: 1.1, r: 18, vx: 34, vy: -40 }));
      later(170, () => donut(c.x + 86, c.y - 46, { life: 0.95, r: 10, vx: 40, vy: -30 }));
      const fall = { arc: 1, dir: Math.PI / 2, grav: 380, n: 2, size: 6, speed: 20 };
      shards(c.x - 30, c.y + 30, fall);
      shards(c.x + 34, c.y + 30, fall);
    });
  };

  // the caller's ref gets the button too
  useImperativeHandle<HTMLElement | null, HTMLElement | null>(ref, () => el.current);

  // the check lands, with a glint, when `done` turns true and leaves when it turns false
  useLayoutEffect(() => {
    const b = el.current;
    if (!primary || !b || done === checked.current) {
      return;
    }
    checked.current = done;
    ok.current.to = done ? 1 : 0;
    if (!done) {
      return;
    }
    const q = at(b, 1, 0);
    kira(q.x - 16, q.y + 2, { life: 1, r: 15 });
    ticks(q.x - 2, q.y - 12, { dir: -0.8, len: 12, n: 2, r: 6 });
  }, [done, primary]);

  useFrame((dt) => {
    sqRef.current?.step(dt);
    if (primary) {
      el.current?.style.setProperty("--ok", Math.max(0, ok.current.step(dt)).toFixed(3));
    }
  });

  const press = () => {
    const b = el.current;
    if (!primary || !b || b.matches(":disabled, [aria-disabled='true']")) {
      return;
    }
    const c = at(b);
    ticks(c.x, c.y - c.h / 2 - 6, { dir: -Math.PI / 2, fan: 0.5, len: 14, n: 3, r: 4 });
    wob(c.x - c.w / 2 - 6, c.y, { dir: -1, life: 0.3, r: 10 });
    wob(c.x + c.w / 2 + 6, c.y, { dir: 1, life: 0.3, r: 10 });
    lines(c.x, c.y + c.h / 2 + 10, { dir: 0, len: 16, life: 0.25, n: 3, spread: 0.1 });
  };

  const click = (e: Parameters<NonNullable<SakugaButtonProps["onClick"]>>[0]) => {
    const b = el.current;
    const s = sqRef.current;
    if (primary) {
      impact();
    } else if (b && s) {
      s.s.x = Math.min(s.s.x, 0.8);
      s.s.v += 4;
      const c = at(b, 1, 0);
      ticks(c.x - 8, c.y - 4, { dir: -1.05, fan: 0.36, len: 17, life: 0.5, n: 3, r: 5 });
    }
    onClick?.(e);
  };

  return (
    <span
      data-slot="sakuga-button-stage"
      className={cn(
        "relative isolate inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink)",
        FONT_BODY,
      )}
    >
      <SakugaStyle />
      {primary && <canvas ref={attachBack} aria-hidden className={BACK_CANVAS} />}
      <ButtonPrimitive
        data-slot="sakuga-button"
        data-variant={variant}
        className={cn(BUTTON, primary ? PRIMARY : SECONDARY, className)}
        {...props}
        ref={el}
        onPointerDown={(e) => {
          press();
          onPointerDown?.(e);
        }}
        onClick={click}
      >
        {children}
        {primary && (
          <svg
            aria-hidden
            viewBox="0 0 24 18"
            className="ml-[calc(var(--ok,0)*6px)] inline-block h-[18px] w-[calc(var(--ok,0)*24px)] [scale:var(--ok,0)] overflow-visible fill-none stroke-(--sk-acc) stroke-[4.4] align-[-2px] [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d="M3 9.5l6 6L21 2.5" />
          </svg>
        )}
      </ButtonPrimitive>
    </span>
  );
};

export { SakugaButton };
