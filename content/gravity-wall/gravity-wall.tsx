"use client";

import type { FC, RefObject } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

import type { Cell, Dims } from "./build-cells";
import type { Photo } from "./photos";
import {
  buildCells,
  CELL_CLASS,
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

/* ── The wall — memoised so featured/expanded changes never re-render it ─ */
interface WallProps {
  cells: Cell[];
  photos: readonly [Photo, ...Photo[]];
  itemsRef: RefObject<(HTMLDivElement | null)[]>;
}

const Wall = memo(function Wall({ cells, photos, itemsRef }: WallProps) {
  return (
    <>
      {cells.map((cell, i) => {
        const photo = photos[cell.photoIndex];
        if (!photo) return null;
        return (
          <div
            key={cell.index}
            ref={(el) => {
              itemsRef.current[i] = el;
            }}
            className={CELL_CLASS}
            style={{ width: cell.width, height: cell.height, opacity: 0 }}
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
});

/* ── Mutable per-frame state, kept off React so the loop never re-renders ─ */
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
}

interface IntroState {
  entrance: number;
  voidEmerge: number;
  featuredEmerge: number;
}

interface GravityWallProps {
  /** Non-empty by construction, so `photos[0]` needs no guard. */
  photos: readonly [Photo, ...Photo[]];
}

export const GravityWall: FC<GravityWallProps> = ({ photos }) => {
  const [dims, setDims] = useState<Dims | null>(null);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [saved, setSaved] = useState<Set<string>>(() => new Set());

  const sectionRef = useRef<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const itemEls = useRef<(HTMLDivElement | null)[]>([]);
  /* Frame origin in client coordinates, so pointer maths stays correct even if
     the section is not flush with the document origin. */
  const originRef = useRef({ left: 0, top: 0 });
  const reduceMotionRef = useRef(false);
  /* The last dims we handed to `setDims`. The tolerance check has to run
     against this rather than against the updater's `prev` — see `measure`. */
  const lastDimsRef = useRef<Dims | null>(null);

  const physics = useRef<PhysicsState>({
    mouse: { x: 0, y: 0, has: false },
    panOff: { x: 0, y: 0 },
    panTarget: { x: 0, y: 0 },
    voidWorld: { x: 0, y: 0 },
    voidRadius: 0,
    targetRadius: 0,
    rowOffsets: [],
    hovering: true,
    pinned: false,
    expanded: false,
    featuredIdx: 0,
  });
  const intro = useRef<IntroState>({
    entrance: 0,
    voidEmerge: 0,
    featuredEmerge: 0,
  });
  const introPlayed = useRef(false);

  const built = useMemo(() => (dims ? buildCells(dims, photos) : null), [dims, photos]);

  const featuredCell =
    built && built.cells.length > 0
      ? built.cells[Math.min(featuredIdx, built.cells.length - 1)]
      : undefined;
  const currentPhoto: Photo = featuredCell
    ? (photos[featuredCell.photoIndex] ?? photos[0])
    : photos[0];

  /* Keep refs mirrored from state so the rAF loop reads fresh values. */
  useEffect(() => {
    physics.current.expanded = expanded;
  }, [expanded]);
  useEffect(() => {
    physics.current.featuredIdx = featuredIdx;
  }, [featuredIdx]);

  /* Autonomous motion (row drift + intro) is suppressed under reduced motion;
     the pointer-driven displacement stays, since it is direct feedback. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reduceMotionRef.current = mq.matches;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* ── Frame sizing, measured from the section rather than the window ── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;
    const measure = () => {
      const rect = section.getBoundingClientRect();
      originRef.current.left = rect.left;
      originRef.current.top = rect.top;
      const vw = Math.round(rect.width);
      const vh = Math.round(rect.height);
      /* A freshly-mounted iframe reports 0x0 on the first callback. Building
         from that yields an empty cell array and NaN opacities. */
      if (vw <= 0 || vh <= 0) return;
      const isMobile = vw < MOBILE_BREAKPOINT;

      /* Deliberately NOT `setDims(prev => …)`. React may replay a queued
         updater against its *base* state on later renders — and it will replay
         forever if the update landed on a lane the render does not include.
         The first measure runs inside the passive-effect flush, which React
         drives from a Scheduler `message` event; when that scheduler callback
         sits at idle priority the update is tagged IdleLane, and every
         subsequent (default-lane) render skips it. An updater that mints a
         fresh object would then see `prev === null` every replay, hand back a
         new `Dims` identity on every render, invalidate `built`, restart both
         the rAF loop and the GSAP intro, and never settle — a black frame plus
         "Maximum update depth exceeded". Comparing against a ref and passing a
         concrete value makes the update replay-safe: however often React
         re-applies it, `dims` keeps one identity. */
      const last = lastDimsRef.current;
      if (
        last &&
        last.isMobile === isMobile &&
        Math.abs(last.vw - vw) < 24 &&
        Math.abs(last.vh - vh) < 24
      ) {
        return;
      }
      const next: Dims = { vw, vh, isMobile };
      lastDimsRef.current = next;
      setDims(next);
    };

    /* Coalesce to one measure per frame — a drag-resize would otherwise
       rebuild several hundred cells synchronously on every observer tick. */
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
  }, []);

  /* ── Actions ─────────────────────────────────────────────────────── */
  const open = useCallback(() => {
    const p = physics.current;
    if (p.expanded || !dims) return;
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
      if (!built || !dims) return;
      const { cells, tile } = built;
      if (cells.length === 0) return;
      const p = physics.current;
      const newIdx = (p.featuredIdx + dir + cells.length) % cells.length;
      const nextCell = cells[newIdx];
      if (!nextCell) return;

      const driftedX = nextCell.baseX + (p.rowOffsets[nextCell.rowIndex] ?? 0);
      const baseScreenX0 = driftedX + p.panOff.x;
      const baseScreenY0 = nextCell.baseY + p.panOff.y;
      /* Pick the torus repeat closest to frame centre, so prev/next never
         travels the long way around the wrap. */
      const kX = Math.round((dims.vw / 2 - baseScreenX0) / tile.width);
      const kY = Math.round((dims.vh / 2 - baseScreenY0) / tile.height);
      const nextWorldX = driftedX + kX * tile.width;
      const nextWorldY = nextCell.baseY + kY * tile.height;

      p.pinned = true;
      p.panTarget.x = dims.vw / 2 - nextWorldX;
      p.panTarget.y = dims.vh / 2 - nextWorldY;
      p.featuredIdx = newIdx;
      setFeaturedIdx(newIdx);
    },
    [built, dims],
  );

  const next = useCallback(() => navigate(1), [navigate]);
  const prev = useCallback(() => navigate(-1), [navigate]);

  const currentSlug = currentPhoto.slug;

  const toggleLike = useCallback(() => {
    setLiked((prevSet) => {
      const set = new Set(prevSet);
      if (set.has(currentSlug)) set.delete(currentSlug);
      else set.add(currentSlug);
      return set;
    });
  }, [currentSlug]);

  const toggleSave = useCallback(() => {
    setSaved((prevSet) => {
      const set = new Set(prevSet);
      if (set.has(currentSlug)) set.delete(currentSlug);
      else set.add(currentSlug);
      return set;
    });
  }, [currentSlug]);

  /* ── Pointer / touch / hover listeners ───────────────────────────── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const p = physics.current;

    const onMove = (e: PointerEvent) => {
      p.mouse.x = e.clientX - originRef.current.left;
      p.mouse.y = e.clientY - originRef.current.top;
      p.mouse.has = true;
    };
    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      p.mouse.x = touch.clientX - originRef.current.left;
      p.mouse.y = touch.clientY - originRef.current.top;
      p.mouse.has = true;
    };
    const onEnter = () => {
      const rect = section.getBoundingClientRect();
      originRef.current.left = rect.left;
      originRef.current.top = rect.top;
      p.hovering = true;
    };
    const onLeave = () => {
      p.hovering = false;
    };

    section.addEventListener("pointermove", onMove);
    section.addEventListener("touchmove", onTouch, { passive: true });
    section.addEventListener("pointerenter", onEnter);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("touchmove", onTouch);
      section.removeEventListener("pointerenter", onEnter);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  /* ── Keyboard (only while a detail is open) ──────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!physics.current.expanded || e.repeat) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, next, prev]);

  /* ── The rAF physics loop ────────────────────────────────────────── */
  useEffect(() => {
    if (!built || !dims) return;
    const { cells, tile } = built;
    const { vw, vh, isMobile } = dims;
    const p = physics.current;
    const introVals = intro.current;
    const tileW = tile.width;
    const tileH = tile.height;

    /* The absolute radii are tuned for a full desktop viewport; cap them
       against the frame so a short preview never loses the whole wall. */
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

    /* Reset world framing for this build. */
    p.panOff.x = vw / 2;
    p.panOff.y = vh / 2;
    p.panTarget.x = vw / 2;
    p.panTarget.y = vh / 2;
    p.voidWorld.x = 0;
    p.voidWorld.y = 0;
    p.rowOffsets = Array.from({ length: tile.rows }, () => 0);
    p.pinned = false;

    /* Seed featured with the cell nearest world centre. */
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell) continue;
      const d = Math.hypot(cell.baseX, cell.baseY);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    p.featuredIdx = best;
    setFeaturedIdx(best);

    let raf = 0;
    const tick = () => {
      const isExpanded = p.expanded;
      const hovering = p.hovering;

      /* A. per-row drift (frozen while a detail is open) */
      if (!isExpanded && !reduceMotionRef.current) {
        for (let r = 0; r < p.rowOffsets.length; r++) {
          const offset = p.rowOffsets[r];
          if (offset === undefined) continue;
          p.rowOffsets[r] = offset + rowDriftSpeed(r);
        }
      }

      /* B. pan lerp toward target */
      p.panOff.x += (p.panTarget.x - p.panOff.x) * PAN_LERP;
      p.panOff.y += (p.panTarget.y - p.panOff.y) * PAN_LERP;

      /* C. void position (world coords) */
      if (isExpanded) {
        if (!p.pinned) {
          const ddx = p.panTarget.x - p.panOff.x;
          const ddy = p.panTarget.y - p.panOff.y;
          if (Math.abs(ddx) < 0.5 && Math.abs(ddy) < 0.5) p.pinned = true;
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

      /* D. target radius: idle < hover < expanded, scaled by intro emerge */
      let baseR: number;
      if (isExpanded) baseR = expandedRadius;
      else if (hovering) baseR = hoverRadius;
      else baseR = idleRadius;
      p.targetRadius = baseR * introVals.voidEmerge;
      p.voidRadius += (p.targetRadius - p.voidRadius) * RADIUS_LERP;

      const R = p.voidRadius;
      const SOFT = R * SOFT_PUSH_RATIO;
      const vX = p.voidWorld.x;
      const vY = p.voidWorld.y;

      const entrance = introVals.entrance;
      const halfDiag = Math.hypot(vw, vh) / 2;
      const revealActive = entrance < 1;
      const cullMargin = 240;

      let nearestIdx = p.featuredIdx;
      let nearestDist = Infinity;

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (!cell) continue;
        const el = itemEls.current[i];
        if (!el) continue;

        /* Re-home this cell into whichever torus repeat sits nearest the frame
           centre — this is what makes a finite cell array look infinite. */
        const driftedX = cell.baseX + (p.rowOffsets[cell.rowIndex] ?? 0);
        const baseScreenX0 = driftedX + p.panOff.x;
        const baseScreenY0 = cell.baseY + p.panOff.y;
        const kX = Math.round((vw / 2 - baseScreenX0) / tileW);
        const kY = Math.round((vh / 2 - baseScreenY0) / tileH);
        const effectiveWorldX = driftedX + kX * tileW;
        const effectiveWorldY = cell.baseY + kY * tileH;

        const dx = effectiveWorldX - vX;
        const dy = effectiveWorldY - vY;
        const dist = Math.hypot(dx, dy);

        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }

        const baseScreenX = effectiveWorldX + p.panOff.x;
        const baseScreenY = effectiveWorldY + p.panOff.y;
        if (baseScreenX + cell.width < -cullMargin) continue;
        if (baseScreenX > vw + cullMargin) continue;
        if (baseScreenY + cell.height < -cullMargin) continue;
        if (baseScreenY > vh + cullMargin) continue;

        let finalWorldX = effectiveWorldX;
        let finalWorldY = effectiveWorldY;
        let s = cell.scale;

        if (dist < SOFT) {
          const t = 1 - dist / SOFT;
          const push = R * t * t;
          let dirX: number;
          let dirY: number;
          if (dist < 0.5) {
            /* Dead centre: fall back to the cell's own deterministic angle
               instead of dividing by zero. */
            dirX = Math.cos(cell.angle);
            dirY = Math.sin(cell.angle);
          } else {
            dirX = dx / dist;
            dirY = dy / dist;
          }
          finalWorldX = effectiveWorldX + dirX * push;
          finalWorldY = effectiveWorldY + dirY * push;
          if (dist > R * 0.55 && dist < R * 1.05) {
            /* Ring bump — makes the void rim read as a lens, not a hole. */
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
          const cellEntrance = entrance * 1.0 - (distFromCenter / halfDiag) * 0.4;
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
      }

      /* F. featured index update (only on real change, only when closed) */
      if (nearestIdx !== p.featuredIdx && nearestDist < R * 0.9 && !isExpanded) {
        p.featuredIdx = nearestIdx;
        setFeaturedIdx(nearestIdx);
      }

      /* G. position the featured anchor */
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
    return () => cancelAnimationFrame(raf);
  }, [built, dims]);

  /* ── Cinematic intro (runs once, snaps to final on teardown) ─────── */
  useEffect(() => {
    if (!built || introPlayed.current) return;

    const introVals = intro.current;

    if (reduceMotionRef.current) {
      introVals.entrance = 1;
      introVals.voidEmerge = 1;
      introVals.featuredEmerge = 1;
      introPlayed.current = true;
      return;
    }

    introVals.entrance = 0;
    introVals.voidEmerge = 0;
    introVals.featuredEmerge = 0;
    physics.current.voidRadius = 0;
    physics.current.targetRadius = 0;

    /* `introPlayed` latches only once the timeline actually finishes, so a
       StrictMode double-mount replays the intro rather than swallowing it,
       while a later resize (which rebuilds `built`) leaves it alone. */
    const tl = gsap.timeline({
      delay: 0.1,
      onComplete: () => {
        introPlayed.current = true;
      },
    });
    tl.to(introVals, { entrance: 1, duration: 1.7, ease: "power2.inOut" }, 0);
    tl.to(introVals, { voidEmerge: 1, duration: 1.1, ease: "power2.out" }, 0.2);
    tl.to(introVals, { featuredEmerge: 1, duration: 0.8, ease: "back.out(1.4)" }, 0.7);

    return () => {
      tl.kill();
      /* Snap to the settled state — leaving `entrance` at 0 renders a black
         frame, since it drives every cell's opacity. */
      introVals.entrance = 1;
      introVals.voidEmerge = 1;
      introVals.featuredEmerge = 1;
    };
  }, [built]);

  return (
    <section
      ref={sectionRef}
      aria-label="Interactive photo wall"
      className="relative isolate h-full w-full touch-none overflow-hidden bg-[#0a0a0a] text-white select-none"
    >
      <div aria-hidden className="absolute inset-0">
        {built && dims && <Wall cells={built.cells} photos={photos} itemsRef={itemEls} />}
      </div>

      {/* Symmetric vignette — replaces the source's corner gradient, which
          existed only to darken the ground behind the headline. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[14]"
        style={{
          background:
            "radial-gradient(ellipse 78% 78% at 50% 50%, transparent 40%, rgb(10 10 10 / 0.5) 100%)",
        }}
      />

      {/* Dim overlay (fades in while expanded, backdrop click closes) */}
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

      {/* Featured anchor (positioned every frame by the tick) */}
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
            onNext={next}
            onPrev={prev}
            onToggleLike={toggleLike}
            onToggleSave={toggleSave}
          />
        )}
      </div>
    </section>
  );
};
