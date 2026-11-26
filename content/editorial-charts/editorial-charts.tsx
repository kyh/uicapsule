"use client";

import type { ChartMotionSpringTransition } from "@tanstack/charts/motion";
import { useEffect, useRef, useState } from "react";

import { DotWaffle } from "./charts/dot-waffle";
import { HairlineLine } from "./charts/hairline-line";
import { RungBars } from "./charts/rung-bars";
import { TickRing } from "./charts/tick-ring";
import { DAY_MAX, SCENES } from "./lib/data";
import { PALETTES, SPRING } from "./lib/tokens";
import type { Palette, Tone } from "./lib/tokens";

const noop = () => null;

const useCountUp = (target: number, ms = 950) => {
  const [shown, setShown] = useState(0);
  const painted = useRef(0);
  useEffect(() => {
    const from = painted.current;

    if (from === target) {
      return noop;
    }

    let raf = 0;
    const t0 = performance.now();

    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - (1 - p) ** 3;
      const value = Math.round(from + (target - from) * eased);
      painted.current = value;
      setShown(value);

      if (p < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [target, ms]);

  return shown;
};

const useReveal = (active: boolean, ms: number) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) {
      return noop;
    }

    let raf = 0;
    const t0 = performance.now();

    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setProgress(p);

      if (p < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [active, ms]);

  return progress;
};

const Kicker = ({ children, tone }: { children: string; tone: Tone }) => (
  <span
    className="inline-block rounded-full border border-dashed px-2.5 py-0.5 text-[8.5px] font-semibold tracking-[0.14em]"
    style={{ borderColor: tone.faint, color: tone.muted }}
  >
    {children}
  </span>
);

const CardHead = ({
  kicker,
  title,
  sub,
  tone,
}: {
  kicker: string;
  title: string;
  sub: string;
  tone: Tone;
}) => (
  <div>
    <Kicker tone={tone}>{kicker}</Kicker>
    <h2 className="mt-2 text-[16.5px] font-bold tracking-[-0.02em]" style={{ color: tone.ink }}>
      {title}
    </h2>
    <p className="mt-0.5 text-[11.5px]" style={{ color: tone.muted }}>
      {sub}
    </p>
  </div>
);

const SourceRow = ({ children, tone }: { children: string; tone: Tone }) => (
  <p
    className="mt-auto pt-3 text-[9px] font-medium tracking-[0.08em]"
    style={{ color: tone.faint }}
  >
    {children}
  </p>
);

export interface EditorialChartsProps {
  palette?: Palette;
  /** Index into the quarters the sheet opens on; read at mount. */
  initialScene?: number;
  /** Step to the next quarter every `cycleMs`. */
  autoCycle?: boolean;
  cycleMs?: number;
  /** How long the first ink-in takes, in ms. */
  revealMs?: number;
  /** Degrees the tick ring turns per quarter. */
  twist?: number;
  spring?: ChartMotionSpringTransition;
  title?: string;
  subtitle?: string;
}

export const EditorialCharts = ({
  palette = PALETTES.ink,
  initialScene = 0,
  autoCycle = true,
  cycleMs = 4600,
  revealMs = 1500,
  twist = 14,
  spring = SPRING,
  title = "The quarter, drawn in ink",
  subtitle = "four marks, one grammar, one spring",
}: EditorialChartsProps) => {
  const [scene, setScene] = useState(() =>
    Math.min(SCENES.length - 1, Math.max(0, Math.round(initialScene))),
  );

  const [inked, setInked] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setInked(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!autoCycle) {
      return noop;
    }

    const t = setInterval(() => {
      setScene((s) => (s + 1) % SCENES.length);
    }, cycleMs);

    return () => {
      clearInterval(t);
    };
  }, [autoCycle, cycleMs]);

  const { dark, ink, ladder, muted, faint, paper } = palette;
  const reveal = useReveal(inked, revealMs);
  const s = SCENES[scene];

  if (!s) {
    throw new RangeError("Editorial chart scene index is out of bounds");
  }

  const sessions = useCountUp(s.sessions);

  return (
    <div
      className="w-[1080px] rounded-[28px] px-9 pt-7 pb-5 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.55)] [font-family:Inter,ui-sans-serif,system-ui,sans-serif]"
      style={{ backgroundColor: paper, color: ink }}
    >
      <div className="flex items-baseline justify-between pb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[19px] font-bold tracking-[-0.02em]">{title}</h1>
          <span className="text-[11.5px]" style={{ color: muted }}>
            {subtitle}
          </span>
        </div>
        <div className="flex gap-3 text-[11px] font-bold tracking-[0.06em]">
          {SCENES.map((q, i) => (
            <span
              key={q.quarter}
              className="transition-colors duration-500"
              style={{
                borderBottom: i === scene ? `2px solid ${ink}` : "2px solid transparent",
                color: i === scene ? ink : faint,
              }}
            >
              {q.quarter}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-9 gap-y-5">
        <section className="flex min-h-[298px] flex-col">
          <CardHead
            kicker="RUNG BARS · BILLING"
            title="Revenue by plan, rung by rung"
            sub="one rung = $2k of MRR · the bar is a ladder you can count"
            tone={palette}
          />
          <div className="mt-3 h-[204px]">
            {inked && (
              <RungBars
                plans={s.plans}
                reveal={reveal}
                height={182}
                initialWidth={480}
                palette={palette}
                spring={spring}
              />
            )}
          </div>
          <SourceRow tone={palette}>
            TICK MARKS ON A POINT SCALE · STAGGERED SPRING ENTRANCE
          </SourceRow>
        </section>

        <section
          className="flex min-h-[298px] flex-col rounded-[20px] px-6 pt-5 pb-4"
          style={{ backgroundColor: dark.bg }}
        >
          <CardHead
            tone={dark}
            kicker="TICK RING · ACQUISITION"
            title="Where the sessions come from"
            sub="one tick = 1% · reads clockwise from noon · the dial twists each quarter"
          />
          <div className="relative mx-auto mt-1 size-[198px]">
            {inked && (
              <TickRing
                channels={s.channels}
                reveal={reveal}
                size={198}
                twist={scene * twist}
                ladder={dark.ladder}
                spring={spring}
              />
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-[30px] font-extrabold tracking-[-0.02em] tabular-nums"
                style={{ color: dark.ink }}
              >
                {(sessions / 1000).toFixed(1)}k
              </span>
              <span
                className="text-[8.5px] font-semibold tracking-[0.14em]"
                style={{ color: dark.muted }}
              >
                SESSIONS
              </span>
            </div>
            {s.channels.map((c, i) => {
              const spots = [
                "left-full top-3 ml-3",
                "left-full bottom-3 ml-3",
                "right-full bottom-3 mr-3 text-right",
                "right-full top-3 mr-3 text-right",
              ] as const;

              return (
                <div
                  key={c.channel}
                  className={`absolute w-24 text-[9px] font-semibold tracking-[0.1em] ${spots[i % 4]}`}
                  style={{ color: dark.ladder[i % dark.ladder.length] }}
                >
                  {c.channel}
                  <span className="block text-[13px] font-extrabold tabular-nums tracking-normal">
                    {c.share}%
                  </span>
                </div>
              );
            })}
          </div>
          <SourceRow tone={dark}>100 VECTOR MARKS · ONE SHADE PER CHANNEL · SPRUNG TWIST</SourceRow>
        </section>

        <section className="flex min-h-[286px] flex-col">
          <CardHead
            kicker="HAIRLINE LINE · GROWTH"
            title="Thirty days of sign-ups"
            sub="one dot = one day · hollow = weekend · the floor is a barcode of days"
            tone={palette}
          />
          <div className="mt-3 h-[184px]">
            {inked && (
              <HairlineLine
                days={s.days}
                reveal={reveal}
                yMax={DAY_MAX}
                height={158}
                initialWidth={480}
                palette={palette}
                spring={spring}
              />
            )}
          </div>
          <SourceRow tone={palette}>
            LINE + DOT + TEXT MARKS · PATH MORPHS BETWEEN QUARTERS
          </SourceRow>
        </section>

        <section className="flex min-h-[286px] flex-col">
          <CardHead
            kicker="DOT WAFFLE · PLAN MIX"
            title="What the new accounts pick"
            sub="one dot = 1% of new accounts · a moved percent pops out and back in"
            tone={palette}
          />
          <div className="mt-2 flex items-center gap-8">
            <div className="size-[182px]">
              {inked && (
                <DotWaffle mix={s.mix} reveal={reveal} size={182} ladder={ladder} spring={spring} />
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              {s.mix.map((m, i) => (
                <div key={m.plan} className="flex items-center gap-2.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: ladder[i % ladder.length] }}
                  />
                  <span
                    className="w-16 text-[9px] font-semibold tracking-[0.1em]"
                    style={{ color: muted }}
                  >
                    {m.plan}
                  </span>
                  <span className="text-[13px] font-extrabold tabular-nums">{m.share}%</span>
                </div>
              ))}
            </div>
          </div>
          <SourceRow tone={palette}>
            DOT MARKS + ORDINAL COLOR SCALE · KEYS CARRY THE PLAN
          </SourceRow>
        </section>
      </div>

      <p
        className="pt-4 text-center text-[9px] font-medium tracking-[0.08em]"
        style={{ color: faint }}
      >
        DEMO DATA · DRAWN BY TANSTACK CHARTS · SPRINGS AND STAGGER BY ITS MOTION RENDERER
      </p>
    </div>
  );
};
