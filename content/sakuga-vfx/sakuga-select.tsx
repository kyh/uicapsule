"use client";

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

const noop = () => null;

interface Rig {
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
  open: boolean;
  seq: number;
  pick: number;
  byHand: boolean;
  kept: boolean;
  held: boolean;
  under: HTMLElement | null;
  jump: boolean;
}

const makeRig = () => {
  const rig: Rig = {
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
  };

  return rig;
};

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

const ring = (rig: Rig, on: boolean) => {
  rig.trigger?.toggleAttribute("data-ring", on);
};

const openEffects = (rig: Rig) => {
  const { popup: m, trigger: b } = rig;

  if (!b || !m) {
    return;
  }

  const above = isUp(m);
  const q = at(b);
  const left = q.x - q.w / 2;
  const right = left + m.offsetWidth;
  const far = above ? -1 : 1;
  const end = q.y + far * (q.h / 2 + 13 + m.offsetHeight);
  puff(left - 9, end - far * 16, { life: 0.8, n: 4, size: 8, vx: -14, vy: -6 });
  puff(right + 13, end - far * 30, { life: 0.7, n: 3, size: 7, vx: 14, vy: -10 });
  sfx("shu", q.x + q.w / 2 + (above ? -34 : 4), q.y - far * (q.h / 2 + (above ? 30 : 36)), {
    col: "#5a4fd8",
    edge: "#ffffff",
    life: 0.75,
    rot: -0.16,
    size: 88,
  });
};

const landEffects = (rig: Rig) => {
  const b = rig.trigger;

  if (b?.isConnected !== true) {
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
    const st = clamp(1 + s.v * 0.012, 0.82, 1.22);
    m.style.transform = `scale(${(y / st).toFixed(4)}, ${(y * st).toFixed(4)}) rotate(${((1 - y) * (isUp(m) ? 7 : -7)).toFixed(2)}deg)`;
  }

  if (want === 0 && rig.kept && y < 0.004) {
    rig.kept = false;

    return true;
  }

  return false;
};

const stepRaised = (rig: Rig, dt: number) => {
  const { raised } = rig;

  if (!raised) {
    return;
  }

  if (rig.open && !rig.held) {
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

  for (const row of rig.rows) {
    const mid = row.offsetTop + row.offsetHeight / 2;
    row.toggleAttribute("data-on", mid > top && mid < top + h);
  }
};

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

  if (!row || row.dataset.selected !== undefined) {
    return;
  }

  aim(rig, row, true);
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
  const { multiple } = props;

  const start = useMemo(
    () => (defaultValue ?? (multiple === true ? [] : null)) as typeof valueProp,
    [defaultValue, multiple],
  );

  const [ownValue, setOwnValue] = useState(start);
  const owned = valueProp !== undefined;
  const field = useRef<HTMLInputElement>(null);
  const fieldRef = useMergedRef(field, inputRef);

  useLayoutEffect(() => {
    turn(rigRef.current, open);
  }, [open, rigRef]);

  useEffect(() => {
    const form = field.current?.form;

    if (!form || owned) {
      return noop;
    }

    const reset = () => {
      setOwnValue(start);
    };

    form.addEventListener("reset", reset);

    return () => {
      form.removeEventListener("reset", reset);
    };
  }, [owned, start]);

  useFrame((dt) => {
    if (stepRig(rigRef.current, dt)) {
      actions.current?.unmount();
    }
  });

  return (
    <SelectPrimitive.Root
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

          if (rigRef.current.trigger?.matches(":focus-visible") === true) {
            ring(rigRef.current, true);
          }
        } else {
          if (details.reason === "focus-out" || details.reason === "outside-press") {
            ring(rigRef.current, false);
          }

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
  onBlur,
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
          "flex w-full min-w-[196px] cursor-pointer touch-manipulation items-center justify-between gap-[14px] rounded-(--sk-r) border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) py-[11px] pr-[14px] pl-[18px] text-left text-[17px] leading-[1.1] font-extrabold tracking-[-0.01em] text-(--sk-ink) italic shadow-(--sk-sh) will-change-transform select-none focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) data-disabled:cursor-not-allowed data-disabled:opacity-45 data-ring:outline-[2.5px] data-ring:outline-offset-[3px] data-ring:outline-(--sk-acc)",
          FONT_DISPLAY,
          className,
        )}
        {...props}
        ref={triggerRef}
        onBlur={(e) => {
          onBlur?.(e);
          const to = e.relatedTarget;

          if (!(to instanceof Node && rigRef.current.popup?.contains(to) === true)) {
            ring(rigRef.current, false);
          }
        }}
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

const SakugaSelectContent = ({
  className,
  children,
  ref,
  onKeyDownCapture,
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
          onKeyDownCapture={(e) => {
            onKeyDownCapture?.(e);
            ring(rigRef.current, true);
          }}
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

const SakugaSelectItem = ({
  className,
  children,
  ref,
  ...props
}: Styled<SelectPrimitive.Item.Props>) => {
  const rigRef = useRig();

  const rowRef = useMergedRef((node: HTMLDivElement | null) => {
    if (!node) {
      return undefined;
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
