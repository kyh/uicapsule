"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { useMotionValue } from "motion/react";
import type { MotionValue } from "motion/react";

export interface TearGeometry {
  horizontal: boolean;
  width: number;
  height: number;
  /** Extent of the main piece along the ticket axis; the seam sits here. */
  seam: number;
  /** Seam hole radius; the perforation runs between the two holes. */
  inset: number;
}

export type TearPhase = "rest" | "held" | "free" | "torn";

export const TEAR = {
  angle: 22,
  gap: 28,
  resistance: 0.45,
  restAngle: 2.5,
  stretch: 30,
};

const RETRACT = 0.17;
const REDUCED_MOTION_PULL = 28;

interface Vec {
  x: number;
  y: number;
}

interface Bridge extends Vec {
  v: number;
}

interface Layout {
  bridges: Bridge[];
  cross: number;
  ends: [Bridge, Bridge];
}

interface Sim {
  a0: number;
  bRest: number;
  bv: number;
  bx: number;
  grab: Vec;
  hinge: Vec;
  hingeV: number;
  last: number;
  phase: "idle" | "held" | "free" | "spring";
  point: Vec;
  pointerId: number | null;
  pt: number;
  pvx: number;
  pvy: number;
  raf: number;
  sign: 1 | -1;
  snapAt: number[];
  snapped: boolean[];
  span: number[];
  start: Vec;
  sx: number;
  sy: number;
  theta: number;
  thetaV: number;
  torn: boolean;
}

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value));
const rad = (deg: number) => (deg * Math.PI) / 180;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const f = (n: number) => n.toFixed(2);
const ease = (dt: number, tau: number) => 1 - Math.exp(-dt / tau);

const initialSim = (): Sim => ({
  a0: 0,
  bRest: 0,
  bv: 0,
  bx: 0,
  grab: { x: 0, y: 0 },
  hinge: { x: 0, y: 0 },
  hingeV: 0,
  last: 0,
  phase: "idle",
  point: { x: 0, y: 0 },
  pointerId: null,
  pt: 0,
  pvx: 0,
  pvy: 0,
  raf: 0,
  sign: 1,
  snapAt: [],
  snapped: [],
  span: [],
  start: { x: 0, y: 0 },
  sx: 0,
  sy: 0,
  theta: 0,
  thetaV: 0,
  torn: false,
});

const buildLayout = (geometry: TearGeometry): Layout => {
  const cross = geometry.horizontal ? geometry.height : geometry.width;
  const span = cross - 2 * geometry.inset;
  const count = clamp(Math.round(span / 22), 4, 16);
  const at = (v: number): Bridge =>
    geometry.horizontal ? { v, x: geometry.seam, y: v } : { v, x: v, y: geometry.seam };
  const bridges: Bridge[] = [];
  for (let i = 0; i < count; i += 1) {
    bridges.push(at(geometry.inset + (span * (i + 0.5)) / count));
  }
  return { bridges, cross, ends: [at(geometry.inset), at(cross - geometry.inset)] };
};

const hide = (near: SVGPathElement, far: SVGPathElement) => {
  near.style.opacity = "0";
  far.style.opacity = "0";
};

const isLink = (target: EventTarget | null) =>
  target instanceof Element && target.closest("a") !== null;

interface EngineInput {
  geometry: TearGeometry;
  layout: Layout;
  reducedMotion: boolean;
}

interface EngineOutput {
  intact: MotionValue<number>;
  phase: MotionValue<TearPhase>;
  setGrabbing: (grabbing: boolean) => void;
  setTorn: (torn: boolean) => void;
}

interface EngineRefs {
  body: RefObject<HTMLDivElement | null>;
  fibres: RefObject<(SVGPathElement | null)[]>;
  input: RefObject<EngineInput>;
  output: RefObject<EngineOutput>;
  root: RefObject<HTMLDivElement | null>;
  stub: RefObject<HTMLDivElement | null>;
}

type StubPointerHandler = (event: ReactPointerEvent<HTMLDivElement>) => void;

interface Handlers {
  onLostPointerCapture: StubPointerHandler;
  onPointerCancel: StubPointerHandler;
  onPointerDown: StubPointerHandler;
  onPointerMove: StubPointerHandler;
  onPointerUp: StubPointerHandler;
}

interface Engine {
  handlers: Handlers;
  reset: () => void;
  stop: () => void;
  tearNow: () => void;
}

const createEngine = (refs: EngineRefs): Engine => {
  const out = refs.output.current;
  const s = initialSim();

  const axis = (along: number, across = 0): Vec =>
    refs.input.current.geometry.horizontal ? { x: along, y: across } : { x: across, y: along };

  const restPose = () => {
    const offset = axis(TEAR.gap / 2);
    return { sx: offset.x, sy: offset.y, theta: rad(TEAR.restAngle) };
  };

  const fibreEnds = (b: Bridge) => {
    const { geometry: geo } = refs.input.current;
    const cos = Math.cos(s.theta * s.sign);
    const sin = Math.sin(s.theta * s.sign);
    const dx = b.x - s.hinge.x;
    const dy = b.y - s.hinge.y;
    return {
      ox: b.x + (geo.horizontal ? s.bx : 0),
      oy: b.y + (geo.horizontal ? 0 : s.bx),
      tx: s.hinge.x + dx * cos - dy * sin + s.sx,
      ty: s.hinge.y + dx * sin + dy * cos + s.sy,
    };
  };

  const paintStretch = (near: SVGPathElement, far: SVGPathElement, i: number, b: Bridge) => {
    const { geometry: geo } = refs.input.current;
    const { ox, oy, tx, ty } = fibreEnds(b);
    const gx = tx - ox;
    const gy = ty - oy;
    const gap = Math.hypot(gx, gy);
    if (gap < 0.35) {
      hide(near, far);
      return;
    }
    const lx = geo.horizontal ? 0 : 1.6;
    const ly = geo.horizontal ? 1.6 : 0;
    const k = clamp(gap / TEAR.stretch, 0, 1);
    const sag = gap * 0.18;
    const w = (1.7 - 1.15 * k).toFixed(2);
    const sx = (geo.horizontal ? 0 : sag) + gx / 2;
    const sy = (geo.horizontal ? sag : 0) + gy / 2;
    near.setAttribute(
      "d",
      `M${f(ox - lx)},${f(oy - ly)}Q${f(ox - lx + sx)},${f(oy - ly + sy)} ${f(tx - lx)},${f(ty - ly)}`,
    );
    far.setAttribute(
      "d",
      `M${f(ox + lx)},${f(oy + ly)}Q${f(ox + lx + gx - sx)},${f(oy + ly + gy - sy)} ${f(tx + lx)},${f(ty + ly)}`,
    );
    near.style.strokeWidth = w;
    far.style.strokeWidth = w;
    near.style.opacity = "1";
    far.style.opacity = "1";
    s.span[i] = gap;
  };

  const paintRetract = (
    near: SVGPathElement,
    far: SVGPathElement,
    i: number,
    b: Bridge,
    now: number,
  ) => {
    const snapAt = s.snapAt[i] ?? 0;
    const t = (now - snapAt) / 1000 / RETRACT;
    if (t >= 1 || snapAt === 0) {
      hide(near, far);
      return false;
    }
    const { ox, oy, tx, ty } = fibreEnds(b);
    const gx = tx - ox;
    const gy = ty - oy;
    const gap = Math.hypot(gx, gy);
    const left = (1 - t) * (1 - t);
    const len = (s.span[i] ?? TEAR.stretch) * 0.5 * left;
    const ux = gap > 0.01 ? gx / gap : 1;
    const uy = gap > 0.01 ? gy / gap : 0;
    near.setAttribute("d", `M${f(ox)},${f(oy)}L${f(ox + ux * len)},${f(oy + uy * len)}`);
    far.setAttribute("d", `M${f(tx)},${f(ty)}L${f(tx - ux * len)},${f(ty - uy * len)}`);
    near.style.strokeWidth = "0.9";
    far.style.strokeWidth = "0.9";
    near.style.opacity = left.toFixed(2);
    far.style.opacity = left.toFixed(2);
    return true;
  };

  const paint = (now: number) => {
    const { geometry: geo, layout, reducedMotion } = refs.input.current;
    const stubEl = refs.stub.current;
    const bodyEl = refs.body.current;
    if (stubEl) {
      const deg = (s.theta * s.sign * 180) / Math.PI;
      stubEl.style.transform = `translate(${f(s.sx)}px, ${f(s.sy)}px) rotate(${deg.toFixed(3)}deg)`;
    }
    if (bodyEl) {
      bodyEl.style.transform = `translate${geo.horizontal ? "X" : "Y"}(${f(s.bx)}px)`;
    }
    const live = s.phase !== "idle" && !reducedMotion;
    let busy = false;
    for (const [i, b] of layout.bridges.entries()) {
      const near = refs.fibres.current[i * 2];
      const far = refs.fibres.current[i * 2 + 1];
      if (!(near && far)) {
        continue;
      }
      if (!live) {
        hide(near, far);
      } else if (s.snapped[i]) {
        busy = paintRetract(near, far, i, b, now) || busy;
      } else {
        paintStretch(near, far, i, b);
      }
    }
    return busy;
  };

  const settleHinge = (grabV: number) => {
    const { geometry: geo, layout } = refs.input.current;
    const far = grabV < layout.cross / 2;
    const end = layout.ends[far ? 1 : 0];
    s.sign = far === geo.horizontal ? 1 : -1;
    s.hinge = { x: end.x, y: end.y };
    s.hingeV = end.v;
    const origin = axis(geo.seam);
    if (refs.stub.current) {
      refs.stub.current.style.transformOrigin = `${end.x - origin.x}px ${end.y - origin.y}px`;
    }
  };

  const markTorn = () => {
    if (s.torn) {
      return;
    }
    s.torn = true;
    s.bRest = -TEAR.gap / 2;
    s.snapped = refs.input.current.layout.bridges.map(() => true);
    out.intact.set(0);
    out.phase.set("torn");
    out.setTorn(true);
  };

  const stepHeld = (now: number, dt: number) => {
    const { geometry: geo, layout } = refs.input.current;
    const limit = rad(TEAR.angle);
    const count = layout.bridges.length;
    const holding = s.snapped.filter((snapped) => !snapped).length;
    const hold = count ? holding / count : 0;
    const follow = 0.92 * (1 - TEAR.resistance * hold);
    const a = Math.atan2(s.point.y - s.hinge.y, s.point.x - s.hinge.x);
    const want = clamp(wrap(a - s.a0) * s.sign * follow, 0, limit + 0.1);
    s.theta += (want - s.theta) * ease(dt, 0.035);
    const along = geo.horizontal ? s.point.x - s.start.x : s.point.y - s.start.y;
    const across = geo.horizontal ? s.point.y - s.start.y : s.point.x - s.start.x;
    const target = axis(clamp(along * 0.05, -2, 4), clamp(across * 0.05, -3, 3));
    s.sx += (target.x - s.sx) * ease(dt, 0.05);
    s.sy += (target.y - s.sy) * ease(dt, 0.05);
    const slack = Math.hypot(s.sx, s.sy);
    let left = 0;
    for (const [i, b] of layout.bridges.entries()) {
      if (s.snapped[i]) {
        continue;
      }
      const d = Math.abs(b.v - s.hingeV);
      if (2 * d * Math.sin(s.theta / 2) + slack > TEAR.stretch || s.theta >= limit) {
        s.snapped[i] = true;
        s.snapAt[i] = now;
        s.bv -= 560 / count;
      } else {
        left += 1;
      }
    }
    out.intact.set(left);
    if (left === 0) {
      s.phase = "free";
      s.bv -= 150;
      markTorn();
      out.phase.set("free");
    }
  };

  const stepFree = (dt: number) => {
    const { geometry: geo } = refs.input.current;
    const cos = Math.cos(s.theta * s.sign);
    const sin = Math.sin(s.theta * s.sign);
    const gx = s.grab.x - s.hinge.x;
    const gy = s.grab.y - s.hinge.y;
    const wx = s.point.x - s.hinge.x - (gx * cos - gy * sin);
    const wy = s.point.y - s.hinge.y - (gx * sin + gy * cos);
    s.sx += (wx - s.sx) * ease(dt, 0.045);
    s.sy += (wy - s.sy) * ease(dt, 0.045);
    const drift = geo.horizontal ? s.pvx : s.pvy;
    const hang = rad(TEAR.angle) * 0.55 + clamp(drift * 0.0009 * s.sign, -0.3, 0.3);
    s.theta += (hang - s.theta) * ease(dt, 0.12);
  };

  const stepSpring = (dt: number) => {
    const rest = s.torn ? restPose() : { sx: 0, sy: 0, theta: 0 };
    s.thetaV += (-300 * (s.theta - rest.theta) - 24 * s.thetaV) * dt;
    s.theta += s.thetaV * dt;
    s.sx += (rest.sx - s.sx) * ease(dt, 0.07);
    s.sy += (rest.sy - s.sy) * ease(dt, 0.07);
    const settled =
      Math.abs(s.theta - rest.theta) < 0.0008 &&
      Math.abs(s.thetaV) < 0.01 &&
      Math.hypot(s.sx - rest.sx, s.sy - rest.sy) < 0.05;
    if (settled) {
      Object.assign(s, rest, { phase: "idle", thetaV: 0 });
      out.phase.set(s.torn ? "torn" : "rest");
    }
  };

  const step = (now: number) => {
    const dt = clamp((now - s.last) / 1000, 0.001, 0.034);
    s.last = now;
    if (s.phase === "held") {
      stepHeld(now, dt);
    } else if (s.phase === "free") {
      stepFree(dt);
    } else if (s.phase === "spring") {
      stepSpring(dt);
    }
    s.bv += (-520 * (s.bx - s.bRest) - 30 * s.bv) * dt;
    s.bx += s.bv * dt;
    const busy = paint(now);
    const moving = Math.abs(s.bx - s.bRest) > 0.02 || Math.abs(s.bv) > 0.5;
    if (s.phase !== "idle" || moving || busy) {
      s.raf = requestAnimationFrame(step);
    } else {
      s.bx = s.bRest;
      s.bv = 0;
      paint(now);
      s.raf = 0;
    }
  };

  const run = () => {
    if (s.raf) {
      return;
    }
    s.last = performance.now();
    s.raf = requestAnimationFrame(step);
  };

  const local = (event: ReactPointerEvent): Vec => {
    const rect = refs.root.current?.getBoundingClientRect();
    if (!rect) {
      return { x: event.clientX, y: event.clientY };
    }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const tearNow = () => {
    cancelAnimationFrame(s.raf);
    s.raf = 0;
    s.pointerId = null;
    out.setGrabbing(false);
    if (s.theta < 0.01 && !s.torn) {
      settleHinge(0);
    }
    markTorn();
    if (refs.input.current.reducedMotion) {
      Object.assign(s, restPose(), { bv: 0, bx: s.bRest, phase: "idle", thetaV: 0 });
      paint(performance.now());
      return;
    }
    s.phase = "spring";
    run();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || s.pointerId !== null || isLink(event.target)) {
      return;
    }
    const { geometry: geo } = refs.input.current;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Best effort: the drag still works while the pointer stays over the stub.
    }
    const p = local(event);
    s.pointerId = event.pointerId;
    s.start = p;
    s.point = p;
    s.pt = performance.now();
    s.pvx = 0;
    s.pvy = 0;
    if (s.theta < 0.01 && !s.torn) {
      settleHinge(geo.horizontal ? p.y : p.x);
    }
    const cos = Math.cos(-s.theta * s.sign);
    const sin = Math.sin(-s.theta * s.sign);
    const ux = p.x - s.sx - s.hinge.x;
    const uy = p.y - s.sy - s.hinge.y;
    s.grab = { x: s.hinge.x + ux * cos - uy * sin, y: s.hinge.y + ux * sin + uy * cos };
    s.a0 = Math.atan2(s.grab.y - s.hinge.y, s.grab.x - s.hinge.x) - (s.theta * s.sign) / 0.92;
    s.phase = s.torn ? "free" : "held";
    s.thetaV = 0;
    out.phase.set(s.torn ? "free" : "held");
    out.setGrabbing(true);
    run();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (s.pointerId !== event.pointerId) {
      return;
    }
    const p = local(event);
    const now = performance.now();
    const dt = Math.max(0.004, (now - s.pt) / 1000);
    s.pvx += ((p.x - s.point.x) / dt - s.pvx) * 0.35;
    s.pvy += ((p.y - s.point.y) / dt - s.pvy) * 0.35;
    s.pt = now;
    s.point = p;
    if (
      refs.input.current.reducedMotion &&
      !s.torn &&
      Math.hypot(p.x - s.start.x, p.y - s.start.y) > REDUCED_MOTION_PULL
    ) {
      tearNow();
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (s.pointerId !== event.pointerId) {
      return;
    }
    s.pointerId = null;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Already released.
    }
    out.setGrabbing(false);
    if (s.phase === "free" || s.phase === "held") {
      s.phase = "spring";
      if (!s.torn) {
        out.phase.set("rest");
      }
    }
    run();
  };

  const reset = () => {
    cancelAnimationFrame(s.raf);
    const { torn } = s;
    Object.assign(s, initialSim(), { torn });
    s.snapped = refs.input.current.layout.bridges.map(() => torn);
    if (torn) {
      s.bRest = -TEAR.gap / 2;
      settleHinge(0);
      Object.assign(s, restPose(), { bx: s.bRest });
    }
    out.intact.set(torn ? 0 : s.snapped.length);
    paint(performance.now());
  };

  const stop = () => cancelAnimationFrame(s.raf);

  return {
    handlers: {
      onLostPointerCapture: onPointerUp,
      onPointerCancel: onPointerUp,
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
    reset,
    stop,
    tearNow,
  };
};

export interface TearStubOptions extends TearGeometry {
  reducedMotion: boolean;
}

export const useTearStub = ({
  horizontal,
  width,
  height,
  seam,
  inset,
  reducedMotion,
}: TearStubOptions) => {
  const geometry = useMemo<TearGeometry>(
    () => ({ height, horizontal, inset, seam, width }),
    [height, horizontal, inset, seam, width],
  );
  const layout = useMemo(() => buildLayout(geometry), [geometry]);
  const input = useRef<EngineInput>({ geometry, layout, reducedMotion });
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const stub = useRef<HTMLDivElement>(null);
  const fibres = useRef<(SVGPathElement | null)[]>([]);
  const [grabbing, setGrabbing] = useState(false);
  const [torn, setTorn] = useState(false);
  const phase = useMotionValue<TearPhase>("rest");
  const intact = useMotionValue(layout.bridges.length);
  const output = useRef<EngineOutput>({ intact, phase, setGrabbing, setTorn });
  const engine = useRef<Engine | null>(null);

  useLayoutEffect(() => {
    input.current = { geometry, layout, reducedMotion };
    engine.current?.reset();
  }, [geometry, layout, reducedMotion]);

  useLayoutEffect(() => {
    const created = createEngine({ body, fibres, input, output, root, stub });
    engine.current = created;
    created.reset();
    return () => {
      created.stop();
      engine.current = null;
    };
  }, []);

  const handlers = useMemo<Handlers>(
    () => ({
      onLostPointerCapture: (event) => engine.current?.handlers.onLostPointerCapture(event),
      onPointerCancel: (event) => engine.current?.handlers.onPointerCancel(event),
      onPointerDown: (event) => engine.current?.handlers.onPointerDown(event),
      onPointerMove: (event) => engine.current?.handlers.onPointerMove(event),
      onPointerUp: (event) => engine.current?.handlers.onPointerUp(event),
    }),
    [],
  );
  const tear = useCallback(() => engine.current?.tearNow(), []);
  const setFibre = useCallback(
    (index: number) => (element: SVGPathElement | null) => {
      fibres.current[index] = element;
    },
    [],
  );

  return {
    bodyRef: body,
    bridges: layout.bridges.length,
    grabbing,
    handlers,
    intact,
    phase,
    rootRef: root,
    setFibre,
    stubRef: stub,
    tear,
    torn,
  };
};
