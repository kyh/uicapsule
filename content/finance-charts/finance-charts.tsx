"use client";

import { useEffect, useRef } from "react";

import { CHARTS } from "./charts";
import { ChartCell } from "./lib/kit";

/** Pixels per second the wall drifts while nobody is touching it. */
const DRIFT = 42;
/** How long the drift yields after someone scrolls the wall themselves. */
const YIELD_MS = 3000;

/**
 * Sixty-two dashboard cards in a masonry wall. Each card springs in and mounts
 * its chart only once it scrolls into view, so the wall reads as a stream of
 * entrances; the wall drifts on its own and yields to any hover or scroll.
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
    let yieldUntil = 0;
    // scrollTop rounds to device pixels, so keep the true position in `y` and
    // remember what we last wrote: any other change is someone scrolling.
    let y = el.scrollTop;
    let written = el.scrollTop;
    const step = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      if (Math.abs(el.scrollTop - written) > 1) {
        yieldUntil = t + YIELD_MS;
      }
      const end = el.scrollHeight - el.clientHeight;
      if (paused.current || t < yieldUntil || y >= end - 1) {
        // Hand the position back to whoever is scrolling; stop at the bottom
        // rather than jumping to the top.
        y = el.scrollTop;
      } else {
        y += (DRIFT * dt) / 1000;
        el.scrollTop = y;
      }
      written = el.scrollTop;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [autoScroll]);

  return (
    <div
      ref={scroller}
      // Move, not enter: a pointer already over the wall at load never enters.
      onPointerMove={(e) => {
        paused.current = e.pointerType === "mouse";
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
