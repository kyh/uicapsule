"use client";

import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { PhoneFrame, SCREEN_HEIGHT, SCREEN_WIDTH } from "./phone-frame";

const EDGE = 28;
const PEEK = 220;
const COMMIT = 110;
const EXIT = SCREEN_WIDTH + 48;
const ARROW_SIZE = 40;

// Apple's scroll-deceleration projection (rate 0.995): a flick commits even from a short pull.
const project = (velocity: number) => ((velocity / 1000) * 0.995) / (1 - 0.995);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface Grab {
  pointerId: number;
  originX: number;
  originOffset: number;
  originY: number;
  top: number;
  unit: number;
}

const STORIES = [
  { blurb: "Why every good gesture has a click", hue: "#f97316", title: "Detents, explained" },
  { blurb: "One curve to rule the capsule library", hue: "#a855f7", title: "The spring config" },
  {
    blurb: "Predictive back and the end of mystery navigation",
    hue: "#3b82f6",
    title: "Edge peeks",
  },
  { blurb: "Faking depth without WebGL", hue: "#10b981", title: "Phosphor & fog" },
  { blurb: "Rubber-banding at the edge of the world", hue: "#ef4444", title: "Overscroll" },
  { blurb: "Designing for the thumb, not the cursor", hue: "#eab308", title: "Reach zones" },
];

const TARGET = 2;

export const PredictiveBack = () => {
  const [screen, setScreen] = useState<"detail" | "home">("detail");
  const reduced = useReducedMotion() ?? false;
  const grabRef = useRef<Grab | null>(null);

  // 0 = detail at rest, EXIT = detail gone. The pointer writes it 1:1; springs settle it.
  const offset = useMotionValue(0);
  const lift = useMotionValue(0);
  // The arrow follows the live gesture only, so settle and reopen springs never flash it.
  const arrow = useMotionValue(0);
  const arrowY = useMotionValue(SCREEN_HEIGHT / 2);

  const detailScale = useTransform(offset, [0, PEEK], [1, 0.86]);
  const homeScale = useTransform(offset, [0, EXIT], [0.92, 1]);
  const homeX = useTransform(offset, [0, EXIT], [-20, 0]);
  const homeDim = useTransform(offset, [0, EXIT], [0.6, 0]);

  const arrowX = useTransform(arrow, [0, PEEK], [-ARROW_SIZE, 18]);
  const arrowOpacity = useTransform(arrow, [0, 24], [0, 1]);
  const armed = useTransform(arrow, [0, COMMIT - 1, COMMIT], [0.55, 0.9, 1.12]);
  const arrowScale = useSpring(armed, { damping: 18, stiffness: 520 });
  const arrowFill = useTransform(
    arrow,
    [COMMIT - 1, COMMIT],
    ["rgba(255,255,255,0.16)", "rgba(255,255,255,1)"],
  );
  const arrowInk = useTransform(arrow, [COMMIT - 1, COMMIT], ["#ffffff", "#0b0c10"]);
  const arrowTop = useTransform(arrowY, (y) => y - ARROW_SIZE / 2);

  const settle = (target: number, velocity: number) => {
    const done = () => {
      if (target === EXIT) {
        setScreen("home");
      }
    };
    if (reduced) {
      offset.jump(target);
      lift.jump(0);
      done();
      return;
    }
    void animate(lift, 0, { bounce: 0, type: "spring", visualDuration: 0.3 });
    void animate(offset, target, {
      bounce: target === 0 ? 0.15 : 0,
      onComplete: done,
      type: "spring",
      velocity,
      visualDuration: 0.36,
    });
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const unit = rect.width / SCREEN_WIDTH;
    const localX = (event.clientX - rect.left) / unit;
    const onButton = event.target instanceof Element && event.target.closest("button") !== null;
    const inFlight = offset.isAnimating();
    const fromEdge = screen === "detail" && localX < EDGE && !onButton;
    if (!inFlight && !fromEdge) {
      return;
    }
    offset.stop();
    lift.stop();
    arrow.stop();
    event.currentTarget.setPointerCapture(event.pointerId);
    const y = clamp((event.clientY - rect.top) / unit, 90, SCREEN_HEIGHT - 90);
    grabRef.current = {
      originOffset: offset.get(),
      originX: event.clientX,
      originY: y,
      pointerId: event.pointerId,
      top: rect.top,
      unit,
    };
    arrowY.set(y);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const grab = grabRef.current;
    if (!grab || grab.pointerId !== event.pointerId) {
      return;
    }
    const next = clamp(grab.originOffset + (event.clientX - grab.originX) / grab.unit, 0, EXIT);
    const y = clamp((event.clientY - grab.top) / grab.unit, 90, SCREEN_HEIGHT - 90);
    offset.set(next);
    arrow.set(next);
    arrowY.set(y);
    lift.set((y - grab.originY) * 0.12);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const grab = grabRef.current;
    if (!grab || grab.pointerId !== event.pointerId) {
      return;
    }
    grabRef.current = null;
    const velocity = offset.getVelocity();
    const commit = offset.get() + project(velocity) > COMMIT;
    if (reduced) {
      arrow.jump(0);
    } else {
      void animate(arrow, 0, { bounce: 0, type: "spring", visualDuration: 0.22 });
    }
    settle(commit ? EXIT : 0, velocity);
  };

  const openDetail = () => {
    setScreen("detail");
    settle(0, offset.getVelocity());
  };

  return (
    <PhoneFrame className="bg-black">
      <div
        className="absolute inset-0 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <motion.div
          aria-hidden={screen === "detail"}
          style={{ scale: homeScale, x: homeX }}
          className="absolute inset-0 bg-[#101116] px-5 pt-[58px]"
        >
          <p className="text-[11px] font-semibold tracking-[0.14em] text-white/40 uppercase">
            Thursday, September 24
          </p>
          <p className="mt-1 text-[32px] leading-none font-bold tracking-tight text-white">
            Reader
          </p>
          <div className="mt-6 space-y-2.5">
            {STORIES.map((story, index) => (
              <button
                type="button"
                key={story.title}
                tabIndex={screen === "home" ? 0 : -1}
                onClick={index === TARGET ? openDetail : undefined}
                className={`flex w-full items-center gap-3.5 rounded-[20px] p-2.5 text-left ring-1 transition-colors ${
                  index === TARGET
                    ? "bg-[#1b2a45] ring-[#3b82f6]/40 hover:bg-[#20324f]"
                    : "bg-white/[0.04] ring-white/[0.05]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-[52px] shrink-0 rounded-[14px]"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${story.hue} 0%, #14161d 85%)`,
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-white">{story.title}</span>
                  <span className="mt-0.5 block truncate text-[12px] text-white/45">
                    {story.blurb}
                  </span>
                </span>
                {index === TARGET && (
                  <ChevronRight className="mr-1 size-4 shrink-0 text-white/40" />
                )}
              </button>
            ))}
          </div>
          <p className="absolute inset-x-0 bottom-9 text-center text-[11px] text-white/30">
            Open the highlighted story
          </p>
          <motion.div
            aria-hidden="true"
            style={{ opacity: homeDim }}
            className="pointer-events-none absolute inset-0 bg-black"
          />
        </motion.div>

        <motion.article
          aria-hidden={screen === "home"}
          style={{ scale: detailScale, x: offset, y: lift }}
          className="absolute inset-0 overflow-hidden rounded-[50px] bg-[#15171f] shadow-[0_24px_60px_rgb(0_0_0/0.7)]"
        >
          <div className="relative h-[292px] overflow-hidden bg-[radial-gradient(circle_at_28%_38%,#60a5fa_0%,#2563eb_28%,#1d2a44_70%)]">
            <div className="absolute -right-10 bottom-[-60px] size-[220px] rounded-full bg-[#0f172a]/50 blur-[2px]" />
            <div className="absolute top-[120px] left-[150px] size-[64px] rounded-full bg-white/15 ring-1 ring-white/25" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#15171f] to-transparent" />
            <button
              type="button"
              aria-label="Back"
              tabIndex={screen === "detail" ? 0 : -1}
              onClick={() => settle(EXIT, 0)}
              className="absolute top-[54px] left-5 grid size-9 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/45"
            >
              <ChevronLeft className="size-5" />
            </button>
          </div>
          <div className="relative -mt-6 px-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-sky-400 uppercase">
              Navigation
            </p>
            <p className="mt-2 text-[24px] leading-[1.15] font-bold tracking-tight text-white">
              Edge peeks: predictive back and the end of mystery navigation
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <span className="size-7 rounded-full bg-[linear-gradient(135deg,#f472b6,#6366f1)]" />
              <p className="text-[12px] text-white/50">Mara Okafor · 6 min read</p>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-white/65">
              Android 14 made the back gesture honest. Pull from the left edge and the current
              screen shrinks in your hand, revealing exactly where you&apos;ll land before you
              commit.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-white/65">
              Let go early and it springs back. Flick and it&apos;s gone. No leap of faith.
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-28 items-end justify-center bg-gradient-to-t from-[#15171f] via-[#15171f]/90 to-transparent pb-9">
            <p className="text-[11px] text-white/30">Drag from the left edge</p>
          </div>
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1.5 h-12 w-1 -translate-y-1/2 rounded-full bg-white/20"
          />
        </motion.article>

        <motion.div
          aria-hidden="true"
          style={{
            backgroundColor: arrowFill,
            color: arrowInk,
            height: ARROW_SIZE,
            opacity: arrowOpacity,
            scale: arrowScale,
            width: ARROW_SIZE,
            x: arrowX,
            y: arrowTop,
          }}
          className="pointer-events-none absolute top-0 left-0 z-40 grid place-items-center rounded-full shadow-lg shadow-black/40 backdrop-blur-md"
        >
          <ArrowLeft className="size-[18px]" />
        </motion.div>
      </div>
    </PhoneFrame>
  );
};
