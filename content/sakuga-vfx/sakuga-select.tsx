"use client";

// Sakuga Select: a dropdown on Base UI's Select. The menu springs out of the trigger the way the
// tooltip's bubble does, the chevron flips over, two puffs leave its far corners and シュッ lands by
// the trigger. A raised highlight slides between the rows, stretching as it goes. Choose a row and
// it inverts for one frame, the menu shrinks back into the trigger, and the new label lands with
// wedges and one puff. Close it without choosing and it just shrinks away.
//
//   <SakugaSelect defaultValue="key" items={stages}>
//     <SakugaSelectTrigger aria-label="Stage">
//       <SakugaSelectValue />
//     </SakugaSelectTrigger>
//     <SakugaSelectContent>
//       <SakugaSelectItem value="key">Key frames</SakugaSelectItem>
//       …
//     </SakugaSelectContent>
//   </SakugaSelect>
//
// The parts share one set of springs through the root. Base UI owns the list, the keys, the
// typeahead, the placement and the form value; the root only keeps the popup mounted until the
// shrink has finished.

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "cn";
import { createContext, use, useMemo, useRef } from "react";
import type { RefObject } from "react";

import { Spring, at, clamp, later, puff, sfx, ticks } from "./sakuga-core";
import { FONT_BODY, FONT_DISPLAY, SakugaStyle, useFrame, useSquashy } from "./sakuga-react";
import type { Squashy } from "./sakuga-core";

type Styled<Props> = Omit<Props, "className"> & { className?: string };

// What the parts share: the elements the reactions move, and the springs that move them.
interface Rig {
  trigger: HTMLElement | null;
  text: HTMLElement | null;
  chevron: Element | null;
  popup: HTMLElement | null;
  list: HTMLElement | null;
  raised: HTMLElement | null;
  squash: Squashy | null;
  out: Spring;
  flip: Spring;
  rowY: Spring;
  rowH: Spring;
  land: Spring;
  // was it open last frame, and which reaction is this
  open: boolean;
  seq: number;
  // which choice this is: a later one cancels the landing of the one before
  pick: number;
  // a person opened it, so the open may draw
  byHand: boolean;
  // the popup is being kept for the shrink and must be let go when it has gone
  kept: boolean;
  // a choice has been made and the menu waits a beat before it shrinks
  held: boolean;
  // the row the raised highlight is behind, and whether its next move is a jump
  under: Element | null;
  jump: boolean;
}

const makeRig = (): Rig => ({
  byHand: false,
  chevron: null,
  flip: new Spring(0, 420, 13),
  held: false,
  jump: true,
  kept: false,
  land: new Spring(1, 600, 13),
  list: null,
  open: false,
  out: new Spring(0, 460, 20),
  pick: 0,
  popup: null,
  raised: null,
  rowH: new Spring(0, 320, 26),
  rowY: new Spring(0, 320, 23),
  seq: 0,
  squash: null,
  text: null,
  trigger: null,
  under: null,
});

const RigContext = createContext<RefObject<Rig> | null>(null);

const useRig = () => {
  const rigRef = use(RigContext);
  if (!rigRef) {
    throw new Error("SakugaSelect parts must be inside <SakugaSelect>");
  }
  return rigRef;
};

const isUp = (popup: HTMLElement) => popup.dataset.side === "top";

// the open: two puffs off the menu's far corners and the word by the trigger
const openEffects = (rig: Rig) => {
  const { trigger: b, popup: m } = rig;
  if (!b || !m) {
    return;
  }
  const above = isUp(m);
  const q = at(b);
  // where the menu will come to rest, not where the overshoot has it now
  const left = q.x - q.w / 2;
  const right = left + m.offsetWidth;
  const far = above ? -1 : 1;
  const end = q.y + far * (q.h / 2 + 13 + m.offsetHeight);
  puff(left - 9, end - far * 16, { life: 0.8, n: 4, size: 8, vx: -14, vy: -6 });
  puff(right + 13, end - far * 30, { life: 0.7, n: 3, size: 7, vx: 14, vy: -10 });
  // flipped, the word tucks in under the trigger so it stays in the control's own column
  sfx("shu", q.x + q.w / 2 + (above ? -34 : 4), q.y - far * (q.h / 2 + (above ? 30 : 36)), {
    col: "#5a4fd8",
    edge: "#ffffff",
    life: 0.75,
    rot: -0.16,
    size: 88,
  });
};

// the new label lands on the trigger
const landEffects = (rig: Rig) => {
  const b = rig.trigger;
  if (!b?.isConnected) {
    return;
  }
  rig.land.x = 0.68;
  if (rig.squash) {
    rig.squash.s.v += 3;
  }
  const c = at(b, 1, 0);
  const q = at(b);
  ticks(c.x - 8, c.y - 4, { dir: -1.05, fan: 0.36, len: 17, life: 0.5, n: 3, r: 5 });
  puff(q.x - q.w / 2 - 9, q.y + q.h / 2 - 2, { life: 0.6, n: 3, size: 7, vx: -12, vy: -8 });
};

// point the raised highlight at a row; a jump puts it there without the slide
const aim = (rig: Rig, row: HTMLElement, jump: boolean) => {
  rig.under = row;
  rig.rowY.to = row.offsetTop;
  rig.rowH.to = row.offsetHeight;
  if (jump) {
    rig.rowY.x = rig.rowY.to;
    rig.rowY.v = 0;
    rig.rowH.x = rig.rowH.to;
    rig.rowH.v = 0;
  }
};

// it has just opened, or just shut
const edge = (rig: Rig, open: boolean) => {
  if (open === rig.open) {
    return;
  }
  rig.open = open;
  rig.seq += 1;
  if (!open) {
    return;
  }
  rig.kept = false;
  rig.jump = true;
  rig.under = null;
  if (rig.squash) {
    rig.squash.s.v += 2;
  }
  if (rig.byHand) {
    const n = rig.seq;
    later(120, () => {
      if (n === rig.seq) {
        openEffects(rig);
      }
    });
  }
  rig.byHand = false;
};

// the menu out of the trigger and back, and the chevron over; true once a kept popup has gone
const stepMenu = (rig: Rig, open: boolean, dt: number) => {
  const s = rig.out;
  // `kept` is set the moment a person closes it, a little before Base UI's attribute follows
  const want = (open && !rig.kept) || rig.held ? 1 : 0;
  s.to = want;
  s.d = want ? 20 : 34;
  rig.flip.to = want;
  const y = Math.max(0, s.step(dt));
  if (rig.chevron instanceof SVGElement) {
    rig.chevron.style.transform = `rotate(${(rig.flip.step(dt) * 180).toFixed(1)}deg)`;
  }
  const m = rig.popup;
  if (!m) {
    return false;
  }
  // stretched while it travels, squashed as it turns back: the volume stays
  const st = clamp(1 + s.v * 0.012, 0.82, 1.22);
  m.style.transform = `scale(${(y / st).toFixed(4)}, ${(y * st).toFixed(4)}) rotate(${((1 - y) * (isUp(m) ? 7 : -7)).toFixed(2)}deg)`;
  if (!open && rig.kept && y < 0.004) {
    rig.kept = false;
    return true;
  }
  return false;
};

// the raised highlight, behind whichever row Base UI has highlighted
const stepRaised = (rig: Rig, open: boolean, dt: number) => {
  const { list, raised } = rig;
  if (!list || !raised) {
    return;
  }
  if (open && !rig.held) {
    // it starts on the chosen row, and stays under a row that has just been picked
    const lit =
      list.querySelector<HTMLElement>("[data-highlighted]") ??
      (rig.under ? null : list.querySelector<HTMLElement>("[data-selected]"));
    if (lit && lit !== rig.under) {
      aim(rig, lit, rig.jump);
      rig.jump = false;
    }
  }
  const ry = rig.rowY;
  const x = ry.step(dt);
  const h = rig.rowH.step(dt) + Math.min(8, Math.abs(ry.v) * 0.04);
  const top = x - (ry.v < 0 ? 0 : h - rig.rowH.x);
  raised.style.transform = `translateY(${top.toFixed(2)}px)`;
  raised.style.height = `${h.toFixed(2)}px`;
  // a label's halo takes the highlight's colour while the highlight is behind it
  for (const row of list.querySelectorAll<HTMLElement>("[role=option]")) {
    const mid = row.offsetTop + row.offsetHeight / 2;
    row.toggleAttribute("data-on", mid > top && mid < top + h);
  }
};

// One frame of everything the select moves. True when the popup may be unmounted.
const stepRig = (rig: Rig, dt: number) => {
  const open = rig.popup?.dataset.open !== undefined;
  edge(rig, open);
  const gone = stepMenu(rig, open, dt);
  stepRaised(rig, open, dt);
  if (rig.text) {
    const p = rig.land.step(dt);
    rig.text.style.transform =
      Math.abs(p - 1) < 0.001 ? "" : `scale(${(1 + (1 - p) * 0.5).toFixed(3)}, ${p.toFixed(3)})`;
  }
  return gone;
};

// a choice: the row inverts, the menu waits a beat, and the label lands if it really changed
const chosen = (rig: Rig, pressed: EventTarget | null) => {
  const { list, text } = rig;
  const was = text?.textContent ?? "";
  rig.pick += 1;
  const n = rig.pick;
  const landIfChanged = () => {
    if (n === rig.pick && (text?.textContent ?? "") !== was) {
      landEffects(rig);
    }
  };
  if (!rig.open || !list) {
    // changed with the menu shut (typing on the trigger): only the label has anything to do
    later(0, landIfChanged);
    return;
  }
  const row =
    (pressed instanceof Element ? pressed.closest<HTMLElement>("[role=option]") : null) ??
    list.querySelector<HTMLElement>("[data-highlighted]");
  if (row && list.contains(row)) {
    // a tap gives no hover first: the highlight goes where the pick is
    aim(rig, row, true);
    // the impact frame, on the row
    row.dataset.inv = "";
    later(190, () => {
      delete row.dataset.inv;
    });
  }
  rig.held = true;
  later(50, () => {
    if (n === rig.pick) {
      rig.held = false;
    }
  });
  // the menu is back inside the trigger: the new label lands
  later(190, landIfChanged);
};

const SakugaSelect = <Value, Multiple extends boolean | undefined = false>({
  actionsRef,
  onOpenChange,
  onValueChange,
  children,
  ...props
}: SelectPrimitive.Root.Props<Value, Multiple>) => {
  const rigRef = useMemo(() => ({ current: makeRig() }), []);
  const ownActions = useRef<SelectPrimitive.Root.Actions>(null);
  const actions = actionsRef ?? ownActions;

  useFrame((dt) => {
    if (stepRig(rigRef.current, dt)) {
      // the shrink has finished: now Base UI may take the popup away
      actions.current?.unmount();
    }
  });

  return (
    <SelectPrimitive.Root
      modal={false}
      {...props}
      actionsRef={actions}
      onOpenChange={(open, details) => {
        onOpenChange?.(open, details);
        if (details.isCanceled) {
          return;
        }
        const rig = rigRef.current;
        if (open) {
          rig.kept = false;
          rig.byHand = details.reason !== "none" && details.reason !== "imperative-action";
        } else {
          // the popup stays until the spring has shrunk it away
          details.preventUnmountOnClose();
          rig.kept = true;
        }
      }}
      onValueChange={(value, details) => {
        onValueChange?.(value, details);
        if (!details.isCanceled && details.reason !== "none") {
          chosen(rigRef.current, details.event.target);
        }
      }}
    >
      <SakugaStyle />
      <RigContext value={rigRef}>{children}</RigContext>
    </SelectPrimitive.Root>
  );
};

const PRESS = { low: 0.8, wide: 0.3 };

const SakugaSelectTrigger = ({
  className,
  children,
  ...props
}: Styled<SelectPrimitive.Trigger.Props>) => {
  const rigRef = useRig();
  const el = useRef<HTMLButtonElement>(null);
  const sqRef = useSquashy(el, PRESS);
  // the press squash steps here; the root reaches it to give the trigger its small kicks
  useFrame((dt) => {
    rigRef.current.squash = sqRef.current;
    sqRef.current?.step(dt);
  });
  return (
    <SelectPrimitive.Trigger
      data-slot="sakuga-select-trigger"
      className={cn(
        "relative isolate inline-flex min-w-[196px] cursor-pointer touch-manipulation items-center justify-between gap-[14px] rounded-(--sk-r) bg-(--sk-card) py-[11px] pr-[14px] pl-[18px] text-left align-middle text-[17px] leading-[1.1] [font-weight:800] tracking-[-0.01em] text-(--sk-ink) italic shadow-(--sk-sh) [border:var(--sk-bw)_solid_var(--sk-ink)] will-change-transform select-none focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45",
        FONT_DISPLAY,
        className,
      )}
      {...props}
      ref={(node: HTMLButtonElement | null) => {
        el.current = node;
        rigRef.current.trigger = node;
      }}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <svg
            ref={(node) => {
              rigRef.current.chevron = node;
            }}
            aria-hidden
            viewBox="0 0 20 20"
            className="h-[20px] w-[20px] flex-none fill-none stroke-current stroke-[3.4] will-change-transform [stroke-linecap:round] [stroke-linejoin:round]"
          />
        }
      >
        <path d="M4.5 7.5l5.5 5.5 5.5-5.5" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
};

const SakugaSelectValue = ({ className, ...props }: Styled<SelectPrimitive.Value.Props>) => {
  const rigRef = useRig();
  return (
    <SelectPrimitive.Value
      data-slot="sakuga-select-value"
      className={cn("min-w-0 origin-left truncate will-change-transform", className)}
      {...props}
      ref={(node) => {
        rigRef.current.text = node;
      }}
    />
  );
};

// The menu. It rests 13px off the trigger, level with its left edge, and scrolls inside whatever
// room Base UI finds for it.
const SakugaSelectContent = ({
  className,
  children,
  side = "bottom",
  sideOffset = 13,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  collisionPadding = 12,
  ...props
}: Styled<SelectPrimitive.Popup.Props> &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger" | "collisionPadding"
  >) => {
  const rigRef = useRig();
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        collisionPadding={collisionPadding}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="sakuga-select-content"
          className={cn(
            "w-max max-w-[min(300px,calc(100vw-32px))] min-w-(--anchor-width) origin-[50%_-16px] rounded-[13px] bg-(--sk-card) p-[5px] text-[15px] leading-[1.4] [font-weight:500] text-(--sk-ink) shadow-(--sk-sh) outline-none [border:var(--sk-bw)_solid_var(--sk-ink)] [transform:scale(0)] will-change-transform data-[closed]:pointer-events-none data-[side=top]:origin-[50%_calc(100%+16px)]",
            FONT_BODY,
            className,
          )}
          {...props}
          ref={(node: HTMLDivElement | null) => {
            rigRef.current.popup = node;
          }}
        >
          <SelectPrimitive.List
            ref={(node: HTMLDivElement | null) => {
              rigRef.current.list = node;
            }}
            className="relative max-h-[min(320px,calc(var(--available-height)-17px))] overflow-y-auto overscroll-contain outline-none [scrollbar-color:var(--sk-ink)_transparent] [scrollbar-width:thin]"
          >
            <span
              ref={(node) => {
                rigRef.current.raised = node;
              }}
              aria-hidden
              className="absolute top-0 right-0 left-0 rounded-[9px] bg-(--sk-soft) [border:2.4px_solid_var(--sk-ink)] will-change-transform"
            />
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
};

// Each label carries a halo in the colour of what is behind it, so the highlight's ink edge parts
// round the letters as it crosses a row instead of striking them through.
const SakugaSelectItem = ({
  className,
  children,
  ...props
}: Styled<SelectPrimitive.Item.Props>) => (
  <SelectPrimitive.Item
    data-slot="sakuga-select-item"
    className={cn(
      "group/sk-row relative flex cursor-pointer items-center justify-between gap-[14px] rounded-[9px] px-[12px] py-[9px] text-[15px] leading-[1.2] [font-weight:600] whitespace-nowrap outline-none select-none [paint-order:stroke_fill] [-webkit-text-stroke:3px_var(--sk-card)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 data-on:[-webkit-text-stroke-color:var(--sk-soft)] data-[selected]:[font-weight:800] data-inv:bg-(--sk-ink) data-inv:text-(--sk-card) data-inv:[-webkit-text-stroke-color:var(--sk-ink)]!",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator
      keepMounted
      render={
        <svg
          aria-hidden
          viewBox="0 0 24 18"
          className="invisible h-[12px] w-[16px] flex-none fill-none stroke-(--sk-acc) stroke-[4.6] [stroke-linecap:round] [stroke-linejoin:round] group-data-[selected]/sk-row:visible"
        />
      }
    >
      <path d="M3 9.5l6 6L21 2.5" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
);

export {
  SakugaSelect,
  SakugaSelectContent,
  SakugaSelectItem,
  SakugaSelectTrigger,
  SakugaSelectValue,
};
