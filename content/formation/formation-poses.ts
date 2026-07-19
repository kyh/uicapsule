// Formation — data model, tunables, math helpers, layout + pose functions.
// Pure (no React) so the client component stays focused on wiring + the rAF loop.

export type FormationMode = "flat" | "tilt" | "ring" | "gallery";

export interface Work {
  title: string;
  category: string;
  /** Accent used for the rule under the detail title. */
  accent: string;
  image: string;
}

export interface Pose {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  s: number;
  o: number;
}

export interface FmLayout {
  W: number;
  H: number;
  /** Card count the ring was solved for. */
  n: number;
  mobile: boolean;
  portrait: boolean;
  cardW: number;
  cardH: number;
  flatScale: number;
  // Flat ring geometry
  flatAngles: number[];
  Rx: number;
  Ry: number;
  flatCY: number;
}

export const MODES: { id: FormationMode; label: string }[] = [
  { id: "flat", label: "Flat" },
  { id: "tilt", label: "Tilt" },
  { id: "ring", label: "Ring" },
  { id: "gallery", label: "Gallery" },
];

// ── Global tunables ────────────────────────────────────────────────────────
export const SPRING = 0.12;
export const HOVER_EASE = 0.055;
export const HOVER_ZOOM = 0.26;
export const PARALLAX_MAX = 5;
export const PERSP = 1700;
export const MORPH_DUR = 680;
export const MORPH_STAGGER = 220;
export const SWAP_BAND = 64;
export const SWAP_SPEED_REF = 1.1;
export const SWAP_FLOOR = 0.6;

const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;

// ── Helpers ────────────────────────────────────────────────────────────────
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const wrap = (x: number, p: number) => ((((x + p / 2) % p) + p) % p) - p / 2;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Poses are mutated in place — the engine holds one `cur`/`from` per card for
// the lifetime of the component, so nothing allocates inside the rAF loop.
export const copyPose = (dst: Pose, src: Pose): void => {
  dst.x = src.x;
  dst.y = src.y;
  dst.z = src.z;
  dst.rx = src.rx;
  dst.ry = src.ry;
  dst.rz = src.rz;
  dst.s = src.s;
  dst.o = src.o;
};

/** `dst = lerp(a, b, t)`, field by field. `dst` may alias `a` (that's the spring step). */
export const lerpPose = (dst: Pose, a: Pose, b: Pose, t: number): void => {
  dst.x = lerp(a.x, b.x, t);
  dst.y = lerp(a.y, b.y, t);
  dst.z = lerp(a.z, b.z, t);
  dst.rx = lerp(a.rx, b.rx, t);
  dst.ry = lerp(a.ry, b.ry, t);
  dst.rz = lerp(a.rz, b.rz, t);
  dst.s = lerp(a.s, b.s, t);
  dst.o = lerp(a.o, b.o, t);
};

/** Lower is "more focused": nearest the stage centre, biased toward the front. */
export const focusScore = (p: Pose): number => Math.abs(p.x) + Math.abs(p.y) - p.z;

export const poseTransform = (p: Pose): string =>
  `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg) scale(${p.s})`;

// ── Layout (recomputed on mount + resize) ───────────────────────────────────
// The flat ring is not evenly angled: card spacing is solved so the *edge* gap
// between neighbours is constant all the way round the ellipse. Sample the
// ellipse finely, then bisect on a shared gap G until Σ ds/(fp+G) === n.
const buildFlatRing = (
  W: number,
  H: number,
  n: number,
  cardW: number,
  cardH: number,
  flatScale: number,
  portrait: boolean,
) => {
  const flatCY = portrait ? H * 0.015 : H * 0.045;
  const cw = cardW * flatScale;
  const ch = cardH * flatScale;
  const R0 = Math.min(W * 0.3, H * 0.38);

  const Rc = Math.min(W / 2 - cw * 0.5 - ch * 0.12 - 22, H / 2 - ch * 0.5 - flatCY - 22);
  const Rx = portrait ? Rc : Math.min(R0, W / 2 - cardW * 0.6);
  const Ry = portrait ? Rc : Math.min(R0, H / 2 - cardH * 0.6);

  const M = 3000;
  const dphi = TWO_PI / M;
  const samples = Array.from({ length: M }, (_, k) => {
    const phi = k * dphi;
    const sp = Math.sin(phi);
    const cp = Math.cos(phi);
    return {
      phi,
      ds: Math.sqrt(Rx * Rx * sp * sp + Ry * Ry * cp * cp) * dphi,
      fp: cw * Math.abs(cp) + ch * Math.abs(sp),
    };
  });

  // count(G) falls monotonically as G grows, so plain bisection converges.
  const count = (G: number) => {
    let s = 0;
    for (const sm of samples) s += sm.ds / (sm.fp + G);
    return s;
  };
  let lo = -0.85 * Math.min(cw, ch);
  let hi = Math.max(W, H);
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    if (count(mid) > n) lo = mid;
    else hi = mid;
  }
  const G = (lo + hi) / 2;

  // Place card i where the cumulative count first reaches i.
  const flatAngles: number[] = [];
  let cum = 0;
  for (const sm of samples) {
    if (flatAngles.length >= n) break;
    while (flatAngles.length < n && cum >= flatAngles.length) flatAngles.push(sm.phi);
    cum += sm.ds / (sm.fp + G);
  }
  while (flatAngles.length < n) {
    flatAngles.push((TWO_PI * flatAngles.length) / n);
  }

  return { flatAngles, Rx, Ry, flatCY };
};

export const getLayout = (W: number, H: number, n: number): FmLayout => {
  const mobile = Math.min(W, H) < 640;
  const portrait = H > W;
  const cardW = mobile
    ? clamp(Math.min(W, H) * 0.27, 80, 118)
    : clamp(Math.min(W, H) * 0.155, 128, 196);
  const cardH = Math.round(cardW * 1.34);
  const flatScale = mobile ? 0.42 : 0.62;
  const ring = buildFlatRing(W, H, n, cardW, cardH, flatScale, portrait);
  return { W, H, n, mobile, portrait, cardW, cardH, flatScale, ...ring };
};

// ── Formations — each a pure function f(i, L, browse) → Pose ─────────────────
const flatPose = (i: number, L: FmLayout, browse: number): Pose => {
  const n = L.n;
  const slot = (((i + browse * 0.004) % n) + n) % n;
  const i0 = Math.floor(slot);
  const i1 = (i0 + 1) % n;
  const fr = slot - i0;
  const a0 = L.flatAngles.at(i0) ?? 0;
  let a1 = L.flatAngles.at(i1) ?? 0;
  if (a1 < a0) a1 += TWO_PI; // bridge the 2π seam
  const ang = lerp(a0, a1, fr);
  return {
    x: Math.cos(ang) * L.Rx,
    y: Math.sin(ang) * L.Ry + L.flatCY,
    z: 0,
    rx: 0,
    ry: 0,
    rz: Math.sin(i * 3.1 + 1.2) * 7,
    s: L.flatScale,
    o: 1,
  };
};

const tiltPose = (i: number, L: FmLayout, browse: number): Pose => {
  const n = L.n;
  const unit = L.cardW * (L.mobile ? 1.12 : 1.5);
  const x = wrap((i - Math.floor(n / 2)) * unit + browse, n * unit);
  const Rarc = L.W * (L.mobile ? 1.5 : 1.2);
  const ax = Math.min(Math.abs(x), Rarc * 0.98);
  const y = -L.H * 0.05 + (Rarc - Math.sqrt(Rarc * Rarc - ax * ax));
  const rz = (Math.asin(clamp(x / Rarc, -1, 1)) / DEG) * 0.65;
  return {
    x,
    y,
    z: 0,
    rx: 0,
    ry: 0,
    rz,
    s: L.mobile ? 0.92 : 1.18,
    o: clamp((0.5 - Math.abs(x) / L.W) / 0.13, 0, 1),
  };
};

const ringPose = (i: number, L: FmLayout, browse: number): Pose => {
  const t = (i / L.n) * TWO_PI + browse * 0.0016;
  const R = Math.min(L.W, L.H) * 0.38;
  const lx = Math.sin(t) * R * (L.portrait ? 1.04 : 1.46);
  const lz = Math.cos(t) * R;
  const A = 63 * DEG;
  const y0 = lz * Math.sin(A);
  const depth = lz * Math.cos(A);
  const B = -21 * DEG;
  const x = lx * Math.cos(B) - y0 * Math.sin(B);
  const y = lx * Math.sin(B) + y0 * Math.cos(B);
  const k = (lz / R + 1) / 2;
  return {
    x,
    y,
    z: depth,
    rx: 0,
    ry: 0,
    rz: (lx / R) * (L.mobile ? 3 : 6),
    s: (L.mobile ? 0.36 : 0.6) + k * (L.mobile ? 0.19 : 0.42),
    o: 1,
  };
};

const galleryPose = (i: number, L: FmLayout, browse: number): Pose => {
  const theta = (i / L.n) * TWO_PI + browse * 0.0042;
  const c = Math.cos(theta);
  const front = (c + 1) / 2;
  const baseS = L.mobile ? 0.72 : 1.42;
  return {
    x: Math.sin(theta) * L.W * (L.mobile ? 0.46 : 0.43),
    y: c * L.H * (L.mobile ? 0.16 : 0.14),
    z: c * (L.mobile ? 95 : 150),
    rx: 0,
    ry: 0,
    rz: 0,
    s: baseS * ((L.mobile ? 0.5 : 0.66) + front * (L.mobile ? 0.5 : 0.34)),
    o: 1,
  };
};

export const poseFor = (mode: FormationMode, i: number, L: FmLayout, browse: number): Pose => {
  if (mode === "flat") return flatPose(i, L, browse);
  if (mode === "tilt") return tiltPose(i, L, browse);
  if (mode === "ring") return ringPose(i, L, browse);
  return galleryPose(i, L, browse);
};

// The liquid-glass normal map — a glass bead: clear in the centre, bending at the rim.
export const GLASS_NORMAL_MAP =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><defs>" +
  "<linearGradient id='r' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='rgb(0,0,0)'/>" +
  "<stop offset='1' stop-color='rgb(255,0,0)'/></linearGradient>" +
  "<linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='rgb(0,0,0)'/>" +
  "<stop offset='1' stop-color='rgb(0,255,0)'/></linearGradient>" +
  "<radialGradient id='n'><stop offset='0.32' stop-color='rgb(128,128,128)' stop-opacity='1'/>" +
  "<stop offset='1' stop-color='rgb(128,128,128)' stop-opacity='0'/></radialGradient></defs>" +
  "<rect width='100' height='100' fill='url(%23r)'/>" +
  "<rect width='100' height='100' fill='url(%23g)' style='mix-blend-mode:screen'/>" +
  "<rect width='100' height='100' fill='url(%23n)'/></svg>";
