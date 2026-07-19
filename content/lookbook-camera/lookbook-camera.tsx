"use client";

import gsap from "gsap";
import { X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { Pos } from "./lookbook-data";
import { DetailPanel, NARROW_BREAKPOINT, usesSideLayout } from "./detail-panel";
import { LookFigure } from "./look-figure";
import {
  BASE_LOOKS,
  CARD_H,
  CARD_W,
  CELL_MARGIN_X,
  CELL_MARGIN_Y,
  chooseCols,
  layoutPositions,
  LOOKS,
  wrapOffset,
} from "./lookbook-data";

/* ── Tunable constants ───────────────────────────────────────────── */

const CAMERA_INTRO_FACTOR = 0.52;
const CAMERA_REST_FACTOR = 1.0;

const NEIGHBOUR_HEIGHT_FRACTION = 0.3;
const NEIGHBOUR_HEIGHT_FRACTION_NARROW = 0.15;
const SELECTION_HEIGHT_FRACTION = 0.75;
const SELECTION_HEIGHT_FRACTION_NARROW = 0.36;
const POST_DESELECT_HEIGHT_FRACTION = 0.375;

const DRAG_THRESHOLD_PX = 6;
const WHEEL_SENSITIVITY = 0.0018;
const MAX_CAMERA_SCALE = 6.0;
const DEFAULT_MIN_ZOOM_CARD_HEIGHT = 240;
const DEFAULT_MIN_ZOOM_CARD_HEIGHT_NARROW = 200;
const DEFAULT_INERTIA_FRICTION = 0.93;
const AUTO_DRIFT_PX_PER_FRAME = 0.45;

const PARALLAX_RANGE = 320;
const PARALLAX_STRENGTH = 9;
const ENTRANCE_STAGGER = 0.04;

/** One cycle — the only cards that are distinct looks, so the only tab stops. */
const KEYBOARD_REACHABLE = BASE_LOOKS.length;

/* ── Types ───────────────────────────────────────────────────────── */

interface Dims {
  w: number;
  h: number;
  worldW: number;
  worldH: number;
  baseFit: number;
}

/** The exact transform the RAF loop last wrote to a card, in GSAP's own props. */
interface WrittenTransform {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface DragState {
  active: boolean;
  didMove: boolean;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  lastSx: number;
  lastSy: number;
  prevSx: number;
  prevSy: number;
  vt: number;
  vx: number;
  vy: number;
  worldAnchorX: number;
  worldAnchorY: number;
  inertiaActive: boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Where the focused card's centre lands in container space.
 *
 * This defers to the detail panel's own layout predicate on purpose: the source
 * switched the landing point at 920 but the panel layout at 768, which left a
 * dead band where the panel was positioned beside a card that had already moved
 * to centre — at 800x600 the panel sat on top of the thing it described.
 */
function selectionTarget(w: number, h: number): { x: number; y: number } {
  if (usesSideLayout(w, h)) return { x: 0.34 * w, y: 0.5 * h };
  return { x: 0.5 * w, y: 0.2 * h + 28 };
}

/** Everything a focused look needs, solved from one layout decision. */
interface SelectionGeometry {
  /** Camera scale while the look is open. */
  cameraScale: number;
  /** Camera translation that puts the card on `selectionTarget`. */
  cameraX: number;
  cameraY: number;
  /** Extra scale applied to the card itself, on top of the camera's. */
  cardScale: number;
  /** Card translation onto the wrapped copy nearest the camera. */
  tileOffX: number;
  tileOffY: number;
}

/**
 * Solve the open-look geometry for a container size and a camera world centre.
 *
 * The card's SIZE and the card's POSITION must come from the same
 * `usesSideLayout` verdict the detail panel branches on, or a frame that gets
 * the sheet layout still flies in a card sized for the wide one and the panel
 * lands on top of the thing it describes. Keeping both in here is what stops
 * the two from drifting apart — including across a resize, which re-solves.
 */
function solveSelection(d: Dims, pos: Pos, worldCx: number, worldCy: number): SelectionGeometry {
  const narrow = !usesSideLayout(d.w, d.h);
  const neighbourFraction = narrow ? NEIGHBOUR_HEIGHT_FRACTION_NARROW : NEIGHBOUR_HEIGHT_FRACTION;
  const selectionFraction = narrow ? SELECTION_HEIGHT_FRACTION_NARROW : SELECTION_HEIGHT_FRACTION;
  const cameraScale = (d.h * neighbourFraction) / CARD_H;
  const target = selectionTarget(d.w, d.h);
  const tileOffX = wrapOffset(pos.x, worldCx, d.worldW);
  const tileOffY = wrapOffset(pos.y, worldCy, d.worldH);
  return {
    cameraScale,
    cameraX: target.x - (pos.x + tileOffX) * cameraScale,
    cameraY: target.y - (pos.y + tileOffY) * cameraScale,
    cardScale: selectionFraction / neighbourFraction,
    tileOffX,
    tileOffY,
  };
}

/* ── Decorative paper-grain contour lines ────────────────────────── */

/** 14 wobbling contours — a paper ground that makes the drift legible. */
const CONTOUR_PATHS: string[] = Array.from({ length: 14 }, (_, i) => {
  const y = (i / 14) * 100 + Math.sin(i * 1.7) * 4;
  return `M0 ${y} Q25 ${y - 6} 50 ${y} T100 ${y}`;
});

function BackgroundLines() {
  return (
    <svg
      className="text-foreground pointer-events-none absolute inset-0 size-full opacity-[0.06]"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      aria-hidden
    >
      {CONTOUR_PATHS.map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="0.06"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

/* ── Host component ──────────────────────────────────────────────── */

export function LookbookCamera() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [dims, setDims] = useState<Dims | null>(null);
  const [positions, setPositions] = useState<Pos[]>([]);
  const [ready, setReady] = useState(false);

  const containerRef = useRef<HTMLElement | null>(null);
  const cameraRef = useRef<HTMLDivElement | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  /**
   * Mirror of the transforms the RAF loop writes as raw `style.transform`, which
   * GSAP's per-target cache never observes. Handing these back to GSAP right
   * before a tween starts is what keeps a selection from beginning a whole tile
   * away from where the card actually is. Entries are mutated in place — the
   * loop touches this every frame for every card.
   */
  const lastWrittenRef = useRef<WrittenTransform[]>([]);

  const camera = useRef({ scale: 0.5, x: 0, y: 0 });
  const drag = useRef<DragState>({
    active: false,
    didMove: false,
    pointerId: -1,
    startClientX: 0,
    startClientY: 0,
    lastSx: 0,
    lastSy: 0,
    prevSx: 0,
    prevSy: 0,
    vt: 0,
    vx: 0,
    vy: 0,
    worldAnchorX: 0,
    worldAnchorY: 0,
    inertiaActive: false,
  });
  const mouse = useRef({ x: 0, y: 0, inside: false });
  const driftRamp = useRef({ amount: 0 });
  /** Camera to restore on close; null when there is nothing worth restoring. */
  const preSelectionCamera = useRef<{ x: number; y: number; scale: number } | null>(null);
  const gsapManagedItems = useRef<Set<number>>(new Set());

  const dimsRef = useRef<Dims>({
    w: 1,
    h: 1,
    worldW: 1,
    worldH: 1,
    baseFit: 1,
  });
  const positionsRef = useRef<Pos[]>([]);
  const rectRef = useRef({ left: 0, top: 0 });
  const selectedIdxRef = useRef<number | null>(null);
  const transitioningRef = useRef(false);
  const enteredRef = useRef(false);
  const cameraInitedRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const animRef = useRef<number | null>(null);
  /** The deferred half of a drag-deselect, held so unmount can kill it. */
  const deselectCallRef = useRef<ReturnType<typeof gsap.delayedCall> | null>(null);
  /** The one-frame wait before the detail panel's entrance is choreographed. */
  const panelRafRef = useRef<number | null>(null);

  const applyCameraTransform = useCallback(() => {
    if (drag.current.active && drag.current.didMove) {
      camera.current.x = drag.current.lastSx - drag.current.worldAnchorX * camera.current.scale;
      camera.current.y = drag.current.lastSy - drag.current.worldAnchorY * camera.current.scale;
    }
    const c = cameraRef.current;
    if (!c) return;
    const { scale, x, y } = camera.current;
    c.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, []);

  const effectiveMinScale = useCallback(() => {
    const w = dimsRef.current.w;
    const floor =
      w < NARROW_BREAKPOINT ? DEFAULT_MIN_ZOOM_CARD_HEIGHT_NARROW : DEFAULT_MIN_ZOOM_CARD_HEIGHT;
    return floor / CARD_H;
  }, []);

  /**
   * The container's viewport offset, cached because pointer/wheel handlers need
   * it on every event and a `getBoundingClientRect()` there would force layout
   * against the RAF loop's transform writes. Page scroll moves it without
   * resizing anything, so scrolling has to refresh it too.
   */
  const refreshRect = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    rectRef.current = { left: r.left, top: r.top };
  }, []);

  const measure = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    // A ResizeObserver fires once at 0x0 inside a freshly-mounted iframe.
    if (w === 0 || h === 0) return;
    // Read the camera's world centre against the OLD dims, before they change.
    const prev = dimsRef.current;
    const worldCx = (prev.w / 2 - camera.current.x) / camera.current.scale;
    const worldCy = (prev.h / 2 - camera.current.y) / camera.current.scale;
    const cols = chooseCols(LOOKS.length, w / h);
    const rows = Math.ceil(LOOKS.length / cols);
    const cellW = CARD_W + CELL_MARGIN_X;
    const cellH = CARD_H + CELL_MARGIN_Y;
    const worldW = cols * cellW;
    const worldH = rows * cellH;
    const baseFit = Math.min(w / worldW, h / worldH) * 0.94;
    const d: Dims = { w, h, worldW, worldH, baseFit };
    const p = layoutPositions(worldW, worldH, cols, LOOKS.length);
    dimsRef.current = d;
    positionsRef.current = p;
    refreshRect();
    setDims(d);
    setPositions(p);
    if (!cameraInitedRef.current) {
      cameraInitedRef.current = true;
      const introScale = CAMERA_INTRO_FACTOR * baseFit;
      camera.current.scale = introScale;
      camera.current.x = (w - worldW * introScale) / 2;
      camera.current.y = (h - worldH * introScale) / 2;
      itemRefs.current.forEach((el) => {
        if (el) {
          el.style.opacity = "0";
          el.style.filter = "blur(8px)";
        }
      });
      applyCameraTransform();
      setReady(true);
      return;
    }

    // An open look keeps the geometry chosen at click time, so a resize that
    // flips `usesSideLayout` would leave the card parked where the old layout
    // put it while the panel re-renders into the new one — landing on top of
    // it. Re-solve and snap; a resize should not animate. Mid-transition the
    // in-flight tween owns these values, so leave it alone.
    const sel = selectedIdxRef.current;
    const selPos = sel === null ? null : p[sel];
    if (sel !== null && selPos && !transitioningRef.current) {
      const g = solveSelection(d, selPos, worldCx, worldCy);
      camera.current.scale = g.cameraScale;
      camera.current.x = g.cameraX;
      camera.current.y = g.cameraY;
      applyCameraTransform();
      const el = itemRefs.current[sel];
      if (el) {
        gsap.set(el, { x: g.tileOffX, y: g.tileOffY, scale: g.cardScale, rotation: 0 });
      }
      // The saved viewport was framed for the old container; restoring it at
      // the new size would land somewhere arbitrary. Fall back to the fit.
      preSelectionCamera.current = null;
    }
  }, [applyCameraTransform, refreshRect]);

  const triggerDragDeselect = useCallback(() => {
    const idx = selectedIdxRef.current;
    if (idx === null) return;
    const realEl = itemRefs.current[idx];
    if (!realEl) return;

    selectedIdxRef.current = null;
    transitioningRef.current = true;

    gsap.killTweensOf(camera.current);
    gsap.killTweensOf(realEl);

    const d = dimsRef.current;
    const pos = positionsRef.current;
    const minScaleDeselect = effectiveMinScale();
    const targetScale = Math.max((d.h * POST_DESELECT_HEIGHT_FRACTION) / CARD_H, minScaleDeselect);

    gsap.to(camera.current, {
      scale: targetScale,
      duration: 0.4,
      ease: "power2.out",
      onUpdate: applyCameraTransform,
    });

    realEl.style.pointerEvents = "";
    gsap.to(realEl, {
      scale: 1,
      rotation: pos[idx]?.rot ?? 0,
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        realEl.style.zIndex = "";
      },
    });

    for (let i = 0; i < LOOKS.length; i++) {
      if (i === idx) continue;
      const el = itemRefs.current[i];
      if (!el) continue;
      gsap.killTweensOf(el);
      gsap.to(el, { opacity: 1, duration: 0.35, ease: "power2.out" });
    }

    const dp = detailPanelRef.current;
    const cb = closeBtnRef.current;
    if (dp) {
      // A re-selection's fade-out may still be running with an onComplete that
      // re-opens the panel. GSAP does not overwrite by default, so kill it.
      gsap.killTweensOf(dp);
      gsap.to(dp, { opacity: 0, x: 24, duration: 0.3, ease: "power2.in" });
    }
    if (cb) gsap.to(cb, { opacity: 0, duration: 0.25, ease: "power2.in" });

    deselectCallRef.current = gsap.delayedCall(0.4, () => {
      deselectCallRef.current = null;
      // Clear, not delete(idx): a deselect mid-reselection has killed the
      // outgoing card's tween, so the onComplete that would have released it
      // never fires and it would be excluded from the re-wrap forever.
      gsapManagedItems.current.clear();
      setSelectedIdx(null);
      transitioningRef.current = false;
      preSelectionCamera.current = null;
      const cont = containerRef.current;
      if (cont) cont.style.cursor = drag.current.active ? "grabbing" : "grab";
    });
  }, [applyCameraTransform, effectiveMinScale]);

  const handleClose = useCallback(() => {
    const idx = selectedIdxRef.current;
    if (idx === null) return;
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    const d = dimsRef.current;
    const pos = positionsRef.current[idx];
    const realEl = itemRefs.current[idx];

    const dp = detailPanelRef.current;
    const cb = closeBtnRef.current;
    if (dp) {
      // Same reason as in triggerDragDeselect: closing during a re-selection
      // would otherwise let that fade-out's onComplete re-open the panel
      // partway through the close.
      gsap.killTweensOf(dp);
      gsap.to(dp, { opacity: 0, x: 36, duration: 0.35, ease: "power2.in" });
    }
    if (cb) gsap.to(cb, { opacity: 0, scale: 0.85, duration: 0.3, ease: "power2.in" });

    const minScale = effectiveMinScale();
    const saved = preSelectionCamera.current;
    const restScale = saved
      ? Math.max(saved.scale, minScale)
      : Math.max(CAMERA_REST_FACTOR * d.baseFit, minScale);
    const restX = saved ? saved.x : (d.w - d.worldW * restScale) / 2;
    const restY = saved ? saved.y : (d.h - d.worldH * restScale) / 2;

    gsap.killTweensOf(camera.current);
    gsap.to(camera.current, {
      scale: restScale,
      x: restX,
      y: restY,
      duration: 0.95,
      delay: 0.18,
      ease: "power3.inOut",
      onUpdate: applyCameraTransform,
      onComplete: () => {
        if (realEl) {
          realEl.style.zIndex = "";
          realEl.style.pointerEvents = "";
        }
        // Clear, not delete(idx), for the same reason as triggerDragDeselect.
        // A chain of re-selections dims — and so kills the tween of — the card
        // from two selections ago, and that tween carried the only release for
        // its index. Anything still in the set here is stranded: the close has
        // settled, so no item tween is in flight that still needs the guard.
        gsapManagedItems.current.clear();
        selectedIdxRef.current = null;
        setSelectedIdx(null);
        transitioningRef.current = false;
        preSelectionCamera.current = null;
      },
    });

    if (realEl && pos) {
      gsap.killTweensOf(realEl);
      const closeWorldCx = (d.w / 2 - restX) / restScale;
      const closeWorldCy = (d.h / 2 - restY) / restScale;
      gsap.to(realEl, {
        x: wrapOffset(pos.x, closeWorldCx, d.worldW),
        y: wrapOffset(pos.y, closeWorldCy, d.worldH),
        scale: 1,
        rotation: pos.rot,
        duration: 0.95,
        delay: 0.18,
        ease: "power3.inOut",
      });
    }

    for (let i = 0; i < LOOKS.length; i++) {
      if (i === idx) continue;
      const el = itemRefs.current[i];
      if (!el) continue;
      gsap.killTweensOf(el);
      gsap.to(el, { opacity: 1, duration: 0.6, delay: 0.18, ease: "power2.out" });
    }
  }, [applyCameraTransform, effectiveMinScale]);

  const handleClickItem = useCallback(
    (idx: number) => {
      if (!enteredRef.current) return;

      const prevIdx = selectedIdxRef.current;
      if (prevIdx === idx) return;
      if (prevIdx === null && transitioningRef.current) return;

      transitioningRef.current = true;

      const d = dimsRef.current;
      const pos = positionsRef.current;
      const newPos = pos[idx];
      const newEl = itemRefs.current[idx];
      const prevPos = prevIdx !== null ? pos[prevIdx] : null;
      const prevEl = prevIdx !== null ? itemRefs.current[prevIdx] : null;
      if (!newPos || !newEl) {
        transitioningRef.current = false;
        return;
      }

      const preCamX = camera.current.x;
      const preCamY = camera.current.y;
      const preCamS = camera.current.scale;
      const worldCx = (d.w / 2 - preCamX) / preCamS;
      const worldCy = (d.h / 2 - preCamY) / preCamS;
      const g = solveSelection(d, newPos, worldCx, worldCy);

      if (prevIdx === null) {
        preSelectionCamera.current = { x: preCamX, y: preCamY, scale: preCamS };
      }

      // Read BEFORE the add below: whether the RAF loop or GSAP owned this card
      // a moment ago decides which of them holds its true transform.
      const rafOwnedNew = !gsapManagedItems.current.has(idx);

      gsapManagedItems.current.add(idx);
      if (prevIdx !== null) gsapManagedItems.current.add(prevIdx);

      // Claim the selection SYNCHRONOUSLY. Deferring this into the panel
      // fade-out below leaves a ~280ms window in which a drag reads the stale
      // index, deselects it, and is then overwritten by the deferred write —
      // ref non-null, state null, every `sel === null` gate dead for good.
      selectedIdxRef.current = idx;

      gsap.killTweensOf(newEl);
      // The RAF loop has been writing this card's `style.transform` raw, which
      // GSAP's per-target transform cache never sees, so a tween would start
      // from whatever GSAP last rendered — a whole tile away once the world has
      // drifted past a wrap boundary — and the card would teleport off screen on
      // frame one before flying back in. `parseTransform: true` is not enough:
      // gsap reads `x`'s start value through `_get` with no uncache flag and
      // only refreshes the cache afterwards, so `x` alone still starts stale.
      // A zero-duration `set` renders immediately, which makes the cache
      // authoritative for all four props before the tween samples any of them.
      //
      // Only when the RAF loop was the one writing. Re-selecting a card during
      // the ~0.65s release tween of the look before it lands here with GSAP
      // still mid-render: its cache is already correct and the RAF mirror is
      // stale by however far the field has panned since, so replaying it would
      // reintroduce the very jump this prevents.
      const lastWritten = rafOwnedNew ? lastWrittenRef.current[idx] : undefined;
      if (lastWritten) gsap.set(newEl, lastWritten);
      gsap.to(newEl, {
        x: g.tileOffX,
        y: g.tileOffY,
        scale: g.cardScale,
        rotation: 0,
        opacity: 1,
        duration: prevIdx === null ? 1.0 : 0.9,
        ease: "power3.inOut",
      });
      newEl.style.zIndex = "60";
      newEl.style.pointerEvents = "none";

      if (prevEl && prevPos) {
        gsap.killTweensOf(prevEl);
        gsap.to(prevEl, {
          x: wrapOffset(prevPos.x, worldCx, d.worldW),
          y: wrapOffset(prevPos.y, worldCy, d.worldH),
          scale: 1,
          rotation: prevPos.rot,
          opacity: 0.22,
          duration: 0.65,
          ease: "power3.inOut",
          onStart: () => {
            prevEl.style.pointerEvents = "";
          },
          onComplete: () => {
            prevEl.style.zIndex = "";
            if (prevIdx !== null) gsapManagedItems.current.delete(prevIdx);
          },
        });
      }

      for (let i = 0; i < LOOKS.length; i++) {
        if (i === idx || i === prevIdx) continue;
        const el = itemRefs.current[i];
        if (!el) continue;
        gsap.killTweensOf(el);
        gsap.to(el, { opacity: 0.22, duration: 0.55, ease: "power2.out" });
      }

      gsap.killTweensOf(camera.current);
      gsap.to(camera.current, {
        scale: g.cameraScale,
        x: g.cameraX,
        y: g.cameraY,
        duration: prevIdx === null ? 1.05 : 0.95,
        ease: "power3.inOut",
        onUpdate: applyCameraTransform,
        onComplete: () => {
          transitioningRef.current = false;
        },
      });

      if (prevIdx === null) {
        setSelectedIdx(idx);
        panelRafRef.current = requestAnimationFrame(() => {
          panelRafRef.current = null;
          const dp = detailPanelRef.current;
          const cb = closeBtnRef.current;
          if (dp) {
            gsap.fromTo(
              dp,
              { opacity: 0, x: 48 },
              { opacity: 1, x: 0, duration: 0.75, ease: "power3.out", delay: 0.35 },
            );
            const stages = dp.querySelectorAll<HTMLElement>("[data-detail-anim]");
            gsap.fromTo(
              stages,
              { opacity: 0, y: 16, filter: "blur(6px)" },
              {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.65,
                ease: "power3.out",
                stagger: 0.08,
                delay: 0.55,
              },
            );
          }
          if (cb) {
            gsap.fromTo(
              cb,
              { opacity: 0, scale: 0.85 },
              { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out", delay: 0.4 },
            );
          }
        });
      } else {
        // Selecting another card DURING a close is a re-selection (the close
        // has not cleared the index yet), so it lands here — but the close has
        // already faded the button out and its restore lives on the fresh-open
        // path above. Without this the look re-opens with no visible close
        // affordance. On an ordinary re-selection the button is already at
        // rest, so this is a no-op.
        const cbNow = closeBtnRef.current;
        if (cbNow) {
          gsap.killTweensOf(cbNow);
          gsap.to(cbNow, { opacity: 1, scale: 1, duration: 0.3, ease: "power3.out" });
        }
        const dp = detailPanelRef.current;
        if (dp) {
          gsap.killTweensOf(dp);
          gsap.killTweensOf(dp.querySelectorAll("[data-detail-anim]"));
          gsap.to(dp, {
            opacity: 0,
            x: 20,
            duration: 0.28,
            ease: "power2.in",
            onComplete: () => {
              setSelectedIdx(idx);
              panelRafRef.current = requestAnimationFrame(() => {
                panelRafRef.current = null;
                const newDp = detailPanelRef.current;
                if (!newDp) return;
                gsap.fromTo(
                  newDp,
                  { opacity: 0, x: 28 },
                  { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" },
                );
                const newStages = newDp.querySelectorAll<HTMLElement>("[data-detail-anim]");
                gsap.fromTo(
                  newStages,
                  { opacity: 0, y: 12, filter: "blur(4px)" },
                  {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    duration: 0.5,
                    ease: "power3.out",
                    stagger: 0.06,
                    delay: 0.08,
                  },
                );
              });
            },
          });
        } else {
          setSelectedIdx(idx);
        }
      }
    },
    [applyCameraTransform],
  );

  /* Deferred work scheduled from event handlers rather than from an effect —
     it outlives the handler, so unmount has to reclaim it explicitly. */
  useEffect(() => {
    return () => {
      deselectCallRef.current?.kill();
      deselectCallRef.current = null;
      if (panelRafRef.current !== null) cancelAnimationFrame(panelRafRef.current);
      panelRafRef.current = null;
    };
  }, []);

  /* Measure on mount + whenever the container box changes. A window resize
     listener is not enough: the gallery resizes the frame directly. */
  useLayoutEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(c);
    return () => {
      ro.disconnect();
      // Re-arm so a StrictMode double-mount replays the entrance rather than
      // silently skipping it.
      cameraInitedRef.current = false;
    };
  }, [measure]);

  /* Pointer / wheel / key listeners + the per-frame RAF loop. */
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!enteredRef.current) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const target = e.target instanceof Node ? e.target : null;
      if (target && detailPanelRef.current?.contains(target)) return;
      if (target && closeBtnRef.current?.contains(target)) return;

      const r = rectRef.current;
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;
      drag.current.active = true;
      drag.current.pointerId = e.pointerId;
      drag.current.startClientX = e.clientX;
      drag.current.startClientY = e.clientY;
      drag.current.lastSx = sx;
      drag.current.lastSy = sy;
      drag.current.prevSx = sx;
      drag.current.prevSy = sy;
      drag.current.vt = performance.now();
      drag.current.vx = 0;
      drag.current.vy = 0;
      // World anchor: the pan stays exact at any zoom because the camera is
      // re-derived from this point rather than accumulating deltas.
      drag.current.worldAnchorX = (sx - camera.current.x) / camera.current.scale;
      drag.current.worldAnchorY = (sy - camera.current.y) / camera.current.scale;
      drag.current.didMove = false;
      drag.current.inertiaActive = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      const r = rectRef.current;
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;
      mouse.current.x = sx;
      mouse.current.y = sy;
      const d = dimsRef.current;
      mouse.current.inside = sx >= 0 && sy >= 0 && sx <= d.w && sy <= d.h;

      if (!drag.current.active || drag.current.pointerId !== e.pointerId) return;

      drag.current.lastSx = sx;
      drag.current.lastSy = sy;
      const dx = e.clientX - drag.current.startClientX;
      const dy = e.clientY - drag.current.startClientY;

      if (!drag.current.didMove && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        drag.current.didMove = true;
        c.style.cursor = "grabbing";
        gsap.killTweensOf(camera.current);
        if (selectedIdxRef.current !== null) {
          triggerDragDeselect();
        }
      }

      if (drag.current.didMove) {
        const now = performance.now();
        const dt = Math.max(1, now - drag.current.vt);
        drag.current.vx = ((sx - drag.current.prevSx) / dt) * 16;
        drag.current.vy = ((sy - drag.current.prevSy) / dt) * 16;
        drag.current.vt = now;
        drag.current.prevSx = sx;
        drag.current.prevSy = sy;
        applyCameraTransform();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (drag.current.pointerId !== e.pointerId) return;
      drag.current.active = false;
      drag.current.pointerId = -1;
      c.style.cursor = "grab";
      if (drag.current.didMove && Math.hypot(drag.current.vx, drag.current.vy) > 0.6) {
        drag.current.inertiaActive = true;
      }
    };

    /** The pointer can leave the frame without a final in-bounds `pointermove`
        (straight off the window edge), which would freeze the parallax on
        whichever card it was last over. */
    const onPointerLeave = () => {
      mouse.current.inside = false;
    };

    const onWheel = (e: WheelEvent) => {
      // An open look owns the wheel: the detail panel scrolls. Everything else
      // is the camera's, so it swallows the event even when it cannot act on
      // it — otherwise the entrance and every transition let the wheel through
      // to whatever page has embedded this.
      if (selectedIdxRef.current !== null) return;
      e.preventDefault();
      if (!enteredRef.current) return;
      if (transitioningRef.current) return;
      if (drag.current.active && drag.current.didMove) return;
      drag.current.inertiaActive = false;
      drag.current.vx = 0;
      drag.current.vy = 0;
      gsap.killTweensOf(camera.current);

      const r = rectRef.current;
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;
      const currentScale = camera.current.scale;
      const zoomFactor = Math.exp(-e.deltaY * WHEEL_SENSITIVITY);
      const minScale = effectiveMinScale();
      const newScale = clamp(currentScale * zoomFactor, minScale, MAX_CAMERA_SCALE);
      if (newScale === currentScale) return;

      // Re-solve the camera so the world point under the cursor stays pinned.
      const worldX = (sx - camera.current.x) / currentScale;
      const worldY = (sy - camera.current.y) / currentScale;
      camera.current.scale = newScale;
      camera.current.x = sx - worldX * newScale;
      camera.current.y = sy - worldY * newScale;
      applyCameraTransform();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedIdxRef.current !== null) {
        handleClose();
      }
    };

    c.addEventListener("pointerdown", onPointerDown);
    c.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    // Without this a cancelled pointer (OS gesture takeover, input redirection)
    // never ends the drag: `active`/`didMove` stay true, so the camera keeps
    // being rewritten from a stale anchor and clicks, drift and parallax all
    // die permanently. `onPointerUp` already filters on the pointer id.
    window.addEventListener("pointercancel", onPointerUp);
    c.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    // Capture phase so a scrolling ancestor counts, not just the window.
    window.addEventListener("scroll", refreshRect, { passive: true, capture: true });

    const tick = () => {
      const sel = selectedIdxRef.current;
      const pos = positionsRef.current;
      const d = dimsRef.current;

      if (
        drag.current.inertiaActive &&
        !drag.current.active &&
        sel === null &&
        !transitioningRef.current
      ) {
        camera.current.x += drag.current.vx;
        camera.current.y += drag.current.vy;
        drag.current.vx *= DEFAULT_INERTIA_FRICTION;
        drag.current.vy *= DEFAULT_INERTIA_FRICTION;
        if (Math.hypot(drag.current.vx, drag.current.vy) < 0.12) {
          drag.current.inertiaActive = false;
          drag.current.vx = 0;
          drag.current.vy = 0;
        }
        applyCameraTransform();
      }

      if (
        AUTO_DRIFT_PX_PER_FRAME > 0 &&
        !reduceMotionRef.current &&
        enteredRef.current &&
        sel === null &&
        !transitioningRef.current &&
        !drag.current.active &&
        !drag.current.inertiaActive &&
        driftRamp.current.amount > 0.001
      ) {
        const speed = AUTO_DRIFT_PX_PER_FRAME * driftRamp.current.amount;
        camera.current.x -= speed;
        camera.current.y -= speed;
        applyCameraTransform();
      }

      if (enteredRef.current) {
        const atRest = sel === null && !transitioningRef.current;
        const camS = camera.current.scale;
        const camX = camera.current.x;
        const camY = camera.current.y;
        const doParallax =
          atRest && mouse.current.inside && !drag.current.active && !reduceMotionRef.current;
        const mx = mouse.current.x;
        const my = mouse.current.y;
        const worldCx = (d.w / 2 - camX) / camS;
        const worldCy = (d.h / 2 - camY) / camS;
        const tileW = d.worldW;
        const tileH = d.worldH;
        const managed = gsapManagedItems.current;
        const refs = itemRefs.current;
        const written = lastWrittenRef.current;

        for (let i = 0; i < refs.length; i++) {
          if (managed.has(i)) continue;
          const el = refs[i];
          const p = pos[i];
          if (!el || !p) continue;

          // Re-wrap every card against the camera's world centre, every frame.
          // This is the mechanic: the field has no edges, ever.
          const tileOffX = wrapOffset(p.x, worldCx, tileW);
          const tileOffY = wrapOffset(p.y, worldCy, tileH);

          let parLift = 1;
          let extraX = 0;
          let extraY = 0;
          if (doParallax) {
            const wrappedX = p.x + tileOffX;
            const wrappedY = p.y + tileOffY;
            const icx = camX + wrappedX * camS;
            const icy = camY + wrappedY * camS;
            const ddx = mx - icx;
            const ddy = my - icy;
            const dist = Math.hypot(ddx, ddy);
            const falloff = Math.max(0, 1 - dist / PARALLAX_RANGE);
            const cEased = falloff * falloff * (3 - 2 * falloff);
            extraX = dist > 0.5 ? (ddx / dist) * PARALLAX_STRENGTH * cEased : 0;
            extraY = dist > 0.5 ? (ddy / dist) * PARALLAX_STRENGTH * cEased : 0;
            parLift = 1 + cEased * 0.04;
          }

          const ox = extraX + tileOffX;
          const oy = extraY + tileOffY;
          el.style.transform = `translate3d(${ox}px, ${oy}px, 0) rotate(${p.rot}deg) scale(${parLift})`;

          const w = written[i];
          if (w) {
            w.x = ox;
            w.y = oy;
            w.rotation = p.rot;
            w.scale = parLift;
          } else {
            written[i] = { x: ox, y: oy, rotation: p.rot, scale: parLift };
          }
        }
      }

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      c.removeEventListener("pointerdown", onPointerDown);
      c.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      c.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", refreshRect, { capture: true });
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [applyCameraTransform, effectiveMinScale, handleClose, refreshRect, triggerDragDeselect]);

  /* Grid entrance (camera dolly + item de-blur). Fires once the first
     measurement lands. Tween cleanup makes it Strict-Mode safe: a teardown
     kills the in-flight dolly and the re-run restarts it from the current
     camera state, so it always settles at rest. */
  useEffect(() => {
    if (!ready) return;

    enteredRef.current = true;
    const realItems = itemRefs.current.filter((el): el is HTMLDivElement => el !== null);
    const restScale = Math.max(CAMERA_REST_FACTOR * dimsRef.current.baseFit, effectiveMinScale());
    // These two refs hold stable objects that GSAP tweens in place; bind them
    // now so the cleanup kills the same objects it started tweening.
    const cameraObj = camera.current;
    const driftObj = driftRamp.current;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceMotionRef.current = reduce;
    if (reduce) {
      const dd = dimsRef.current;
      camera.current.scale = restScale;
      camera.current.x = (dd.w - dd.worldW * restScale) / 2;
      camera.current.y = (dd.h - dd.worldH * restScale) / 2;
      applyCameraTransform();
      realItems.forEach((el) => {
        el.style.opacity = "1";
        el.style.filter = "none";
      });
      // Unlike the source, reduced motion also parks the perpetual drift and
      // the cursor repulsion — both read this ref inside the RAF loop.
      driftRamp.current.amount = 0;
      return;
    }

    driftObj.amount = 0;
    gsap.to(driftObj, { amount: 1, duration: 2.5, ease: "power2.in", delay: 1.5 });

    const tl = gsap.timeline({ delay: 0.12 });
    tl.to(
      realItems,
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.95,
        ease: "power3.out",
        stagger: { each: ENTRANCE_STAGGER, from: "random" },
      },
      0,
    );
    tl.to(
      cameraObj,
      {
        scale: restScale,
        duration: 1.6,
        ease: "power4.out",
        onUpdate: () => {
          if (!drag.current.active) {
            const dd = dimsRef.current;
            const s = camera.current.scale;
            camera.current.x = (dd.w - dd.worldW * s) / 2;
            camera.current.y = (dd.h - dd.worldH * s) / 2;
          }
          applyCameraTransform();
        },
      },
      0,
    );

    return () => {
      tl.kill();
      gsap.killTweensOf(cameraObj);
      gsap.killTweensOf(driftObj);
      gsap.killTweensOf(realItems);
    };
  }, [ready, applyCameraTransform, effectiveMinScale]);

  const selectedLook = selectedIdx === null ? null : (LOOKS[selectedIdx] ?? null);

  return (
    <section
      ref={containerRef}
      data-lookbook-root
      aria-label="Interactive lookbook canvas"
      // `text-foreground` is load-bearing, not decoration: the scoped palette
      // below only reaches utilities that name a token, and the detail panel's
      // headings, prices and the close icon all inherit `color`. Without an
      // anchor here they inherit the HOST page's — white, under a dark theme,
      // on this component's permanently cream glass.
      className="bg-background text-foreground relative size-full overflow-hidden select-none"
      style={{ touchAction: "none", cursor: "grab" }}
    >
      {/* Scoped palette. uicapsule declares its tokens with `@theme inline`, so
          `--color-background` expands to `var(--background)` at the use site —
          redefining the raw token here is what makes every `bg-background` /
          `text-foreground` utility below resolve warm, and immune to whatever
          light/dark theme surrounds the frame. */}
      <style>{`
        [data-lookbook-root]{
          --background:#fffdf8;
          --foreground:#221e18;
          --muted:#ece4d4;
          --muted-foreground:#6f6757;
          --border:#ddd3c0;
        }
        [data-lookbook-root] .lbk-display{
          font-family:'Playfair Display',Georgia,'Times New Roman',serif;
          font-style:italic;
          font-weight:500;
        }
      `}</style>

      <BackgroundLines />

      {/* Camera + world */}
      <div
        ref={cameraRef}
        className="absolute top-0 left-0"
        style={{
          transformOrigin: "0 0",
          willChange: "transform",
          // The gallery server-renders this component, so the first HTML has no
          // measurements and every card is stacked at 0,0. Hide the camera node
          // rather than unmounting the cards: `measure()` needs them mounted to
          // zero them, and that zeroed state is what the entrance animates from.
          visibility: ready ? undefined : "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            width: dims?.worldW ?? 0,
            height: dims?.worldH ?? 0,
          }}
        >
          {LOOKS.map((look, i) => {
            const p = positions[i];
            // 72 cards, 18 distinct looks: the other three cycles are visual
            // repeats. Exposing them as buttons put 54 unreachable duplicates
            // in the accessibility tree with labels identical to their twins,
            // so they are hidden from it entirely — which also means they must
            // not be focusable at all, not merely untabbable.
            const isDuplicate = i >= KEYBOARD_REACHABLE;
            return (
              <div
                key={look.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onClick={() => {
                  // Swallow the synthetic click that closes out a pan. The
                  // keyboard path below deliberately skips this: `didMove`
                  // survives until the next pointerdown, and gating Enter on it
                  // left activation dead for as long as that took.
                  if (drag.current.didMove) return;
                  handleClickItem(i);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClickItem(i);
                  }
                }}
                role={isDuplicate ? undefined : "button"}
                tabIndex={isDuplicate ? undefined : 0}
                aria-hidden={isDuplicate || undefined}
                // Keyed off look identity, not index: the 54 aria-hidden
                // duplicates stay mouse-clickable, and opening one has to be
                // reported by the one real button that names the same look.
                // `cloneLook` preserves `lookNumber`, so it survives the cycles.
                aria-expanded={
                  isDuplicate ? undefined : selectedLook?.lookNumber === look.lookNumber
                }
                aria-label={
                  isDuplicate ? undefined : `${look.name}, look number ${look.lookNumber}`
                }
                data-look-card={look.id}
                className="focus-visible:ring-foreground/40 focus-visible:ring-offset-background absolute cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  left: p ? p.x - CARD_W / 2 : 0,
                  top: p ? p.y - CARD_H / 2 : 0,
                  willChange: "transform",
                }}
              >
                <LookFigure look={look} className="pointer-events-none size-full" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      <div
        className="pointer-events-none absolute bottom-6 left-8 z-20"
        style={{
          opacity: selectedIdx !== null ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      >
        <p className="text-muted-foreground text-[10px] tracking-[0.3em] uppercase">
          Drag to pan · scroll to zoom · click a look
        </p>
      </div>

      {/* Selection chrome */}
      {selectedLook && dims && (
        <>
          <button
            type="button"
            ref={closeBtnRef}
            onClick={handleClose}
            aria-label="Close look"
            className="bg-background/85 border-foreground/15 hover:border-foreground/40 hover:bg-background absolute top-5 right-5 z-50 grid size-10 place-items-center rounded-full border shadow-md backdrop-blur-md transition-all"
          >
            <X className="size-4" />
          </button>
          <DetailPanel
            key={selectedLook.id}
            ref={detailPanelRef}
            look={selectedLook}
            containerW={dims.w}
            containerH={dims.h}
          />
        </>
      )}
    </section>
  );
}
