"use client";

import type { CSSProperties, FC } from "react";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

import { N, STATS, statAt } from "./stat-reel-data";

const DESKTOP = { itemH: 62, font: 26 };
const MOBILE = { itemH: 46, font: 19 };
/**
 * Gates the first auto-step behind the entrance timeline. Floor is ~250ms:
 * below that the per-focus figure pop (overwrite: true) fires while the
 * entrance still owns the figure and kills the cold open.
 */
const START_DELAY_MS = 600;
const BREAKPOINT = 900;
const TOUCH_GAIN = 1.2;
const ROW_COUNT = N * 2;

/**
 * Wheel deltas arrive in three units (`WheelEvent.deltaMode`): pixels (0),
 * lines (1) and pages (2). Chrome and Safari only ever report pixels, but
 * Firefox on Windows/Linux reports lines, so the accumulator has to convert
 * to pixels before comparing against `CFG.wheelStep`. This nominal line
 * height only has to be in the right order of magnitude.
 */
const WHEEL_LINE_PX = 16;

/**
 * A wheel or touch gesture delivers events milliseconds apart, so a gap this
 * long means the gesture ended and any sub-threshold residue in the
 * accumulator is stale. Without expiry, 44px of ignored input waits
 * indefinitely for an unrelated flick minutes later to top it over
 * `CFG.wheelStep` and steal a row. Not a feel constant: every value well above
 * a frame and well below human re-engagement behaves identically for real
 * gestures.
 */
const GESTURE_IDLE_MS = 500;

const COLOR_REST = "#636365";
const COLOR_FOCUS = "#010102";

/**
 * Declared locally: the host app never defines `--font-sans`, so Tailwind's
 * `font-sans` resolves to a cycle and falls back to Times.
 */
const SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const CFG = {
  step: 0.8,
  dwell: 0.6,
  numScale: 1.05,
  centerScale: 1.68,
  farScale: 0.7,
  falloff: 270,
  falloffMobile: 150,
  wheelStep: 45,
  manualStep: 1.2,
  resume: 4,
};

/** Scale a fully-defocused row shrinks to, relative to the focused row. */
const FAR_RATIO = CFG.farScale / CFG.centerScale;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** `CSSProperties` widened to accept custom properties without a type assertion. */
interface CSSVarProperties extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

const PANEL_MASK =
  "linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%)";

const SECTION_STYLE: CSSProperties = {
  fontFamily: SANS,
};

const PANEL_STYLE: CSSProperties = {
  maskImage: PANEL_MASK,
  WebkitMaskImage: PANEL_MASK,
};

const ROW_STYLE: CSSProperties = {
  height: "var(--bm-item-h)",
  fontSize: "calc(var(--bm-base-font) * var(--center-scale))",
};

/** Breathing room kept between the widest figure and the column's inner edge. */
const FIT_GUTTER_PX = 10;

/** Smallest fraction of its natural size the figure may be shrunk to. */
const FIT_FLOOR = 0.4;

/**
 * Shrinks the figure until it fits the left column, down to a 40% floor.
 * Writes `--bm-num-fit`, which the font-size `calc()` multiplies in.
 */
const applyFit = (num: HTMLElement, col: HTMLElement) => {
  num.style.setProperty("--bm-num-fit", "1");
  const natural = num.scrollWidth;
  const cs = window.getComputedStyle(col);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const available = col.clientWidth - padL - padR - FIT_GUTTER_PX;
  // A 0-wide column (hidden panel, freshly-mounted iframe) makes `available`
  // negative, which the 0.4 floor would silently absorb into a real-looking
  // shrink. Keep the `1` written above until there is something to fit into.
  if (available <= 0) return;
  if (natural > 0 && natural > available) {
    num.style.setProperty("--bm-num-fit", String(Math.max(FIT_FLOOR, available / natural)));
  }
};

interface RowsProps {
  register: (index: number, el: HTMLDivElement | null) => void;
}

const Rows: FC<RowsProps> = memo(({ register }) => {
  return (
    <>
      {Array.from({ length: ROW_COUNT }, (_, j) => (
        <div
          key={j}
          ref={(el) => register(j, el)}
          style={ROW_STYLE}
          className="pointer-events-none absolute top-0 right-0 left-[clamp(32px,5vw,80px)] flex origin-left items-center leading-[1.05] font-medium whitespace-nowrap text-[#636365] [will-change:transform]"
        >
          {statAt(j).label}
        </div>
      ))}
    </>
  );
});

Rows.displayName = "StatReelRows";

export const StatReel: FC = () => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

  /** The single scalar every tween drives; the rAF loop paints from it. */
  const proxy = useRef({ idx: 0 });
  const targetRef = useRef(0);
  const modeRef = useRef<"auto" | "user">("auto");
  const focusedRef = useRef(0);
  const accumRef = useRef(0);
  const reducedRef = useRef(false);
  const firstFigure = useRef(true);
  const sizeRef = useRef({
    itemH: DESKTOP.itemH,
    falloff: CFG.falloff,
    panelH: 0,
    cy: 0,
  });

  const register = useCallback((index: number, el: HTMLDivElement | null) => {
    rowsRef.current[index] = el;
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const figure = figureRef.current;
    const panel = panelRef.current;

    if (!section || !figure || !panel) return;

    let disposed = false;
    const proxyState = proxy.current;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;

    const onMq = (e: MediaQueryListEvent) => {
      reducedRef.current = e.matches;
    };

    mq.addEventListener("change", onMq);

    const isReduced = () => reducedRef.current;

    const measure = () => {
      const mobile = window.innerWidth < BREAKPOINT;
      const base = mobile ? MOBILE : DESKTOP;
      const panelH = panel.clientHeight;

      sizeRef.current = {
        itemH: base.itemH,
        falloff: mobile ? CFG.falloffMobile : CFG.falloff,
        panelH,
        cy: panelH / 2,
      };

      section.style.setProperty("--bm-item-h", `${base.itemH}px`);
      section.style.setProperty("--bm-base-font", `${base.font}px`);
      section.style.setProperty("--center-scale", String(CFG.centerScale));

      if (numberRef.current && leftRef.current) {
        applyFit(numberRef.current, leftRef.current);
      }
    };

    measure();
    window.addEventListener("resize", measure);

    // The gallery resizes the frame without ever firing a window resize.
    const ro = new ResizeObserver(() => {
      // A freshly-mounted iframe reports 0x0 on the first callback.
      if (section.clientWidth === 0 || section.clientHeight === 0) return;
      measure();
    });
    ro.observe(section);

    // Fonts swap in after first paint; the initial applyFit measured fallbacks.
    const refitAfterFonts = async () => {
      await document.fonts.ready;
      if (!disposed) measure();
    };

    void refitAfterFonts();

    let dwellTimer: ReturnType<typeof setTimeout> | null = null;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    let startTimer: ReturnType<typeof setTimeout> | null = null;

    /** Queues the next auto advance one dwell from now. */
    const scheduleNextStep = () => {
      dwellTimer = setTimeout(() => {
        targetRef.current += 1;
        autoStep(targetRef.current);
      }, CFG.dwell * 1000);
    };

    function onStepDone() {
      if (modeRef.current !== "auto" || isReduced()) return;
      scheduleNextStep();
    }

    const tweenTo = (t: number, duration: number, ease: string) => {
      gsap.to(proxyState, {
        idx: t,
        duration: isReduced() ? 0 : duration,
        ease,
        overwrite: true,
        onComplete: onStepDone,
      });
    };

    const autoStep = (t: number) => tweenTo(t, CFG.step, "expo.inOut");

    const startAuto = () => {
      if (isReduced()) return;

      modeRef.current = "auto";
      targetRef.current = Math.round(proxyState.idx);

      if (dwellTimer) clearTimeout(dwellTimer);
      scheduleNextStep();
    };

    const stepManual = (dir: number) => {
      if (startTimer) clearTimeout(startTimer);
      if (dwellTimer) clearTimeout(dwellTimer);
      if (resumeTimer) clearTimeout(resumeTimer);

      modeRef.current = "user";
      targetRef.current += dir;
      tweenTo(targetRef.current, CFG.manualStep, "expo.out");

      resumeTimer = setTimeout(startAuto, CFG.resume * 1000);
    };

    /** Input accumulates continuously but only advances in whole rows. */
    const drain = () => {
      while (Math.abs(accumRef.current) >= CFG.wheelStep) {
        const d = Math.sign(accumRef.current);
        accumRef.current -= d * CFG.wheelStep;
        stepManual(d);
      }
    };

    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * The single entry point for wheel and touch alike: both feed pixels in,
     * whole rows come out, and the remainder is dropped once the gesture ends.
     */
    const accumulate = (deltaPx: number) => {
      accumRef.current += deltaPx;
      drain();

      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        accumRef.current = 0;
      }, GESTURE_IDLE_MS);
    };

    let rafId = 0;
    let prevNearest: HTMLDivElement | null = null;

    const render = () => {
      const { itemH, falloff, panelH, cy } = sizeRef.current;

      // Skip painting until the panel has a real height, or every row would
      // land offscreen for a frame inside a freshly-mounted iframe.
      if (panelH > 0) {
        const idx = proxyState.idx;
        const rows = rowsRef.current;
        const windowH = ROW_COUNT * itemH;
        const halfWin = windowH / 2;

        let nearestEl: HTMLDivElement | null = null;
        let nearestAbs = Infinity;

        for (let j = 0; j < ROW_COUNT; j++) {
          const row = rows[j];
          if (!row) continue;

          let off = (j - idx) * itemH;
          // Wrap into (-halfWin, halfWin] so the reel never ends.
          off = ((((off + halfWin) % windowH) + windowH) % windowH) - halfWin;
          const screenY = cy + off;

          if (screenY < -itemH || screenY > panelH + itemH) {
            if (row.style.opacity !== "0") row.style.opacity = "0";
            continue;
          }

          const s = smoothstep(clamp01(Math.abs(off) / falloff));
          if (row.style.opacity !== "1") row.style.opacity = "1";
          row.style.transform = `translateY(${screenY - itemH / 2}px) scale(${lerp(1, FAR_RATIO, s)})`;

          const a = Math.abs(off);
          if (a < nearestAbs) {
            nearestAbs = a;
            nearestEl = row;
          }
        }

        // Only touch color when the centre row actually changes.
        if (nearestEl !== prevNearest) {
          if (prevNearest) prevNearest.style.color = COLOR_REST;
          if (nearestEl) nearestEl.style.color = COLOR_FOCUS;
          prevNearest = nearestEl;
        }

        const focused = ((Math.round(idx) % N) + N) % N;
        if (focused !== focusedRef.current) {
          focusedRef.current = focused;
          setFocusedIndex(focused);
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit =
        e.deltaMode === 1 ? WHEEL_LINE_PX : e.deltaMode === 2 ? sizeRef.current.panelH : 1;
      accumulate(e.deltaY * unit);
    };

    /**
     * The reel tracks exactly one finger, latched by identifier. Reading
     * `touches[0]` instead would silently re-anchor onto a different contact
     * the moment the tracked finger lifts out of a multi-touch gesture,
     * turning the next 2px move into a jump of a dozen rows.
     */
    let activeTouch: number | null = null;
    let touchY = 0;

    const findTouch = (list: TouchList, id: number): Touch | null => {
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        if (t && t.identifier === id) return t;
      }
      return null;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (activeTouch !== null) return;

      const t = e.changedTouches[0];
      if (!t) return;

      activeTouch = t.identifier;
      touchY = t.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (activeTouch === null) return;

      const t = findTouch(e.touches, activeTouch);
      if (!t) return;

      const dy = touchY - t.clientY;
      touchY = t.clientY;
      e.preventDefault();
      accumulate(dy * TOUCH_GAIN);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (activeTouch === null) return;
      if (!findTouch(e.changedTouches, activeTouch)) return;

      // Hand tracking to a finger that is still down rather than going dead
      // until the next touchstart. Re-anchoring `touchY` to its current
      // position is what keeps the handover from registering as a jump.
      const next = e.touches[0];
      activeTouch = next ? next.identifier : null;
      if (next) touchY = next.clientY;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const dir = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
      if (dir === 0) return;

      e.preventDefault();
      stepManual(dir);
    };

    section.addEventListener("wheel", onWheel, { passive: false });
    section.addEventListener("touchstart", onTouchStart, { passive: true });
    section.addEventListener("touchmove", onTouchMove, { passive: false });
    section.addEventListener("touchend", onTouchEnd, { passive: true });
    section.addEventListener("touchcancel", onTouchEnd, { passive: true });
    section.addEventListener("keydown", onKeyDown);

    const groups = [figure, panel];
    let intro: gsap.core.Timeline | null = null;

    if (isReduced()) {
      gsap.set(groups, { opacity: 1, y: 0, scale: 1 });
      firstFigure.current = false;
    } else {
      const tl = gsap.timeline({
        delay: 0.12,
        onComplete: () => {
          firstFigure.current = false;
        },
      });

      tl.fromTo(
        groups,
        { opacity: 0, y: 26, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power4.out",
          stagger: 0.12,
        },
      );

      intro = tl;
      startTimer = setTimeout(startAuto, START_DELAY_MS);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      mq.removeEventListener("change", onMq);
      section.removeEventListener("wheel", onWheel);
      section.removeEventListener("touchstart", onTouchStart);
      section.removeEventListener("touchmove", onTouchMove);
      section.removeEventListener("touchend", onTouchEnd);
      section.removeEventListener("touchcancel", onTouchEnd);
      section.removeEventListener("keydown", onKeyDown);

      if (dwellTimer) clearTimeout(dwellTimer);
      if (resumeTimer) clearTimeout(resumeTimer);
      if (startTimer) clearTimeout(startTimer);
      if (idleTimer) clearTimeout(idleTimer);

      gsap.killTweensOf(proxyState);
      gsap.killTweensOf(groups);
      // Killing only the child tween would leave the timeline on the ticker,
      // where it completes and fires `onComplete` after the reset below.
      intro?.kill();

      // StrictMode remounts: every latch must return to its mount-time value
      // or the second mount skips the cold open.
      firstFigure.current = true;
      modeRef.current = "auto";
      proxyState.idx = 0;
      targetRef.current = 0;
      focusedRef.current = 0;
      accumRef.current = 0;
    };
  }, []);

  // Both halves of a focus change: pop the incoming figure in, then refit it to
  // the left column now that its digits — and so its natural width — differ.
  // The entrance timeline owns the figure until it completes, so the pop stays
  // latched off for the cold open while the fit still has to run.
  useIsoLayoutEffect(() => {
    const figure = figureRef.current;

    if (figure && !firstFigure.current) {
      if (reducedRef.current) {
        gsap.set(figure, { opacity: 1, y: 0, scale: 1 });
      } else {
        gsap.fromTo(
          figure,
          { y: 14, scale: 0.95, opacity: 0 },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: Math.max(0.32, CFG.step * 0.7),
            ease: "expo.out",
            overwrite: true,
          },
        );
      }
    }

    if (numberRef.current && leftRef.current) {
      applyFit(numberRef.current, leftRef.current);
    }
  }, [focusedIndex]);

  const current = statAt(focusedIndex);

  const numberStyle: CSSVarProperties = {
    backgroundImage: current.gradient,
    "--bm-num-scale": String(CFG.numScale),
  };

  return (
    <section
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#f2f2f4] text-[#010102] [--bm-base-font:19px] [--bm-item-h:46px] [--center-scale:1.68] min-[900px]:flex-row min-[900px]:[--bm-base-font:26px] min-[900px]:[--bm-item-h:62px]"
      style={SECTION_STYLE}
      ref={sectionRef}
      aria-label="Ocean depth statistics"
      // Wheel and touch already seize the reel; the tab stop is what gives a
      // keyboard-only user the same arrow-key access to it.
      tabIndex={0}
    >
      <div
        className="z-[1] flex min-w-0 shrink-0 grow-0 basis-auto flex-col items-center justify-center pt-[clamp(28px,7vw,56px)] pr-4 pb-0 pl-4 text-center min-[900px]:basis-[38%] min-[900px]:items-start min-[900px]:pt-0 min-[900px]:pr-[clamp(12px,1.4vw,28px)] min-[900px]:pl-[clamp(20px,2.6vw,52px)] min-[900px]:text-left"
        ref={leftRef}
        aria-hidden
      >
        <div className="opacity-0 [will-change:transform,opacity]" ref={figureRef}>
          <div className="mb-1.5 min-h-[26px] w-full text-center text-[clamp(14px,1.4vw,20px)] font-medium text-[#636365] min-[900px]:w-auto min-[900px]:text-left">
            {current.prefix ?? " "}
          </div>

          <span
            className="block bg-clip-text bg-no-repeat text-[calc(clamp(68px,20vw,124px)*var(--bm-num-scale,1.05)*var(--bm-num-fit,1))] leading-none font-semibold tracking-[-0.055em] whitespace-nowrap text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] min-[900px]:text-[calc(clamp(56px,9vw,152px)*var(--bm-num-scale,1.05)*var(--bm-num-fit,1))]"
            ref={numberRef}
            style={numberStyle}
          >
            {current.value}
          </span>
        </div>
      </div>

      <div
        className="relative z-[1] min-w-0 shrink grow basis-auto overflow-hidden px-[clamp(32px,5vw,80px)] opacity-0"
        ref={panelRef}
        style={PANEL_STYLE}
        aria-hidden
      >
        <Rows register={register} />
      </div>

      <ul className="sr-only">
        {STATS.map((stat) => (
          <li key={stat.label}>
            {`${stat.prefix ? `${stat.prefix} ` : ""}${stat.value} — ${stat.label}`}
          </li>
        ))}
      </ul>
    </section>
  );
};
