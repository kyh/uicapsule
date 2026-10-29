"use client";

import { barY, defineChart, dot, ruleY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowDown, ArrowUp, Bitcoin, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { compact } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  Num,
  PlotOverlay,
  renderer,
  useActive,
  useCycle,
} from "../lib/kit";
import { GREEN, MUTED, ORANGE, RED, SPRING, THEME } from "../lib/tokens";

interface Coin {
  id: string;
  color: string;
  glyph: ReactNode;
  value: number;
}

const COINS: Coin[] = [
  {
    color: "#f7931a",
    glyph: <Bitcoin className="size-3.5" strokeWidth={2.6} />,
    id: "BTC",
    value: 8.1,
  },
  { color: "#627eea", glyph: "Ξ", id: "ETH", value: 6.9 },
  { color: "#0d1e30", glyph: "₳", id: "ADA", value: 9 },
  { color: "#26a17b", glyph: "₮", id: "USDT", value: 5.7 },
  { color: "#2775ca", glyph: "$", id: "USDC", value: 13.4 },
  { color: "#f3ba2f", glyph: "◆", id: "BNB", value: 10.6 },
  { color: "#eb0029", glyph: "▽", id: "TRX", value: 15.4 },
  { color: "#e6007a", glyph: "P", id: "DOT", value: 5.7 },
];

const TICKER = [
  { change: 13, price: "$1,249.00", sym: "ETH" },
  { change: 10, price: "$1,985.00", sym: "BNB" },
  { change: -0.9, price: "$0.9720", sym: "USDT" },
  { change: 4.2, price: "$0.1040", sym: "XRP" },
  { change: -2.4, price: "$0.3810", sym: "ADA" },
  { change: 6.1, price: "$64,210.00", sym: "BTC" },
] as const;

const HOLDINGS = [
  { amount: "0.00836 BTC", coin: COINS[0], name: "Bitcoin", sym: "BTC" },
  { amount: "2.7368 USDT", coin: COINS[3], name: "Tether", sym: "USDT" },
  { amount: "6.8375 ETH", coin: COINS[1], name: "Ethereum", sym: "ETH" },
] as const;

const MARGIN = { bottom: 2, left: 40, right: 0, top: 14 };
const HEIGHT = 200;
const TOP = 20_000_000;
const BAR = "#fdd9bf";

const CoinBadge = ({ coin, size = 24 }: { coin: Coin | undefined; size?: number }) => (
  <span
    className="inline-flex shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
    style={{ backgroundColor: coin?.color, height: size, width: size }}
  >
    {coin?.glyph}
  </span>
);

const Ticker = () => {
  const active = useActive();
  const items = [...TICKER, ...TICKER];
  return (
    <div className="relative -mx-5 mt-3 overflow-hidden border-b border-black/[0.06] pb-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <motion.div
        className="flex w-max gap-2 pl-5"
        animate={active ? { x: ["0%", "-50%"] } : undefined}
        transition={{ duration: 22, ease: "linear", repeat: Infinity }}
      >
        {items.map((t, i) => {
          const up = t.change >= 0;
          const Arrow = up ? ArrowUp : ArrowDown;
          return (
            <span
              // oxlint-disable-next-line no-array-index-key -- the ticker repeats itself to loop seamlessly
              key={`${t.sym}-${i}`}
              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-black/[0.08] bg-white px-2.5 text-[11px] tabular-nums"
            >
              <span className="font-medium text-[#3a3a42]">{t.sym}:</span>
              <span style={{ color: MUTED }}>{t.price}</span>
              <span
                className="inline-flex items-center font-medium"
                style={{ color: up ? GREEN : RED }}
              >
                <Arrow className="size-3" strokeWidth={3} />({up ? "+" : ""}
                {t.change}%)
              </span>
            </span>
          );
        })}
      </motion.div>
    </div>
  );
};

const Flow = ({ label, value, change }: { label: string; value: number; change: number }) => {
  const up = change >= 0;
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <div className="rounded-2xl bg-[#f6f6f7] p-3.5">
      <p className="text-[12px]" style={{ color: MUTED }}>
        {label}
      </p>
      <Num value={value} className="mt-1 block text-[19px] font-bold tracking-[-0.03em]" />
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: MUTED }}>
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold"
          style={{ backgroundColor: up ? "#dcfce7" : "#fee2e2", color: up ? GREEN : RED }}
        >
          <span
            className="inline-flex size-3 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: up ? GREEN : RED }}
          >
            <Arrow className="size-2" strokeWidth={3.5} />
          </span>
          {Math.abs(change).toFixed(2)}%
        </span>
        vs last month
      </p>
    </div>
  );
};

export const YourAsset = () => {
  const [hi, pin] = useCycle(COINS.length, 1900, 4);
  const [lap] = useCycle(1000, 1900 * COINS.length, 0);

  // Each lap re-prices the portfolio a little, so the bars breathe.
  const rows = useMemo(
    () =>
      COINS.map((c, i) => ({
        id: c.id,
        value: c.value * 1_000_000 * (1 + 0.09 * Math.sin(lap * 1.7 + i * 2.3)),
      })),
    [lap],
  );
  const picked = rows[hi] ?? rows[0];

  const definition = useMemo(
    () =>
      defineChart({
        focusRing: false,
        margin: MARGIN,
        marks: [
          barY(rows, {
            fill: (d) => (d.id === picked?.id ? "#fcc59c" : BAR),
            key: "id",
            radius: 8,
            stroke: "#f7bf96",
            strokeWidth: 1,
            x: "id",
            y1: 0,
            y2: "value",
          }),
          ruleY([0], { stroke: "#d9d9de", strokeOpacity: 1, strokeWidth: 1 }),
          dot(rows, {
            fill: ORANGE,
            key: "id",
            r: 6.5,
            stroke: "#ffffff",
            strokeWidth: 2,
            x: "id",
            y: "value",
          }),
        ],
        scales: {
          x: {
            axis: false,
            scale: scaleBand<string>()
              .domain(COINS.map((c) => c.id))
              .paddingInner(0.76)
              .paddingOuter(0.38),
          },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 11 },
              ticks: {
                format: (v) => compact(v),
                size: 0,
                values: [0, 5_000_000, 10_000_000, 15_000_000, 20_000_000],
              },
            },
            grid: { stroke: "#e2e2e7", strokeDasharray: "4 4", strokeOpacity: 1, strokeWidth: 1 },
            scale: scaleLinear().domain([0, TOP]),
          },
        },
        theme: THEME,
      }),
    [rows, picked],
  );

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Your Asset</h3>
          <p className="mt-0.5 truncate text-[12px]" style={{ color: MUTED }}>
            Live asset performance tracking
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[11px]" style={{ color: MUTED }}>
            Updating in 5 min
          </span>
          <span className="inline-flex size-8 items-center justify-center rounded-full border border-black/[0.08] text-[#8a8a93]">
            <motion.span
              animate={{ rotate: lap * 360 }}
              transition={SPRING}
              className="inline-flex"
            >
              <RefreshCw className="size-3.5" />
            </motion.span>
          </span>
        </div>
      </div>
      <Ticker />
      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Holdings value by asset"
            onFocusChange={(p) => {
              if (p) {
                pin(COINS.findIndex((c) => c.id === p.xValue));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            dark
            left={((hi + 0.5) / COINS.length) * 100}
            top={100 - ((picked?.value ?? 0) / TOP) * 100}
            className="-translate-y-[calc(100%+12px)] text-center leading-tight"
          >
            <span className="block text-[10px] text-white/60">{picked?.id}</span>
            <span className="font-semibold">{compact(picked?.value ?? 0)}</span>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <div className="mt-2.5 flex" style={{ paddingLeft: MARGIN.left }}>
        {COINS.map((c, i) => (
          <motion.span
            key={c.id}
            animate={{ scale: i === hi ? 1.15 : 1 }}
            transition={SPRING}
            className="flex flex-1 justify-center"
          >
            <CoinBadge coin={c} size={22} />
          </motion.span>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Flow label="Deposit" value={8937.08} change={4.52} />
        <Flow label="Withdrawal" value={3746.91} change={-0.64} />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {HOLDINGS.map((h) => (
          <div
            key={h.sym}
            className="flex items-center gap-2.5 rounded-2xl bg-[#f6f6f7] px-3 py-2.5 ring-1 ring-black/[0.04]"
          >
            <CoinBadge coin={h.coin} size={22} />
            <span className="flex-1 text-[13px]">
              {h.name} <span style={{ color: MUTED }}>({h.sym})</span>
            </span>
            <span className="text-[13px] tabular-nums">{h.amount}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
