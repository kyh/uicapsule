import type { Grid } from "./terminal-grid";

import { ASKS, BEAR_CURVE, BIDS, CANDLES, GREEKS, OPTION_CHAIN, RISK } from "./terminal-data";
import {
  drawBar,
  drawBigNumber,
  drawBox,
  drawHRule,
  drawText,
  drawTextRight,
  INNER_COLS,
  INNER_ROWS,
  makeGrid,
  OUTER_COLS,
  OUTER_ROWS,
  pasteInto,
  SCREEN_X,
  SCREEN_Y,
  setCell,
  vbarChar,
} from "./terminal-grid";

// ---------------------------------------------------------------------------
// Phone shell — bezel rails, rounded stubs, side buttons, Dynamic Island
// ---------------------------------------------------------------------------

function drawPhoneBezel(g: Grid) {
  const cols = OUTER_COLS;
  const rows = OUTER_ROWS;
  const L_OUTER = 1;
  const L_INNER = 2;
  const R_INNER = cols - 3;
  const R_OUTER = cols - 2;

  // Top edge with rounded-corner stubs
  setCell(g, 0, L_OUTER, "▗", 1);
  setCell(g, 0, R_OUTER, "▖", 1);
  for (let c = L_OUTER + 1; c < R_OUTER; c++) setCell(g, 0, c, "▀", 1);

  // Side rails
  for (let r = 1; r < rows - 1; r++) {
    setCell(g, r, L_OUTER, "▌", 1);
    setCell(g, r, L_INNER, "█", 1);
    setCell(g, r, R_INNER, "█", 1);
    setCell(g, r, R_OUTER, "▐", 1);
  }

  // Bottom edge with mirror stubs
  setCell(g, rows - 1, L_OUTER, "▝", 1);
  setCell(g, rows - 1, R_OUTER, "▘", 1);
  for (let c = L_OUTER + 1; c < R_OUTER; c++) setCell(g, rows - 1, c, "▄", 1);

  // Side buttons — left rail action + volume rockers, right rail sleep
  const leftBtn = (r0: number, r1: number) => {
    for (let r = r0; r <= r1; r++) setCell(g, r, 0, "▌", 1);
  };
  const rightBtn = (r0: number, r1: number) => {
    for (let r = r0; r <= r1; r++) setCell(g, r, cols - 1, "▐", 1);
  };

  leftBtn(8, 9);
  leftBtn(13, 15);
  leftBtn(17, 19);
  rightBtn(14, 19);

  // Dynamic Island — pill with camera + Face ID cut-outs
  const diW = 14;
  const diStart = Math.floor((cols - diW) / 2);

  for (let c = 0; c < diW; c++) setCell(g, 1, diStart + c, "▄", 1);
  for (let c = 0; c < diW; c++) {
    if (c === 2) continue;
    if (c === diW - 3) continue;
    setCell(g, 2, diStart + c, "█", 1);
  }
  for (let c = 0; c < diW; c++) setCell(g, 3, diStart + c, "▀", 1);
}

function statusBarTop(g: Grid) {
  drawText(g, 2, 5, "9:41", 0.85);
  drawText(g, 2, 38, "●●●", 0.55);
  drawText(g, 2, 42, "78%", 0.8);
  setCell(g, 2, 46, "█", 0.85);
}

const TABS = [
  { iconCol: 3, labelCol: 1, label: "home" },
  { iconCol: 11, labelCol: 8, label: "trade" },
  { iconCol: 19, labelCol: 17, label: "book" },
  { iconCol: 27, labelCol: 25, label: "acct" },
  { iconCol: 35, labelCol: 33, label: "more" },
] as const;

function drawTabBar(inner: Grid, activeIndex: number) {
  drawHRule(inner, 49, 0, INNER_COLS, "─", 0.22);

  TABS.forEach((tab, i) => {
    const active = i === activeIndex;
    setCell(inner, 50, tab.iconCol, active ? "◆" : "◇", active ? 0.9 : 0.45);
    drawText(inner, 51, tab.labelCol, tab.label, active ? 0.8 : 0.45);
  });

  drawHRule(inner, 53, 16, 8, "▬", 0.6);
}

// ---------------------------------------------------------------------------
// Phase 1 — BTC spot trade
// ---------------------------------------------------------------------------

function drawCandles(inner: Grid) {
  const top = 9;
  const bottom = 23;
  const h = bottom - top;
  const x0 = 5;
  const cw = 2;

  let min = Infinity;
  let max = -Infinity;
  for (const k of CANDLES) {
    min = Math.min(min, k.l);
    max = Math.max(max, k.h);
  }
  const span = max - min || 1;
  const yOf = (price: number) => top + Math.round((1 - (price - min) / span) * h);

  drawText(inner, top, 0, "108K", 0.45);
  drawText(inner, top + Math.round(h / 2), 0, "107K", 0.45);
  drawText(inner, bottom, 0, "106K", 0.45);

  CANDLES.forEach((k, i) => {
    const cx = x0 + i * cw;
    const bull = k.c >= k.o;
    const bodyChar = bull ? "█" : "▒";
    const bodyAlpha = bull ? 0.98 : 0.55;
    const hi = yOf(k.h);
    const lo = yOf(k.l);
    const bodyTop = Math.min(yOf(k.o), yOf(k.c));
    const bodyBot = Math.max(yOf(k.o), yOf(k.c));

    for (let r = hi; r <= lo; r++) setCell(inner, r, cx, "│", 0.5);
    for (let r = bodyTop; r <= bodyBot; r++) {
      for (let x = 0; x < cw; x++) setCell(inner, r, cx + x, bodyChar, bodyAlpha);
    }
  });

  const last = CANDLES[CANDLES.length - 1];
  if (!last) return;

  const lastRow = yOf(last.c);
  for (let c = x0; c < 39; c++) setCell(inner, lastRow, c, "┄", 0.3);
  // Alpha 1 is load-bearing: the last-price row crosses the final candles and
  // `setCell` drops any write that a brighter cell already occupies, so
  // anything at or below the 0.98 bull body would come out half-eaten.
  drawText(inner, lastRow, 33, "107.4K", 1);
}

function drawOrderBook(inner: Grid) {
  drawText(inner, 27, 0, "ORDER BOOK", 0.6);
  drawTextRight(inner, 27, 39, "depth 4.32 BTC", 0.5);
  drawHRule(inner, 28, 0, INNER_COLS, "─", 0.22);

  const maxSize = Math.max(...ASKS.map((a) => a.size), ...BIDS.map((b) => b.size));
  const barCol = 13;
  const barMax = 11;

  ASKS.forEach((a, i) => {
    const r = 29 + i;
    drawText(inner, r, 0, `ASK ${a.price}`, 0.7);
    drawBar(inner, r, barCol, Math.max(1, Math.round((a.size / maxSize) * barMax)), "▒", 0.55);
    drawTextRight(inner, r, 34, a.size.toFixed(3), 0.7);
    setCell(inner, r, 37, "↑", 0.55);
  });

  drawText(inner, 33, 9, "── spread $4.00 ──", 0.4);

  BIDS.forEach((b, i) => {
    const r = 34 + i;
    drawText(inner, r, 0, `BID ${b.price}`, 0.7);
    drawBar(inner, r, barCol, Math.max(1, Math.round((b.size / maxSize) * barMax)), "▓", 0.7);
    drawTextRight(inner, r, 34, b.size.toFixed(3), 0.7);
    setCell(inner, r, 37, "↓", 0.55);
  });
}

export function buildBtcFrame(): Grid {
  const outer = makeGrid(OUTER_COLS, OUTER_ROWS);
  drawPhoneBezel(outer);
  statusBarTop(outer);

  const inner = makeGrid(INNER_COLS, INNER_ROWS);

  drawText(inner, 0, 0, "←  BTC · USD", 0.9);
  setCell(inner, 0, 38, "…", 0.6);
  drawText(inner, 1, 3, "spot · usdt-margined", 0.5);
  setCell(inner, 1, 38, "◆", 0.7);

  drawText(inner, 3, 0, "$107,432.18", 0.98);
  drawText(inner, 4, 0, "▲ +2.47%   +$2,584.42 today", 0.7);
  drawTextRight(inner, 4, 39, "live ●", 0.75);

  const tfs = ["1H", "1D", "1W", "1M", "3M", "1Y"];
  tfs.forEach((t, i) => drawText(inner, 6, i * 6, t, i === 3 ? 0.9 : 0.45));
  drawText(inner, 7, 18, "──", 0.8);

  drawCandles(inner);

  const maxV = Math.max(...CANDLES.map((k) => k.v));
  CANDLES.forEach((k, i) => {
    const cx = 5 + i * 2;
    const ch = vbarChar(k.v / maxV);
    setCell(inner, 25, cx, ch, 0.5);
    setCell(inner, 25, cx + 1, ch, 0.5);
  });

  drawOrderBook(inner);

  drawText(inner, 39, 0, "wallet", 0.55);
  drawText(inner, 40, 0, "0.4218 BTC", 0.85);
  drawTextRight(inner, 40, 39, "≈ $45,318.86", 0.85);

  drawBox(inner, 42, 0, 19, 4, 0.95);
  drawText(inner, 43, 8, "BUY", 0.95);
  drawText(inner, 44, 8, "BUY", 0.95);
  drawBox(inner, 42, 20, 19, 4, 0.55);
  drawText(inner, 43, 27, "SELL", 0.55);
  drawText(inner, 44, 27, "SELL", 0.55);

  drawTabBar(inner, 1);

  pasteInto(outer, inner, SCREEN_Y, SCREEN_X);
  return outer;
}

// ---------------------------------------------------------------------------
// Phase 2 — XAU options chain
// ---------------------------------------------------------------------------

function drawPayoff(inner: Grid) {
  const top = 25;
  const lossRow = 33;
  const zero = 31;
  const strikeCol = 14;

  drawHRule(inner, zero, 1, 38, "┈", 0.16);
  for (let c = 1; c <= strikeCol; c++) setCell(inner, lossRow, c, "─", 0.6);

  let prevRow = lossRow;
  for (let k = 1; k <= 24; k++) {
    const col = strikeCol + k;
    if (col > 39) break;
    const row = Math.max(top, Math.round(lossRow - k * 0.62));
    setCell(inner, row, col, "╱", 0.72);
    if (prevRow - row > 1) {
      for (let rr = row + 1; rr < prevRow; rr++) setCell(inner, rr, col, "╱", 0.5);
    }
    prevRow = row;
  }

  const beCol = strikeCol + 6;
  for (let r = top; r <= lossRow; r++) setCell(inner, r, beCol, "┊", 0.22);
  // Sits on the clamped plateau of the ramp, so it has to outrank the 0.72
  // slashes to read as a label rather than a stray character.
  drawTextRight(inner, top, 39, "+max", 0.8);
}

export function buildGoldFrame(): Grid {
  const outer = makeGrid(OUTER_COLS, OUTER_ROWS);
  drawPhoneBezel(outer);
  statusBarTop(outer);

  const inner = makeGrid(INNER_COLS, INNER_ROWS);

  drawText(inner, 0, 0, "←  XAU · OPTIONS", 0.9);
  setCell(inner, 0, 38, "…", 0.6);
  drawText(inner, 1, 3, "26 dec · opt · usd", 0.5);
  setCell(inner, 1, 38, "●", 0.7);

  drawText(inner, 3, 0, "$2,684.50", 0.98);
  drawText(inner, 4, 0, "▼ -0.32%   -$8.65 today", 0.7);
  drawTextRight(inner, 4, 39, "iv30 13.8", 0.6);

  const exps = ["NOV", "DEC", "JAN", "MAR", "JUN", "LEAP"];
  let ec = 0;
  exps.forEach((e, i) => {
    const active = i === 1;
    drawText(inner, 6, ec, active ? `${e}*` : e, active ? 0.9 : 0.45);
    ec += e.length + (active ? 1 : 0) + 2;
  });
  drawText(inner, 7, 5, "──", 0.8);

  const cCallBid = 6;
  const cCallIv = 12;
  const cK = 17;
  const cPutIv = 23;
  const cPutBid = 29;

  drawText(inner, 9, 0, "CALL", 0.55);
  drawText(inner, 9, cCallBid, "bid", 0.45);
  drawText(inner, 9, cCallIv, "iv", 0.45);
  drawText(inner, 9, cK + 1, "K", 0.55);
  drawText(inner, 9, cPutIv, "iv", 0.45);
  drawText(inner, 9, cPutBid, "bid", 0.45);
  drawTextRight(inner, 9, 39, "PUT", 0.55);
  drawHRule(inner, 10, 0, INNER_COLS, "─", 0.22);

  OPTION_CHAIN.forEach((row, i) => {
    const r = 11 + i;
    if (row.highlight) {
      for (let c = 0; c < INNER_COLS; c++) setCell(inner, r, c, "·", 0.14);
    }
    drawText(inner, r, cCallBid, row.callBid.toFixed(2), 0.82);
    drawText(inner, r, cCallIv, row.callIv.toFixed(1), 0.45);
    drawText(inner, r, cK, String(row.strike), row.highlight ? 0.98 : 0.7);
    drawText(inner, r, cPutIv, row.putIv.toFixed(1), 0.45);
    drawText(inner, r, cPutBid, row.putBid.toFixed(2), 0.82);
    if (row.highlight) {
      // Hugging the strike: cK-2 lands on the last digit of the call IV and
      // cK+4 is the only free column on the put side, so the pair has to sit
      // tight against the 4-digit strike rather than one cell out.
      setCell(inner, r, cK - 1, "►", 0.9);
      setCell(inner, r, cK + 4, "◄", 0.9);
    }
  });

  drawText(inner, 20, 0, "GREEKS", 0.6);
  drawText(inner, 20, 9, `delta ${GREEKS.delta.toFixed(2)}`, 0.7);
  drawText(inner, 20, 22, `gamma ${GREEKS.gamma.toFixed(3)}`, 0.7);
  drawText(inner, 21, 0, `theta ${GREEKS.theta.toFixed(2)}`, 0.7);
  drawText(inner, 21, 13, `vega ${GREEKS.vega.toFixed(2)}`, 0.7);
  drawText(inner, 21, 25, `rho ${GREEKS.rho.toFixed(2)}`, 0.7);

  drawText(inner, 23, 0, "P/L AT EXPIRY", 0.6);
  drawTextRight(inner, 23, 39, "long call ►", 0.5);
  drawHRule(inner, 24, 0, INNER_COLS, "─", 0.22);
  drawPayoff(inner);
  drawText(inner, 35, 12, "2680", 0.55);
  drawText(inner, 35, 18, "BE 2697", 0.45);

  drawBox(inner, 39, 0, 12, 3, 0.95);
  drawText(inner, 40, 4, "LONG", 0.95);
  drawBox(inner, 39, 13, 12, 3, 0.55);
  drawText(inner, 40, 16, "SHORT", 0.55);
  drawBox(inner, 39, 26, 14, 3, 0.55);
  drawText(inner, 40, 29, "SPREAD", 0.55);

  drawText(inner, 43, 0, "size  1×  100 oz", 0.7);
  drawTextRight(inner, 43, 39, "cost  $2,605", 0.7);
  drawHRule(inner, 44, 0, INNER_COLS, "─", 0.22);
  drawText(inner, 45, 0, "notional  $268,450", 0.7);
  drawTextRight(inner, 45, 39, "margin 12 %", 0.6);

  drawTabBar(inner, 2);

  pasteInto(outer, inner, SCREEN_Y, SCREEN_X);
  return outer;
}

// ---------------------------------------------------------------------------
// Phase 3 — Drawdown stats card
// ---------------------------------------------------------------------------

function drawBearChart(inner: Grid) {
  const top = 32;
  const bottom = 43;
  const h = bottom - top;
  const x0 = 5;
  const x1 = 39;
  const w = x1 - x0;
  const vals = BEAR_CURVE;

  const first = vals[0];
  if (first === undefined) return;

  let min = Infinity;
  let max = -Infinity;
  for (const v of vals) {
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  const span = max - min || 1;
  const colOf = (i: number) => x0 + Math.round((i / (vals.length - 1)) * w);
  const rowOf = (v: number) => top + Math.round((1 - (v - min) / span) * h);

  drawText(inner, top, 0, "131", 0.45);
  drawText(inner, top + Math.round(h / 2), 0, "107", 0.45);
  drawText(inner, bottom, 0, "83", 0.45);

  let peakI = 0;
  let peakV = first;
  let troughI = 0;
  let troughV = first;
  vals.forEach((v, i) => {
    if (v > peakV) {
      peakV = v;
      peakI = i;
    }
    if (v < troughV) {
      troughV = v;
      troughI = i;
    }
  });

  vals.forEach((v, i) => {
    const c = colOf(i);
    const r = rowOf(v);

    const prev = vals[i - 1];
    if (i > 0 && prev !== undefined) {
      const pc = colOf(i - 1);
      const pr = rowOf(prev);
      const steps = Math.max(1, c - pc);
      for (let s = 1; s < steps; s++) {
        const ix = pc + s;
        const iy = Math.round(pr + ((r - pr) * s) / steps);
        setCell(inner, iy, ix, r < pr ? "╱" : r > pr ? "╲" : "─", 0.5);
      }
    }

    setCell(inner, r, c, "▪", 0.85);
    for (let rr = r + 1; rr <= bottom; rr++) {
      const d = (rr - r) / Math.max(1, bottom - r);
      setCell(inner, rr, c, d < 0.4 ? "▒" : d < 0.75 ? "░" : "·", 0.18);
    }
  });

  setCell(inner, rowOf(peakV) - 1, colOf(peakI), "▼", 0.6);
  setCell(inner, rowOf(troughV) + 1, colOf(troughI), "▲", 0.6);

  // One row below the trough marker, not level with it: the trough is by
  // definition the chart floor, so its ▲ always lands on `bottom + 1` and would
  // swallow whichever tick shares that column.
  const years = ["21", "22", "23", "24", "25"];
  years.forEach((y, i) => {
    const c = x0 + Math.round((i / (years.length - 1)) * w);
    setCell(inner, bottom + 2, c, "┴", 0.35);
    drawText(inner, bottom + 3, Math.min(36, c), `'${y}`, 0.4);
  });
}

export function buildStatsFrame(): Grid {
  const outer = makeGrid(OUTER_COLS, OUTER_ROWS);
  drawPhoneBezel(outer);
  statusBarTop(outer);

  const inner = makeGrid(INNER_COLS, INNER_ROWS);

  drawText(inner, 1, 0, "DRAWDOWN PROFILE", 0.85);
  drawText(inner, 2, 0, "five-year tape · marked to market", 0.45);
  drawHRule(inner, 4, 0, INNER_COLS, "─", 0.22);

  const leftX = 0;
  const rightX = 21;

  drawBigNumber(inner, 6, leftX, RISK.sharpe, 0.95, 0);
  drawText(inner, 12, leftX, "SHARPE RATIO", 0.6);
  drawText(inner, 13, leftX, "paid for the risk", 0.4);
  drawText(inner, 14, leftX, "you took", 0.4);

  drawBigNumber(inner, 6, rightX, RISK.maxDrawdown, 0.95, 0);
  drawText(inner, 12, rightX, "MAX DRAWDOWN", 0.6);
  drawText(inner, 13, rightX, "the year you'd", 0.4);
  drawText(inner, 14, rightX, "rather forget", 0.4);

  drawBigNumber(inner, 17, leftX, RISK.vol, 0.95, 0);
  drawText(inner, 23, leftX, "ANNUAL VOL", 0.6);
  drawText(inner, 24, leftX, "one σ of monthly", 0.4);
  drawText(inner, 25, leftX, "log returns", 0.4);

  drawBigNumber(inner, 17, rightX, RISK.cagr, 0.95, 0);
  drawText(inner, 23, rightX, "CAGR · 5Y", 0.6);
  drawText(inner, 24, rightX, "compounded since", 0.4);
  drawText(inner, 25, rightX, "inception", 0.4);

  drawHRule(inner, 29, 0, INNER_COLS, "─", 0.22);
  drawText(inner, 30, 0, "EQUITY CURVE · INDEXED TO 100", 0.6);
  drawTextRight(inner, 30, 39, "5Y · USD", 0.45);

  drawBearChart(inner);

  drawHRule(inner, 49, 0, INNER_COLS, "─", 0.22);
  drawText(inner, 51, 0, "marked daily · 1,260 obs", 0.5);
  drawTextRight(inner, 51, 39, "self · usd", 0.4);

  pasteInto(outer, inner, SCREEN_Y, SCREEN_X);
  return outer;
}
