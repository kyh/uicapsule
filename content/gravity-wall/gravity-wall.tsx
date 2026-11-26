"use client";

import type { Dispatch, FC, RefObject, SetStateAction } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

import type { Cell, Dims } from "./build-cells";
import type { Photo } from "./photos";
import {
  buildCells,
  CELL_CLASS,
  CULL_MARGIN,
  MOBILE_BREAKPOINT,
  PAN_LERP,
  RADIUS_LERP,
  rowDriftSpeed,
  smoothstep,
  SOFT_PUSH_RATIO,
  VOID_LERP,
  VOID_RADIUS_CAP_RATIO,
  VOID_RADIUS_CAP_RATIO_EXPANDED,
  VOID_RADIUS_EXPANDED_DESKTOP,
  VOID_RADIUS_EXPANDED_MOBILE,
  VOID_RADIUS_HOVER_DESKTOP,
  VOID_RADIUS_HOVER_MOBILE,
  VOID_RADIUS_IDLE_DESKTOP,
  VOID_RADIUS_IDLE_MOBILE,
} from "./build-cells";
import { FeaturedCard } from "./featured-card";

const noop = () => null;

interface WallProps {
  cells: Cell[];
  photos: readonly [Photo, ...Photo[]];
  itemsRef: RefObject<(HTMLDivElement | null)[]>;
}

const WallBase = ({ cells, photos, itemsRef }: WallProps) => (
  <>
    {cells.map((cell, i) => {
      const photo = photos[cell.photoIndex];

      if (!photo) {
        return null;
      }

      return (
        <div
          key={cell.index}
          ref={(el) => {
            itemsRef.current[i] = el;
          }}
          className={CELL_CLASS}
          style={{ height: cell.height, opacity: 0, width: cell.width }}
        >
          <img
            src={photo.thumbUrl}
            alt=""
            draggable={false}
            decoding="async"
            className="h-full w-full object-cover select-none"
          />
        </div>
      );
    })}
  </>
);

const Wall = memo(WallBase);

interface PhysicsState {
  mouse: { x: number; y: number; has: boolean };
  panOff: { x: number; y: number };
  panTarget: { x: number; y: number };
  voidWorld: { x: number; y: number };
  voidRadius: number;
  targetRadius: number;
  rowOffsets: number[];
  hovering: boolean;
  pinned: boolean;
  expanded: boolean;
  featuredIdx: number;
  featuredPhoto: number;
}

interface IntroState {
  entrance: number;
  voidEmerge: number;
  featuredEmerge: number;
}

interface Frame {
  vw: number;
  vh: number;
  tileW: number;
  tileH: number;
  halfDiag: number;
  idleRadius: number;
  hoverRadius: number;
  expandedRadius: number;
}

const advanceVoid = (
  p: PhysicsState,
  introVals: IntroState,
  frame: Frame,
  reduceMotion: boolean,
) => {
  const isExpanded = p.expanded;
  const { vw, vh } = frame;

  if (!isExpanded && !reduceMotion) {
    for (let r = 0; r < p.rowOffsets.length; r += 1) {
      const offset = p.rowOffsets[r];

      if (offset === undefined) {
        continue;
      }

      p.rowOffsets[r] = offset + rowDriftSpeed(r);
    }
  }

  p.panOff.x += (p.panTarget.x - p.panOff.x) * PAN_LERP;
  p.panOff.y += (p.panTarget.y - p.panOff.y) * PAN_LERP;

  if (isExpanded) {
    if (!p.pinned) {
      const ddx = p.panTarget.x - p.panOff.x;
      const ddy = p.panTarget.y - p.panOff.y;

      if (Math.abs(ddx) < 0.5 && Math.abs(ddy) < 0.5) {
        p.pinned = true;
      }
    }

    if (p.pinned) {
      p.voidWorld.x = vw / 2 - p.panOff.x;
      p.voidWorld.y = vh / 2 - p.panOff.y;
    }
  } else if (p.mouse.has) {
    const tx = p.mouse.x - p.panOff.x;
    const ty = p.mouse.y - p.panOff.y;
    p.voidWorld.x += (tx - p.voidWorld.x) * VOID_LERP;
    p.voidWorld.y += (ty - p.voidWorld.y) * VOID_LERP;
  }

  let baseR: number;

  if (isExpanded) {
    baseR = frame.expandedRadius;
  } else if (p.hovering) {
    baseR = frame.hoverRadius;
  } else {
    baseR = frame.idleRadius;
  }

  p.targetRadius = baseR * introVals.voidEmerge;
  p.voidRadius += (p.targetRadius - p.voidRadius) * RADIUS_LERP;
};

const placeCell = (
  cell: Cell,
  el: HTMLDivElement,
  p: PhysicsState,
  introVals: IntroState,
  frame: Frame,
) => {
  const { vw, vh, tileW, tileH, halfDiag } = frame;
  const R = p.voidRadius;
  const SOFT = R * SOFT_PUSH_RATIO;
  const vX = p.voidWorld.x;
  const vY = p.voidWorld.y;
  const { entrance } = introVals;
  const revealActive = entrance < 1;

  const driftedX = cell.baseX + (p.rowOffsets[cell.rowIndex] ?? 0);
  const baseScreenX0 = driftedX + p.panOff.x;
  const baseScreenY0 = cell.baseY + p.panOff.y;
  const kX = Math.round((vw / 2 - baseScreenX0) / tileW);
  const kY = Math.round((vh / 2 - baseScreenY0) / tileH);
  const effectiveWorldX = driftedX + kX * tileW;
  const effectiveWorldY = cell.baseY + kY * tileH;

  const dx = effectiveWorldX - vX;
  const dy = effectiveWorldY - vY;
  // oxlint-disable-next-line unicorn/prefer-modern-math-apis -- Math.hypot is slower and this runs ~500 times a frame; same result for pixel-scale inputs
  const dist = Math.sqrt(dx * dx + dy * dy);

  const baseScreenX = effectiveWorldX + p.panOff.x;
  const baseScreenY = effectiveWorldY + p.panOff.y;

  if (baseScreenX + cell.width < -CULL_MARGIN) {
    return dist;
  }

  if (baseScreenX > vw + CULL_MARGIN) {
    return dist;
  }

  if (baseScreenY + cell.height < -CULL_MARGIN) {
    return dist;
  }

  if (baseScreenY > vh + CULL_MARGIN) {
    return dist;
  }

  let finalWorldX = effectiveWorldX;
  let finalWorldY = effectiveWorldY;
  let s = cell.scale;

  if (dist < SOFT) {
    const t = 1 - dist / SOFT;
    const push = R * t * t;
    let dirX: number;
    let dirY: number;

    if (dist < 0.5) {
      dirX = Math.cos(cell.angle);
      dirY = Math.sin(cell.angle);
    } else {
      dirX = dx / dist;
      dirY = dy / dist;
    }

    finalWorldX = effectiveWorldX + dirX * push;
    finalWorldY = effectiveWorldY + dirY * push;

    if (dist > R * 0.55 && dist < R * 1.05) {
      const ringT =
        smoothstep(R * 0.55, R * 0.8, dist) * (1 - smoothstep(R * 0.85, R * 1.05, dist));

      s *= 1 + 0.06 * ringT;
    }
  }

  let alpha = 1;
  let introOffsetX = 0;
  let introOffsetY = 0;

  if (revealActive) {
    const distFromCenter = Math.hypot(cell.baseX, cell.baseY);
    const cellEntrance = entrance * 1 - (distFromCenter / halfDiag) * 0.4;
    const entranceAlpha = Math.max(0, Math.min(1, cellEntrance * 1.5));
    alpha = entranceAlpha;
    s *= 0.3 + 0.7 * entranceAlpha;

    if (distFromCenter > 1) {
      const dirX = cell.baseX / distFromCenter;
      const dirY = cell.baseY / distFromCenter;
      const flyMag = (1 - entranceAlpha) * 420;
      introOffsetX = dirX * flyMag;
      introOffsetY = dirY * flyMag;
    }
  }

  const screenX = finalWorldX + introOffsetX + p.panOff.x - cell.width / 2;
  const screenY = finalWorldY + introOffsetY + p.panOff.y - cell.height / 2;
  el.style.transform =
    `translate3d(${screenX.toFixed(2)}px, ${screenY.toFixed(2)}px, 0) ` +
    `rotate(${cell.rotation.toFixed(2)}deg) scale(${s.toFixed(3)})`;
  el.style.opacity = alpha < 0.999 ? alpha.toFixed(3) : "1";

  return dist;
};

interface GravityWallProps {
  /** Non-empty by construction, so `photos[0]` needs no guard. */
  photos: readonly [Photo, ...Photo[]];
}

const useSlugToggle = (setSlugs: Dispatch<SetStateAction<Set<string>>>, slug: string) =>
  useCallback(() => {
    setSlugs((prev) => {
      const next = new Set(prev);

      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }

      return next;
    });
  }, [setSlugs, slug]);

export const GravityWall: FC<GravityWallProps> = ({ photos }) => {
  const [dims, setDims] = useState<Dims | null>(null);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [saved, setSaved] = useState<Set<string>>(() => new Set());

  const sectionRef = useRef<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const itemEls = useRef<(HTMLDivElement | null)[]>([]);
  const originRef = useRef({ left: 0, top: 0 });
  const reduceMotionRef = useRef(false);
  const lastDimsRef = useRef<Dims | null>(null);

  const physics = useRef<PhysicsState>({
    expanded: false,
    featuredIdx: 0,
    featuredPhoto: 0,
    hovering: false,
    mouse: { has: false, x: 0, y: 0 },
    panOff: { x: 0, y: 0 },
    panTarget: { x: 0, y: 0 },
    pinned: false,
    rowOffsets: [],
    targetRadius: 0,
    voidRadius: 0,
    voidWorld: { x: 0, y: 0 },
  });

  const intro = useRef<IntroState>({
    entrance: 0,
    featuredEmerge: 0,
    voidEmerge: 0,
  });

  const built = useMemo(() => (dims ? buildCells(dims, photos) : null), [dims, photos]);

  const featuredCell =
    built && built.cells.length > 0
      ? built.cells[Math.min(featuredIdx, built.cells.length - 1)]
      : undefined;

  const currentPhoto: Photo = featuredCell
    ? (photos[featuredCell.photoIndex] ?? photos[0])
    : photos[0];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      reduceMotionRef.current = mq.matches;
    };

    apply();
    mq.addEventListener("change", apply);

    return () => {
      mq.removeEventListener("change", apply);
    };
  }, []);

  const refreshOrigin = useCallback(() => {
    const section = sectionRef.current;

    if (!section) {
      return null;
    }

    const rect = section.getBoundingClientRect();
    originRef.current.left = rect.left;
    originRef.current.top = rect.top;

    return rect;
  }, []);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return noop;
    }

    let raf = 0;

    const measure = () => {
      const rect = refreshOrigin();

      if (!rect) {
        return;
      }

      const vw = Math.round(rect.width);
      const vh = Math.round(rect.height);

      if (vw <= 0 || vh <= 0) {
        return;
      }

      const isMobile = vw < MOBILE_BREAKPOINT;

      const last = lastDimsRef.current;

      if (
        last &&
        last.isMobile === isMobile &&
        Math.abs(last.vw - vw) < 24 &&
        Math.abs(last.vh - vh) < 24
      ) {
        return;
      }

      const next: Dims = { isMobile, vh, vw };
      lastDimsRef.current = next;
      setDims(next);
    };

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });

    observer.observe(section);
    measure();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [refreshOrigin]);

  const setFeatured = useCallback((idx: number, cells: readonly Cell[]) => {
    const p = physics.current;
    const cell = cells[idx];

    if (!cell) {
      return;
    }

    p.featuredIdx = idx;
    p.featuredPhoto = cell.photoIndex;
    setFeaturedIdx(idx);
  }, []);

  const open = useCallback(() => {
    const p = physics.current;

    if (p.expanded || !dims) {
      return;
    }

    p.pinned = false;
    p.panTarget.x = dims.vw / 2 - p.voidWorld.x;
    p.panTarget.y = dims.vh / 2 - p.voidWorld.y;
    p.expanded = true;
    setExpanded(true);
  }, [dims]);

  const close = useCallback(() => {
    const p = physics.current;
    p.pinned = false;
    p.expanded = false;
    setExpanded(false);
  }, []);

  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (!built || !dims) {
        return;
      }

      const { cells, tile } = built;

      if (cells.length === 0) {
        return;
      }

      const p = physics.current;
      const newIdx = (p.featuredIdx + dir + cells.length) % cells.length;
      const nextCell = cells[newIdx];

      if (!nextCell) {
        return;
      }

      const driftedX = nextCell.baseX + (p.rowOffsets[nextCell.rowIndex] ?? 0);
      const baseScreenX0 = driftedX + p.panOff.x;
      const baseScreenY0 = nextCell.baseY + p.panOff.y;
      const kX = Math.round((dims.vw / 2 - baseScreenX0) / tile.width);
      const kY = Math.round((dims.vh / 2 - baseScreenY0) / tile.height);
      const nextWorldX = driftedX + kX * tile.width;
      const nextWorldY = nextCell.baseY + kY * tile.height;

      p.pinned = true;
      p.panTarget.x = dims.vw / 2 - nextWorldX;
      p.panTarget.y = dims.vh / 2 - nextWorldY;
      setFeatured(newIdx, cells);
    },
    [built, dims, setFeatured],
  );

  const goNext = useCallback(() => {
    navigate(1);
  }, [navigate]);

  const goPrev = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const toggleLike = useSlugToggle(setLiked, currentPhoto.slug);
  const toggleSave = useSlugToggle(setSaved, currentPhoto.slug);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return noop;
    }

    const p = physics.current;

    const onMove = (e: PointerEvent) => {
      p.mouse.x = e.clientX - originRef.current.left;
      p.mouse.y = e.clientY - originRef.current.top;
      p.mouse.has = true;
    };

    const onTouch = (e: TouchEvent) => {
      const [touch] = e.touches;

      if (!touch) {
        return;
      }

      p.mouse.x = touch.clientX - originRef.current.left;
      p.mouse.y = touch.clientY - originRef.current.top;
      p.mouse.has = true;
    };

    const onEnter = () => {
      refreshOrigin();
      p.hovering = true;
    };

    const onLeave = () => {
      p.hovering = false;
    };

    section.addEventListener("pointermove", onMove);
    section.addEventListener("touchmove", onTouch, { passive: true });
    section.addEventListener("pointerenter", onEnter);
    section.addEventListener("pointerleave", onLeave);
    window.addEventListener(
      "scroll",
      () => {
        refreshOrigin();
      },
      { capture: true, passive: true },
    );

    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("touchmove", onTouch);
      section.removeEventListener("pointerenter", onEnter);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener(
        "scroll",
        () => {
          refreshOrigin();
        },
        { capture: true },
      );
    };
  }, [refreshOrigin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!physics.current.expanded || e.repeat) {
        return;
      }

      if (e.key === "Escape") {
        close();
      } else if (e.key === "ArrowRight") {
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [close, goNext, goPrev]);

  useEffect(() => {
    if (!built || !dims) {
      return noop;
    }

    const { cells, tile } = built;
    const { vw, vh, isMobile } = dims;
    const p = physics.current;
    const introVals = intro.current;
    const tileW = tile.width;
    const tileH = tile.height;

    const minDim = Math.min(vw, vh);

    const idleRadius = Math.min(
      isMobile ? VOID_RADIUS_IDLE_MOBILE : VOID_RADIUS_IDLE_DESKTOP,
      minDim * VOID_RADIUS_CAP_RATIO,
    );

    const hoverRadius = Math.min(
      isMobile ? VOID_RADIUS_HOVER_MOBILE : VOID_RADIUS_HOVER_DESKTOP,
      minDim * VOID_RADIUS_CAP_RATIO,
    );

    const expandedRadius = Math.min(
      isMobile ? VOID_RADIUS_EXPANDED_MOBILE : VOID_RADIUS_EXPANDED_DESKTOP,
      minDim * VOID_RADIUS_CAP_RATIO_EXPANDED,
    );

    p.panOff.x = vw / 2;
    p.panOff.y = vh / 2;
    p.panTarget.x = vw / 2;
    p.panTarget.y = vh / 2;
    p.voidWorld.x = 0;
    p.voidWorld.y = 0;
    p.rowOffsets = Array.from({ length: tile.rows }, () => 0);
    p.pinned = false;

    if (p.expanded) {
      const kept = cells.findIndex((cell) => cell.photoIndex === p.featuredPhoto);
      setFeatured(kept === -1 ? 0 : kept, cells);
    } else {
      let best = 0;
      let bestD = Infinity;

      for (let i = 0; i < cells.length; i += 1) {
        const cell = cells[i];

        if (!cell) {
          continue;
        }

        const d = Math.hypot(cell.baseX, cell.baseY);

        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }

      setFeatured(best, cells);
    }

    const frame: Frame = {
      expandedRadius,
      halfDiag: Math.hypot(vw, vh) / 2,
      hoverRadius,
      idleRadius,
      tileH,
      tileW,
      vh,
      vw,
    };

    let raf = 0;

    const tick = () => {
      advanceVoid(p, introVals, frame, reduceMotionRef.current);
      const isExpanded = p.expanded;
      const R = p.voidRadius;
      const vX = p.voidWorld.x;
      const vY = p.voidWorld.y;

      let nearestIdx = p.featuredIdx;
      let nearestDist = Infinity;

      for (let i = 0; i < cells.length; i += 1) {
        const cell = cells[i];

        if (!cell) {
          continue;
        }

        const el = itemEls.current[i];

        if (!el) {
          continue;
        }

        const dist = placeCell(cell, el, p, introVals, frame);

        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      if (nearestIdx !== p.featuredIdx && nearestDist < R * 0.9 && !isExpanded) {
        setFeatured(nearestIdx, cells);
      }

      const anchor = anchorRef.current;

      if (anchor) {
        let sx: number;
        let sy: number;

        if (isExpanded && p.pinned) {
          sx = vw / 2;
          sy = vh / 2;
        } else {
          sx = vX + p.panOff.x;
          sy = vY + p.panOff.y;
        }

        const fEm = introVals.featuredEmerge;
        anchor.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0) scale(${fEm.toFixed(3)})`;
        anchor.style.opacity = fEm < 0.999 ? fEm.toFixed(3) : "1";
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [built, dims, setFeatured]);

  const hasBuilt = built !== null;
  useEffect(() => {
    if (!hasBuilt) {
      return noop;
    }

    const introVals = intro.current;

    if (reduceMotionRef.current) {
      introVals.entrance = 1;
      introVals.voidEmerge = 1;
      introVals.featuredEmerge = 1;

      return noop;
    }

    introVals.entrance = 0;
    introVals.voidEmerge = 0;
    introVals.featuredEmerge = 0;
    physics.current.voidRadius = 0;
    physics.current.targetRadius = 0;

    const tl = gsap.timeline({ delay: 0.1 });
    tl.to(introVals, { duration: 1.7, ease: "power2.inOut", entrance: 1 }, 0);
    tl.to(introVals, { duration: 1.1, ease: "power2.out", voidEmerge: 1 }, 0.2);
    tl.to(introVals, { duration: 0.8, ease: "back.out(1.4)", featuredEmerge: 1 }, 0.7);

    return () => {
      tl.kill();
      introVals.entrance = 1;
      introVals.voidEmerge = 1;
      introVals.featuredEmerge = 1;
    };
  }, [hasBuilt]);

  return (
    <section
      ref={sectionRef}
      aria-label="Interactive photo wall"
      className="relative isolate h-full w-full touch-none overflow-hidden bg-[#0a0a0a] text-white select-none"
    >
      <div aria-hidden className="absolute inset-0">
        {built && <Wall cells={built.cells} photos={photos} itemsRef={itemEls} />}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[14]"
        style={{
          background:
            "radial-gradient(ellipse 78% 78% at 50% 50%, transparent 40%, rgb(10 10 10 / 0.5) 100%)",
        }}
      />

      <div
        aria-hidden
        onClick={close}
        className="absolute inset-0 z-20 transition-opacity duration-300"
        style={{
          background: "rgb(10 10 10 / 0.55)",
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? "auto" : "none",
        }}
      />

      <div
        ref={anchorRef}
        className="pointer-events-none absolute top-0 left-0 z-30 will-change-transform"
        style={{ opacity: 0 }}
      >
        {built && dims && (
          <FeaturedCard
            photo={currentPhoto}
            expanded={expanded}
            isMobile={dims.isMobile}
            vw={dims.vw}
            vh={dims.vh}
            liked={liked.has(currentPhoto.slug)}
            saved={saved.has(currentPhoto.slug)}
            onOpen={open}
            onClose={close}
            onNext={goNext}
            onPrev={goPrev}
            onToggleLike={toggleLike}
            onToggleSave={toggleSave}
          />
        )}
      </div>
    </section>
  );
};
