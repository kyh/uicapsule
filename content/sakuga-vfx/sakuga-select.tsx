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
// typeahead, the placement and the form value. The root holds `open` and `value` when no parent
// does, so the springs start in the same turn as the click, and a form reset can put the default
// back; it also keeps the popup mounted until the shrink has finished.

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "cn";
import { createContext, use, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

import { Spring, at, clamp, later, puff, sfx, ticks } from "./sakuga-core";
import type { Squashy } from "./sakuga-core";
import {
  FONT_BODY,
  FONT_DISPLAY,
  SakugaStyle,
  useFrame,
  useMergedRef,
  useSquashy,
} from "./sakuga-react";
import type { Styled } from "./sakuga-react";

// What the parts share: the elements the reactions move, and the springs that move them.
interface Rig {
  // the trigger's place on the page, which does not squash; the menu hangs from it
  anchor: HTMLElement | null;
  trigger: HTMLElement | null;
  text: HTMLElement | null;
  chevron: SVGElement | null;
  popup: HTMLElement | null;
  raised: HTMLElement | null;
  rows: Set<HTMLElement>;
  squash: Squashy | null;
  out: Spring;
  flip: Spring;
  rowY: Spring;
  rowH: Spring;
  land: Spring;
  // open as the root last rendered it, and which opening or closing this is
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
  under: HTMLElement | null;
  jump: boolean;
}

const makeRig = (): Rig => ({
  anchor: null,
  byHand: false,
  chevron: null,
  flip: new Spring(0, 420, 13),
  held: false,
  jump: true,
  kept: false,
  land: new Spring(1, 600, 13),
  open: false,
  out: new Spring(0, 460, 20),
  pick: 0,
  popup: null,
  raised: null,
  rowH: new Spring(0, 320, 26),
  rowY: new Spring(0, 320, 23),
  rows: new Set(),
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

const rowWith = (rig: Rig, mark: "highlighted" | "selected") => {
  for (const row of rig.rows) {
    if (row.dataset[mark] !== undefined) {
      return row;
    }
  }
  return null;
};

// the open: two puffs off the menu's far corners and the word by the trigger
const openEffects = (rig: Rig) => {
  const { popup: m, trigger: b } = rig;
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

// The root has rendered open or shut: the springs turn round in that same turn.
const turn = (rig: Rig, open: boolean) => {
  if (open === rig.open) {
    return;
  }
  rig.open = open;
  rig.seq += 1;
  if (!open) {
    rig.kept = true;
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
const stepMenu = (rig: Rig, dt: number) => {
  const s = rig.out;
  const want = rig.open || rig.held ? 1 : 0;
  s.to = want;
  s.d = want ? 20 : 34;
  rig.flip.to = want;
  const y = Math.max(0, s.step(dt));
  if (rig.chevron) {
    rig.chevron.style.transform = `rotate(${(rig.flip.step(dt) * 180).toFixed(1)}deg)`;
  }
  const m = rig.popup;
  if (m) {
    // stretched while it travels, squashed as it turns back: the volume stays
    const st = clamp(1 + s.v * 0.012, 0.82, 1.22);
    m.style.transform = `scale(${(y / st).toFixed(4)}, ${(y * st).toFixed(4)}) rotate(${((1 - y) * (isUp(m) ? 7 : -7)).toFixed(2)}deg)`;
  }
  if (want === 0 && rig.kept && y < 0.004) {
    rig.kept = false;
    return true;
  }
  return false;
};

// the raised highlight, behind whichever row Base UI has highlighted
const stepRaised = (rig: Rig, dt: number) => {
  const { raised } = rig;
  if (!raised) {
    return;
  }
  if (rig.open && !rig.held) {
    // it starts on the chosen row, and stays under a row that has just been picked
    const lit = rowWith(rig, "highlighted") ?? (rig.under ? null : rowWith(rig, "selected"));
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
  for (const row of rig.rows) {
    const mid = row.offsetTop + row.offsetHeight / 2;
    row.toggleAttribute("data-on", mid > top && mid < top + h);
  }
};

// One frame of everything the select moves. True when the popup may be unmounted.
const stepRig = (rig: Rig, dt: number) => {
  const gone = stepMenu(rig, dt);
  stepRaised(rig, dt);
  if (rig.text) {
    const p = rig.land.step(dt);
    rig.text.style.transform =
      Math.abs(p - 1) < 0.001 ? "" : `scale(${(1 + (1 - p) * 0.5).toFixed(3)}, ${p.toFixed(3)})`;
  }
  return gone;
};

// a choice: the row inverts, the menu waits a beat, and the label lands if it really changed
const chosen = (rig: Rig, pressed: EventTarget | null) => {
  const { text } = rig;
  const was = text?.textContent ?? "";
  rig.pick += 1;
  const n = rig.pick;
  const landIfChanged = () => {
    if (n === rig.pick && (text?.textContent ?? "") !== was) {
      landEffects(rig);
    }
  };
  if (!rig.open) {
    // changed with the menu shut (typing on the trigger): only the label has anything to do
    later(0, landIfChanged);
    return;
  }
  let row = rowWith(rig, "highlighted");
  if (pressed instanceof Node) {
    for (const each of rig.rows) {
      if (each.contains(pressed)) {
        row = each;
      }
    }
  }
  // picking the row that is already chosen changes nothing: the menu just shrinks away
  if (!row || row.dataset.selected !== undefined) {
    return;
  }
  // a tap gives no hover first: the highlight goes where the pick is
  aim(rig, row, true);
  // the impact frame, on the row
  const hit = row;
  hit.dataset.inv = "";
  later(190, () => {
    delete hit.dataset.inv;
  });
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
  inputRef,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  value: valueProp,
  defaultValue,
  onValueChange,
  children,
  ...props
}: SelectPrimitive.Root.Props<Value, Multiple>) => {
  const rigRef = useMemo(() => ({ current: makeRig() }), []);
  const ownActions = useRef<SelectPrimitive.Root.Actions>(null);
  const actions = actionsRef ?? ownActions;
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = openProp ?? ownOpen;
  // The root holds the value when no parent does, so a form reset can put the default back.
  const [ownValue, setOwnValue] = useState(defaultValue);
  const owned = valueProp !== undefined;
  const field = useRef<HTMLInputElement>(null);
  const fieldRef = useMergedRef(field, inputRef);

  // The springs follow what was really rendered, so a parent that refuses a change moves nothing.
  useLayoutEffect(() => {
    turn(rigRef.current, open);
  }, [open, rigRef]);

  // A form reset puts the default back, and plays nothing.
  useEffect(() => {
    const form = field.current?.form;
    if (!form || owned) {
      return;
    }
    const reset = () => setOwnValue(defaultValue);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [owned, defaultValue]);

  useFrame((dt) => {
    if (stepRig(rigRef.current, dt)) {
      // the shrink has finished: now Base UI may take the popup away
      actions.current?.unmount();
    }
  });

  return (
    <SelectPrimitive.Root
      // Not modal: the page behind stays scrollable and clickable while the menu is out, as it
      // does under a native select; a press outside closes the menu and still reaches its target.
      modal={false}
      {...props}
      actionsRef={actions}
      inputRef={fieldRef}
      open={open}
      value={owned ? valueProp : ownValue}
      onOpenChange={(next, details) => {
        onOpenChange?.(next, details);
        if (details.isCanceled) {
          return;
        }
        if (next) {
          rigRef.current.byHand =
            details.reason !== "none" && details.reason !== "imperative-action";
        } else {
          // the popup stays until the spring has shrunk it away
          details.preventUnmountOnClose();
        }
        setOwnOpen(next);
      }}
      onValueChange={(value, details) => {
        onValueChange?.(value, details);
        if (details.isCanceled) {
          return;
        }
        if (details.reason !== "none") {
          chosen(rigRef.current, details.event.target);
        }
        if (!owned) {
          setOwnValue(value);
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
  ref,
  onMouseDown,
  onPointerDown,
  ...props
}: Styled<SelectPrimitive.Trigger.Props>) => {
  const rigRef = useRig();
  const el = useRef<HTMLButtonElement>(null);
  const triggerRef = useMergedRef(
    el,
    (node: HTMLButtonElement | null) => {
      rigRef.current.trigger = node;
    },
    ref,
  );
  const sqRef = useSquashy(el, PRESS);
  // the press squash steps here; the root reaches it to give the trigger its small kicks
  useFrame((dt) => {
    rigRef.current.squash = sqRef.current;
    sqRef.current?.step(dt);
  });
  return (
    <span
      ref={(node) => {
        rigRef.current.anchor = node;
      }}
      data-slot="sakuga-select-anchor"
      className="relative isolate inline-block align-middle"
    >
      <SelectPrimitive.Trigger
        data-slot="sakuga-select-trigger"
        className={cn(
          "flex w-full min-w-[196px] cursor-pointer touch-manipulation items-center justify-between gap-[14px] rounded-(--sk-r) border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) py-[11px] pr-[14px] pl-[18px] text-left text-[17px] leading-[1.1] font-extrabold tracking-[-0.01em] text-(--sk-ink) italic shadow-(--sk-sh) will-change-transform select-none focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) data-disabled:cursor-not-allowed data-disabled:opacity-45",
          FONT_DISPLAY,
          className,
        )}
        {...props}
        ref={triggerRef}
        // The menu opens on the click, not the press: the trigger squashes while it is held and
        // the menu springs out on release. Base UI then treats the click as it does a key press.
        onMouseDown={(e) => {
          onMouseDown?.(e);
          e.preventBaseUIHandler();
        }}
        onPointerDown={(e) => {
          onPointerDown?.(e);
          e.preventBaseUIHandler();
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
    </span>
  );
};

const SakugaSelectValue = ({ className, ref, ...props }: Styled<SelectPrimitive.Value.Props>) => {
  const rigRef = useRig();
  const textRef = useMergedRef((node: HTMLSpanElement | null) => {
    rigRef.current.text = node;
  }, ref);
  return (
    <SelectPrimitive.Value
      data-slot="sakuga-select-value"
      className={cn("min-w-0 origin-left truncate will-change-transform", className)}
      {...props}
      ref={textRef}
    />
  );
};

// The menu. It rests 13px off the trigger, level with its left edge, and scrolls inside whatever
// room Base UI finds for it.
const SakugaSelectContent = ({
  className,
  children,
  ref,
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
  const popupRef = useMergedRef((node: HTMLDivElement | null) => {
    rigRef.current.popup = node;
  }, ref);
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        anchor={() => rigRef.current.anchor}
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
            "w-max max-w-[min(300px,calc(100vw-32px))] min-w-(--anchor-width) origin-[50%_-16px] rounded-[13px] border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) p-[5px] text-[15px] leading-[1.4] font-medium text-(--sk-ink) shadow-(--sk-sh) outline-none [transform:scale(0)] will-change-transform data-closed:pointer-events-none data-[side=top]:origin-[50%_calc(100%+16px)]",
            FONT_BODY,
            className,
          )}
          {...props}
          ref={popupRef}
        >
          <SelectPrimitive.List className="relative max-h-[min(320px,calc(var(--available-height)-17px))] overflow-y-auto overscroll-contain outline-none [scrollbar-color:var(--sk-ink)_transparent] [scrollbar-width:thin]">
            <span
              ref={(node) => {
                rigRef.current.raised = node;
              }}
              aria-hidden
              className="absolute top-0 right-0 left-0 rounded-[9px] border-[2.4px] border-(--sk-ink) bg-(--sk-soft) will-change-transform"
            />
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
};

// Each label carries a halo in the colour of what is behind it, so the highlight's ink edge parts
// round the letters as it crosses a row instead of striking them through. `data-[selected]` is
// spelled with brackets because a host app may define its own `data-selected:` variant.
const SakugaSelectItem = ({
  className,
  children,
  ref,
  ...props
}: Styled<SelectPrimitive.Item.Props>) => {
  const rigRef = useRig();
  const rowRef = useMergedRef((node: HTMLDivElement | null) => {
    if (!node) {
      return;
    }
    const { rows } = rigRef.current;
    rows.add(node);
    return () => {
      rows.delete(node);
    };
  }, ref);
  return (
    <SelectPrimitive.Item
      data-slot="sakuga-select-item"
      className={cn(
        "group/sk-row relative flex cursor-pointer items-center justify-between gap-[14px] rounded-[9px] px-[12px] py-[9px] text-[15px] leading-[1.2] font-semibold whitespace-nowrap outline-none select-none [paint-order:stroke_fill] [-webkit-text-stroke:3px_var(--sk-card)] data-disabled:cursor-not-allowed data-disabled:opacity-45 data-on:[-webkit-text-stroke-color:var(--sk-soft)] data-[selected]:font-extrabold data-inv:bg-(--sk-ink) data-inv:text-(--sk-card) data-inv:[-webkit-text-stroke-color:var(--sk-ink)]!",
        className,
      )}
      {...props}
      ref={rowRef}
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
};

const SakugaSelectGroup = ({ className, ...props }: Styled<SelectPrimitive.Group.Props>) => (
  <SelectPrimitive.Group data-slot="sakuga-select-group" className={className} {...props} />
);

// A group's heading: small, heavy and dim, set in from the rows' left edge like their labels.
const SakugaSelectLabel = ({ className, ...props }: Styled<SelectPrimitive.GroupLabel.Props>) => (
  <SelectPrimitive.GroupLabel
    data-slot="sakuga-select-label"
    className={cn(
      "px-[12px] pt-[8px] pb-[4px] text-[12px] leading-[1.2] font-extrabold tracking-[0.04em] whitespace-nowrap text-(--sk-dim) uppercase select-none",
      className,
    )}
    {...props}
  />
);

// A rule between groups, in the same ink line as the number field's dividers.
const SakugaSelectSeparator = ({
  className,
  ...props
}: Styled<SelectPrimitive.Separator.Props>) => (
  <SelectPrimitive.Separator
    data-slot="sakuga-select-separator"
    className={cn("mx-[4px] my-[5px] h-[2.4px] rounded-full bg-(--sk-ink)", className)}
    {...props}
  />
);

export {
  SakugaSelect,
  SakugaSelectContent,
  SakugaSelectGroup,
  SakugaSelectItem,
  SakugaSelectLabel,
  SakugaSelectSeparator,
  SakugaSelectTrigger,
  SakugaSelectValue,
};
