"use client";

import { useRender } from "@base-ui/react/use-render";
import { cn } from "cn";
import { createContext, use, useId, useLayoutEffect, useMemo, useRef } from "react";
import type {
  ComponentProps,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  RefObject,
} from "react";

import { Spring, at, hollow, later, puff, ring, sfx, ticks } from "./sakuga-core";
import type { Squashy } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame, useMergedRef, useSquashy } from "./sakuga-react";
import type { Styled } from "./sakuga-react";

interface Rig {
  open: boolean;
  s: Spring;
  tip: HTMLElement | null;
  trigger: HTMLElement | null;
  squashRef: RefObject<Squashy | null> | null;
}

interface Shared {
  rigRef: RefObject<Rig>;
  tipId: string;
  request: (on: boolean) => void;
}

const SharedContext = createContext<Shared | null>(null);

const useShared = () => {
  const shared = use(SharedContext);

  if (!shared) {
    throw new Error("SakugaTooltip parts must be inside <SakugaTooltip>");
  }

  return shared;
};

const makeRig = () => {
  const rig: RefObject<Rig> = {
    current: { open: false, s: new Spring(0, 460, 15), squashRef: null, tip: null, trigger: null },
  };

  return rig;
};

const mark = ({ open, tip, trigger }: Rig) => {
  trigger?.toggleAttribute("data-popup-open", open);
  tip?.toggleAttribute("data-open", open);
  tip?.toggleAttribute("data-closed", !open);
};

const react = (rig: Rig, on: boolean) => {
  if (on === rig.open) {
    return;
  }

  rig.open = on;
  rig.s.to = on ? 1 : 0;
  rig.s.d = on ? 15 : 34;
  mark(rig);

  if (!on) {
    return;
  }

  const squash = rig.squashRef?.current;

  if (squash) {
    squash.s.v += 2;
  }

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

type SakugaTooltipProps = Styled<ComponentProps<"span">> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const SakugaTooltip = ({
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
  ...props
}: SakugaTooltipProps) => {
  const rigRef = useMemo(() => makeRig(), []);
  const tipId = useId();
  const mounted = useRef(false);

  useLayoutEffect(() => {
    const rig = rigRef.current;

    if (!mounted.current) {
      mounted.current = true;

      if (open ?? defaultOpen) {
        rig.open = true;
        rig.s.x = 1;
        rig.s.to = 1;

        if (rig.tip) {
          rig.tip.style.transform = "scale(1) rotate(0deg)";
        }
      }

      mark(rig);

      return;
    }

    if (open !== undefined) {
      react(rig, open);
    }
  });

  const shared = useMemo<Shared>(
    () => ({
      request: (on) => {
        if (on === rigRef.current.open) {
          return;
        }

        onOpenChange?.(on);

        if (open === undefined) {
          react(rigRef.current, on);
        }
      },
      rigRef,
      tipId,
    }),
    [onOpenChange, open, rigRef, tipId],
  );

  useFrame((dt) => {
    const rig = rigRef.current;
    rig.squashRef?.current?.step(dt);
    const y = Math.max(0, rig.s.step(dt));

    if (rig.tip) {
      rig.tip.style.transform = `scale(${y}) rotate(${(1 - y) * -10}deg)`;
    }
  });

  return (
    <span
      data-slot="sakuga-tooltip"
      className={cn(
        "relative isolate inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink)",
        FONT_BODY,
        className,
      )}
      {...props}
    >
      <SakugaStyle />
      <SharedContext value={shared}>{children}</SharedContext>
    </span>
  );
};

const TRIGGER =
  "grid size-[42px] cursor-pointer place-items-center rounded-full border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) p-0 font-black shadow-[4px_5px_0_var(--sk-soft)] focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc)";

const SakugaTooltipTrigger = ({
  className,
  render,
  ref,
  onBlur,
  onClick,
  onFocus,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  ...props
}: Styled<useRender.ComponentProps<"button">>) => {
  const { request, rigRef, tipId } = useShared();
  const el = useRef<HTMLElement>(null);
  const setEl = useMergedRef<HTMLElement>(el, ref);
  const sqRef = useSquashy(el, { low: 0.78, wide: 0.3 });

  useLayoutEffect(() => {
    const rig = rigRef.current;
    rig.trigger = el.current;
    rig.squashRef = sqRef;
    mark(rig);

    return () => {
      rig.trigger = null;
      rig.squashRef = null;
    };
  }, [rigRef, sqRef]);

  return useRender({
    defaultTagName: "button",
    props: {
      "aria-describedby": tipId,
      type: render ? undefined : "button",
      ...props,
      className: cn(!render && TRIGGER, className),
      "data-slot": "sakuga-tooltip-trigger",
      onBlur: (e: FocusEvent<HTMLButtonElement>) => {
        onBlur?.(e);
        request(false);
      },
      onClick: (e: MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        request(!rigRef.current.open || document.activeElement === e.currentTarget);
      },
      onFocus: (e: FocusEvent<HTMLButtonElement>) => {
        onFocus?.(e);
        request(true);
      },
      onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(e);

        if (e.key === "Escape") {
          request(false);
        }
      },
      onPointerEnter: (e: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(e);

        if (e.pointerType === "mouse") {
          request(true);
        }
      },
      onPointerLeave: (e: PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(e);

        if (e.pointerType === "mouse") {
          request(false);
        }
      },
    },
    ref: setEl,
    render,
  });
};

const TIP =
  "pointer-events-none absolute bottom-[calc(100%+16px)] left-1/2 w-max max-w-[220px] min-w-[120px] origin-[50%_120%] [translate:-50%_0] [transform:scale(0)] rounded-[13px] border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) px-[14px] py-[11px] text-center text-[16px] font-extrabold shadow-(--sk-sh) will-change-transform before:absolute before:top-[calc(100%-4.5px)] before:left-1/2 before:z-1 before:-ml-[6px] before:border-[6px] before:border-t-[8.5px] before:border-transparent before:border-t-(--sk-card) before:content-[''] after:absolute after:top-full after:left-1/2 after:-ml-[9px] after:border-[9px] after:border-t-[12px] after:border-transparent after:border-t-(--sk-ink) after:content-['']";

const SakugaTooltipContent = ({ className, ref, ...props }: Styled<ComponentProps<"div">>) => {
  const { rigRef, tipId } = useShared();
  const el = useRef<HTMLDivElement>(null);
  const setEl = useMergedRef(el, ref);

  useLayoutEffect(() => {
    const rig = rigRef.current;
    rig.tip = el.current;
    mark(rig);

    return () => {
      rig.tip = null;
    };
  }, [rigRef]);

  return (
    <div
      data-slot="sakuga-tooltip-content"
      id={tipId}
      role="tooltip"
      className={cn(TIP, className)}
      {...props}
      ref={setEl}
    />
  );
};

export { SakugaTooltip, SakugaTooltipContent, SakugaTooltipTrigger };
