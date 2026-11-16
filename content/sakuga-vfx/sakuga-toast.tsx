"use client";

// Sakuga Toast: a notification that streaks in from the left as a smear with speed lines behind
// it, lands in a cloud of dust with ズザッ in dotted letters, wobbles, and after a while leaves by
// shrinking.
// Put <SakugaToaster /> where the toast should appear and call sakugaToast("Saved") from anywhere.
// Base UI's Toast owns the list, the live region, the close button and the keyboard. The toaster
// keeps its place on the page while the toast is hidden; position it yourself (for example
// `fixed bottom-6 left-6` in className). One toast at a time: a new one replaces the message and
// plays the arrival again.

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { cn } from "cn";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";

import {
  Spring,
  at,
  dotted,
  isCalm,
  lines,
  puff,
  rnd,
  sfx,
  shards,
  ticks,
  wob,
} from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

type Styled<Props> = Omit<Props, "className"> & { className?: string };

interface SakugaToastData {
  // seconds it stays once it has landed
  duration: number;
}

interface SakugaToastOptions {
  // seconds it stays once it has landed (2.6 by default)
  duration?: number;
}

type ToastObject = ToastPrimitive.Root.ToastObject<SakugaToastData>;

const manager = ToastPrimitive.createToastManager<SakugaToastData>();

// Every call uses the one id, so Base UI updates the toast in place and the arrival plays again.
const ID = "sakuga-toast";
const STAY = 2.6;

// Show a message. Base UI's own timeout is off (0): it runs on the wall clock and pauses on
// hover, and this toast counts its stay on the set's clock, from the moment it lands.
const sakugaToast = Object.assign(
  (title: ReactNode, options?: SakugaToastOptions) =>
    manager.add({ data: { duration: options?.duration ?? STAY }, id: ID, timeout: 0, title }),
  { dismiss: () => manager.close(ID) },
);

// 0 gone, 1 streaking in, 2 landed, 3 leaving
type Phase = 0 | 1 | 2 | 3;

const DUST = [-0.5, -0.36, -0.2] as const;

// The toast has no drag to follow, so Base UI's swipe-to-dismiss is off.
const NO_SWIPE: ("down" | "left" | "right" | "up")[] = [];

const TOAST =
  "absolute bottom-0 left-0 flex w-[236px] items-center gap-[10px] rounded-(--sk-r) [border:var(--sk-bw)_solid_var(--sk-ink)] bg-(--sk-card) px-[14px] py-[12px] text-[15px] font-bold whitespace-nowrap shadow-(--sk-sh) will-change-transform focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc)";

type Step = (dt: number) => void;

const SakugaToast = ({
  toast: item,
  stepsRef,
  className,
  ...props
}: Styled<ToastPrimitive.Root.Props> & {
  toast: ToastObject;
  // where the toast puts its frame step, for the toaster to run
  stepsRef: RefObject<Set<RefObject<Step>>>;
}) => {
  const el = useRef<HTMLDivElement>(null);
  const sx = useRef(new Spring(-280, 280, 18));
  const ss = useRef(new Spring(1, 420, 26));
  const phase = useRef<Phase>(0);
  const t = useRef(0);
  const at0 = useRef(0);
  // Base UI takes a closed toast off the page once the animations on it have finished. This idle,
  // paused animation is what it waits for; it is finished by hand when the spring has shrunk the
  // toast away, so the leave runs in full on the set's clock.
  const holdRef = useRef<Animation | null>(null);
  // the turn of the toast's life last acted on
  const seen = useRef("");
  const ending = item.transitionStatus === "ending";
  const duration = item.data?.duration ?? STAY;

  const release = () => {
    holdRef.current?.finish();
    holdRef.current = null;
  };

  const arrive = () => {
    const toast = el.current;
    if (!toast) {
      return;
    }
    release();
    toast.style.visibility = "";
    sx.current.x = -280;
    sx.current.v = 1000;
    sx.current.to = 0;
    ss.current.x = 1;
    ss.current.to = 1;
    ss.current.k = 420;
    phase.current = 1;
    if (isCalm()) {
      sx.current.x = 0;
      sx.current.v = 0;
    }
  };

  const leave = () => {
    const toast = el.current;
    if (!toast || phase.current === 0 || phase.current === 3) {
      return;
    }
    phase.current = 3;
    ss.current.to = 0;
    ss.current.k = 500;
    const c = at(toast);
    puff(c.x, c.y, { life: 0.5, n: 4, size: 9 });
  };

  // A new toast, or a new message on the one that is up, arrives. A closed one leaves.
  useLayoutEffect(() => {
    const turn = `${item.updateKey}${ending ? " ending" : ""}`;
    if (turn === seen.current) {
      return;
    }
    seen.current = turn;
    if (!ending) {
      arrive();
      return;
    }
    const hold = el.current?.animate([], { duration: 1 });
    hold?.pause();
    holdRef.current = hold ?? null;
    leave();
    if (phase.current === 0) {
      release();
    }
  });

  const step: Step = (dt) => {
    t.current += dt;
    const toast = el.current;
    if (!toast || phase.current === 0) {
      return;
    }
    const x = sx.current.step(dt);
    const sc = ss.current.step(dt);
    const st = 1 + Math.min(1.5, Math.abs(sx.current.v) * 0.0017);
    toast.style.transform = `translateX(${x}px) scale(${st * sc}, ${sc / Math.sqrt(st)})`;
    if (phase.current === 1) {
      const c = at(toast);
      if (Math.random() < 0.8) {
        lines(c.x - c.w / 2 - 6, c.y + rnd(-14, 14), {
          dir: Math.PI,
          len: 80,
          life: 0.22,
          n: 1,
          spread: 2,
        });
      }
      if (x > -10) {
        // it lands
        phase.current = 2;
        at0.current = t.current;
        lines(c.x - c.w / 2 - 4, c.y, { dir: Math.PI, len: 70, life: 0.4, n: 9, spread: 18 });
        for (const u of DUST) {
          // drawn in the original's order (size, vx, life), so a seeded run matches it frame for frame
          const size = rnd(8, 12);
          const vx = -rnd(10, 30);
          const life = rnd(0.7, 1);
          puff(c.x + c.w * u, c.y + c.h / 2 + 4, { life, n: 4, size, vx, vy: -8 });
        }
        puff(c.x + c.w / 2 + 8, c.y + 10, { life: 0.6, n: 3, size: 7, vx: 20 });
        shards(c.x - c.w / 2, c.y + 12, { arc: 1.6, dir: Math.PI + 0.5, n: 4, size: 4 });
        ticks(c.x + 30, c.y + c.h / 2 + 12, { dir: 0.5, len: 16, n: 2, r: 4 });
        sfx("zuza", c.x - 34, c.y - 58, { rot: -0.1, size: 124, ...dotted() });
        wob(c.x + c.w / 2 + 6, c.y, { dir: 1 });
      }
    } else if (phase.current === 2 && t.current - at0.current > duration) {
      // time is up. It starts leaving on this frame; Base UI hears about it and closes the toast.
      leave();
      manager.close(item.id);
    } else if (phase.current === 3 && (sc < 0.03 || isCalm())) {
      phase.current = 0;
      toast.style.visibility = "hidden";
      toast.style.transform = "";
      release();
    }
  };

  // The toaster steps its toasts from the frame it took when the page loaded, so a toast keeps
  // its turn among the page's controls however late it is shown.
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });
  useEffect(() => {
    const steps = stepsRef.current;
    steps.add(stepRef);
    return () => {
      steps.delete(stepRef);
    };
  }, [stepsRef]);

  return (
    <ToastPrimitive.Root
      data-slot="sakuga-toast"
      toast={item}
      swipeDirection={NO_SWIPE}
      className={cn(TOAST, className)}
      {...props}
      ref={el}
    >
      <span
        aria-hidden
        data-slot="sakuga-toast-icon"
        className="grid size-[28px] flex-none place-items-center rounded-full [border:2.4px_solid_var(--sk-ink)] bg-(--sk-pri)"
      >
        <svg
          viewBox="0 0 20 20"
          className="size-[15px] fill-none stroke-(--sk-on-pri) stroke-[4] [stroke-linecap:round] [stroke-linejoin:round]"
        >
          <path d="M3.5 10.5l4.5 4.5 8.5-10" />
        </svg>
      </span>
      <ToastPrimitive.Title
        data-slot="sakuga-toast-title"
        className="overflow-hidden text-ellipsis"
      />
      <ToastPrimitive.Close
        data-slot="sakuga-toast-close"
        aria-label="Dismiss"
        className="ml-auto size-[26px] flex-none cursor-pointer rounded-full border-0 bg-transparent p-0 text-[15px] font-black focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc)"
      >
        ✕
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
};

const SakugaToastList = () => {
  const { toasts } = ToastPrimitive.useToastManager<SakugaToastData>();
  const stepsRef = useRef(new Set<RefObject<Step>>());
  useFrame((dt) => {
    for (const stepRef of stepsRef.current) {
      stepRef.current(dt);
    }
  });
  return toasts.map((item) => <SakugaToast key={item.id} toast={item} stepsRef={stepsRef} />);
};

// The slot the toast lands in: 236 by 56, kept while the toast is hidden.
const SakugaToaster = ({ className, ...props }: Styled<ToastPrimitive.Viewport.Props>) => (
  <ToastPrimitive.Provider toastManager={manager} timeout={0} limit={1}>
    <SakugaStyle />
    <ToastPrimitive.Viewport
      data-slot="sakuga-toaster"
      className={cn(
        "relative isolate inline-block h-[56px] w-[236px] align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) outline-none",
        FONT_BODY,
        className,
      )}
      {...props}
    >
      <SakugaToastList />
    </ToastPrimitive.Viewport>
  </ToastPrimitive.Provider>
);

export { SakugaToaster, sakugaToast };
