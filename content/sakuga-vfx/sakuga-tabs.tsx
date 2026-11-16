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

interface Rig {
  sx: Spring;
  sw: Spring;
  up: Spring;
  pending: boolean;
  dir: number;
  // the index a click or key just asked for: that move gets the landing
  asked: number;
  shown: number;
}

// point the raised tab at a tab; quiet puts it there at once
const aim = (rig: Rig, tab: HTMLElement, quiet: boolean) => {
  rig.dir = Math.sign(tab.offsetLeft - rig.sx.to) || 1;
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

const TAB =
  'relative cursor-pointer border-l-[2.4px] px-[15px] py-[10px] font-[-apple-system,"Segoe_UI",system-ui,sans-serif] text-[15px] leading-[1.2] whitespace-nowrap transition-[translate] duration-[180ms] ease-[cubic-bezier(.3,1.6,.5,1)] focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc)';

export const SakugaTabs = ({
  tabs = DEFAULT_TABS,
  selected,
  defaultSelected = 0,
  onSelectedChange,
  label = "Tabs",
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
    pending: false,
    shown: 0,
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
  }, [picked]);

  useEffect(() => {
    if (!strip.current) {
      return;
    }
    const watch = new ResizeObserver(() => {
      const tab = buttons.current[rig.current.shown];
      if (tab) {
        aim(rig.current, tab, true);
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
    const w = r.sw.step(dt) + Math.min(46, Math.abs(sx.v) * 0.06);
    const u = r.up.step(dt);
    ind.style.transform = `translate(${x - (sx.v < 0 ? 0 : w - r.sw.x)}px, ${u}px)`;
    ind.style.width = `${w}px`;
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
        aria-label={label}
        className="relative flex rounded-[12px] border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) shadow-(--sk-sh)"
      >
        <span
          ref={raised}
          className="absolute top-[-11px] bottom-[-1px] left-0 ml-[calc(var(--sk-bw)*-1)] w-[10px] rounded-t-[13px] border-[length:var(--sk-bw)] border-b-0 border-(--sk-ink) bg-(--sk-card) will-change-[transform,width]"
        />
        {list.map((tab, i) => {
          const on = i === picked;
          const bare = i === 0 || on || i === picked + 1;
          return (
            <button
              key={tab.value}
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
