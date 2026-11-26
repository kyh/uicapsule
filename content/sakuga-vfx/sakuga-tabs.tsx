"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "cn";
import { createContext, use, useEffect, useRef } from "react";
import type { RefObject } from "react";

import { Spring, at, clamp, clock, later, lines, puff, ticks } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame, useMergedRef } from "./sakuga-react";
import type { Styled } from "./sakuga-react";

const noop = () => null;

interface Rig {
  sx: Spring;
  sw: Spring;
  up: Spring;
  pending: boolean;
  dir: number;
  from: number;
  span: number;
  shown: HTMLElement | null;
}

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

const follow = (rig: Rig, tab: HTMLElement) => {
  if (rig.pending) {
    rig.sx.to = tab.offsetLeft;
    rig.sw.to = tab.offsetWidth;
    rig.span = tab.offsetParent?.clientWidth ?? Infinity;
  } else {
    aim(rig, tab, true);
  }
};

const paint = (rig: Rig, ind: HTMLElement) => {
  const { sx } = rig;
  const room = sx.v < 0 ? rig.span - sx.x - rig.sw.x : sx.x;
  const stretch = Math.max(0, Math.min(46, Math.abs(sx.v) * 0.06, Math.abs(sx.x - rig.from), room));
  const w = rig.sw.x + stretch;
  const left = clamp(sx.x - (sx.v < 0 ? 0 : stretch), 0, Math.max(0, rig.span - w));
  ind.style.transform = `translate(${left}px, ${rig.up.x}px)`;
  ind.style.width = `${w}px`;
};

const land = (tab: HTMLElement, dir: number) => {
  const c = at(tab);
  ticks(c.x, c.y - c.h / 2 - 12, { dir: -Math.PI / 2, fan: 0.5, len: 15, life: 0.5, n: 3, r: 4 });
  puff(c.x - dir * (c.w / 2 + 12), c.y - 6, { life: 0.7, n: 4, size: 9, vx: -dir * 20, vy: -12 });
  later(90, () => {
    puff(c.x - dir * (c.w / 2 + 20), c.y + 14, { life: 0.55, n: 3, size: 6, vx: -dir * 14 });
  });
  lines(c.x - (dir * c.w) / 2, c.y, { dir: dir > 0 ? Math.PI : 0, len: 34, n: 4, spread: 10 });
};

const PickContext = createContext<RefObject<number> | null>(null);

const UNTRIED = Symbol("untried");

const SakugaTabs = ({
  className,
  onValueChange,
  onPointerDownCapture,
  ...props
}: Styled<TabsPrimitive.Root.Props>) => {
  const pickedAt = useRef(-1);
  const tried = useRef<unknown>(UNTRIED);

  return (
    <PickContext value={pickedAt}>
      <SakugaStyle />
      <TabsPrimitive.Root
        data-slot="sakuga-tabs"
        className={cn(
          "flex flex-col items-start text-[15px] leading-[1.4] font-medium text-(--sk-ink)",
          FONT_BODY,
          className,
        )}
        {...props}
        onPointerDownCapture={(e) => {
          tried.current = UNTRIED;
          onPointerDownCapture?.(e);
        }}
        onValueChange={(value, details) => {
          if (details.event.type === "click" && Object.is(tried.current, value)) {
            details.cancel();

            return;
          }

          tried.current = details.event.type === "click" ? UNTRIED : value;
          onValueChange?.(value, details);

          if (details.reason === "none" && !details.isCanceled) {
            pickedAt.current = clock.now;
          }
        }}
      />
    </PickContext>
  );
};

const HIDDEN = { visibility: "hidden" } as const;

const SakugaTabsList = ({
  className,
  children,
  activateOnFocus = true,
  ref,
  ...props
}: Styled<TabsPrimitive.List.Props>) => {
  const pickedAtRef = use(PickContext);
  const strip = useRef<HTMLDivElement>(null);
  const stripRef = useMergedRef(strip, ref);
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
      return noop;
    }

    const r = rig.current;

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
      ref={stripRef}
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

const SakugaTabsTrigger = ({ className, ...props }: Styled<TabsPrimitive.Tab.Props>) => (
  <TabsPrimitive.Tab
    data-slot="sakuga-tabs-trigger"
    className={cn(
      "relative cursor-pointer border-l-[2.4px] border-l-(--sk-ink) px-[15px] py-[10px] text-[15px] leading-[1.2] font-semibold whitespace-nowrap transition-[translate] duration-[180ms] ease-[cubic-bezier(.3,1.6,.5,1)] first-of-type:border-l-transparent focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) data-active:-translate-y-[5px] data-active:border-l-transparent data-active:font-extrabold [[data-active]+&]:border-l-transparent",
      '[font-family:-apple-system,"Segoe_UI",system-ui,sans-serif]',
      className,
    )}
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
