"use client";

import { useEffect, useRef, useState } from "react";

import { DotWaffle } from "./charts/dot-waffle";
import { HairlineLine } from "./charts/hairline-line";
import { RungBars } from "./charts/rung-bars";
import { TickRing } from "./charts/tick-ring";
import { DAY_MAX, SCENES } from "./lib/data";
import { DARK, FAINT, INK, LADDER, MUTED, PAPER } from "./lib/tokens";

const CYCLE_MS = 4600;

const useCountUp = (target: number, ms = 950) => {
  // Starts at 0 (matching the not-yet-inked charts around it) and always
  // resumes from the last painted value, so neither SSR nor a Strict Mode
  // remount can flash the final count or skip the entrance.
  const [shown, setShown] = useState(0);
  const painted = useRef(0);
  useEffect(() => {
    const from = painted.current;
    if (from === target) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - (1 - p) ** 3;
      const value = Math.round(from + (target - from) * eased);
      painted.current = value;
      setShown(value);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return shown;
};

// Entrance clock: 0 → 1 over `ms`, driving how much of each chart is inked.
const useReveal = (active: boolean, ms: number) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, ms]);
  return progress;
};

const Kicker = ({ children, dark }: { children: string; dark?: boolean }) => (
  <span
    className="inline-block rounded-full border border-dashed px-2.5 py-0.5 text-[8.5px] font-semibold tracking-[0.14em]"
    style={{
      color: dark ? DARK.muted : MUTED,
      borderColor: dark ? DARK.faint : FAINT,
    }}
  >
    {children}
  </span>
);

const CardHead = ({
  kicker,
  title,
  sub,
  dark,
}: {
  kicker: string;
  title: string;
  sub: string;
  dark?: boolean;
}) => (
  <div>
    <Kicker dark={dark}>{kicker}</Kicker>
    <h2
      className="mt-2 text-[16.5px] font-bold tracking-[-0.02em]"
      style={{ color: dark ? DARK.ink : INK }}
    >
      {title}
    </h2>
    <p className="mt-0.5 text-[11.5px]" style={{ color: dark ? DARK.muted : MUTED }}>
      {sub}
    </p>
  </div>
);

const SourceRow = ({ children, dark }: { children: string; dark?: boolean }) => (
  <p
    className="mt-auto pt-3 text-[9px] font-medium tracking-[0.08em]"
    style={{ color: dark ? DARK.faint : FAINT }}
  >
    {children}
  </p>
);

export const EditorialCharts = () => {
  const [scene, setScene] = useState(0);
  // Charts mount after first paint so every visitor gets the full staggered
  // entrance instead of a server-rendered final state.
  const [inked, setInked] = useState(false);
  useEffect(() => {
    setInked(true);
    const t = setInterval(() => setScene((s) => (s + 1) % SCENES.length), CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  const reveal = useReveal(inked, 1500);
  const s = SCENES[scene] ?? SCENES[0]!;
  const sessions = useCountUp(s.sessions);

  return (
    <div
      className="w-[1080px] rounded-[28px] px-9 pt-7 pb-5 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.55)] [font-family:Inter,ui-sans-serif,system-ui,sans-serif]"
      style={{ backgroundColor: PAPER, color: INK }}
    >
      {/* Masthead */}
      <div className="flex items-baseline justify-between pb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[19px] font-bold tracking-[-0.02em]">The quarter, drawn in ink</h1>
          <span className="text-[11.5px]" style={{ color: MUTED }}>
            four marks, one grammar, one spring
          </span>
        </div>
        <div className="flex gap-3 text-[11px] font-bold tracking-[0.06em]">
          {SCENES.map((q, i) => (
            <span
              key={q.quarter}
              className="transition-colors duration-500"
              style={{
                color: i === scene ? INK : FAINT,
                borderBottom: i === scene ? `2px solid ${INK}` : "2px solid transparent",
              }}
            >
              {q.quarter}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-9 gap-y-5">
        {/* Rung bars */}
        <section className="flex min-h-[298px] flex-col">
          <CardHead
            kicker="RUNG BARS · BILLING"
            title="Revenue by plan, rung by rung"
            sub="one rung = $2k of MRR · the bar is a ladder you can count"
          />
          <div className="mt-3 h-[204px]">
            {inked && <RungBars plans={s.plans} reveal={reveal} height={182} initialWidth={480} />}
          </div>
          <SourceRow>TICK MARKS ON A POINT SCALE · STAGGERED SPRING ENTRANCE</SourceRow>
        </section>

        {/* Tick ring — the dark card */}
        <section
          className="flex min-h-[298px] flex-col rounded-[20px] px-6 pt-5 pb-4"
          style={{ backgroundColor: DARK.bg }}
        >
          <CardHead
            dark
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
                twist={scene * 14}
                ladder={DARK.ladder}
              />
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-[30px] font-extrabold tracking-[-0.02em] tabular-nums"
                style={{ color: DARK.ink }}
              >
                {(sessions / 1000).toFixed(1)}k
              </span>
              <span
                className="text-[8.5px] font-semibold tracking-[0.14em]"
                style={{ color: DARK.muted }}
              >
                SESSIONS
              </span>
            </div>
            {s.channels.map((c, i) => {
              // Clockwise from noon: channel order sweeps right side first.
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
                  style={{ color: DARK.ladder[i % DARK.ladder.length] }}
                >
                  {c.channel}
                  <span className="block text-[13px] font-extrabold tabular-nums tracking-normal">
                    {c.share}%
                  </span>
                </div>
              );
            })}
          </div>
          <SourceRow dark>100 VECTOR MARKS · ONE SHADE PER CHANNEL · SPRUNG TWIST</SourceRow>
        </section>

        {/* Hairline line */}
        <section className="flex min-h-[286px] flex-col">
          <CardHead
            kicker="HAIRLINE LINE · GROWTH"
            title="Thirty days of sign-ups"
            sub="one dot = one day · hollow = weekend · the floor is a barcode of days"
          />
          <div className="mt-3 h-[184px]">
            {inked && (
              <HairlineLine
                days={s.days}
                reveal={reveal}
                yMax={DAY_MAX}
                height={158}
                initialWidth={480}
              />
            )}
          </div>
          <SourceRow>LINE + DOT + TEXT MARKS · PATH MORPHS BETWEEN QUARTERS</SourceRow>
        </section>

        {/* Dot waffle */}
        <section className="flex min-h-[286px] flex-col">
          <CardHead
            kicker="DOT WAFFLE · PLAN MIX"
            title="What the new accounts pick"
            sub="one dot = 1% of new accounts · a moved percent pops out and back in"
          />
          <div className="mt-2 flex items-center gap-8">
            <div className="size-[182px]">
              {inked && <DotWaffle mix={s.mix} reveal={reveal} size={182} ladder={LADDER} />}
            </div>
            <div className="flex flex-col gap-2.5">
              {s.mix.map((m, i) => (
                <div key={m.plan} className="flex items-center gap-2.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: LADDER[i % LADDER.length] }}
                  />
                  <span
                    className="w-16 text-[9px] font-semibold tracking-[0.1em]"
                    style={{ color: MUTED }}
                  >
                    {m.plan}
                  </span>
                  <span className="text-[13px] font-extrabold tabular-nums">{m.share}%</span>
                </div>
              ))}
            </div>
          </div>
          <SourceRow>DOT MARKS + ORDINAL COLOR SCALE · KEYS CARRY THE PLAN</SourceRow>
        </section>
      </div>

      <p
        className="pt-4 text-center text-[9px] font-medium tracking-[0.08em]"
        style={{ color: FAINT }}
      >
        DEMO DATA · DRAWN BY TANSTACK CHARTS · SPRINGS AND STAGGER BY ITS MOTION RENDERER
      </p>
    </div>
  );
};
