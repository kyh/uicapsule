"use client";

// Sakuga Accordion: pick a section and its panel drops open on a spring, shoving the ones below it
// down. Where its bottom edge lands, dust kicks up either side, wedges fly off the header's corner as
// the chevron flips, and a hollow ポン lands on the card's corner. Close it and the panel is sucked
// back up with one small puff. The panel's height is the real thing: the text is there from the first
// frame.
//
// Base UI's Accordion owns the value, the ids and ARIA, and the buttons. The panel stays mounted and
// we own its height: Base UI would hide it the moment it closes, and ours has a spring to finish.

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { cn } from "cn";
import { createContext, use, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { ComponentProps, RefObject } from "react";

import { Spring, at, hollow, later, puff, sfx, ticks } from "./sakuga-core";
import { FONT_BODY, FONT_DISPLAY, SakugaStyle, useFrame } from "./sakuga-react";

type Styled<Props> = Omit<Props, "className"> & { className?: string };

interface Rig {
  // the panel's height, as a share of its content's
  h: Spring;
  // the chevron: 0 points down, 1 points up
  turn: Spring;
  press: Spring;
  // its own header has just been pressed: the change that follows is the person's
  asked: boolean;
  // it is dropping open and has not hit the bottom yet
  landing: boolean;
  // it was closed by its own header, so it gets the puff
  closing: boolean;
  still: boolean;
}

const makeRig = (): Rig => ({
  asked: false,
  closing: false,
  h: new Spring(0, 380, 19),
  landing: false,
  press: new Spring(1, 520, 15),
  still: true,
  turn: new Spring(0, 420, 13),
});

// drop it open, or suck it back up; only a change its own header asked for gets the effects
const aim = (r: Rig, on: boolean, loud: boolean) => {
  r.h.to = on ? 1 : 0;
  r.h.k = on ? 380 : 900;
  r.h.d = on ? 19 : 40;
  r.turn.to = r.h.to;
  r.landing = on && loud;
  r.closing = !on && loud;
  r.still = false;
  r.h.v = on ? Math.max(r.h.v, 5) : Math.min(r.h.v, -6);
};

// the chevron turns over through flat, a little wider as it goes
const flip = (t: number) => {
  const y = 1 - 2 * t;
  return `scale(${(1 + Math.max(0, 1 - Math.abs(y)) * 0.25).toFixed(3)}, ${y.toFixed(3)})`;
};

// one item's moving parts, shared by its trigger and its panel
interface ItemRefs {
  rigRef: RefObject<Rig>;
  headRef: RefObject<HTMLButtonElement | null>;
  chevronRef: RefObject<SVGSVGElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  bodyRef: RefObject<HTMLDivElement | null>;
}

const ItemContext = createContext<ItemRefs | null>(null);

const useItem = () => {
  const item = use(ItemContext);
  if (!item) {
    throw new Error("Sakuga accordion parts go inside a SakugaAccordionItem");
  }
  return item;
};

// the bottom edge lands
const land = (head: HTMLElement, panel: HTMLElement) => {
  const box = head.closest('[data-slot="sakuga-accordion"]');
  if (!box) {
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
const shut = (head: HTMLElement) => {
  const q = at(head, 1, 1);
  puff(q.x + 4, q.y, { life: 0.4, n: 3, size: 7 });
};

// the panel's height and the chevron, one frame on
const stepPanel = (
  r: Rig,
  dt: number,
  head: HTMLElement,
  panel: HTMLElement,
  body: HTMLElement,
  chevron: SVGSVGElement,
) => {
  const h = Math.max(0, r.h.step(dt));
  const t = r.turn.step(dt);
  chevron.style.transform = flip(t);
  if (r.landing && h >= 1) {
    r.landing = false;
    land(head, panel);
  }
  if (r.closing && h < 0.08) {
    r.closing = false;
    shut(head);
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
};

const SakugaAccordion = ({
  className,
  children,
  ...props
}: Styled<AccordionPrimitive.Root.Props>) => (
  <AccordionPrimitive.Root
    data-slot="sakuga-accordion"
    // the font family stays outside cn: tailwind-merge takes it for a font weight and drops ours
    className={`${FONT_BODY} ${cn(
      "relative isolate inline-block w-[270px] max-w-full rounded-(--sk-r) bg-(--sk-card) align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) shadow-(--sk-sh) [border:var(--sk-bw)_solid_var(--sk-ink)]",
      className,
    )}`}
    {...props}
  >
    <SakugaStyle />
    {children}
  </AccordionPrimitive.Root>
);

const SakugaAccordionItem = ({
  className,
  onOpenChange,
  ...props
}: Styled<AccordionPrimitive.Item.Props>) => {
  const rigRef = useRef(makeRig());
  const headRef = useRef<HTMLButtonElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const refs = useMemo(() => ({ bodyRef, chevronRef, headRef, panelRef, rigRef }), []);

  useFrame((dt) => {
    const r = rigRef.current;
    const head = headRef.current;
    const panel = panelRef.current;
    const body = bodyRef.current;
    const chevron = chevronRef.current;
    if (!head) {
      return;
    }
    const y = r.press.step(dt);
    head.style.transform =
      Math.abs(y - 1) < 0.001 && Math.abs(r.press.v) < 0.01
        ? ""
        : `scale(${1 + (1 - y) * 0.14}, ${y})`;
    if (!r.still && panel && body && chevron) {
      stepPanel(r, dt, head, panel, body, chevron);
    }
  });

  return (
    <ItemContext value={refs}>
      <AccordionPrimitive.Item
        data-slot="sakuga-accordion-item"
        className={cn("not-first:border-t-[2.4px] not-first:border-(--sk-ink)", className)}
        {...props}
        onOpenChange={(open, details) => {
          onOpenChange?.(open, details);
          if (details.isCanceled || details.reason !== "trigger-press") {
            return;
          }
          const r = rigRef.current;
          // the header gives, whatever pressed it
          r.press.x = Math.min(r.press.x, 0.86);
          // the panel reacts when the value comes back changed; if it never does, forget it
          r.asked = true;
          later(0, () => {
            r.asked = false;
          });
        }}
      />
    </ItemContext>
  );
};

const HEADER = `group flex w-full cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-[10px] px-[16px] py-[10px] text-left text-[17px] leading-[1.2] font-extrabold tracking-[-0.01em] text-(--sk-ink) italic will-change-transform select-none focus-visible:outline-[2.5px] focus-visible:outline-offset-[-3px] focus-visible:outline-(--sk-acc) data-disabled:cursor-not-allowed data-disabled:opacity-45`;

const SakugaAccordionTrigger = ({
  className,
  children,
  ...props
}: Styled<AccordionPrimitive.Trigger.Props>) => {
  const { rigRef, headRef, chevronRef } = useItem();

  // the header squashes a little while it is held
  useEffect(() => {
    const head = headRef.current;
    if (!head) {
      return;
    }
    const off = new AbortController();
    const hold = (to: number) => () => {
      if (to === 1 || !head.matches(":disabled, [data-disabled]")) {
        rigRef.current.press.to = to;
      }
    };
    head.addEventListener("pointerdown", hold(0.86), { signal: off.signal });
    for (const e of ["pointerup", "pointerleave", "pointercancel", "blur"]) {
      head.addEventListener(e, hold(1), { signal: off.signal });
    }
    return () => off.abort();
  }, [headRef, rigRef]);

  return (
    <AccordionPrimitive.Header data-slot="sakuga-accordion-header">
      <AccordionPrimitive.Trigger
        ref={headRef}
        data-slot="sakuga-accordion-trigger"
        className={`${FONT_DISPLAY} ${cn(HEADER, className)}`}
        {...props}
      >
        {children}
        {/* the class is only how it looks before the first reaction: after that the spring writes the transform */}
        <svg
          ref={chevronRef}
          aria-hidden
          viewBox="0 0 16 16"
          className="h-[16px] w-[16px] flex-none overflow-visible fill-none stroke-(--sk-ink) stroke-[3.2] [stroke-linecap:round] [stroke-linejoin:round] group-data-panel-open:[transform:scaleY(-1)]"
        >
          <path d="M2.5 5.5l5.5 5.5 5.5-5.5" />
        </svg>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
};

// The panel's own element. Base UI marks a closed panel `hidden` at once; ours has a spring to play
// first, so it is never hidden: closed, it is inert and no taller than the spring says.
const PanelShell = ({ open, ...props }: ComponentProps<"div"> & { open: boolean }) => {
  const { rigRef, panelRef, bodyRef, chevronRef } = useItem();
  const was = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    const r = rigRef.current;
    const before = was.current;
    was.current = open;
    if (before === null) {
      // mounted: an open one is simply open
      r.h.x = open ? 1 : 0;
      r.h.to = r.h.x;
      r.turn.x = r.h.x;
      r.turn.to = r.h.x;
      return;
    }
    const panel = panelRef.current;
    const body = bodyRef.current;
    if (before === open || !panel || !body) {
      return;
    }
    aim(r, open, r.asked);
    r.asked = false;
    // before the paint, so the panel never shows a frame at its new resting height
    panel.style.height = `${(r.h.x * body.offsetHeight).toFixed(2)}px`;
    if (chevronRef.current) {
      chevronRef.current.style.transform = flip(r.turn.x);
    }
  }, [open, rigRef, panelRef, bodyRef, chevronRef]);

  return <div {...props} hidden={false} inert={!open} />;
};

const SakugaAccordionContent = ({
  className,
  children,
  ...props
}: Omit<Styled<AccordionPrimitive.Panel.Props>, "keepMounted" | "hiddenUntilFound" | "render">) => {
  const { panelRef, bodyRef } = useItem();
  return (
    <AccordionPrimitive.Panel
      ref={panelRef}
      keepMounted
      data-slot="sakuga-accordion-content"
      // the height class is only how it looks before the first reaction: after that the spring writes it
      className="overflow-hidden not-data-open:h-0"
      render={(panelProps, state) => <PanelShell {...panelProps} open={state.open} />}
      {...props}
    >
      <div
        ref={bodyRef}
        className={cn("px-[16px] pt-[1px] pb-[14px] text-[14px] leading-[1.45]", className)}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
};

export { SakugaAccordion, SakugaAccordionItem, SakugaAccordionTrigger, SakugaAccordionContent };
