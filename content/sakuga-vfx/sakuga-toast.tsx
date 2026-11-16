"use client";

// Sakuga Toast: a notification that streaks in from the left as a smear with speed lines behind
// it, lands in a cloud of dust with ズザッ in dotted letters, wobbles, and after a while leaves by
// shrinking.
// Put it where the toast should appear and call show("Saved") through its ref. The message sits
// in a role="status" region, so it is read out. The element keeps its place on the page while the
// toast is hidden; position it yourself (for example `fixed bottom-6 left-6` in className).

import { useImperativeHandle, useRef, useState } from "react";
import type { Ref } from "react";

import {
  Spring,
  at,
  dotted,
  isCalm,
  lines,
  puff,
  rnd,
  sfx,
  shards,
  ticks,
  wob,
} from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

export interface SakugaToastHandle {
  // show a message. It stays for `duration` seconds, or until hide(). Calling it again while one
  // is up replaces the message and plays the arrival again.
  show: (text?: string) => void;
  hide: () => void;
  // true while it is showing
  readonly open: boolean;
}

interface SakugaToastProps {
  // the words when show() is given none
  message?: string;
  // seconds it stays
  duration?: number;
  className?: string;
  ref?: Ref<SakugaToastHandle>;
}

// 0 hidden, 1 streaking in, 2 landed, 3 leaving
type Phase = 0 | 1 | 2 | 3;

// the handle is built out here because its `open` is a getter
const toastHandle = (
  show: (text?: string) => void,
  hide: () => void,
  isOpen: () => boolean,
): SakugaToastHandle => ({
  hide,
  get open() {
    return isOpen();
  },
  show,
});

const DUST = [-0.5, -0.36, -0.2] as const;

export const SakugaToast = ({
  message = "Saved successfully!",
  duration = 2.6,
  className = "",
  ref,
}: SakugaToastProps) => {
  const [words, setWords] = useState("");
  const el = useRef<HTMLDivElement>(null);
  const sx = useRef(new Spring(-280, 280, 18));
  const ss = useRef(new Spring(1, 420, 26));
  const phase = useRef<Phase>(0);
  const t = useRef(0);
  const at0 = useRef(0);

  const show = (text?: string) => {
    const toast = el.current;
    if (!toast) {
      return;
    }
    setWords(text ?? message);
    toast.dataset.on = "";
    sx.current.x = -280;
    sx.current.v = 1000;
    sx.current.to = 0;
    ss.current.x = 1;
    ss.current.to = 1;
    ss.current.k = 420;
    phase.current = 1;
    if (isCalm()) {
      sx.current.x = 0;
      sx.current.v = 0;
    }
  };

  const hide = () => {
    const toast = el.current;
    if (!toast || phase.current === 0 || phase.current === 3) {
      return;
    }
    phase.current = 3;
    ss.current.to = 0;
    ss.current.k = 500;
    const c = at(toast);
    puff(c.x, c.y, { life: 0.5, n: 4, size: 9 });
  };

  useImperativeHandle(ref, () =>
    toastHandle(show, hide, () => phase.current > 0 && phase.current < 3),
  );

  useFrame((dt) => {
    t.current += dt;
    const toast = el.current;
    if (!toast || phase.current === 0) {
      return;
    }
    const x = sx.current.step(dt);
    const sc = ss.current.step(dt);
    const st = 1 + Math.min(1.5, Math.abs(sx.current.v) * 0.0017);
    toast.style.transform = `translateX(${x}px) scale(${st * sc}, ${sc / Math.sqrt(st)})`;
    if (phase.current === 1) {
      const c = at(toast);
      if (Math.random() < 0.8) {
        lines(c.x - c.w / 2 - 6, c.y + rnd(-14, 14), {
          dir: Math.PI,
          len: 80,
          life: 0.22,
          n: 1,
          spread: 2,
        });
      }
      if (x > -10) {
        // it lands
        phase.current = 2;
        at0.current = t.current;
        lines(c.x - c.w / 2 - 4, c.y, { dir: Math.PI, len: 70, life: 0.4, n: 9, spread: 18 });
        for (const u of DUST) {
          // drawn in the original's order (size, vx, life), so a seeded run matches it frame for frame
          const size = rnd(8, 12);
          const vx = -rnd(10, 30);
          const life = rnd(0.7, 1);
          puff(c.x + c.w * u, c.y + c.h / 2 + 4, { life, n: 4, size, vx, vy: -8 });
        }
        puff(c.x + c.w / 2 + 8, c.y + 10, { life: 0.6, n: 3, size: 7, vx: 20 });
        shards(c.x - c.w / 2, c.y + 12, { arc: 1.6, dir: Math.PI + 0.5, n: 4, size: 4 });
        ticks(c.x + 30, c.y + c.h / 2 + 12, { dir: 0.5, len: 16, n: 2, r: 4 });
        sfx("zuza", c.x - 34, c.y - 58, { rot: -0.1, size: 124, ...dotted() });
        wob(c.x + c.w / 2 + 6, c.y, { dir: 1 });
      }
    } else if (phase.current === 2 && t.current - at0.current > (duration || 2.6)) {
      hide();
    } else if (phase.current === 3 && (sc < 0.03 || isCalm())) {
      phase.current = 0;
      delete toast.dataset.on;
      toast.style.transform = "";
    }
  });

  return (
    <span
      className={`relative isolate inline-block h-[56px] w-[236px] align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) ${FONT_BODY} ${className}`}
    >
      <SakugaStyle />
      <div
        ref={el}
        className="invisible absolute bottom-0 left-0 flex w-[236px] items-center gap-[10px] rounded-(--sk-r) [border:var(--sk-bw)_solid_var(--sk-ink)] bg-(--sk-card) px-[14px] py-[12px] text-[15px] font-bold whitespace-nowrap shadow-(--sk-sh) will-change-transform data-on:visible"
      >
        <span
          aria-hidden
          className="grid size-[28px] flex-none place-items-center rounded-full [border:2.4px_solid_var(--sk-ink)] bg-(--sk-pri)"
        >
          <svg
            viewBox="0 0 20 20"
            className="size-[15px] fill-none stroke-(--sk-on-pri) stroke-[4] [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d="M3.5 10.5l4.5 4.5 8.5-10" />
          </svg>
        </span>
        <output className="overflow-hidden text-ellipsis">{words}</output>
        <button
          type="button"
          aria-label="Dismiss"
          className="ml-auto size-[26px] flex-none cursor-pointer rounded-full border-0 bg-transparent p-0 text-[15px] font-black focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc)"
          onClick={hide}
        >
          ✕
        </button>
      </div>
    </span>
  );
};
