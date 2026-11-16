"use client";

// Sakuga Tabs: the raised tab itself slides to the one you pick, stretching as it goes, and lands
// with wedges above it, a puff at the side it came from and speed lines behind it.
// It only draws the tabs: show the matching panel from onSelectedChange.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { Spring, at, clamp, later, lines, puff, ticks } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

export interface SakugaTab {
  label: string;
  // defaults to the label
  value?: string;
}

export interface SakugaTabsProps {
  tabs?: readonly SakugaTab[];
  // the index picked; setting it from code moves the tab without the landing effects
  selected?: number;
  defaultSelected?: number;
  onSelectedChange?: (index: number, detail: { value: string; label: string }) => void;
  // what a screen reader calls the tab list
  label?: string;
  // the id of an element that names the tab list; with it, no aria-label is set
  "aria-labelledby"?: string;
  className?: string;
}

const DEFAULT_TABS: readonly SakugaTab[] = [
  { label: "Home", value: "home" },
  { label: "Profile", value: "profile" },
  { label: "Settings", value: "settings" },
];

const STEPS = new Map([
  ["ArrowLeft", -1],
  ["ArrowRight", 1],
  ["End", 99],
  ["Home", -99],
]);

// Two deliberate fixes of upstream bugs, so the control does what the original's own header says:
// 1. The original keeps the way it travelled in `this.dir`, which on an element is the built-in
//    `dir` property and always reads back "". Its landing never took a side: the puffs rose from
//    the middle of the tab and the speed lines always ran right. Here the side is kept in the rig.
// 2. Picking a tab makes its label bold, which resizes the list, and the original's ResizeObserver
//    answered every resize by snapping the raised tab to its target: the slide and its stretch
//    never showed. Here a resize during a move only retargets the springs; any other still snaps.
// Every number is the original's. One clamp is added: because of the snap, the original's stretch
// formula never ran, and at full speed its 46px would throw the trailing edge out past the end of
// the list. Here the stretch only trails over ground already covered since the move began, and
// never leaves the list; the spring's overshoot past either end of the list is held at the end.

interface Rig {
  sx: Spring;
  sw: Spring;
  up: Spring;
  pending: boolean;
  // which way the last picked move went: 1 right, -1 left
  dir: number;
  // where the move began, and how wide the list is: the stretch stays between them
  from: number;
  span: number;
  // the index a click or key just asked for: that move gets the landing
  asked: number;
  shown: number;
}

// point the raised tab at a tab; quiet puts it there at once
const aim = (rig: Rig, tab: HTMLElement, quiet: boolean) => {
  if (!quiet) {
    rig.dir = Math.sign(tab.offsetLeft - rig.sx.to) || 1;
    rig.from = rig.sx.x;
  }
  rig.span = tab.offsetParent?.clientWidth ?? Infinity;
  rig.sx.to = tab.offsetLeft;
  rig.sw.to = tab.offsetWidth;
  if (quiet) {
    rig.sx.x = rig.sx.to;
    rig.sw.x = rig.sw.to;
    rig.sx.v = 0;
  } else {
    rig.pending = true;
    rig.up.x = -5;
  }
};

// the list changed size: follow it, without cutting a move short
const follow = (rig: Rig, tab: HTMLElement) => {
  if (rig.pending) {
    rig.sx.to = tab.offsetLeft;
    rig.sw.to = tab.offsetWidth;
    rig.span = tab.offsetParent?.clientWidth ?? Infinity;
  } else {
    aim(rig, tab, true);
  }
};

// write the raised tab where the springs are: it stretches with its speed
const paint = (rig: Rig, ind: HTMLElement) => {
  const { sx } = rig;
  const room = sx.v < 0 ? rig.span - sx.x - rig.sw.x : sx.x;
  const stretch = Math.max(0, Math.min(46, Math.abs(sx.v) * 0.06, Math.abs(sx.x - rig.from), room));
  const w = rig.sw.x + stretch;
  // the list's ends are walls: the spring's own overshoot stops at them too
  const left = clamp(sx.x - (sx.v < 0 ? 0 : stretch), 0, Math.max(0, rig.span - w));
  ind.style.transform = `translate(${left}px, ${rig.up.x}px)`;
  ind.style.width = `${w}px`;
};

// never changes, so React leaves the style alone once the first measure has shown the raised tab
const HIDDEN = { visibility: "hidden" } as const;

const TAB =
  'relative cursor-pointer border-l-[2.4px] px-[15px] py-[10px] font-[-apple-system,"Segoe_UI",system-ui,sans-serif] text-[15px] leading-[1.2] whitespace-nowrap transition-[translate] duration-[180ms] ease-[cubic-bezier(.3,1.6,.5,1)] focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc)';

export const SakugaTabs = ({
  tabs = DEFAULT_TABS,
  selected,
  defaultSelected = 0,
  onSelectedChange,
  label = "Tabs",
  "aria-labelledby": labelledBy,
  className = "",
}: SakugaTabsProps) => {
  const list = tabs.map((t) => ({ label: t.label, value: t.value ?? t.label }));
  const [own, setOwn] = useState(defaultSelected);
  const picked = clamp(selected ?? own, 0, list.length - 1);

  const strip = useRef<HTMLDivElement>(null);
  const raised = useRef<HTMLSpanElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const rig = useRef<Rig>({
    asked: -1,
    dir: 1,
    from: 0,
    pending: false,
    shown: 0,
    span: Infinity,
    sw: new Spring(10, 320, 26),
    sx: new Spring(0, 320, 23),
    up: new Spring(0, 420, 13),
  });

  // runs after the tabs have their new weights, so the widths read are the new ones
  useLayoutEffect(() => {
    const r = rig.current;
    const tab = buttons.current[picked];
    if (tab) {
      aim(r, tab, r.asked !== picked);
    }
    r.asked = -1;
    r.shown = picked;
    // the raised tab stays hidden until it has been measured once, then the clock moves it
    const ind = raised.current;
    if (ind?.style.visibility) {
      paint(r, ind);
      ind.style.visibility = "";
    }
  }, [picked]);

  useEffect(() => {
    if (!strip.current) {
      return;
    }
    const watch = new ResizeObserver(() => {
      const tab = buttons.current[rig.current.shown];
      if (tab) {
        follow(rig.current, tab);
      }
    });
    watch.observe(strip.current);
    return () => watch.disconnect();
  }, []);

  useFrame((dt) => {
    const r = rig.current;
    const ind = raised.current;
    if (!ind) {
      return;
    }
    const { sx } = r;
    const x = sx.step(dt);
    r.sw.step(dt);
    r.up.step(dt);
    paint(r, ind);
    const tab = buttons.current[r.shown];
    if (r.pending && tab && Math.abs(x - sx.to) < 3) {
      // it has landed
      r.pending = false;
      r.up.x = -7;
      const c = at(tab);
      const { dir } = r;
      ticks(c.x, c.y - c.h / 2 - 12, {
        dir: -Math.PI / 2,
        fan: 0.5,
        len: 15,
        life: 0.5,
        n: 3,
        r: 4,
      });
      puff(c.x - dir * (c.w / 2 + 12), c.y - 6, {
        life: 0.7,
        n: 4,
        size: 9,
        vx: -dir * 20,
        vy: -12,
      });
      later(90, () =>
        puff(c.x - dir * (c.w / 2 + 20), c.y + 14, { life: 0.55, n: 3, size: 6, vx: -dir * 14 }),
      );
      lines(c.x - (dir * c.w) / 2, c.y, { dir: dir > 0 ? Math.PI : 0, len: 34, n: 4, spread: 10 });
    }
  });

  const pick = (index: number) => {
    const i = clamp(index, 0, list.length - 1);
    const tab = list[i];
    if (i === picked || !tab) {
      return;
    }
    rig.current.asked = i;
    if (selected === undefined) {
      setOwn(i);
    }
    onSelectedChange?.(i, { label: tab.label, value: tab.value });
    // a pick the parent turned down must not lend its landing to a later change from code
    queueMicrotask(() => {
      rig.current.asked = -1;
    });
  };

  const keydown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const d = STEPS.get(e.key);
    if (!d) {
      return;
    }
    e.preventDefault();
    const ends = d < 0 ? 0 : list.length - 1;
    const n = Math.abs(d) > 1 ? ends : (i + d + list.length) % list.length;
    pick(n);
    buttons.current[n]?.focus();
  };

  return (
    <span
      className={`relative isolate mt-[10px] inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) ${FONT_BODY} ${className}`}
    >
      <SakugaStyle />
      <div
        ref={strip}
        role="tablist"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        className="relative flex rounded-[12px] border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) shadow-(--sk-sh)"
      >
        {list.length > 0 && (
          <span
            ref={raised}
            style={HIDDEN}
            className="absolute top-[-11px] bottom-[-1px] left-0 ml-[calc(var(--sk-bw)*-1)] w-[10px] rounded-t-[13px] border-[length:var(--sk-bw)] border-b-0 border-(--sk-ink) bg-(--sk-card) will-change-[transform,width]"
          />
        )}
        {list.map((tab, i) => {
          const on = i === picked;
          const bare = i === 0 || on || i === picked + 1;
          return (
            <button
              key={`${i}:${tab.value}`}
              ref={(node) => {
                buttons.current[i] = node;
              }}
              type="button"
              role="tab"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              data-value={tab.value}
              className={`${TAB} ${on ? "-translate-y-[5px] font-extrabold" : "font-semibold"} ${bare ? "border-l-transparent" : "border-l-(--sk-ink)"}`}
              onClick={() => pick(i)}
              onKeyDown={(e) => keydown(e, i)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </span>
  );
};
