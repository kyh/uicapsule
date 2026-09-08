// Static datasets for the three phases. No network, no randomness — every
// figure here gets drawn onto the canvas as characters.

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}
export interface DepthRow {
  price: string;
  size: number;
}
export interface OptionRow {
  strike: number;
  callBid: number;
  callIv: number;
  putBid: number;
  putIv: number;
  highlight?: boolean;
}

// Phase 1 — a bullish BTC breakout from ~106K to a 107.4K close with one pullback.
export const CANDLES: Candle[] = [
  { c: 106_140, h: 106_180, l: 105_920, o: 106_020, v: 0.42 },
  { c: 106_280, h: 106_320, l: 106_080, o: 106_140, v: 0.55 },
  { c: 106_260, h: 106_400, l: 106_210, o: 106_280, v: 0.38 },
  { c: 106_480, h: 106_520, l: 106_230, o: 106_260, v: 0.61 },
  { c: 106_650, h: 106_690, l: 106_440, o: 106_480, v: 0.72 },
  { c: 106_560, h: 106_720, l: 106_500, o: 106_650, v: 0.49 },
  { c: 106_380, h: 106_600, l: 106_320, o: 106_560, v: 0.83 },
  { c: 106_510, h: 106_540, l: 106_350, o: 106_380, v: 0.44 },
  { c: 106_740, h: 106_780, l: 106_480, o: 106_510, v: 0.67 },
  { c: 106_920, h: 106_960, l: 106_700, o: 106_740, v: 0.78 },
  { c: 107_040, h: 107_080, l: 106_870, o: 106_920, v: 0.69 },
  { c: 106_990, h: 107_120, l: 106_960, o: 107_040, v: 0.51 },
  { c: 107_220, h: 107_260, l: 106_960, o: 106_990, v: 0.88 },
  { c: 107_350, h: 107_380, l: 107_180, o: 107_220, v: 0.74 },
  { c: 107_300, h: 107_420, l: 107_280, o: 107_350, v: 0.46 },
  { c: 107_440, h: 107_480, l: 107_270, o: 107_300, v: 0.81 },
  { c: 107_432, h: 107_460, l: 107_360, o: 107_440, v: 0.58 },
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
    callBid: 56.4,
    callIv: 14.2,
    putBid: 3.05,
    putIv: 13.8,
    strike: 2640,
  },
  {
    callBid: 48.2,
    callIv: 13.9,
    putBid: 5.2,
    putIv: 13.5,
    strike: 2650,
  },
  {
    callBid: 40.4,
    callIv: 13.6,
    putBid: 8.1,
    putIv: 13.4,
    strike: 2660,
  },
  {
    callBid: 32.9,
    callIv: 13.3,
    putBid: 12.3,
    putIv: 13.6,
    strike: 2670,
  },
  {
    callBid: 25.85,
    callIv: 13.4,
    highlight: true,
    putBid: 16.95,
    putIv: 13.9,
    strike: 2680,
  },
  {
    callBid: 19.4,
    callIv: 13.7,
    putBid: 22.5,
    putIv: 14.3,
    strike: 2690,
  },
  {
    callBid: 14.05,
    callIv: 14.2,
    putBid: 29.1,
    putIv: 14.8,
    strike: 2700,
  },
  {
    callBid: 9.6,
    callIv: 14.8,
    putBid: 36.95,
    putIv: 15.4,
    strike: 2710,
  },
];

export const GREEKS = {
  delta: 0.52,
  gamma: 0.018,
  rho: 0.34,
  theta: -0.45,
  vega: 1.2,
};

// Phase 3 — a bearish equity curve indexed to 100, peak ~131, trough ~83.
export const BEAR_CURVE: number[] = [
  100, 104, 108, 113, 119, 124, 122, 127, 131, 128, 122, 116, 118, 121, 119, 113, 106, 99, 95, 91,
  88, 86, 83, 87, 92, 95, 93, 96, 99, 102,
];

export const RISK = {
  cagr: "23.8%",
  maxDrawdown: "-17.8%",
  sharpe: "2.14",
  vol: "14.2%",
};
