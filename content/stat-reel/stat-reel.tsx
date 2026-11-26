"use client";

import type { CSSProperties, FC } from "react";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

import { N, STATS, statAt } from "./stat-reel-data";

const noop = () => null;

const DESKTOP = { font: 26, itemH: 62 };
const MOBILE = { font: 19, itemH: 46 };
const START_DELAY_MS = 600;
const BREAKPOINT = 900;
const TOUCH_GAIN = 1.2;
const ROW_COUNT = N * 2;

const WHEEL_LINE_PX = 16;

const GESTURE_IDLE_MS = 500;

const COLOR_REST = "#636365";
const COLOR_FOCUS = "#010102";

const SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const CFG = {
  centerScale: 1.68,
  dwell: 0.6,
  falloff: 270,
  falloffMobile: 150,
  farScale: 0.7,
  manualStep: 1.2,
  numScale: 1.05,
  resume: 4,
  step: 0.8,
  wheelStep: 45,
};

const FAR_RATIO = CFG.farScale / CFG.centerScale;

const clamp01 = (v: number) => (v < 0 ? 0 : Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface CSSVarProperties extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

const PANEL_MASK =
  "linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%)";

const SECTION_STYLE: CSSProperties = {
  fontFamily: SANS,
};

const PANEL_STYLE: CSSProperties = {
  WebkitMaskImage: PANEL_MASK,
  maskImage: PANEL_MASK,
};

const ROW_STYLE: CSSProperties = {
  fontSize: "calc(var(--bm-base-font) * var(--center-scale))",
  height: "var(--bm-item-h)",
};

const FIT_GUTTER_PX = 10;

const FIT_FLOOR = 0.4;

const applyFit = (num: HTMLElement, col: HTMLElement) => {
  num.style.setProperty("--bm-num-fit", "1");
  const natural = num.scrollWidth;
  const cs = window.getComputedStyle(col);
  const padL = Number(cs.paddingLeft.replace("px", "")) || 0;
  const padR = Number(cs.paddingRight.replace("px", "")) || 0;
  const available = col.clientWidth - padL - padR - FIT_GUTTER_PX;

  if (available <= 0) {
    return;
  }

  if (natural > 0 && natural > available) {
    num.style.setProperty("--bm-num-fit", String(Math.max(FIT_FLOOR, available / natural)));
  }
};

interface RowsProps {
  register: (index: number, el: HTMLDivElement | null) => void;
}

const RowsBase: FC<RowsProps> = ({ register }) => (
  <>
    {Array.from({ length: ROW_COUNT }, (_, j) => (
      <div
        key={j}
        ref={(el) => {
          register(j, el);
        }}
        style={ROW_STYLE}
        className="pointer-events-none absolute top-0 right-0 left-[clamp(32px,5vw,80px)] flex origin-left items-center leading-[1.05] font-medium whitespace-nowrap text-[#636365] [will-change:transform]"
      >
        {statAt(j).label}
      </div>
    ))}
  </>
);

const Rows = memo(RowsBase);

Rows.displayName = "StatReelRows";

export const StatReel: FC = () => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

  const proxy = useRef({ idx: 0 });
  const targetRef = useRef(0);
  const modeRef = useRef<"auto" | "user">("auto");
  const focusedRef = useRef(0);
  const accumRef = useRef(0);
  const reducedRef = useRef(false);
  const firstFigure = useRef(true);

  const sizeRef = useRef({
    cy: 0,
    falloff: CFG.falloff,
    itemH: DESKTOP.itemH,
    panelH: 0,
  });

  const register = useCallback((index: number, el: HTMLDivElement | null) => {
    rowsRef.current[index] = el;
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const figure = figureRef.current;
    const panel = panelRef.current;

    if (!section || !figure || !panel) {
      return noop;
    }

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
        cy: panelH / 2,
        falloff: mobile ? CFG.falloffMobile : CFG.falloff,
        itemH: base.itemH,
        panelH,
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

    const ro = new ResizeObserver(() => {
      if (section.clientWidth === 0 || section.clientHeight === 0) {
        return;
      }

      measure();
    });

    ro.observe(section);

    const refitAfterFonts = async () => {
      await document.fonts.ready;

      if (!disposed) {
        measure();
      }
    };

    void refitAfterFonts();

    let dwellTimer: ReturnType<typeof setTimeout> | null = null;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    let startTimer: ReturnType<typeof setTimeout> | null = null;

    const tweenTo = (t: number, duration: number, ease: string, onComplete: () => void) => {
      gsap.to(proxyState, {
        duration: isReduced() ? 0 : duration,
        ease,
        idx: t,
        onComplete,
        overwrite: true,
      });
    };

    const queueAutoStep = () => {
      if (modeRef.current !== "auto" || isReduced()) {
        return;
      }

      dwellTimer = setTimeout(() => {
        targetRef.current += 1;
        tweenTo(targetRef.current, CFG.step, "expo.inOut", queueAutoStep);
      }, CFG.dwell * 1000);
    };

    const startAuto = () => {
      if (isReduced()) {
        return;
      }

      modeRef.current = "auto";
      targetRef.current = Math.round(proxyState.idx);

      if (dwellTimer !== null && dwellTimer !== 0) {
        clearTimeout(dwellTimer);
      }

      queueAutoStep();
    };

    const stepManual = (dir: number) => {
      if (startTimer !== null && startTimer !== 0) {
        clearTimeout(startTimer);
      }

      if (dwellTimer !== null && dwellTimer !== 0) {
        clearTimeout(dwellTimer);
      }

      if (resumeTimer !== null && resumeTimer !== 0) {
        clearTimeout(resumeTimer);
      }

      modeRef.current = "user";
      targetRef.current += dir;
      tweenTo(targetRef.current, CFG.manualStep, "expo.out", queueAutoStep);

      resumeTimer = setTimeout(startAuto, CFG.resume * 1000);
    };

    const drain = () => {
      while (Math.abs(accumRef.current) >= CFG.wheelStep) {
        const d = Math.sign(accumRef.current);
        accumRef.current -= d * CFG.wheelStep;
        stepManual(d);
      }
    };

    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const accumulate = (deltaPx: number) => {
      accumRef.current += deltaPx;
      drain();

      if (idleTimer !== null && idleTimer !== 0) {
        clearTimeout(idleTimer);
      }

      idleTimer = setTimeout(() => {
        accumRef.current = 0;
      }, GESTURE_IDLE_MS);
    };

    let rafId = 0;
    let prevNearest: HTMLDivElement | null = null;

    const render = () => {
      const { itemH, falloff, panelH, cy } = sizeRef.current;

      if (panelH > 0) {
        const { idx } = proxyState;
        const rows = rowsRef.current;
        const windowH = ROW_COUNT * itemH;
        const halfWin = windowH / 2;

        let nearestEl: HTMLDivElement | null = null;
        let nearestAbs = Infinity;

        for (let j = 0; j < ROW_COUNT; j += 1) {
          const row = rows[j];

          if (!row) {
            continue;
          }

          let off = (j - idx) * itemH;
          off = ((((off + halfWin) % windowH) + windowH) % windowH) - halfWin;
          const screenY = cy + off;

          if (screenY < -itemH || screenY > panelH + itemH) {
            if (row.style.opacity !== "0") {
              row.style.opacity = "0";
            }

            continue;
          }

          const s = smoothstep(clamp01(Math.abs(off) / falloff));

          if (row.style.opacity !== "1") {
            row.style.opacity = "1";
          }

          row.style.transform = `translateY(${screenY - itemH / 2}px) scale(${lerp(1, FAR_RATIO, s)})`;

          const a = Math.abs(off);

          if (a < nearestAbs) {
            nearestAbs = a;
            nearestEl = row;
          }
        }

        if (nearestEl !== prevNearest) {
          if (prevNearest) {
            prevNearest.style.color = COLOR_REST;
          }

          if (nearestEl) {
            nearestEl.style.color = COLOR_FOCUS;
          }

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
      let unit = 1;

      if (e.deltaMode === 1) {
        unit = WHEEL_LINE_PX;
      } else if (e.deltaMode === 2) {
        unit = sizeRef.current.panelH;
      }

      accumulate(e.deltaY * unit);
    };

    let activeTouch: number | null = null;
    let touchY = 0;

    const findTouch = (list: TouchList, id: number) => {
      for (const t of list) {
        if (t.identifier === id) {
          return t;
        }
      }

      return null;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (activeTouch !== null) {
        return;
      }

      const [t] = e.changedTouches;

      if (!t) {
        return;
      }

      activeTouch = t.identifier;
      touchY = t.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (activeTouch === null) {
        return;
      }

      const t = findTouch(e.touches, activeTouch);

      if (!t) {
        return;
      }

      const dy = touchY - t.clientY;
      touchY = t.clientY;
      e.preventDefault();
      accumulate(dy * TOUCH_GAIN);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (activeTouch === null) {
        return;
      }

      if (!findTouch(e.changedTouches, activeTouch)) {
        return;
      }

      const [next] = e.touches;
      activeTouch = next ? next.identifier : null;

      if (next) {
        touchY = next.clientY;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      let dir = 0;

      if (e.key === "ArrowDown") {
        dir = 1;
      } else if (e.key === "ArrowUp") {
        dir = -1;
      }

      if (dir === 0) {
        return;
      }

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
      gsap.set(groups, { opacity: 1, scale: 1, y: 0 });
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
        { opacity: 0, scale: 0.96, y: 26 },
        {
          duration: 1,
          ease: "power4.out",
          opacity: 1,
          scale: 1,
          stagger: 0.12,
          y: 0,
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

      if (dwellTimer !== null && dwellTimer !== 0) {
        clearTimeout(dwellTimer);
      }

      if (resumeTimer !== null && resumeTimer !== 0) {
        clearTimeout(resumeTimer);
      }

      if (startTimer !== null && startTimer !== 0) {
        clearTimeout(startTimer);
      }

      if (idleTimer !== null && idleTimer !== 0) {
        clearTimeout(idleTimer);
      }

      gsap.killTweensOf(proxyState);
      gsap.killTweensOf(groups);
      intro?.kill();

      firstFigure.current = true;
      modeRef.current = "auto";
      proxyState.idx = 0;
      targetRef.current = 0;
      focusedRef.current = 0;
      accumRef.current = 0;
    };
  }, []);

  useIsoLayoutEffect(() => {
    const figure = figureRef.current;

    if (figure && !firstFigure.current) {
      if (reducedRef.current) {
        gsap.set(figure, { opacity: 1, scale: 1, y: 0 });
      } else {
        gsap.fromTo(
          figure,
          { opacity: 0, scale: 0.95, y: 14 },
          {
            duration: Math.max(0.32, CFG.step * 0.7),
            ease: "expo.out",
            opacity: 1,
            overwrite: true,
            scale: 1,
            y: 0,
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
    "--bm-num-scale": String(CFG.numScale),
    backgroundImage: current.gradient,
  };

  return (
    <section
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#f2f2f4] text-[#010102] [--bm-base-font:19px] [--bm-item-h:46px] [--center-scale:1.68] min-[900px]:flex-row min-[900px]:[--bm-base-font:26px] min-[900px]:[--bm-item-h:62px]"
      style={SECTION_STYLE}
      ref={sectionRef}
      aria-label="Ocean depth statistics"
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- wheel and touch already seize the reel; the tab stop is what gives a keyboard-only user the same arrow-key access to it
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
            {`${stat.prefix !== undefined && stat.prefix !== "" ? `${stat.prefix} ` : ""}${stat.value} — ${stat.label}`}
          </li>
        ))}
      </ul>
    </section>
  );
};
