"use client";

// Sakuga Tabs: the raised tab itself slides to the one you pick, stretching as it goes, and lands
// with wedges above it, a puff at the side it came from and speed lines behind it.
// Base UI's Tabs underneath: SakugaTabs, SakugaTabsList, SakugaTabsTrigger, SakugaTabsContent.
// A value set from code moves the raised tab without the landing.

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "cn";
import { createContext, use, useEffect, useRef } from "react";
import type { RefObject } from "react";

import { Spring, at, clamp, clock, later, lines, puff, ticks } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

type Styled<Props> = Omit<Props, "className"> & { className?: string };

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
  // the tab the raised tab is on, or going to
  shown: HTMLElement | null;
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

// it has landed
const land = (tab: HTMLElement, dir: number) => {
  const c = at(tab);
  ticks(c.x, c.y - c.h / 2 - 12, { dir: -Math.PI / 2, fan: 0.5, len: 15, life: 0.5, n: 3, r: 4 });
  puff(c.x - dir * (c.w / 2 + 12), c.y - 6, { life: 0.7, n: 4, size: 9, vx: -dir * 20, vy: -12 });
  later(90, () =>
    puff(c.x - dir * (c.w / 2 + 20), c.y + 14, { life: 0.55, n: 3, size: 6, vx: -dir * 14 }),
  );
  lines(c.x - (dir * c.w) / 2, c.y, { dir: dir > 0 ? Math.PI : 0, len: 34, n: 4, spread: 10 });
};

// The clock time of the last change a person made. The list reads it when the active tab changes:
// a change in the same instant was theirs and gets the landing, any other came from code.
const PickContext = createContext<RefObject<number> | null>(null);

const SakugaTabs = ({ className, onValueChange, ...props }: Styled<TabsPrimitive.Root.Props>) => {
  const pickedAt = useRef(-1);
  return (
    <PickContext value={pickedAt}>
      <SakugaStyle />
      <TabsPrimitive.Root
        data-slot="sakuga-tabs"
        className={`${FONT_BODY} ${cn(
          "flex flex-col items-start text-[15px] leading-[1.4] font-medium text-(--sk-ink)",
          className,
        )}`}
        {...props}
        onValueChange={(value, details) => {
          onValueChange?.(value, details);
          if (details.reason === "none" && !details.isCanceled) {
            pickedAt.current = clock.now;
          }
        }}
      />
    </PickContext>
  );
};

// never changes, so React leaves the style alone once the first measure has shown the raised tab
const HIDDEN = { visibility: "hidden" } as const;

const SakugaTabsList = ({
  className,
  children,
  // upstream picks a tab as the arrow keys reach it
  activateOnFocus = true,
  ...props
}: Styled<TabsPrimitive.List.Props>) => {
  const pickedAtRef = use(PickContext);
  const strip = useRef<HTMLDivElement>(null);
  const raised = useRef<HTMLSpanElement>(null);
  const rig = useRef<Rig>({
    dir: 1,
    from: 0,
    pending: false,
    shown: null,
    span: Infinity,
    sw: new Spring(10, 320, 26),
    sx: new Spring(0, 320, 23),
    up: new Spring(0, 420, 13),
  });

  useEffect(() => {
    const list = strip.current;
    const ind = raised.current;
    if (!list || !ind) {
      return;
    }
    const r = rig.current;
    // Base UI owns which tab is active; the raised tab follows what it wrote to the DOM, after
    // the tabs have their new weights, so the widths read are the new ones
    const sync = () => {
      const tab = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (tab === r.shown) {
        return;
      }
      const first = r.shown === null;
      r.shown = tab;
      if (!tab) {
        ind.style.visibility = "hidden";
        return;
      }
      const picked = pickedAtRef !== null && pickedAtRef.current === clock.now;
      if (pickedAtRef) {
        pickedAtRef.current = -1;
      }
      aim(r, tab, first || !picked);
      // the raised tab stays hidden until it has been measured, then the clock moves it
      if (ind.style.visibility) {
        paint(r, ind);
        ind.style.visibility = "";
      }
    };
    sync();
    const active = new MutationObserver(sync);
    active.observe(list, {
      attributeFilter: ["aria-selected"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    const size = new ResizeObserver(() => {
      if (r.shown) {
        follow(r, r.shown);
      }
    });
    size.observe(list);
    return () => {
      active.disconnect();
      size.disconnect();
    };
  }, [pickedAtRef]);

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
    if (r.pending && r.shown && Math.abs(x - sx.to) < 3) {
      r.pending = false;
      r.up.x = -7;
      land(r.shown, r.dir);
    }
  });

  return (
    <TabsPrimitive.List
      ref={strip}
      data-slot="sakuga-tabs-list"
      activateOnFocus={activateOnFocus}
      className={cn(
        "relative mt-[10px] flex rounded-[12px] border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) shadow-(--sk-sh)",
        className,
      )}
      {...props}
    >
      <span
        ref={raised}
        aria-hidden
        data-slot="sakuga-tabs-indicator"
        style={HIDDEN}
        className="absolute top-[-11px] bottom-[-1px] left-0 ml-[calc(var(--sk-bw)*-1)] w-[10px] rounded-t-[13px] border-[length:var(--sk-bw)] border-b-0 border-(--sk-ink) bg-(--sk-card) will-change-[transform,width]"
      />
      {children}
    </TabsPrimitive.List>
  );
};

// The font families are kept outside cn: tailwind-merge reads an arbitrary font-[…] as a weight
// and would drop either it or the weight.
const TAB_FONT = 'font-[-apple-system,"Segoe_UI",system-ui,sans-serif]';

const SakugaTabsTrigger = ({ className, ...props }: Styled<TabsPrimitive.Tab.Props>) => (
  <TabsPrimitive.Tab
    data-slot="sakuga-tabs-trigger"
    className={`${TAB_FONT} ${cn(
      "relative cursor-pointer border-l-[2.4px] border-l-(--sk-ink) px-[15px] py-[10px] text-[15px] leading-[1.2] font-semibold whitespace-nowrap transition-[translate] duration-[180ms] ease-[cubic-bezier(.3,1.6,.5,1)] first-of-type:border-l-transparent focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) data-active:-translate-y-[5px] data-active:border-l-transparent data-active:font-extrabold [[data-active]+&]:border-l-transparent",
      className,
    )}`}
    {...props}
  />
);

const SakugaTabsContent = ({ className, ...props }: Styled<TabsPrimitive.Panel.Props>) => (
  <TabsPrimitive.Panel
    data-slot="sakuga-tabs-content"
    className={cn(
      "focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc)",
      className,
    )}
    {...props}
  />
);

export { SakugaTabs, SakugaTabsList, SakugaTabsTrigger, SakugaTabsContent };
