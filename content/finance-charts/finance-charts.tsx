"use client";

import { useEffect, useRef } from "react";

import { CHARTS } from "./charts";
import { ChartCell } from "./lib/kit";

const DRIFT = 42;
const YIELD_MS = 3000;

/**
 * Sixty-two dashboard cards in a masonry wall. Each card springs in and mounts
 * its chart only once it scrolls into view, so the wall reads as a stream of
 * entrances; the wall drifts on its own and yields to any hover or scroll.
 */
export const FinanceCharts = ({ autoScroll = true }: { autoScroll?: boolean }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const holdUntil = useRef(0);

  const release = () => {
    holdUntil.current = Math.min(holdUntil.current, performance.now() + YIELD_MS);
  };

  useEffect(() => {
    const el = scroller.current;

    if (!el || !autoScroll || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let raf = 0;
    let last = performance.now();
    let yieldUntil = 0;
    let y = el.scrollTop;
    let written = el.scrollTop;

    const step = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;

      if (Math.abs(el.scrollTop - written) > 1) {
        yieldUntil = t + YIELD_MS;
      }

      const end = el.scrollHeight - el.clientHeight;

      if (hovered.current || t < holdUntil.current || t < yieldUntil || y >= end - 1) {
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
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") {
          hovered.current = true;
        }
      }}
      onPointerLeave={() => {
        hovered.current = false;
        release();
      }}
      onPointerDown={() => {
        holdUntil.current = Infinity;
      }}
      onPointerUp={release}
      onPointerCancel={release}
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
