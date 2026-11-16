"use client";

// Sakuga Accordion: pick a section and its panel drops open on a spring, shoving the ones below it
// down. Where its bottom edge lands, dust kicks up either side, wedges fly off the chevron as it
// flips, and a hollow ポン lands beside it. Close it and the panel is sucked back up with one small puff.
// The panel's height is the real thing: the text is there from the first frame.

import { useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { Spring, at, hollow, isCalm, puff, sfx, ticks } from "./sakuga-core";
import { FONT_BODY, FONT_DISPLAY, SakugaStyle, useFrame } from "./sakuga-react";

export interface SakugaAccordionSection {
  title: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface SakugaAccordionProps {
  sections: readonly SakugaAccordionSection[];
  // let more than one section stay open
  multiple?: boolean;
  // the indexes of the open sections
  open?: readonly number[];
  defaultOpen?: readonly number[];
  onOpenChange?: (open: number[]) => void;
  disabled?: boolean;
  className?: string;
}

const NONE: readonly number[] = [];

interface Rig {
  // the panel's height, as a share of its content's
  h: Spring;
  // the chevron: 0 points down, 1 points up
  turn: Spring;
  press: Spring;
  // it is dropping open and has not hit the bottom yet
  landing: boolean;
  // it is closing by itself, so it gets the puff
  closing: boolean;
  still: boolean;
}

const makeRig = (): Rig => ({
  closing: false,
  h: new Spring(0, 380, 19),
  landing: false,
  press: new Spring(1, 520, 15),
  still: true,
  turn: new Spring(0, 420, 13),
});

// drop it open, or suck it back up
const aim = (r: Rig, on: boolean, alone: boolean) => {
  r.h.to = on ? 1 : 0;
  r.h.k = on ? 380 : 900;
  r.h.d = on ? 19 : 40;
  r.turn.to = r.h.to;
  r.landing = on;
  r.closing = !on && alone;
  r.still = false;
  r.h.v = on ? Math.max(r.h.v, 5) : Math.min(r.h.v, -6);
  if (isCalm()) {
    r.h.x = r.h.to;
    r.h.v = 0;
    r.turn.x = r.h.to;
    r.turn.v = 0;
  }
};

// the chevron turns over through flat, a little wider as it goes
const flip = (t: number) => {
  const y = 1 - 2 * t;
  return `scale(${(1 + Math.max(0, 1 - Math.abs(y)) * 0.25).toFixed(3)}, ${y.toFixed(3)})`;
};

const KEYS = new Map([
  ["ArrowDown", 1],
  ["ArrowUp", -1],
  ["End", 99],
  ["Home", -99],
]);

const HEADER = `flex w-full cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-[10px] px-[16px] py-[10px] text-left text-[17px] leading-[1.2] font-extrabold tracking-[-0.01em] text-(--sk-ink) italic will-change-transform select-none focus-visible:outline-[2.5px] focus-visible:outline-offset-[-3px] focus-visible:outline-(--sk-acc) disabled:cursor-not-allowed disabled:opacity-45 ${FONT_DISPLAY}`;

export const SakugaAccordion = ({
  sections,
  multiple = false,
  open,
  defaultOpen = NONE,
  onOpenChange,
  disabled = false,
  className = "",
}: SakugaAccordionProps) => {
  const uid = useId();
  const [own, setOwn] = useState<readonly number[]>(defaultOpen);
  const shownOpen = open ?? own;
  const key = shownOpen.join(",");
  const count = sections.length;

  const card = useRef<HTMLDivElement>(null);
  const heads = useRef<(HTMLButtonElement | null)[]>([]);
  const chevrons = useRef<(SVGSVGElement | null)[]>([]);
  const panels = useRef<(HTMLElement | null)[]>([]);
  const bodies = useRef<(HTMLDivElement | null)[]>([]);
  const rigs = useRef<Rig[]>([]);
  const before = useRef<string | null>(null);

  useLayoutEffect(() => {
    const now = new Set(key === "" ? [] : key.split(",").map(Number));
    const was = before.current;
    before.current = key;
    while (rigs.current.length < count) {
      rigs.current.push(makeRig());
    }
    if (was === null) {
      // mounted: the open ones are simply open
      for (const i of now) {
        const r = rigs.current[i];
        if (r) {
          r.h.x = 1;
          r.h.to = 1;
          r.turn.x = 1;
          r.turn.to = 1;
        }
      }
      return;
    }
    const old = new Set(was === "" ? [] : was.split(",").map(Number));
    // when one closes as another opens, only the opening one reacts
    const opening = [...now].some((i) => !old.has(i));
    for (const [i, r] of rigs.current.entries()) {
      const panel = panels.current[i];
      const body = bodies.current[i];
      if (now.has(i) !== old.has(i) && panel && body) {
        aim(r, now.has(i), !opening);
        // before the paint, so the panel never shows a frame at its new resting height
        panel.style.height = `${(r.h.x * body.offsetHeight).toFixed(2)}px`;
        const chevron = chevrons.current[i];
        if (chevron) {
          chevron.style.transform = flip(r.turn.x);
        }
      }
    }
  }, [key, count]);

  // the bottom edge lands
  const land = (i: number) => {
    const box = card.current;
    const panel = panels.current[i];
    const head = heads.current[i];
    if (!box || !panel || !head) {
      return;
    }
    const k = at(box);
    const p = at(panel, 0.5, 1);
    const q = at(head, 1, 0);
    const left = k.x - k.w / 2;
    const right = k.x + k.w / 2;
    puff(left - 7, p.y - 3, { life: 0.7, n: 4, size: 8, vx: -16, vy: -10 });
    puff(right + 12, p.y + 2, { life: 0.7, n: 4, size: 8, vx: 16, vy: -8 });
    ticks(q.x - 4, q.y + 2, { dir: -0.75, fan: 0.36, len: 15, life: 0.5, n: 3, r: 5 });
    // the word straddles the card's top right corner, clear of every chevron and inside its column
    sfx("pon", right - 30, k.y - k.h / 2 - 22, { life: 0.8, rot: 0.06, size: 72, ...hollow() });
  };

  // it has shut
  const shut = (i: number) => {
    const head = heads.current[i];
    if (head) {
      const q = at(head, 1, 1);
      puff(q.x + 4, q.y, { life: 0.4, n: 3, size: 7 });
    }
  };

  useFrame((dt) => {
    for (const [i, r] of rigs.current.entries()) {
      const head = heads.current[i];
      const panel = panels.current[i];
      const body = bodies.current[i];
      const chevron = chevrons.current[i];
      if (head && panel && body && chevron) {
        const y = r.press.step(dt);
        head.style.transform =
          Math.abs(y - 1) < 0.001 && Math.abs(r.press.v) < 0.01
            ? ""
            : `scale(${1 + (1 - y) * 0.14}, ${y})`;
        if (!r.still) {
          const h = Math.max(0, r.h.step(dt));
          const t = r.turn.step(dt);
          chevron.style.transform = flip(t);
          if (r.landing && h >= 1) {
            r.landing = false;
            land(i);
          }
          if (r.closing && h < 0.08) {
            r.closing = false;
            shut(i);
          }
          const turned = Math.abs(t - r.turn.to) < 0.002 && Math.abs(r.turn.v) < 0.02;
          if (r.h.to === 1 && Math.abs(h - 1) < 0.001 && Math.abs(r.h.v) < 0.01) {
            panel.style.height = "";
            r.still = turned;
          } else if (r.h.to === 0 && h < 0.004) {
            r.h.x = 0;
            r.h.v = 0;
            panel.style.height = "0px";
            r.still = turned;
          } else {
            panel.style.height = `${(h * body.offsetHeight).toFixed(2)}px`;
          }
        }
      }
    }
  });

  const toggle = (i: number) => {
    const on = shownOpen.includes(i);
    let next = on ? [] : [i];
    if (multiple) {
      next = on ? shownOpen.filter((n) => n !== i) : [...shownOpen, i].toSorted((a, b) => a - b);
    }
    const r = rigs.current[i];
    if (r) {
      // the header gives, whatever pressed it
      r.press.x = Math.min(r.press.x, 0.86);
    }
    setOwn(next);
    onOpenChange?.(next);
  };

  const keyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = KEYS.get(e.key);
    const live = heads.current.filter((b) => b && !b.disabled);
    const here = live.indexOf(heads.current[i] ?? null);
    if (!step || here === -1) {
      return;
    }
    e.preventDefault();
    let n = (here + step + live.length) % live.length;
    if (Math.abs(step) > 1) {
      n = step < 0 ? 0 : live.length - 1;
    }
    live[n]?.focus();
  };

  const hold = (i: number, to: number) => {
    const r = rigs.current[i];
    if (r) {
      r.press.to = to;
    }
  };

  return (
    <div
      className={`relative isolate inline-block w-[270px] max-w-full align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) ${FONT_BODY} ${className}`}
    >
      <SakugaStyle />
      <div
        ref={card}
        className="rounded-(--sk-r) bg-(--sk-card) shadow-(--sk-sh) [border:var(--sk-bw)_solid_var(--sk-ink)]"
      >
        {sections.map((section, i) => {
          const on = shownOpen.includes(i);
          const off = disabled || section.disabled === true;
          return (
            <div
              // a section is its place: `open` holds indexes, and two may share a title
              key={i}
              className={i > 0 ? "border-t-[2.4px] border-(--sk-ink)" : undefined}
            >
              <h3>
                <button
                  ref={(node) => {
                    heads.current[i] = node;
                  }}
                  type="button"
                  id={`${uid}-head-${i}`}
                  aria-expanded={on}
                  aria-controls={`${uid}-panel-${i}`}
                  disabled={off}
                  className={HEADER}
                  onClick={() => toggle(i)}
                  onKeyDown={(e) => keyDown(e, i)}
                  onPointerDown={() => hold(i, 0.86)}
                  onPointerUp={() => hold(i, 1)}
                  onPointerLeave={() => hold(i, 1)}
                  onPointerCancel={() => hold(i, 1)}
                  onBlur={() => hold(i, 1)}
                >
                  {section.title}
                  <svg
                    ref={(node) => {
                      chevrons.current[i] = node;
                    }}
                    aria-hidden
                    viewBox="0 0 16 16"
                    className={`h-[16px] w-[16px] flex-none overflow-visible fill-none stroke-(--sk-ink) stroke-[3.2] [stroke-linecap:round] [stroke-linejoin:round] ${on ? "[transform:scaleY(-1)]" : ""}`}
                  >
                    <path d="M2.5 5.5l5.5 5.5 5.5-5.5" />
                  </svg>
                </button>
              </h3>
              {/* the classes are only how it looks before the first reaction: after that the springs write the height */}
              <section
                ref={(node) => {
                  panels.current[i] = node;
                }}
                id={`${uid}-panel-${i}`}
                aria-labelledby={`${uid}-head-${i}`}
                inert={!on}
                className={`overflow-hidden ${on ? "" : "h-0"}`}
              >
                <div
                  ref={(node) => {
                    bodies.current[i] = node;
                  }}
                  className="px-[16px] pt-[1px] pb-[14px] text-[14px] leading-[1.45]"
                >
                  {section.content}
                </div>
              </section>
            </div>
          );
        })}
      </div>
    </div>
  );
};
