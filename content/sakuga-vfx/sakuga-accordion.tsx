"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { cn } from "cn";
import { createContext, use, useLayoutEffect, useMemo, useRef } from "react";
import type { ComponentProps, RefObject } from "react";

import { Spring, at, hollow, later, puff, sfx, ticks } from "./sakuga-core";
import { FONT_BODY, FONT_DISPLAY, SakugaStyle, useFrame, useMergedRef } from "./sakuga-react";
import type { Styled } from "./sakuga-react";

interface Rig {
  h: Spring;
  turn: Spring;
  press: Spring;
  asked: boolean;
  landing: boolean;
  closing: boolean;
  still: boolean;
}

const makeRig = () => ({
  asked: false,
  closing: false,
  h: new Spring(0, 380, 19),
  landing: false,
  press: new Spring(1, 520, 15),
  still: true,
  turn: new Spring(0, 420, 13),
});

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

const flip = (t: number) => {
  const y = 1 - 2 * t;

  return `scale(${(1 + Math.max(0, 1 - Math.abs(y)) * 0.25).toFixed(3)}, ${y.toFixed(3)})`;
};

interface ItemRefs {
  rigRef: RefObject<Rig>;
  headRef: RefObject<HTMLButtonElement | null>;
  chevronRef: RefObject<SVGSVGElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  bodyRef: RefObject<HTMLDivElement | null>;
}

const CardContext = createContext<RefObject<HTMLDivElement | null> | null>(null);
const ItemContext = createContext<ItemRefs | null>(null);

const useItem = () => {
  const item = use(ItemContext);

  if (!item) {
    throw new Error("Sakuga accordion parts go inside a SakugaAccordionItem");
  }

  return item;
};

const land = (card: HTMLElement, head: HTMLElement, panel: HTMLElement) => {
  const k = at(card);
  const p = at(panel, 0.5, 1);
  const q = at(head, 1, 0);
  const left = k.x - k.w / 2;
  const right = k.x + k.w / 2;
  puff(left - 7, p.y - 3, { life: 0.7, n: 4, size: 8, vx: -16, vy: -10 });
  puff(right + 12, p.y + 2, { life: 0.7, n: 4, size: 8, vx: 16, vy: -8 });
  ticks(q.x - 4, q.y + 2, { dir: -0.75, fan: 0.36, len: 15, life: 0.5, n: 3, r: 5 });
  sfx("pon", right - 30, k.y - k.h / 2 - 22, { life: 0.8, rot: 0.06, size: 72, ...hollow() });
};

const shut = (head: HTMLElement) => {
  const q = at(head, 1, 1);
  puff(q.x + 4, q.y, { life: 0.4, n: 3, size: 7 });
};

const stepPanel = (
  r: Rig,
  dt: number,
  card: HTMLElement | null,
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

    if (card) {
      land(card, head, panel);
    }
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
  ref,
  ...props
}: Styled<AccordionPrimitive.Root.Props>) => {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <AccordionPrimitive.Root
      ref={useMergedRef(cardRef, ref)}
      data-slot="sakuga-accordion"
      className={cn(
        "relative isolate inline-block w-[270px] max-w-full rounded-(--sk-r) border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) shadow-(--sk-sh)",
        FONT_BODY,
        className,
      )}
      {...props}
    >
      <SakugaStyle />
      <CardContext value={cardRef}>{children}</CardContext>
    </AccordionPrimitive.Root>
  );
};

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
  const cardRef = use(CardContext);

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
      stepPanel(r, dt, cardRef?.current ?? null, head, panel, body, chevron);
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
          r.press.x = Math.min(r.press.x, 0.86);
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
  ref,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onBlur,
  ...props
}: Styled<AccordionPrimitive.Trigger.Props>) => {
  const { rigRef, headRef, chevronRef } = useItem();

  const hold = (to: number, el: HTMLElement) => {
    if (to === 1 || !el.matches(":disabled, [data-disabled]")) {
      rigRef.current.press.to = to;
    }
  };

  return (
    <AccordionPrimitive.Header data-slot="sakuga-accordion-header">
      <AccordionPrimitive.Trigger
        ref={useMergedRef(headRef, ref)}
        data-slot="sakuga-accordion-trigger"
        className={cn(HEADER, FONT_DISPLAY, className)}
        {...props}
        onPointerDown={(e) => {
          onPointerDown?.(e);
          hold(0.86, e.currentTarget);
        }}
        onPointerUp={(e) => {
          onPointerUp?.(e);
          hold(1, e.currentTarget);
        }}
        onPointerLeave={(e) => {
          onPointerLeave?.(e);
          hold(1, e.currentTarget);
        }}
        onPointerCancel={(e) => {
          onPointerCancel?.(e);
          hold(1, e.currentTarget);
        }}
        onBlur={(e) => {
          onBlur?.(e);
          hold(1, e.currentTarget);
        }}
      >
        {children}
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

const PanelShell = ({ open, ...props }: ComponentProps<"div"> & { open: boolean }) => {
  const { rigRef, panelRef, bodyRef, chevronRef } = useItem();
  const was = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    const r = rigRef.current;
    const before = was.current;
    was.current = open;

    if (before === null) {
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
  ref,
  ...props
}: Omit<Styled<AccordionPrimitive.Panel.Props>, "keepMounted" | "hiddenUntilFound" | "render">) => {
  const { panelRef, bodyRef } = useItem();

  return (
    <AccordionPrimitive.Panel
      ref={useMergedRef(panelRef, ref)}
      keepMounted
      data-slot="sakuga-accordion-content"
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
