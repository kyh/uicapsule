"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "cn";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { flushSync } from "react-dom";

import {
  P,
  Spring,
  at,
  blob,
  burst,
  clamp,
  fillPath,
  lerp,
  lines,
  pen,
  persist,
  puff,
  rnd,
  sfx,
  shards,
  ticks,
  toon,
} from "./sakuga-core";
import type { Layer } from "./sakuga-core";
import { BACK_CANVAS, FONT_BODY, SakugaStyle, useBackLayer, useFrame } from "./sakuga-react";
import type { Styled } from "./sakuga-react";

type SakugaProgressProps = Styled<Omit<ProgressPrimitive.Root.Props, "children" | "value">> & {
  value?: number | null;
  doneLabel?: string;
  onDone?: () => void;
};

const UNKNOWN = "…";

const LOBES = [
  [0, -0.95, 1],
  [0.78, -0.55, 0.74],
  [-0.72, -0.78, 0.72],
  [0.36, -1.7, 0.7],
  [-0.4, -1.62, 0.62],
  [1.1, -1.32, 0.52],
  [-1.18, -0.28, 0.52],
  [0.62, 0.3, 0.5],
  [-0.86, 0.5, 0.52],
  [-1.5, 0.82, 0.38],
  [-2.05, 1, 0.24],
  [0.16, 0.72, 0.4],
] as const;

const PEBBLE = [
  [-1, 0.4],
  [-0.5, -0.8],
  [0.5, -1],
  [1, 0.1],
  [0.3, 0.9],
] as const;

const RAYS = [
  [-2.6, 58],
  [-2.95, 60],
  [-0.35, 56],
  [-0.1, 60],
] as const;

const lobe = ([x, y, r]: readonly [number, number, number], i: number) => {
  const ph = rnd(6.28);
  const w = rnd(1.4, 2.6);

  return { i, ph, r, w, x, y };
};

const pebble = (u: number) => {
  const s = rnd(3.4, 5.6);
  const ph = rnd(6.28);
  const rot = rnd(-0.5, 0.5);

  const pts = PEBBLE.map(([x, y]) => {
    const px = x * rnd(0.8, 1.2);
    const py = y * rnd(0.8, 1.2);

    return [px, py] as const;
  });

  return { lift: new Spring(0, 70, 7), ph, pts, rot, s, u };
};

const makeLoad = () => ({
  acc: 0,
  ck: new Spring(0, 260, 13),
  doneAt: 0,
  goal: 0,
  lag: new Spring(0, 120, 16),
  lastPct: "",
  lobes: LOBES.map(lobe),
  p: 0,
  peb: [0.14, 0.31, 0.5, 0.69, 0.87].map(pebble),
  rest: new Spring(0, 160, 14),
  said: false,
  shown: 0,
  size: new Spring(0, 90, 13),
  spd: 0,
  t: 0,
  tag: new Spring(1, 500, 13),
  unknown: false,
  vis: false,
});

type Load = ReturnType<typeof makeLoad>;

type Pebble = ReturnType<typeof pebble>;

const clear = (load: Load) => {
  load.doneAt = 0;
  load.said = false;
};

const setGoal = (load: Load, value: number) => {
  const n = clamp(Number(value) || 0);

  if (load.doneAt && n >= 1) {
    return;
  }

  if (n < load.p - 0.001) {
    clear(load);
    load.p = n;
  }

  load.goal = n;
};

const paintPebble = (q: Pebble, px: number, gy: number, tt: number, up: number) => {
  const g = pen();
  const y = gy - q.s * 0.7 - up * (7 + q.s * 1.5) + Math.sin(tt * 3 + q.ph) * 2 * up;
  const path = new Path2D();
  g.save();
  g.translate(px, y);
  g.rotate(q.rot + up * Math.sin(tt * 2 + q.ph) * 0.5);

  for (const [n, [x, yy]] of q.pts.entries()) {
    if (n) {
      path.lineTo(x * q.s, yy * q.s);
    } else {
      path.moveTo(x * q.s, yy * q.s);
    }
  }

  path.closePath();
  toon(path, 1.1, q.s * 0.5);
  g.restore();

  if (up > 0.15 && up < 0.9 && q.lift.v > 0.6) {
    g.save();
    g.strokeStyle = P.accent;
    g.lineWidth = 2.4;
    g.beginPath();

    for (const a of [-1.9, -1.57, -1.24]) {
      g.moveTo(px + Math.cos(a) * (q.s + 5), y + Math.sin(a) * (q.s + 5));
      g.lineTo(px + Math.cos(a) * (q.s + 11), y + Math.sin(a) * (q.s + 11));
    }

    g.stroke();
    g.restore();
  }
};

const paintRest = (x: number, d: number, gy: number, rs: number, tt: number) => {
  const g = pen();
  blob(
    (
      [
        [x, gy - 9 * rs, 8 * rs],
        [x + 8 * d, gy - 6 * rs, 6 * rs],
        [x - 6 * d, gy - 5 * rs, 5.5 * rs],
        [x + 2 * d, gy - 15 * rs, 5.5 * rs],
      ] as const
    ).map(([cx, cyy, r], n) => [cx, cyy, r * (1 + Math.sin(tt * 3 + n) * 0.06)] as const),
    1.3,
    { arcs: true, lx: 1 },
  );
  g.strokeStyle = P.line;
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(x + d * 18, gy - 6);
  g.lineTo(x + d * 25, gy - 6);
  g.moveTo(x + d * 19, gy - 1.5);
  g.lineTo(x + d * 23, gy - 1.5);
  g.stroke();
};

const paintCheck = (x: number, y: number, c: number, tt: number) => {
  const g = pen();
  g.save();
  g.translate(x, y);
  g.rotate((1 - c) * -0.5);
  g.scale(c, c);
  g.save();
  g.strokeStyle = P.accent;
  g.lineWidth = 9;
  g.lineJoin = "miter";
  g.lineCap = "butt";
  g.beginPath();
  g.moveTo(-28, 2);
  g.lineTo(-8, 22);
  g.lineTo(30, -26);
  g.stroke();
  g.lineCap = "round";
  g.lineWidth = 4;
  g.beginPath();

  for (const [a, d] of RAYS) {
    g.moveTo(Math.cos(a) * d, Math.sin(a) * d * 0.7);
    g.lineTo(Math.cos(a) * (d + 13), Math.sin(a) * (d + 13) * 0.7);
  }

  g.stroke();
  g.restore();
  const s = 15 * (0.9 + 0.1 * Math.sin(tt * 5));
  const q = s * 0.14;
  const sp = new Path2D();
  g.translate(74, 28);
  sp.moveTo(0, -s);
  sp.quadraticCurveTo(q, -q, s * 0.75, 0);
  sp.quadraticCurveTo(q, q, 0, s);
  sp.quadraticCurveTo(-q, q, -s * 0.75, 0);
  sp.quadraticCurveTo(-q, -q, 0, -s);
  g.fillStyle = P.fill;
  fillPath(sp);
  g.strokeStyle = P.ink;
  g.lineWidth = 2.4;
  g.stroke(sp);
  g.restore();
};

const paint = (load: Load, bar: HTMLElement, tt: number, dt: number) => {
  if (!load.vis) {
    return;
  }

  const g = pen();
  const b = at(bar);
  const L = b.x - b.w / 2;
  const R = b.x + b.w / 2;
  const { p } = load;
  const done = load.doneAt;
  const lead = L + 4 + (b.w - 8) * p;
  const cy = b.y;
  const gy = cy + b.h / 2 + 30;
  const reach = clamp(p * 1.25 + (done ? 1 : 0));
  const gx1 = lerp(L + 10, R - 10, reach);

  if (reach > 0.02) {
    g.strokeStyle = P.line;
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(L + 10, gy);
    g.lineTo(gx1, gy);

    for (let x = L + 26; x < gx1 - 6; x += 37) {
      g.moveTo(x, gy);
      g.lineTo(x + 3, gy - 4);
      g.moveTo(x + 5, gy);
      g.lineTo(x + 6.5, gy - 2.5);
    }

    g.stroke();
  }

  for (const q of load.peb) {
    const px = L + b.w * q.u;
    q.lift.to = !done && lead > px - 16 ? 1 : 0;
    const up = q.lift.step(dt);

    if (!(reach < q.u - 0.04 && up < 0.01)) {
      paintPebble(q, px, gy, tt, up);
    }
  }

  load.rest.to = done ? 1 : 0;
  const rs = Math.max(0, load.rest.step(dt));

  if (rs > 0.02) {
    paintRest(L + 34, -1, gy, rs, tt);
    paintRest(R - 40, 1, gy, rs, tt);
  }

  load.size.to = done || p < 0.015 ? 0 : 10 + 25 * Math.sqrt(p);
  load.lag.to = load.spd;
  const S = Math.max(0, load.size.step(dt));
  const drag = load.lag.step(dt);

  if (S > 0.6) {
    blob(
      load.lobes.map((l) => {
        const boil = 1 + 0.16 * Math.sin(tt * l.w + l.ph);
        const roll = 0.82 + 0.22 * Math.sin(tt * 2.6 - l.i * 0.9);

        return [
          lead +
            3 +
            (l.x + Math.cos(tt * l.w * 0.7 + l.ph) * 0.1 - drag * 1.6 * Math.max(0, -l.y) * 0.5) *
              S,
          cy - 3 + (l.y + Math.sin(tt * l.w * 0.7 + l.ph) * 0.1) * S,
          l.r * S * boil * roll,
        ] as const;
      }),
      1.6,
      { arcs: true, deep: 1.7, lx: 1 },
    );
  }

  load.ck.to = done ? 1 : 0;
  const c = Math.max(0, load.ck.step(dt));

  if (c > 0.02) {
    paintCheck(b.x + 4, cy - b.h / 2 - 56, c, tt);
  }
};

const tear = (lead: number, top: number, p: number, spd: number) => {
  const S = 10 + 25 * Math.sqrt(p);

  if (Math.random() < 0.5) {
    const px = lead - S * rnd(0.9, 1.6);
    const py = top - S * rnd(0.1, 0.9);
    const size = rnd(3, 5.5) + p * 3;
    const vx = -rnd(40, 90);
    const vy = rnd(-12, 4);
    const life = rnd(0.4, 0.7);
    puff(px, py, { life, n: 2, size, vx, vy });
  } else {
    lines(lead - S * 1.4, top - S * rnd(0.2, 1.3), {
      dir: Math.PI,
      len: 30 + spd * 160,
      life: 0.3,
      n: 1,
      spread: 3,
    });
  }

  if (Math.random() < 0.16) {
    ticks(lead + S * 1.1, top - S * 1.5, { dir: -0.7, len: 8, life: 0.35, n: 3, r: 4 });
  }
};

const finish = (b: ReturnType<typeof at>, top: number, back: Layer | null) => {
  const R = b.x + b.w / 2;
  burst(R - 74, b.y, { layer: back ?? undefined, life: 0.5, r: 92, spikes: 15 });
  burst(R - 60, b.y, { life: 0.3, r: 40 });
  shards(R - 60, b.y, { arc: 6.28, life: 0.9, n: 11, size: 7, speed: 270 });

  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * 6.28 + rnd(0.5);
    const size = rnd(8, 13);
    const life = rnd(0.6, 1);
    puff(R - 70 + Math.cos(a) * 70, b.y + Math.sin(a) * 34, {
      life,
      n: 4,
      size,
      vx: Math.cos(a) * 46,
      vy: Math.sin(a) * 30 - 8,
    });
  }

  sfx("don", b.x - 26, top - 62, { life: 1.05, rot: -0.12, size: 170 });
};

const advanceLoad = (load: Load, dt: number) => {
  const was = load.p;

  if (!load.doneAt && load.p < load.goal) {
    load.p = Math.min(load.goal, load.p + dt * clamp((load.goal - load.p) * 3, 0.12, 0.9));
  }

  load.spd = lerp(load.spd, dt > 0 ? (load.p - was) / dt : 0, Math.min(1, dt * 8));
};

const ride = (load: Load, b: ReturnType<typeof at>, dt: number) => {
  const L = b.x - b.w / 2;
  const lead = L + 4 + (b.w - 8) * load.p;
  const top = b.y - b.h / 2;
  const { p, spd } = load;

  if (p > 0.06 && spd > 0.02) {
    load.acc += dt * (4 + spd * 60);

    while (load.acc > 1) {
      load.acc -= 1;
      tear(lead, top, p, spd);
    }
  }

  if (!load.said && p > 0.3 && p < 0.9) {
    load.said = true;
    sfx("gogo", b.x - 34, top - 66, { life: 2.9, rot: -0.1, size: 150 });
    ticks(b.x + 52, top - 84, { dir: -0.5, len: 10, life: 0.6, n: 2, r: 4 });
    ticks(L + 8, top - 40, { dir: Math.PI + 0.3, len: 10, life: 0.6, n: 2, r: 4 });
  }
};

const loadOf = (loadRef: RefObject<Load | null>) => {
  const made = loadRef.current ?? makeLoad();
  loadRef.current = made;

  return made;
};

const textOf = (load: Load, n: number, doneLabel: string) => {
  if (load.doneAt) {
    return doneLabel;
  }

  return load.unknown ? UNKNOWN : `${n}%`;
};

const BAR =
  "relative h-[38px] overflow-hidden rounded-[19px] border-4 border-(--sk-ink) bg-(--sk-card)";

const FILL =
  "relative bg-(--sk-fill) before:absolute before:top-[5px] before:left-[22px] before:h-[11px] before:w-[9px] before:rounded-[2px] before:bg-white before:opacity-[.92] before:content-[''] before:[transform:skewX(-28deg)] after:absolute after:top-[5px] after:left-[37px] after:h-[11px] after:w-[6px] after:rounded-[2px] after:bg-white after:opacity-[.92] after:content-[''] after:[transform:skewX(-28deg)]";

const PCT =
  "mx-auto mt-[64px] table bg-(--sk-card) px-[13px] pt-[3px] pb-[4px] [font-family:'Marker_Felt','Chalkboard_SE','Comic_Sans_MS',-apple-system,'Segoe_UI',sans-serif] text-[21px] leading-[1.1] font-black tracking-[-0.01em] whitespace-nowrap italic shadow-[5px_5px_0_var(--sk-fill)] border-[2.5px] border-(--sk-ink) will-change-transform [transform:skewX(-12deg)]";

const ROOT =
  "relative isolate w-(--sk-progress-width,280px) max-w-full align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink)";

const SakugaProgress = ({
  className,
  value,
  min = 0,
  max = 100,
  doneLabel = "Complete ✓",
  onDone,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  ...props
}: SakugaProgressProps) => {
  const box = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const [attachBack, backRef] = useBackLayer();
  const loadRef = useRef<Load | null>(null);

  const [shown, setShown] = useState<{ text: string; value: number | null }>(() =>
    value === null || value === undefined
      ? { text: UNKNOWN, value: null }
      : { text: "0%", value: min },
  );

  useEffect(() => {
    const load = loadOf(loadRef);

    const layer = persist((_k, tt, dt) => {
      if (bar.current) {
        paint(load, bar.current, tt, dt);
      }
    });

    return () => {
      layer.dead = true;
    };
  }, []);

  const hadValue = useRef(false);
  useLayoutEffect(() => {
    const load = loadOf(loadRef);
    const known = value !== null && value !== undefined && Number.isFinite(value);
    load.unknown = !known;

    if (known) {
      hadValue.current = true;
      setGoal(load, max > min ? (value - min) / (max - min) : 0);
    } else if (hadValue.current) {
      hadValue.current = false;
      setGoal(load, 0);
    }
  }, [value, min, max]);

  useFrame((dt) => {
    const boxEl = box.current;
    const barEl = bar.current;
    const tagEl = pct.current;

    if (!boxEl || !barEl || !tagEl) {
      return;
    }

    const load = loadOf(loadRef);
    load.t += dt;
    const r = boxEl.getBoundingClientRect();
    load.vis = r.bottom > -80 && r.top < innerHeight + 80;
    advanceLoad(load, dt);
    const b = at(barEl);
    const top = b.y - b.h / 2;
    const { p } = load;

    if (!load.doneAt && load.vis) {
      ride(load, b, dt);
    }

    if (!load.doneAt && p >= 1) {
      load.doneAt = Math.max(load.t, 1e-9);

      if (load.vis) {
        finish(b, top, backRef.current);
      }

      load.tag.x = 1.5;
      onDone?.();
    }

    const n = load.doneAt ? 100 : Math.floor(p * 100);
    const text = textOf(load, n, doneLabel);

    if (text !== load.lastPct) {
      load.lastPct = text;
      flushSync(() => {
        setShown({ text, value: load.unknown ? null : min + ((max - min) * n) / 100 });
      });

      if (n % 5 === 0 && !load.doneAt) {
        load.tag.x = 1.1;
      }
    }

    tagEl.style.transform = `skewX(-12deg) scale(${load.tag.step(dt)})`;

    if (p !== load.shown) {
      load.shown = p;
      boxEl.style.setProperty("--v", String(p));
    }
  });

  return (
    <ProgressPrimitive.Root
      data-slot="sakuga-progress"
      className={cn(ROOT, FONT_BODY, className)}
      min={min}
      max={max}
      value={shown.value}
      aria-label={
        ariaLabel ?? (labelledBy !== undefined && labelledBy !== "" ? undefined : "Loading")
      }
      aria-labelledby={labelledBy}
      {...props}
    >
      <SakugaStyle />
      <canvas ref={attachBack} aria-hidden className={BACK_CANVAS} />
      <div ref={box} data-slot="sakuga-progress-box" className="relative pt-[70px]">
        <ProgressPrimitive.Track ref={bar} data-slot="sakuga-progress-track" className={BAR}>
          <ProgressPrimitive.Indicator
            data-slot="sakuga-progress-indicator"
            className={FILL}
            style={{ height: "100%", width: "calc(var(--v, 0) * 100%)" }}
          />
        </ProgressPrimitive.Track>
        <ProgressPrimitive.Value ref={pct} data-slot="sakuga-progress-value" className={PCT}>
          {() => shown.text}
        </ProgressPrimitive.Value>
      </div>
    </ProgressPrimitive.Root>
  );
};

export { SakugaProgress };
