"use client";

import gsap from "gsap";
import { X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { Pos } from "./lookbook-data";
import { DetailPanel, NARROW_BREAKPOINT, usesSideLayout } from "./detail-panel";
import { LookFigure } from "./look-figure";
import {
  CARD_H,
  CARD_W,
  CELL_MARGIN_X,
  CELL_MARGIN_Y,
  chooseCols,
  layoutPositions,
  LOOKS,
  lookTotal,
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

/** One cycle of the four — the only cards that take a tab stop. */
const KEYBOARD_REACHABLE = LOOKS.length / 4;

/* ── Types ───────────────────────────────────────────────────────── */

interface Dims {
  w: number;
  h: number;
  worldW: number;
  worldH: number;
  baseFit: number;
  cols: number;
  rows: number;
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
  const preSelectionCamera = useRef({ x: 0, y: 0, scale: 0 });
  const gsapManagedItems = useRef<Set<number>>(new Set());

  const dimsRef = useRef<Dims>({
    w: 1,
    h: 1,
    worldW: 1,
    worldH: 1,
    baseFit: 1,
    cols: 1,
    rows: 1,
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

  const measure = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    // A ResizeObserver fires once at 0x0 inside a freshly-mounted iframe.
    if (w === 0 || h === 0) return;
    const cols = chooseCols(LOOKS.length, w / h);
    const rows = Math.ceil(LOOKS.length / cols);
    const cellW = CARD_W + CELL_MARGIN_X;
    const cellH = CARD_H + CELL_MARGIN_Y;
    const worldW = cols * cellW;
    const worldH = rows * cellH;
    const baseFit = Math.min(w / worldW, h / worldH) * 0.94;
    const d: Dims = { w, h, worldW, worldH, baseFit, cols, rows };
    const p = layoutPositions(worldW, worldH, cols, LOOKS.length);
    dimsRef.current = d;
    positionsRef.current = p;
    rectRef.current = { left: r.left, top: r.top };
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
    }
  }, [applyCameraTransform]);

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
      preSelectionCamera.current = { x: 0, y: 0, scale: 0 };
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
    const hasSaved = saved.scale > 0;
    const restScale = hasSaved
      ? Math.max(saved.scale, minScale)
      : Math.max(CAMERA_REST_FACTOR * d.baseFit, minScale);
    const restX = hasSaved ? saved.x : (d.w - d.worldW * restScale) / 2;
    const restY = hasSaved ? saved.y : (d.h - d.worldH * restScale) / 2;

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
        gsapManagedItems.current.delete(idx);
        selectedIdxRef.current = null;
        setSelectedIdx(null);
        transitioningRef.current = false;
        preSelectionCamera.current = { x: 0, y: 0, scale: 0 };
      },
    });

    if (realEl && pos) {
      gsap.killTweensOf(realEl);
      const closeWorldCx = (d.w / 2 - restX) / restScale;
      const closeWorldCy = (d.h / 2 - restY) / restScale;
      const closeTileOffX = -Math.round((pos.x - closeWorldCx) / d.worldW) * d.worldW;
      const closeTileOffY = -Math.round((pos.y - closeWorldCy) / d.worldH) * d.worldH;
      gsap.to(realEl, {
        x: closeTileOffX,
        y: closeTileOffY,
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
      if (drag.current.didMove) return;
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

      // Same predicate as the landing point above: the card's SIZE and the
      // card's POSITION have to come from one decision, or a frame that gets
      // the sheet layout would still fly in a card sized for the wide one.
      const narrow = !usesSideLayout(d.w, d.h);
      const neighbourFraction = narrow
        ? NEIGHBOUR_HEIGHT_FRACTION_NARROW
        : NEIGHBOUR_HEIGHT_FRACTION;
      const selectionFraction = narrow
        ? SELECTION_HEIGHT_FRACTION_NARROW
        : SELECTION_HEIGHT_FRACTION;
      const cameraScale = (d.h * neighbourFraction) / CARD_H;
      const selectedExtraScale = selectionFraction / neighbourFraction;
      const target = selectionTarget(d.w, d.h);

      const preCamX = camera.current.x;
      const preCamY = camera.current.y;
      const preCamS = camera.current.scale;
      const viewCx = d.w / 2;
      const viewCy = d.h / 2;
      const worldCx = (viewCx - preCamX) / preCamS;
      const worldCy = (viewCy - preCamY) / preCamS;
      // Fly to the nearest wrapped copy of the card, not the canonical one.
      const newTileOffX = -Math.round((newPos.x - worldCx) / d.worldW) * d.worldW;
      const newTileOffY = -Math.round((newPos.y - worldCy) / d.worldH) * d.worldH;
      const wrappedNewX = newPos.x + newTileOffX;
      const wrappedNewY = newPos.y + newTileOffY;
      const targetX = target.x - wrappedNewX * cameraScale;
      const targetY = target.y - wrappedNewY * cameraScale;

      if (prevIdx === null) {
        preSelectionCamera.current = { x: preCamX, y: preCamY, scale: preCamS };
      }

      gsapManagedItems.current.add(idx);
      if (prevIdx !== null) gsapManagedItems.current.add(prevIdx);

      // Claim the selection SYNCHRONOUSLY. Deferring this into the panel
      // fade-out below leaves a ~280ms window in which a drag reads the stale
      // index, deselects it, and is then overwritten by the deferred write —
      // ref non-null, state null, every `sel === null` gate dead for good.
      selectedIdxRef.current = idx;

      gsap.killTweensOf(newEl);
      gsap.to(newEl, {
        x: newTileOffX,
        y: newTileOffY,
        scale: selectedExtraScale,
        rotation: 0,
        opacity: 1,
        duration: prevIdx === null ? 1.0 : 0.9,
        ease: "power3.inOut",
      });
      newEl.style.zIndex = "60";
      newEl.style.pointerEvents = "none";

      if (prevEl && prevPos) {
        gsap.killTweensOf(prevEl);
        const prevTileOffX = -Math.round((prevPos.x - worldCx) / d.worldW) * d.worldW;
        const prevTileOffY = -Math.round((prevPos.y - worldCy) / d.worldH) * d.worldH;
        gsap.to(prevEl, {
          x: prevTileOffX,
          y: prevTileOffY,
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
        scale: cameraScale,
        x: targetX,
        y: targetY,
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

    const onWheel = (e: WheelEvent) => {
      if (!enteredRef.current) return;
      if (selectedIdxRef.current !== null) return;
      if (transitioningRef.current) return;
      if (drag.current.active && drag.current.didMove) return;
      e.preventDefault();
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
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    c.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);

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
        const viewCx = d.w / 2;
        const viewCy = d.h / 2;
        const doParallax =
          atRest && mouse.current.inside && !drag.current.active && !reduceMotionRef.current;
        const mx = mouse.current.x;
        const my = mouse.current.y;
        const worldCx = (viewCx - camX) / camS;
        const worldCy = (viewCy - camY) / camS;
        const tileW = d.worldW;
        const tileH = d.worldH;
        const managed = gsapManagedItems.current;
        const refs = itemRefs.current;

        for (let i = 0; i < refs.length; i++) {
          if (managed.has(i)) continue;
          const el = refs[i];
          const p = pos[i];
          if (!el || !p) continue;

          // Re-wrap every card against the camera's world centre, every frame.
          // This is the mechanic: the field has no edges, ever.
          const tileOffX = -Math.round((p.x - worldCx) / tileW) * tileW;
          const tileOffY = -Math.round((p.y - worldCy) / tileH) * tileH;

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
        }
      }

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      c.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      c.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [applyCameraTransform, effectiveMinScale, handleClose, triggerDragDeselect]);

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
      className="bg-background relative size-full overflow-hidden select-none"
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
            return (
              <div
                key={look.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onClick={() => handleClickItem(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClickItem(i);
                  }
                }}
                role="button"
                // 72 cards but only 18 distinct looks — the other three cycles
                // are duplicates, so they stay out of the tab order.
                tabIndex={i < KEYBOARD_REACHABLE ? 0 : -1}
                aria-label={`${look.name}, look number ${look.lookNumber}`}
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
            panelRef={detailPanelRef}
            look={selectedLook}
            total={lookTotal(selectedLook)}
            containerW={dims.w}
            containerH={dims.h}
          />
        </>
      )}
    </section>
  );
}
