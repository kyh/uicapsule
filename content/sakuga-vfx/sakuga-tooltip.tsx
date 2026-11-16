"use client";

// Sakuga Tooltip: a hint that springs out of its trigger like a speech bubble, with puffs either
// side, a ring off the trigger and a hollow カチッ, and shrinks back into it.
// Base UI's Tooltip owns the open state, hover, Escape, the portal and the positioning. On top of
// that the trigger keeps the set's own rules: it also opens on any focus and on a tap or click, a
// click on the focused trigger keeps it open, and blur closes it.

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "cn";
import { createContext, use, useId, useLayoutEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";

import { Spring, at, hollow, later, puff, ring, sfx, ticks } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame, useSquashy } from "./sakuga-react";

type Styled<Props> = Omit<Props, "className"> & { className?: string };

// What the parts share: the bubble's spring and the two elements the effects are placed from.
interface Rig {
  open: boolean;
  // the close is being held open by us until the bubble has shrunk away
  held: boolean;
  s: Spring;
  tip: HTMLElement | null;
  trigger: HTMLElement | null;
  // the little jump the trigger makes as the bubble leaves it
  kick: (() => void) | null;
  // the trigger's layout box, as an anchor for the positioner
  still: { contextElement: Element | undefined; getBoundingClientRect: () => DOMRect };
}

interface Shared {
  rigRef: RefObject<Rig>;
  handle: TooltipPrimitive.Handle<unknown>;
  tipId: string;
  triggerId: string;
}

// Where the trigger sits in the layout, without the squash it is drawn with. The bubble is
// anchored to this, so it does not ride the trigger's bounce.
const layoutBox = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  return new DOMRect(r.x + (r.width - w) / 2, r.y + (r.height - h) / 2, w, h);
};

// A rig, with that box as the anchor the positioner measures.
const makeRig = (): RefObject<Rig> => {
  const rigRef: RefObject<Rig> = {
    current: {
      held: false,
      kick: null,
      open: false,
      s: new Spring(0, 460, 15),
      still: {
        get contextElement() {
          return rigRef.current.trigger ?? undefined;
        },
        getBoundingClientRect: () =>
          rigRef.current.trigger ? layoutBox(rigRef.current.trigger) : new DOMRect(),
      },
      tip: null,
      trigger: null,
    },
  };
  return rigRef;
};

// Base UI snaps the positioner to whole pixels. Slide the bubble by the part of a pixel that was
// lost, so it sits exactly on its anchor, as a bubble laid out inside its trigger would.
const unsnap = ({ tip, trigger }: Rig) => {
  const box = tip?.parentElement;
  if (!tip || !trigger || !box) {
    return;
  }
  const { side, align } = box.dataset;
  const gap = Number(box.dataset.gap);
  const a = layoutBox(trigger);
  const p = box.getBoundingClientRect();
  const upright = side === "top" || side === "bottom";
  const flat = side === "left" || side === "right";
  let dx = 0;
  let dy = 0;
  if (upright && align === "center") {
    dx = a.x + a.width / 2 - (p.x + p.width / 2);
  } else if (side === "left") {
    dx = a.x - gap - p.right;
  } else if (side === "right") {
    dx = a.right + gap - p.x;
  }
  if (flat && align === "center") {
    dy = a.y + a.height / 2 - (p.y + p.height / 2);
  } else if (side === "top") {
    dy = a.y - gap - p.bottom;
  } else if (side === "bottom") {
    dy = a.bottom + gap - p.y;
  }
  // more than a pixel is not rounding: the positioner was moved on purpose
  const sub = Math.abs(dx) < 1 && Math.abs(dy) < 1;
  tip.style.translate = sub ? `${dx}px ${dy}px` : "";
};

const SharedContext = createContext<Shared | null>(null);

const useShared = () => {
  const shared = use(SharedContext);
  if (!shared) {
    throw new Error("SakugaTooltip parts must be inside <SakugaTooltip>");
  }
  return shared;
};

const SakugaTooltipProvider = ({ delay = 0, ...props }: TooltipPrimitive.Provider.Props) => (
  <TooltipPrimitive.Provider data-slot="sakuga-tooltip-provider" delay={delay} {...props} />
);

const SakugaTooltip = ({
  open,
  handle,
  actionsRef,
  onOpenChange,
  disableHoverablePopup = true,
  children,
  ...props
}: TooltipPrimitive.Root.Props) => {
  const ownHandle = useMemo(() => TooltipPrimitive.createHandle(), []);
  const ownActions = useRef<TooltipPrimitive.Root.Actions>(null);
  const actions = actionsRef ?? ownActions;
  const rigRef = useMemo(makeRig, []);
  const tipId = useId();
  const triggerId = useId();
  const shared = useMemo(
    () => ({ handle: handle ?? ownHandle, rigRef, tipId, triggerId }),
    [handle, ownHandle, rigRef, tipId, triggerId],
  );

  // the bubble springs out or shrinks back; the effects follow 120ms after it starts out
  const react = (on: boolean) => {
    const rig = rigRef.current;
    if (on === rig.open) {
      return;
    }
    rig.open = on;
    rig.s.to = on ? 1 : 0;
    rig.s.d = on ? 15 : 34;
    if (!on) {
      return;
    }
    rig.kick?.();
    later(120, () => {
      const { tip, trigger } = rig;
      if (!rig.open || !tip || !trigger) {
        return;
      }
      const c = at(tip);
      const q = at(trigger);
      puff(c.x - c.w / 2 - 8, c.y - 12, { life: 0.8, n: 4, size: 8, vx: -14, vy: -10 });
      puff(c.x + c.w / 2 + 10, c.y + 12, { life: 0.8, n: 4, size: 8, vx: 14, vy: -6 });
      puff(c.x - c.w / 2 - 4, c.y + 22, { life: 0.6, n: 3, size: 5, vx: -10 });
      ticks(c.x + c.w / 2 - 2, c.y - c.h / 2 - 6, {
        dir: -1,
        fan: 0.36,
        len: 16,
        life: 0.5,
        n: 3,
        r: 5,
      });
      ring(q.x, q.y - q.h / 2 - 3, { life: 0.5, rx: 22, ry: 5, w: 3 });
      sfx("kachi", c.x + 6, c.y - 46, { life: 0.8, rot: -0.08, size: 96, ...hollow() });
    });
  };

  // owned by a parent: the bubble follows the `open` it is given
  useLayoutEffect(() => {
    if (open !== undefined) {
      react(open);
    }
  });

  useFrame((dt) => {
    const rig = rigRef.current;
    const y = Math.max(0, rig.s.step(dt));
    if (rig.tip) {
      rig.tip.style.transform = `scale(${y}) rotate(${(1 - y) * -10}deg)`;
    }
    if (rig.open || rig.held) {
      unsnap(rig);
    }
    // Base UI was asked to keep the closed bubble on the page; let it go once it has shrunk to nothing
    if (rig.held && !rig.open && y === 0) {
      rig.held = false;
      actions.current?.unmount();
    }
  });

  return (
    <SharedContext value={shared}>
      <SakugaStyle />
      <TooltipPrimitive.Root
        open={open}
        handle={shared.handle}
        actionsRef={actions}
        disableHoverablePopup={disableHoverablePopup}
        onOpenChange={(next, details) => {
          onOpenChange?.(next, details);
          if (details.isCanceled) {
            return;
          }
          if (!next) {
            details.preventUnmountOnClose();
            rigRef.current.held = true;
          }
          if (open === undefined) {
            react(next);
          }
        }}
        {...props}
      >
        {children}
      </TooltipPrimitive.Root>
    </SharedContext>
  );
};

const TRIGGER = `inline-grid size-[42px] cursor-pointer place-items-center rounded-full [border:var(--sk-bw)_solid_var(--sk-ink)] bg-(--sk-card) p-0 align-middle text-[15px] leading-[1.4] font-black text-(--sk-ink) shadow-[4px_5px_0_var(--sk-soft)] focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) ${FONT_BODY}`;

// The trigger is the set's round help button. `delay` is how long a hover waits (none), and
// `closeOnClick` hands the click back to Base UI's rule, where a click closes the hint.
const SakugaTooltipTrigger = ({
  className,
  closeOnClick = false,
  delay = 0,
  onBlur,
  onClick,
  onFocus,
  ...props
}: Styled<TooltipPrimitive.Trigger.Props>) => {
  const { handle, rigRef, tipId, triggerId } = useShared();
  const el = useRef<HTMLButtonElement>(null);
  const sqRef = useSquashy(el, { low: 0.78, wide: 0.3 });

  useLayoutEffect(() => {
    const rig = rigRef.current;
    rig.trigger = el.current;
    rig.kick = () => {
      if (sqRef.current) {
        sqRef.current.s.v += 2;
      }
    };
    return () => {
      rig.trigger = null;
      rig.kick = null;
    };
  }, [rigRef, sqRef]);

  useFrame((dt) => sqRef.current?.step(dt));

  const set = (on: boolean, id: string) => {
    if (on === rigRef.current.open) {
      return;
    }
    if (on) {
      handle.open(id);
    } else {
      handle.close();
    }
  };

  return (
    <TooltipPrimitive.Trigger
      data-slot="sakuga-tooltip-trigger"
      id={triggerId}
      aria-describedby={tipId}
      className={cn(TRIGGER, className)}
      closeOnClick={closeOnClick}
      delay={delay}
      {...props}
      ref={el}
      onFocus={(e) => {
        onFocus?.(e);
        // any focus opens it, not only a keyboard one
        e.preventBaseUIHandler();
        set(true, e.currentTarget.id);
      }}
      onBlur={(e) => {
        onBlur?.(e);
        e.preventBaseUIHandler();
        set(false, e.currentTarget.id);
      }}
      onClick={(e) => {
        onClick?.(e);
        if (!closeOnClick) {
          // a tap opens it, and a click on the focused trigger keeps it open
          const focused = document.activeElement === e.currentTarget;
          set(!rigRef.current.open || focused, e.currentTarget.id);
        }
      }}
    />
  );
};

const TIP = `pointer-events-none w-max max-w-[220px] min-w-[120px] origin-[50%_120%] [transform:scale(0)] rounded-[13px] [border:var(--sk-bw)_solid_var(--sk-ink)] bg-(--sk-card) px-[14px] py-[11px] text-center text-[16px] leading-[1.4] font-extrabold text-(--sk-ink) shadow-(--sk-sh) will-change-transform before:absolute before:top-[calc(100%-4.5px)] before:left-1/2 before:z-1 before:-ml-[6px] before:border-[6px] before:border-t-[8.5px] before:border-transparent before:border-t-(--sk-card) before:content-[''] after:absolute after:top-full after:left-1/2 after:-ml-[9px] after:border-[9px] after:border-t-[12px] after:border-transparent after:border-t-(--sk-ink) after:content-[''] ${FONT_BODY}`;

// The bubble's tail points down at the trigger, so it sits above and does not flip or shift.
const STAY = { align: "none", side: "none" } as const;

const SakugaTooltipContent = ({
  className,
  side = "top",
  sideOffset = 16,
  align = "center",
  alignOffset = 0,
  collisionAvoidance = STAY,
  anchor,
  children,
  ...props
}: Styled<TooltipPrimitive.Popup.Props> &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "anchor" | "collisionAvoidance" | "side" | "sideOffset"
  >) => {
  const { rigRef, tipId } = useShared();
  return (
    <TooltipPrimitive.Portal keepMounted>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor ?? (() => rigRef.current.still)}
        data-gap={anchor ? undefined : Number(sideOffset)}
        collisionAvoidance={collisionAvoidance}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="sakuga-tooltip-content"
          id={tipId}
          role="tooltip"
          className={cn(TIP, className)}
          {...props}
          ref={(node) => {
            rigRef.current.tip = node;
          }}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
};

export { SakugaTooltip, SakugaTooltipContent, SakugaTooltipProvider, SakugaTooltipTrigger };
