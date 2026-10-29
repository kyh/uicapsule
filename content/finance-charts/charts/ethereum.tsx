"use client";

import { barY, defineChart, link } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUp, Diamond, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { rng, usd } from "../lib/data";
import { Card, ChartSlot, Num, Segmented, renderer, useCycle } from "../lib/kit";
import { DASHED_GRID, GREEN, MUTED, THEME } from "../lib/tokens";

const N = 49;
const UP = "#1fa64a";
const DOWN = "#f0442c";
const VOL_UP = "#b8e6c6";
const VOL_DOWN = "#fbbdb3";

interface Candle {
  id: string;
  i: number;
  open: number;
  close: number;
  high: number;
  low: number;
  vol: number;
  up: boolean;
}

const candles = (seed: number, center: number): Candle[] => {
  const r = rng(seed);
  const out: Candle[] = [];
  let prev = center;
  for (let i = 0; i < N; i += 1) {
    const open = Math.min(19_000, Math.max(6500, prev + (r() - 0.5) * 2200));
    const pull = (center - open) * 0.25;
    let close = Math.min(20_000, Math.max(5500, open + pull + (r() - 0.5) * 7600));
    if (Math.abs(close - open) < 300) {
      close = open + (r() > 0.5 ? 300 : -300);
    }
    const high = Math.max(open, close) + r() * 1300;
    const low = Math.min(open, close) - r() * 1300;
    out.push({
      close,
      high,
      i,
      id: `c${i}`,
      low,
      open,
      up: close >= open,
      vol: 0.4 + r() * r() * 2,
    });
    prev = close;
  }
  return out;
};

const RANGES = [
  {
    change: 339,
    data: candles(31, 13_000),
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    value: 10_974.58,
  },
  {
    change: 912,
    data: candles(58, 12_200),
    labels: ["1", "5", "9", "13", "17", "21", "25"],
    value: 10_412.2,
  },
  {
    change: 2764,
    data: candles(97, 11_000),
    labels: ["Jan", "Feb", "Apr", "Jun", "Aug", "Oct", "Dec"],
    value: 8240.67,
  },
] as const;

const MARGIN = { bottom: 28, left: 0, right: 40, top: 8 };
const HEIGHT = 250;

const kFormat = (v: number) => (v === 0 ? "$0" : `$${v / 1000}K`);

const Stat = ({
  color,
  label,
  value,
  down,
}: {
  color: string;
  label: string;
  value: string;
  down?: boolean;
}) => (
  <p className="flex items-center gap-1.5 whitespace-nowrap">
    <span className="size-2 rounded-[2px]" style={{ backgroundColor: color }} />
    <span style={{ color: MUTED }}>{label}</span>
    <span
      className="text-[12px] font-medium normal-case"
      style={{ color: down ? DOWN : "#0b0b0f" }}
    >
      {value}
    </span>
  </p>
);

const EthereumBody = () => {
  const [range, pin] = useCycle(RANGES.length, 3600);
  const current = RANGES[range] ?? RANGES[0];
  const rows = current.data;

  const definition = useMemo(() => {
    const maxVol = Math.max(...rows.map((d) => d.vol));
    return defineChart({
      margin: MARGIN,
      marks: [
        barY(rows, {
          fill: (d) => (d.up ? VOL_UP : VOL_DOWN),
          id: "volume",
          key: "id",
          maxThickness: 5,
          x: "i",
          y: "vol",
          yScale: "vol",
        }),
        link(rows, {
          id: "wicks",
          key: "id",
          stroke: (d) => (d.up ? UP : DOWN),
          strokeWidth: 1.1,
          x1: "i",
          x2: "i",
          y1: "low",
          y2: "high",
        }),
        barY(rows, {
          fill: (d) => (d.up ? UP : DOWN),
          id: "bodies",
          key: "id",
          maxThickness: 4.5,
          radius: 1,
          x: "i",
          y1: "open",
          y2: "close",
        }),
      ],
      scales: {
        vol: {
          axis: false,
          channel: "y",
          scale: scaleLinear().domain([0, maxVol * 5.2]),
        },
        x: {
          axis: {
            line: false,
            tickLabels: { fontSize: 12 },
            ticks: {
              format: (v: number) => current.labels[Math.round((v - 3) / 7)] ?? "",
              padding: 8,
              size: 0,
              values: current.labels.map((_, k) => k * 7 + 3),
            },
          },
          scale: scaleLinear().domain([-0.8, N - 0.2]),
        },
        y: {
          axis: {
            line: false,
            tickLabels: { fontSize: 12 },
            ticks: {
              format: kFormat,
              padding: 6,
              size: 0,
              values: [0, 5000, 10_000, 15_000, 20_000, 25_000],
            },
          },
          grid: DASHED_GRID,
          scale: scaleLinear().domain([0, 25_000]),
          side: "right",
        },
      },
      theme: THEME,
    });
  }, [rows, current]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex size-8 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(160deg, #8ea2f5, #5a6fe0)" }}
          >
            <Diamond className="size-4 text-white" strokeWidth={2.4} />
          </span>
          <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Ethereum</h3>
        </div>
        <button
          type="button"
          aria-label="Insights"
          className="inline-flex size-8 items-center justify-center rounded-full border border-black/[0.08]"
        >
          <Sparkles className="size-4 text-[#5b5ef0]" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Num value={current.value} className="text-[26px] font-bold tracking-[-0.03em]" />
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium"
            style={{ backgroundColor: "#e3f6e9", color: GREEN }}
          >
            <span
              className="inline-flex size-3 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: GREEN }}
            >
              <ArrowUp className="size-2" strokeWidth={3.5} />
            </span>
            <Num value={current.change} format={(n) => usd(n, true)} />
          </span>
        </div>
        <Segmented options={["W", "M", "Y"]} value={range} onChange={pin} size="sm" />
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-[10px] tracking-[0.02em] uppercase">
        <Stat color="#a23cf0" label="NAV:" value="$11.0K" />
        <Stat color="#3d5af1" label="Market price:" value="$11.0K" />
        <Stat color="#a23cf0" label="NAV change:" value="-$836.5" down />
        <Stat color="#3d5af1" label="Mkt price change:" value="-$847.5" down />
      </div>
      <ChartSlot height={HEIGHT} className="mt-3">
        <Chart
          definition={definition}
          renderer={renderer}
          height={HEIGHT}
          ariaLabel="Ethereum candlesticks with volume"
        />
      </ChartSlot>
    </>
  );
};

// The cycle, count-ups and chart mount read the card's in-view state, so the
// body renders inside <Card> rather than beside it.
export const Ethereum = () => (
  <Card>
    <EthereumBody />
  </Card>
);
