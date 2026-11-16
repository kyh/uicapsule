"use client";

// Sakuga Tooltip: a help button whose hint springs out of it like a speech bubble, with puffs
// either side, a ring off the button and a hollow カチッ.
// It shows on hover, on focus and on tap, and Escape closes it. Children replace the "?" on the
// button. The hint opens above the button; the control keeps 60px above itself for that.

import { useId, useImperativeHandle, useRef } from "react";
import type { ReactNode, Ref } from "react";

import { Spring, at, hollow, later, puff, ring, sfx, ticks } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame, useSquashy } from "./sakuga-react";

export interface SakugaTooltipHandle {
  show: () => void;
  hide: () => void;
  // true while the hint is out
  readonly open: boolean;
}

interface SakugaTooltipProps {
  // the hint
  text?: string;
  // what a screen reader calls the button
  label?: string;
  // replaces the "?" on the button
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  ref?: Ref<SakugaTooltipHandle>;
}

// the handle is built out here because its `open` is a getter
const tooltipHandle = (set: (on: boolean) => void, isOpen: () => boolean): SakugaTooltipHandle => ({
  hide: () => set(false),
  get open() {
    return isOpen();
  },
  show: () => set(true),
});

export const SakugaTooltip = ({
  text = "Helpful hint!",
  label = "Help",
  children,
  onOpenChange,
  className = "",
  ref,
}: SakugaTooltipProps) => {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const s = useRef(new Spring(0, 460, 15));
  const sqRef = useSquashy(button, { low: 0.78, wide: 0.3 });
  const isOpen = useRef(false);

  const set = (on: boolean) => {
    if (on === isOpen.current) {
      return;
    }
    isOpen.current = on;
    s.current.to = on ? 1 : 0;
    s.current.d = on ? 15 : 34;
    onOpenChange?.(on);
    if (!on) {
      return;
    }
    if (sqRef.current) {
      sqRef.current.s.v += 2;
    }
    later(120, () => {
      if (!isOpen.current || !tip.current || !button.current) {
        return;
      }
      const c = at(tip.current);
      const q = at(button.current);
      puff(c.x - c.w / 2 - 8, c.y - 12, { life: 0.8, n: 4, size: 8, vx: -14, vy: -10 });
      puff(c.x + c.w / 2 + 10, c.y + 12, { life: 0.8, n: 4, size: 8, vx: 14, vy: -6 });
      puff(c.x - c.w / 2 - 4, c.y + 22, { life: 0.6, n: 3, size: 5, vx: -10 });
      ticks(c.x + c.w / 2 - 2, c.y - c.h / 2 - 6, {
        dir: -1,
        fan: 0.36,
        len: 16,
        life: 0.5,
        n: 3,
        r: 5,
      });
      ring(q.x, q.y - q.h / 2 - 3, { life: 0.5, rx: 22, ry: 5, w: 3 });
      sfx("kachi", c.x + 6, c.y - 46, { life: 0.8, rot: -0.08, size: 96, ...hollow() });
    });
  };

  useImperativeHandle(ref, () => tooltipHandle(set, () => isOpen.current));

  useFrame((dt) => {
    sqRef.current?.step(dt);
    const y = Math.max(0, s.current.step(dt));
    if (tip.current) {
      tip.current.style.transform = `scale(${y}) rotate(${(1 - y) * -10}deg)`;
    }
  });

  return (
    <span
      className={`relative isolate mt-[60px] inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) ${FONT_BODY} ${className}`}
    >
      <SakugaStyle />
      <div
        ref={tip}
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+16px)] left-1/2 w-max max-w-[220px] min-w-[120px] origin-[50%_120%] [translate:-50%_0] [transform:scale(0)] rounded-[13px] [border:var(--sk-bw)_solid_var(--sk-ink)] bg-(--sk-card) px-[14px] py-[11px] text-center text-[16px] font-extrabold shadow-(--sk-sh) will-change-transform before:absolute before:top-[calc(100%-4.5px)] before:left-1/2 before:z-1 before:-ml-[6px] before:border-[6px] before:border-t-[8.5px] before:border-transparent before:border-t-(--sk-card) before:content-[''] after:absolute after:top-full after:left-1/2 after:-ml-[9px] after:border-[9px] after:border-t-[12px] after:border-transparent after:border-t-(--sk-ink) after:content-['']"
      >
        {text}
      </div>
      <button
        ref={button}
        type="button"
        aria-describedby={id}
        aria-label={label}
        className="grid size-[42px] cursor-pointer place-items-center rounded-full [border:var(--sk-bw)_solid_var(--sk-ink)] bg-(--sk-card) p-0 font-black shadow-[4px_5px_0_var(--sk-soft)] focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc)"
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") {
            set(true);
          }
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") {
            set(false);
          }
        }}
        onFocus={() => set(true)}
        onBlur={() => set(false)}
        onClick={(e) => set(!isOpen.current || document.activeElement === e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            set(false);
          }
        }}
      >
        {children ?? "?"}
      </button>
    </span>
  );
};
