// Static datasets for the three phases. No network, no randomness — every
// figure here gets drawn onto the canvas as characters.

export type Candle = { o: number; h: number; l: number; c: number; v: number };
export type DepthRow = { price: string; size: number };
export type OptionRow = {
  strike: number;
  callBid: number;
  callIv: number;
  putBid: number;
  putIv: number;
  highlight?: boolean;
};

// Phase 1 — a bullish BTC breakout from ~106K to a 107.4K close with one pullback.
export const CANDLES: Candle[] = [
  { o: 106020, h: 106180, l: 105920, c: 106140, v: 0.42 },
  { o: 106140, h: 106320, l: 106080, c: 106280, v: 0.55 },
  { o: 106280, h: 106400, l: 106210, c: 106260, v: 0.38 },
  { o: 106260, h: 106520, l: 106230, c: 106480, v: 0.61 },
  { o: 106480, h: 106690, l: 106440, c: 106650, v: 0.72 },
  { o: 106650, h: 106720, l: 106500, c: 106560, v: 0.49 },
  { o: 106560, h: 106600, l: 106320, c: 106380, v: 0.83 },
  { o: 106380, h: 106540, l: 106350, c: 106510, v: 0.44 },
  { o: 106510, h: 106780, l: 106480, c: 106740, v: 0.67 },
  { o: 106740, h: 106960, l: 106700, c: 106920, v: 0.78 },
  { o: 106920, h: 107080, l: 106870, c: 107040, v: 0.69 },
  { o: 107040, h: 107120, l: 106960, c: 106990, v: 0.51 },
  { o: 106990, h: 107260, l: 106960, c: 107220, v: 0.88 },
  { o: 107220, h: 107380, l: 107180, c: 107350, v: 0.74 },
  { o: 107350, h: 107420, l: 107280, c: 107300, v: 0.46 },
  { o: 107300, h: 107480, l: 107270, c: 107440, v: 0.81 },
  { o: 107440, h: 107460, l: 107360, c: 107432, v: 0.58 },
];

export const ASKS: DepthRow[] = [
  { price: "107,448", size: 0.184 },
  { price: "107,446", size: 0.092 },
  { price: "107,440", size: 0.451 },
  { price: "107,436", size: 0.218 },
];

export const BIDS: DepthRow[] = [
  { price: "107,432", size: 0.238 },
  { price: "107,430", size: 0.117 },
  { price: "107,428", size: 0.892 },
  { price: "107,424", size: 0.314 },
];

// Phase 2 — a XAU options chain, 26 DEC expiry, ATM at the 2680 strike.
export const OPTION_CHAIN: OptionRow[] = [
  {
    strike: 2640,
    callBid: 56.4,
    callIv: 14.2,
    putBid: 3.05,
    putIv: 13.8,
  },
  {
    strike: 2650,
    callBid: 48.2,
    callIv: 13.9,
    putBid: 5.2,
    putIv: 13.5,
  },
  {
    strike: 2660,
    callBid: 40.4,
    callIv: 13.6,
    putBid: 8.1,
    putIv: 13.4,
  },
  {
    strike: 2670,
    callBid: 32.9,
    callIv: 13.3,
    putBid: 12.3,
    putIv: 13.6,
  },
  {
    strike: 2680,
    callBid: 25.85,
    callIv: 13.4,
    putBid: 16.95,
    putIv: 13.9,
    highlight: true,
  },
  {
    strike: 2690,
    callBid: 19.4,
    callIv: 13.7,
    putBid: 22.5,
    putIv: 14.3,
  },
  {
    strike: 2700,
    callBid: 14.05,
    callIv: 14.2,
    putBid: 29.1,
    putIv: 14.8,
  },
  {
    strike: 2710,
    callBid: 9.6,
    callIv: 14.8,
    putBid: 36.95,
    putIv: 15.4,
  },
];

export const GREEKS = {
  delta: 0.52,
  gamma: 0.018,
  theta: -0.45,
  vega: 1.2,
  rho: 0.34,
};

// Phase 3 — a bearish equity curve indexed to 100, peak ~131, trough ~83.
export const BEAR_CURVE: number[] = [
  100, 104, 108, 113, 119, 124, 122, 127, 131, 128, 122, 116, 118, 121, 119, 113, 106, 99, 95, 91,
  88, 86, 83, 87, 92, 95, 93, 96, 99, 102,
];

export const RISK = {
  sharpe: "2.14",
  maxDrawdown: "-17.8%",
  vol: "14.2%",
  cagr: "23.8%",
};
