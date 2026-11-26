import { WORDS } from "./sakuga-words";
import type { WordName } from "./sakuga-words";

export const TAU = Math.PI * 2;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const rnd = (a = 1, b?: number) =>
  b === undefined ? Math.random() * a : a + Math.random() * (b - a);

export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const easeIn = (t: number) => t ** 3;
export const easeBack = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

export class Spring {
  x: number;
  v = 0;
  to: number;
  k: number;
  d: number;

  constructor(x = 0, k = 300, d = 20) {
    this.x = x;
    this.to = x;
    this.k = k;
    this.d = d;
  }

  step(dt: number) {
    if (!(dt > 0)) {
      return this.x;
    }

    const n = Math.ceil(dt / 0.008);
    const h = dt / n;

    for (let i = 0; i < n; i += 1) {
      this.v += (-this.k * (this.x - this.to) - this.d * this.v) * h;
      this.x += this.v * h;
    }

    return this.x;
  }
}

export const P = {
  accent: "#ff5fa8",
  fill: "#ffffff",
  ink: "#1d1a4a",
  line: "#5a4fd8",
  sfx: ["#1d1a4a", "#ffffff"],
  shade: "#b8b3ff",
} as const;

type Draw = (k: number, t: number, dt: number) => void;

export interface Effect {
  t: number;
  life: number;
  draw: Draw;
  dead?: boolean;
}

export interface Layer {
  c: HTMLCanvasElement | null;
  g: CanvasRenderingContext2D | null;
  live: Effect[];
  dirty: boolean;
}

const front: Layer = { c: null, dirty: false, g: null, live: [] };
const layers: Layer[] = [front];
let dpr = 1;
let calmQuery: MediaQueryList | null = null;

let g!: CanvasRenderingContext2D;
export const pen = () => g;

export const fillPath = (path: Path2D, rule?: CanvasFillRule) => {
  g.fill(path, rule);
};

export const isCalm = () => {
  calmQuery ??= matchMedia("(prefers-reduced-motion: reduce)");

  return calmQuery.matches;
};

const size = () => {
  dpr = Math.min(2.5, devicePixelRatio || 1);

  if (front.c) {
    front.c.width = innerWidth * dpr;
    front.c.height = innerHeight * dpr;
  }
};

const ensureFront = () => {
  if (front.c?.isConnected === true) {
    return;
  }

  const c = document.createElement("canvas");
  c.setAttribute("aria-hidden", "true");
  c.dataset.sakugaFx = "";
  c.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000";
  document.body.append(c);

  if (!front.c) {
    addEventListener("resize", size);
  }

  front.c = c;
  front.g = c.getContext("2d");
  size();
};

export const addBackLayer = (canvas: HTMLCanvasElement) => {
  const layer: Layer = { c: canvas, dirty: false, g: canvas.getContext("2d"), live: [] };
  layers.push(layer);

  return layer;
};

export const removeBackLayer = (layer: Layer) => {
  const i = layers.indexOf(layer);

  if (i > 0) {
    layers.splice(i, 1);
  }
};

type FrameFn = (dt: number) => void;

const frames = new Set<FrameFn>();
const timers: { at: number; f: () => void }[] = [];
let now = 0;
let last = 0;
let running = false;

const drawLayer = (layer: Layer, dt: number) => {
  const { c, g: ctx } = layer;

  if (!c || !ctx || (layer.live.length === 0 && !layer.dirty)) {
    return;
  }

  let ox = scrollX;
  let oy = scrollY;

  if (layer !== front) {
    if (!c.isConnected) {
      layer.live = [];
      layer.dirty = false;

      return;
    }

    const r = c.getBoundingClientRect();
    const w = Math.round(r.width * dpr);
    const h = Math.round(r.height * dpr);

    if (c.width !== w) {
      c.width = w;
    }

    if (c.height !== h) {
      c.height = h;
    }

    ox += r.left;
    oy += r.top;
  }

  g = ctx;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, c.width / dpr, c.height / dpr);
  g.translate(-ox, -oy);
  g.lineJoin = "round";
  g.lineCap = "round";
  layer.live = layer.live.filter((p) => {
    p.t += dt;

    return p.dead !== true && p.t < p.life;
  });

  for (const p of layer.live) {
    g.save();
    p.draw(p.t / p.life, p.t, dt);
    g.restore();
  }

  layer.dirty = layer.live.length > 0;
};

const advance = (dt: number) => {
  now += dt;
  const due = timers.filter((q) => q.at <= now).toSorted((a, b) => a.at - b.at);

  for (const q of due) {
    timers.splice(timers.indexOf(q), 1);
  }

  for (const q of due) {
    q.f();
  }

  for (const f of frames) {
    f(dt);
  }

  for (const layer of layers) {
    drawLayer(layer, dt);
  }
};

export const clock = {
  advance,
  get now() {
    return now;
  },
  paused: false,
};

const idle = () =>
  frames.size === 0 && timers.length === 0 && layers.every((l) => l.live.length === 0 && !l.dirty);

const loop = (ms: number) => {
  if (!running) {
    return;
  }

  const dt = clamp((ms - last) / 1000, 0, 0.034);
  last = ms;

  if (!clock.paused) {
    advance(dt);
  }

  if (idle()) {
    running = false;

    return;
  }

  requestAnimationFrame(loop);
};

const start = () => {
  if (running) {
    return;
  }

  running = true;
  last = performance.now();
  requestAnimationFrame(loop);
};

export const later = (ms: number, f: () => void) => {
  timers.push({ at: now + ms / 1000, f });
  start();
};

export const onFrame = (fn: FrameFn) => {
  frames.add(fn);
  start();

  return () => {
    frames.delete(fn);
  };
};

const add = (life: number, draw: Draw, layer: Layer = front) => {
  const p: Effect = { draw, life, t: 0 };

  if (!isCalm()) {
    if (layer === front) {
      ensureFront();
    }

    layer.live.push(p);
    start();
  }

  return p;
};

export const persist = (draw: Draw, layer?: Layer) => add(Infinity, draw, layer);

type Circle = readonly [x: number, y: number, r: number];

const paintShade = () => {
  g.fillStyle = P.shade;
  g.fillRect(-1e4, -1e4, 2e4, 2e4);
};

export const blob = (
  cs: readonly Circle[],
  lw = 1.5,
  { lx = -1, arcs = false, deep = 1 }: { lx?: number; arcs?: boolean; deep?: number } = {},
) => {
  const u = new Path2D();

  for (const [x, y, r] of cs) {
    if (r > 0.3) {
      u.moveTo(x + r, y);
      u.arc(x, y, r, 0, TAU);
    }
  }

  g.save();
  g.lineWidth = lw * 2;
  g.strokeStyle = P.line;
  g.stroke(u);
  g.restore();
  g.save();
  g.clip(u);
  paintShade();
  const r = cs[0]?.[2] ?? 8;
  g.save();
  g.translate(lx * r * 0.2 * deep, -r * 0.26 * deep);
  g.fillStyle = P.fill;
  fillPath(u);
  g.restore();

  if (arcs) {
    g.strokeStyle = P.line;
    g.lineWidth = lw * 0.75;
    g.beginPath();

    for (const [x, y, rr] of cs) {
      if (rr > 3) {
        g.moveTo(x + Math.cos(-2.7) * rr, y + Math.sin(-2.7) * rr);
        g.arc(x, y, rr, -2.7, -0.5);
      }
    }

    g.stroke();
  }

  g.restore();
};

export const toon = (path: Path2D, lw = 1.5, off = 3, fill: string = P.fill) => {
  g.save();
  g.lineWidth = lw * 2;
  g.strokeStyle = P.line;
  g.stroke(path);
  g.restore();
  g.save();
  g.clip(path);
  paintShade();
  g.translate(-off * 0.7, -off);
  g.fillStyle = fill;
  fillPath(path);
  g.restore();
};

export const puff = (
  x: number,
  y: number,
  { n = 5, size: sz = 13, vx = 0, vy = -18, life = 0.8, spread = 1 } = {},
) => {
  const lobes = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU + rnd(0.6);
    const d = rnd(0.25, 0.9) * sz * spread;
    const r = rnd(0.55, 1) * sz;
    const ph = rnd(TAU);
    const sp = rnd(0.6, 1.3);

    return { a, d, ph, r, sp };
  });

  lobes.unshift({ a: 0, d: 0, ph: 0, r: sz, sp: 1 });
  add(life, (k, t) => {
    const grow = easeBack(clamp(t / 0.22));
    const die = 1 - easeIn(clamp((k - 0.55) / 0.45));
    const px = x + vx * easeOut(k) * life;
    const py = y + vy * easeOut(k) * life;
    const reach = 0.5 + easeOut(k) * 0.9;
    blob(
      lobes.map<Circle>((l) => {
        const a = l.a + t * 0.9 * l.sp;

        return [
          px + Math.cos(a) * l.d * reach,
          py + Math.sin(a) * l.d * reach - easeOut(k) * 5 * l.sp,
          l.r * grow * die * (1 + Math.sin(t * 9 + l.ph) * 0.05),
        ];
      }),
      1.5,
      { arcs: sz > 6.5, deep: 1.5, lx: 0.5 },
    );
  });
};

export const burst = (
  x: number,
  y: number,
  { r = 44, spikes = 13, life = 0.34, layer }: BurstOptions = {},
) => {
  const j = Array.from({ length: spikes * 2 }, (_, i) =>
    i % 2 ? rnd(0.34, 0.5) : rnd(0.75, 1.15),
  );

  const rot = rnd(TAU);

  const pins = Array.from({ length: 8 }, (_, i) => ({
    a: (i / 8) * TAU + rnd(0.5),
    l: rnd(1.25, 1.75),
    w: rnd(0.03, 0.055),
  }));

  const star = (R: number, turn: number, inner: number) => {
    const p = new Path2D();

    for (const [i, m] of j.entries()) {
      const a = rot + turn + (i / j.length) * TAU;
      const rr = R * (i % 2 ? m * inner : m);
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;

      if (i === 0) {
        p.moveTo(px, py);
      } else {
        p.lineTo(px, py);
      }
    }

    p.closePath();

    return p;
  };

  add(
    life,
    (k) => {
      const R = r * easeOut(clamp(k / 0.3));
      const hollowing = 1 + easeIn(clamp((k - 0.35) / 0.65)) * 1.3;
      const r0 = R * 0.6 * Math.min(1.9, hollowing);
      g.save();
      g.fillStyle = P.accent;
      g.beginPath();

      for (const n of pins) {
        const l = R * n.l;

        if (l > r0) {
          g.moveTo(x + Math.cos(n.a - n.w) * r0, y + Math.sin(n.a - n.w) * r0);
          g.lineTo(x + Math.cos(n.a) * l, y + Math.sin(n.a) * l);
          g.lineTo(x + Math.cos(n.a + n.w) * r0, y + Math.sin(n.a + n.w) * r0);
        }
      }

      g.fill();
      g.restore();
      const big = star(R * 1.16, 0.19, hollowing);
      g.save();
      g.fillStyle = P.shade;
      fillPath(big);
      g.strokeStyle = P.line;
      g.lineWidth = 1.2;
      g.stroke(big);
      g.restore();
      toon(star(R * 0.84, 0, hollowing), 1.4, 3);
    },
    layer,
  );
};

export interface BurstOptions {
  r?: number;
  spikes?: number;
  life?: number;
  layer?: Layer;
}

const polygon = (pts: readonly (readonly [number, number])[], scale: number) => {
  const p = new Path2D();

  for (const [i, [u, w]] of pts.entries()) {
    if (i === 0) {
      p.moveTo(u * scale, w * scale);
    } else {
      p.lineTo(u * scale, w * scale);
    }
  }

  p.closePath();

  return p;
};

const SHARD: readonly (readonly [number, number])[] = [
  [-1.4, 0.1],
  [-0.6, -0.7],
  [1.2, -0.45],
  [1.5, 0.15],
  [0.4, 0.75],
];

const shard = (
  x: number,
  y: number,
  {
    speed,
    sz,
    life,
    dir,
    arc,
    grav,
  }: Record<"speed" | "sz" | "life" | "dir" | "arc" | "grav", number>,
) => {
  const a = dir + rnd(-arc, arc) / 2;
  const v = speed * rnd(0.5, 1.15);
  const s = sz * rnd(0.6, 1.4);
  const spin = rnd(-7, 7);
  const pts = SHARD.map(([px, py]) => [px * rnd(0.8, 1.2), py * rnd(0.8, 1.2)] as const);
  const edgeA = pts.at(1);
  const edgeB = pts.at(4);
  add(life * rnd(0.7, 1), (k, t) => {
    const px = x + Math.cos(a) * v * t;
    const py = y + Math.sin(a) * v * t + grav * t * t;
    const sc = s * (1 - easeIn(clamp((k - 0.6) / 0.4)));
    g.translate(px, py);
    g.rotate(spin * t + a);
    toon(polygon(pts, sc), 1.1, sc * 0.45, P.fill);

    if (sc > 2.5 && edgeA && edgeB) {
      g.strokeStyle = P.line;
      g.lineWidth = 0.9;
      g.beginPath();
      g.moveTo(edgeA[0] * sc, edgeA[1] * sc);
      g.lineTo(edgeB[0] * sc, edgeB[1] * sc);
      g.stroke();
    }
  });
};

export const shards = (
  x: number,
  y: number,
  {
    n = 7,
    speed = 190,
    size: sz = 5,
    life = 0.75,
    dir = -Math.PI / 2,
    arc = Math.PI,
    grav = 420,
  } = {},
) => {
  for (let i = 0; i < n; i += 1) {
    shard(x, y, { arc, dir, grav, life, speed, sz });
  }
};

export const ring = (x: number, y: number, { rx = 40, ry = 12, life = 0.5, w = 5 } = {}) => {
  add(life, (k) => {
    const s = easeOut(k);
    const lw = w * (1 - k);
    g.beginPath();
    g.ellipse(x, y, rx * (0.3 + s), ry * (0.3 + s), 0, 0, TAU);
    g.strokeStyle = P.line;
    g.lineWidth = lw + 2.4;
    g.stroke();
    g.strokeStyle = P.fill;
    g.lineWidth = lw;

    if (lw > 0.3) {
      g.stroke();
    }
  });
};

const splashDrop = (x: number, y: number, life: number) => {
  const a = -Math.PI / 2 + rnd(-1.1, 1.1);
  const v = rnd(100, 210);
  const r0 = rnd(2, 4);
  add(life * rnd(0.8, 1.15), (k, t) => {
    const px = x + Math.cos(a) * v * t;
    const py = y - 6 + Math.sin(a) * v * t + 520 * t * t;
    const r = r0 * (1 - easeIn(clamp((k - 0.6) / 0.4)));
    const ang = Math.atan2(Math.sin(a) * v + 1040 * t, Math.cos(a) * v);
    const d = new Path2D();
    g.translate(px, py);
    g.rotate(ang);
    d.moveTo(-r * 2.6, 0);
    d.quadraticCurveTo(-r * 0.6, -r * 1.05, r * 0.5, -r * 0.9);
    d.arc(r * 0.4, 0, r * 0.95, -1.4, 1.4);
    d.quadraticCurveTo(-r * 0.6, r * 1.05, -r * 2.6, 0);

    if (r > 0.5) {
      toon(d, 1, r * 0.5);
    }
  });
};

export const splash = (x: number, y: number, { w = 34, h = 26, life = 0.7 } = {}) => {
  const n = 7;

  const ts = Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1) - 0.5;
    const tall = h * rnd(0.55, 1.1) * (1 - Math.abs(u) * 0.7);
    const lean = rnd(-0.4, 0.4);
    const d = rnd(0, 0.14);

    return { d, h: tall, lean, u };
  });

  add(life, (k) => {
    const p = new Path2D();
    const tips: [number, number, number][] = [];
    p.moveTo(x - w * 0.62, y);

    for (const s of ts) {
      const kk = clamp((k - s.d) / 0.8);
      const up = Math.sin(kk * Math.PI) * s.h * (1 - kk * 0.25);
      const bx = x + s.u * w;
      const half = (w / n) * 0.62;
      const tx = bx + (s.u * 1.6 + s.lean) * up * 0.5;
      tips.push([tx, y - up, up]);
      p.quadraticCurveTo(bx - half, y - up * 0.25, tx, y - up);
      p.quadraticCurveTo(bx + half * 0.5, y - up * 0.3, bx + half, y);
    }

    p.lineTo(x + w * 0.62, y);
    p.closePath();
    g.save();
    g.lineWidth = 2.8;
    g.strokeStyle = P.line;
    g.stroke(p);
    g.restore();
    g.fillStyle = P.shade;
    fillPath(p);
    g.save();
    g.clip(p);
    g.fillStyle = P.fill;

    for (const [tx, ty, up] of tips) {
      if (up > 4) {
        g.beginPath();
        g.ellipse(tx, ty + up * 0.2, up * 0.2 + 1.4, up * 0.34, 0, 0, TAU);
        g.fill();
      }
    }

    g.restore();
  });

  for (let i = 0; i < 7; i += 1) {
    splashDrop(x, y, life);
  }
};

export const slash = (
  x: number,
  y: number,
  { len = 110, ang = -0.5, life = 0.42, thick = 15, col }: SlashOptions = {},
) => {
  const R = len * 0.9;
  const cx = x - Math.cos(ang - Math.PI / 2) * R * 0.86;
  const cy = y - Math.sin(ang - Math.PI / 2) * R * 0.86;
  const a0 = ang - Math.PI / 2 - 0.62;
  const sweep = 1.24;
  const c = col ?? P.accent;
  const N = 26;
  add(life, (k) => {
    const head = easeOut(clamp(k / 0.42));
    const tail = easeIn(clamp((k - 0.22) / 0.78));

    if (head - tail < 0.01) {
      return;
    }

    const crescent = (T: number) => {
      const p = new Path2D();

      for (let i = 0; i <= N; i += 1) {
        const a = a0 + sweep * lerp(tail, head, i / N);
        const px = cx + Math.cos(a) * R;
        const py = cy + Math.sin(a) * R;

        if (i === 0) {
          p.moveTo(px, py);
        } else {
          p.lineTo(px, py);
        }
      }

      for (let i = N; i >= 0; i -= 1) {
        const q = i / N;
        const a = a0 + sweep * lerp(tail, head, q);
        const rr = R - T * Math.sin(q * Math.PI) ** 0.7;
        p.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }

      p.closePath();

      return p;
    };

    g.save();
    g.fillStyle = c;
    fillPath(crescent(thick));
    g.restore();
    g.fillStyle = P.fill;
    fillPath(crescent(thick * 0.42));
    g.strokeStyle = P.line;
    g.lineWidth = 1.3;
    g.stroke(crescent(thick));
  });
};

export interface SlashOptions {
  len?: number;
  ang?: number;
  life?: number;
  thick?: number;
  col?: string;
}

const speedLine = (
  x: number,
  y: number,
  { dir, len, spread, life }: Record<"dir" | "len" | "spread" | "life", number>,
) => {
  const o = rnd(-spread, spread);
  const l = len * rnd(0.5, 1.3);
  const d = rnd(0, 0.25);
  const w = rnd(1, 2.6);
  add(life, (k) => {
    const kk = clamp((k - d) / (1 - d));
    const a = easeOut(kk);
    const b = easeIn(kk);
    const px = x - Math.sin(dir) * o;
    const py = y + Math.cos(dir) * o;
    g.strokeStyle = P.line;
    g.lineWidth = w * (1 - b);
    g.beginPath();
    g.moveTo(px + Math.cos(dir) * l * b * 1.4, py + Math.sin(dir) * l * b * 1.4);
    g.lineTo(px + Math.cos(dir) * l * (0.2 + a * 1.2), py + Math.sin(dir) * l * (0.2 + a * 1.2));

    if (kk > 0) {
      g.stroke();
    }
  });
};

export const lines = (
  x: number,
  y: number,
  { n = 7, dir = Math.PI, len = 46, spread = 26, life = 0.3 } = {},
) => {
  for (let i = 0; i < n; i += 1) {
    speedLine(x, y, { dir, len, life, spread });
  }
};

export const ticks = (
  x: number,
  y: number,
  { n = 3, r = 16, len = 9, dir = -0.9, life = 0.4, fan = 0.42 } = {},
) => {
  add(life, (k) => {
    const a = easeOut(clamp(k / 0.5));
    const b = easeIn(clamp((k - 0.4) / 0.6));
    g.save();
    g.fillStyle = P.accent;
    g.beginPath();

    for (let i = 0; i < n; i += 1) {
      const an = dir + (i - (n - 1) / 2) * fan;
      const r0 = r + len * b * 1.25;
      const r1 = r + len * a * 1.25;
      const hw = 0.07 + 2.2 / (r1 + 8);

      if (r1 - r0 >= 0.6) {
        g.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0);
        g.lineTo(x + Math.cos(an - hw) * r1, y + Math.sin(an - hw) * r1);
        g.lineTo(x + Math.cos(an + hw) * r1, y + Math.sin(an + hw) * r1);
        g.closePath();
      }
    }

    g.fill();
    g.restore();
  });
};

export const donut = (
  x: number,
  y: number,
  { r = 20, vx = 30, vy = -50, life = 1, tilt = -0.25 } = {},
) => {
  const ph = rnd(TAU);
  add(life, (k, t) => {
    const s = easeBack(clamp(t / 0.22)) * (1 - easeIn(clamp((k - 0.6) / 0.4)));

    if (s < 0.03) {
      return;
    }

    const px = x + vx * easeOut(k) * life;
    const py = y + vy * easeOut(k) * life;
    const hole = 0.42 + 0.22 * k;
    const p = new Path2D();

    for (const [m, bump] of [
      [1, 0.09],
      [hole, 0.05],
    ] as const) {
      for (let i = 0; i <= 48; i += 1) {
        const a = (i / 48) * TAU;
        const rr = r * s * m * (1 + bump * Math.sin(a * 9 + ph + t * 2));
        const ex = Math.cos(a) * rr;
        const ey = Math.sin(a) * rr * 0.52;
        const qx = px + ex * Math.cos(tilt) - ey * Math.sin(tilt);
        const qy = py + ex * Math.sin(tilt) + ey * Math.cos(tilt);

        if (i === 0) {
          p.moveTo(qx, qy);
        } else {
          p.lineTo(qx, qy);
        }
      }
    }

    g.save();
    g.lineWidth = 3;
    g.strokeStyle = P.line;
    g.stroke(p);
    g.restore();
    g.save();
    g.clip(p, "evenodd");
    paintShade();
    g.translate(r * 0.06, -r * 0.2);
    g.fillStyle = P.fill;
    fillPath(p, "evenodd");
    g.restore();
  });
};

export const wob = (x: number, y: number, { dir = 1, r = 16, life = 0.45 } = {}) => {
  add(life, (k) => {
    g.strokeStyle = P.line;
    g.lineWidth = 2.2 * (1 - k);

    if (g.lineWidth < 0.2) {
      return;
    }

    g.beginPath();

    for (const d of [0, 7]) {
      const rr = r + d + easeOut(k) * 8;
      const c = dir > 0 ? 0 : Math.PI;
      g.moveTo(x - dir * r + Math.cos(c - 0.45) * rr, y + Math.sin(c - 0.45) * rr);
      g.arc(x - dir * r, y, rr, c - 0.45, c + 0.45);
    }

    g.stroke();
  });
};

export const kira = (
  x: number,
  y: number,
  { r = 9, life = 0.6, col }: { r?: number; life?: number; col?: string } = {},
) => {
  add(life, (k, t) => {
    const s = r * Math.sin(k * Math.PI) ** 0.6;
    const q = s * 0.16;
    const p = new Path2D();
    g.translate(x, y);
    g.rotate(Math.sin(t * 3) * 0.2);
    p.moveTo(0, -s);
    p.quadraticCurveTo(q, -q, s * 0.7, 0);
    p.quadraticCurveTo(q, q, 0, s);
    p.quadraticCurveTo(-q, q, -s * 0.7, 0);
    p.quadraticCurveTo(-q, -q, 0, -s);
    g.save();
    g.fillStyle = col ?? P.fill;
    fillPath(p);
    g.restore();
    g.strokeStyle = P.accent;
    g.lineWidth = 2;
    g.stroke(p);
  });
};

const paths = new Map<WordName, Path2D>();
const baked = new Map<string, HTMLCanvasElement>();

const wordPath = (name: WordName) => {
  let p = paths.get(name);

  if (!p) {
    p = new Path2D(WORDS[name][2]);
    paths.set(name, p);
  }

  return p;
};

const screentone = (x: CanvasRenderingContext2D, oc: string) => {
  const t = document.createElement("canvas");
  t.width = 22;
  t.height = 44;
  const y = t.getContext("2d");

  if (!y) {
    return oc;
  }

  y.fillStyle = "#fff";
  y.fillRect(0, 0, 22, 44);
  y.fillStyle = oc;
  y.beginPath();

  for (const [px, py] of [
    [0, 0],
    [22, 0],
    [0, 44],
    [22, 44],
    [11, 22],
  ] as const) {
    y.moveTo(px + 5.2, py);
    y.arc(px, py, 5.2, 0, TAU);
  }

  y.fill();

  return x.createPattern(t, "repeat") ?? oc;
};

const bake = (name: WordName, fc: string, oc: string, dots: boolean) => {
  const key = `${name}|${fc}|${oc}|${dots}`;
  const hit = baked.get(key);

  if (hit) {
    return hit;
  }

  const [w, h] = WORDS[name];
  const p = wordPath(name);
  const pad = 24;
  const c = document.createElement("canvas");
  c.width = w + pad * 2;
  c.height = h + pad * 2;
  const x = c.getContext("2d");

  if (x) {
    x.translate(pad, pad);
    x.lineJoin = "round";
    x.strokeStyle = oc;
    x.fillStyle = oc;
    x.lineWidth = w * 0.035 * 2;
    x.stroke(p);
    x.fill(p);
    x.fillStyle = dots ? screentone(x, oc) : fc;
    x.fill(p);
  }

  baked.set(key, c);

  return c;
};

export interface SfxOptions {
  size?: number;
  rot?: number;
  life?: number;
  col?: string;
  edge?: string;
  dots?: boolean;
}

export const sfx = (
  name: WordName,
  x: number,
  y: number,
  { size: sz = 64, rot = -0.14, life = 0.95, col, edge, dots = false }: SfxOptions = {},
) => {
  if (isCalm()) {
    return;
  }

  const s = new Spring(0.2, 520, 17);
  s.to = 1;
  let lastT = 0;
  const c = bake(name, col ?? P.sfx[0], edge ?? P.sfx[1], dots);
  const k0 = sz / WORDS[name][0];
  add(life, (k, t) => {
    const sc = s.step(t - lastT) * (1 - easeIn(clamp((k - 0.86) / 0.14))) * k0;
    lastT = t;
    g.translate(x + Math.sin(t * 31) * 0.8, y + Math.cos(t * 27) * 0.8);
    g.rotate(rot + Math.sin(t * 6) * 0.03);
    g.drawImage(c, (-c.width / 2) * sc, (-c.height / 2) * sc, c.width * sc, c.height * sc);
  });
};

export const hollow = () => ({ col: "#ffffff", edge: "#1d1a4a" });
export const dotted = () => ({ dots: true, edge: "#1d1a4a" });

export const at = (el: Element, fx = 0.5, fy = 0.5) => {
  const b = el.getBoundingClientRect();

  return {
    h: b.height,
    w: b.width,
    x: b.left + scrollX + b.width * fx,
    y: b.top + scrollY + b.height * fy,
  };
};

export interface Squashy {
  s: Spring;
  pop: Spring;
  tilt: Spring;
  step: (dt: number) => void;
  dispose: () => void;
}

export const squashy = (el: HTMLElement, { low = 0.82, k = 520, d = 15, wide = 0.55 } = {}) => {
  const s = new Spring(1, k, d);
  const pop = new Spring(1, 300, 12);
  const tilt = new Spring(0, 260, 10);
  const off = new AbortController();
  const disabled = () => el.matches(":disabled, [aria-disabled='true']");
  el.addEventListener(
    "pointerdown",
    () => {
      if (!disabled()) {
        s.to = low;
      }
    },
    { signal: off.signal },
  );

  for (const e of ["pointerup", "pointerleave", "pointercancel", "blur"]) {
    el.addEventListener(
      e,
      () => {
        s.to = 1;
      },
      { signal: off.signal },
    );
  }

  return {
    dispose: () => {
      off.abort();
    },
    pop,
    s,
    step: (dt) => {
      const y = s.step(dt);
      const p = pop.step(dt);
      const r = tilt.step(dt);

      const still =
        Math.abs(y - 1) < 0.001 &&
        Math.abs(s.v) < 0.01 &&
        Math.abs(p - 1) < 0.001 &&
        Math.abs(r) < 0.02;

      el.style.transform = still
        ? ""
        : `rotate(${r}deg) scale(${(1 + (1 - y) * wide) * p}, ${y * p})`;
    },
    tilt,
  } satisfies Squashy;
};
