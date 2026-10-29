"use client";

import { useEffect, useRef } from "react";

import { CHARTS } from "./charts";
import { ChartCell } from "./lib/kit";

/** Pixels per second the wall drifts while nobody is touching it. */
const DRIFT = 42;

/**
 * Sixty-two dashboard cards in a masonry wall. Each card springs in and mounts
 * its chart only once it scrolls into view, so the wall reads as a stream of
 * entrances; the wall drifts on its own until a pointer or wheel takes over.
 */
export const FinanceCharts = ({ autoScroll = true }: { autoScroll?: boolean }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el || !autoScroll || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let raf = 0;
    let last = performance.now();
    // scrollTop rounds to device pixels, so keep the true position here.
    let y = el.scrollTop;
    const step = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      if (paused.current) {
        y = el.scrollTop;
      } else {
        const end = el.scrollHeight - el.clientHeight;
        y = y >= end - 1 ? 0 : y + (DRIFT * dt) / 1000;
        el.scrollTop = y;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [autoScroll]);

  return (
    <div
      ref={scroller}
      onPointerEnter={() => {
        paused.current = true;
      }}
      onPointerLeave={() => {
        paused.current = false;
      }}
      className="size-full overflow-y-auto bg-[#f3f4f7] [font-family:Inter,ui-sans-serif,system-ui,sans-serif] [scrollbar-width:none]"
    >
      <div className="mx-auto max-w-[1680px] columns-[340px] gap-4 px-4 py-6">
        {CHARTS.map(({ id, Chart }) => (
          <ChartCell key={id} id={id}>
            <Chart />
          </ChartCell>
        ))}
      </div>
    </div>
  );
};
