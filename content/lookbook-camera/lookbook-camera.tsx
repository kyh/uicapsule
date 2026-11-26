"use client";

import { gsap } from "gsap";
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

const noop = () => null;

const CAMERA_INTRO_FACTOR = 0.52;
const CAMERA_REST_FACTOR = 1;

const NEIGHBOUR_HEIGHT_FRACTION = 0.3;
const NEIGHBOUR_HEIGHT_FRACTION_NARROW = 0.15;
const SELECTION_HEIGHT_FRACTION = 0.75;
const SELECTION_HEIGHT_FRACTION_NARROW = 0.36;
const POST_DESELECT_HEIGHT_FRACTION = 0.375;

const DRAG_THRESHOLD_PX = 6;
const DEFAULT_MIN_ZOOM_CARD_HEIGHT = 240;
const DEFAULT_MIN_ZOOM_CARD_HEIGHT_NARROW = 200;

const KEYBOARD_REACHABLE = BASE_LOOKS.length;

interface Dims {
  w: number;
  h: number;
  worldW: number;
  worldH: number;
  baseFit: number;
}

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

export interface LookbookCameraProps {
  /** Canvas paper colour. */
  background?: string;
  /** Ink colour for type, rules and controls. */
  foreground?: string;
  /** Secondary text colour (hint, captions). */
  mutedForeground?: string;
  /** Idle camera drift in px per frame; 0 holds the camera still. */
  driftSpeed?: number;
  /** How far, in px, cards near the cursor lean towards it. */
  parallaxStrength?: number;
  /** Radius, in px, of the cursor's parallax falloff. */
  parallaxRange?: number;
  /** Per-frame velocity kept after a fling, 0–1. Higher glides further. */
  inertiaFriction?: number;
  /** Wheel delta to zoom factor exponent. */
  wheelSensitivity?: number;
  /** Largest camera scale the wheel can reach. */
  maxZoom?: number;
  /** Opacity the other looks fade to while one is open. */
  dimOpacity?: number;
  /** Maximum card rotation either side of upright, in degrees. */
  maxTilt?: number;
  /** Seconds between each card's entrance. Read at mount. */
  entranceStagger?: number;
  /** Footer hint; an empty string hides it. */
  hint?: string;
}

interface Tuning {
  dimOpacity: number;
  driftSpeed: number;
  entranceStagger: number;
  inertiaFriction: number;
  maxTilt: number;
  maxZoom: number;
  parallaxRange: number;
  parallaxStrength: number;
  wheelSensitivity: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const selectionTarget = (w: number, h: number) => {
  if (usesSideLayout(w, h)) {
    return { x: 0.34 * w, y: 0.5 * h };
  }

  return { x: 0.5 * w, y: 0.2 * h + 28 };
};

interface SelectionGeometry {
  cameraScale: number;
  cameraX: number;
  cameraY: number;
  cardScale: number;
  tileOffX: number;
  tileOffY: number;
}

const solveSelection = (d: Dims, pos: Pos, worldCx: number, worldCy: number) => {
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
  } satisfies SelectionGeometry;
};

const dimOtherCards = (
  refs: (HTMLDivElement | null)[],
  idx: number,
  prevIdx: number | null,
  opacity: number,
) => {
  for (let i = 0; i < LOOKS.length; i += 1) {
    if (i === idx || i === prevIdx) {
      continue;
    }

    const el = refs[i];

    if (!el) {
      continue;
    }

    gsap.killTweensOf(el);
    gsap.to(el, { duration: 0.55, ease: "power2.out", opacity });
  }
};

const restoreCloseButton = (btn: HTMLButtonElement | null) => {
  if (btn) {
    gsap.killTweensOf(btn);
    gsap.to(btn, { duration: 0.3, ease: "power3.out", opacity: 1, scale: 1 });
  }
};

const PARALLAX_REST = { extraX: 0, extraY: 0, lift: 1 };

const cursorParallax = (ddx: number, ddy: number, range: number, strength: number) => {
  const dist = Math.hypot(ddx, ddy);
  const falloff = Math.max(0, 1 - dist / range);
  const cEased = falloff * falloff * (3 - 2 * falloff);

  if (dist <= 0.5) {
    return { extraX: 0, extraY: 0, lift: 1 + cEased * 0.04 };
  }

  return {
    extraX: (ddx / dist) * strength * cEased,
    extraY: (ddy / dist) * strength * cEased,
    lift: 1 + cEased * 0.04,
  };
};

const CONTOUR_PATHS: string[] = Array.from({ length: 14 }, (_, i) => {
  const y = (i / 14) * 100 + Math.sin(i * 1.7) * 4;

  return `M0 ${y} Q25 ${y - 6} 50 ${y} T100 ${y}`;
});

const BackgroundLines = () => (
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

const resolveProps = ({
  background = "#fffdf8",
  foreground = "#221e18",
  mutedForeground = "#6f6757",
  driftSpeed = 0.45,
  parallaxStrength = 9,
  parallaxRange = 320,
  inertiaFriction = 0.93,
  wheelSensitivity = 0.0018,
  maxZoom = 6,
  dimOpacity = 0.22,
  maxTilt = 2,
  entranceStagger = 0.04,
  hint = "Drag to pan · scroll to zoom · click a look",
}: LookbookCameraProps) => ({
  background,
  foreground,
  hint,
  mutedForeground,
  tuning: {
    dimOpacity,
    driftSpeed,
    entranceStagger,
    inertiaFriction,
    maxTilt,
    maxZoom,
    parallaxRange,
    parallaxStrength,
    wheelSensitivity,
  } satisfies Tuning,
});

export const LookbookCamera = (props: LookbookCameraProps) => {
  const { background, foreground, hint, mutedForeground, tuning } = resolveProps(props);

  const { dimOpacity, maxTilt } = tuning;
  const tuningRef = useRef<Tuning>(tuning);

  useLayoutEffect(() => {
    tuningRef.current = tuning;
  });

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [dims, setDims] = useState<Dims | null>(null);
  const [positions, setPositions] = useState<Pos[]>([]);
  const [ready, setReady] = useState(false);

  const containerRef = useRef<HTMLElement | null>(null);
  const cameraRef = useRef<HTMLDivElement | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastWrittenRef = useRef<WrittenTransform[]>([]);

  const camera = useRef({ scale: 0.5, x: 0, y: 0 });

  const drag = useRef<DragState>({
    active: false,
    didMove: false,
    inertiaActive: false,
    lastSx: 0,
    lastSy: 0,
    pointerId: -1,
    prevSx: 0,
    prevSy: 0,
    startClientX: 0,
    startClientY: 0,
    vt: 0,
    vx: 0,
    vy: 0,
    worldAnchorX: 0,
    worldAnchorY: 0,
  });

  const mouse = useRef({ inside: false, x: 0, y: 0 });
  const driftRamp = useRef({ amount: 0 });
  const preSelectionCamera = useRef<{ x: number; y: number; scale: number } | null>(null);
  const gsapManagedItems = useRef<Set<number>>(new Set());

  const dimsRef = useRef<Dims>({
    baseFit: 1,
    h: 1,
    w: 1,
    worldH: 1,
    worldW: 1,
  });

  const positionsRef = useRef<Pos[]>([]);
  const rectRef = useRef({ left: 0, top: 0 });
  const selectedIdxRef = useRef<number | null>(null);
  const transitioningRef = useRef(false);
  const enteredRef = useRef(false);
  const cameraInitedRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const animRef = useRef<number | null>(null);
  const deselectCallRef = useRef<ReturnType<typeof gsap.delayedCall> | null>(null);
  const panelRafRef = useRef<number | null>(null);

  const applyCameraTransform = useCallback(() => {
    if (drag.current.active && drag.current.didMove) {
      camera.current.x = drag.current.lastSx - drag.current.worldAnchorX * camera.current.scale;
      camera.current.y = drag.current.lastSy - drag.current.worldAnchorY * camera.current.scale;
    }

    const c = cameraRef.current;

    if (!c) {
      return;
    }

    const { scale, x, y } = camera.current;
    c.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, []);

  const effectiveMinScale = useCallback(() => {
    const { w } = dimsRef.current;

    const floor =
      w < NARROW_BREAKPOINT ? DEFAULT_MIN_ZOOM_CARD_HEIGHT_NARROW : DEFAULT_MIN_ZOOM_CARD_HEIGHT;

    return floor / CARD_H;
  }, []);

  const refreshRect = useCallback(() => {
    const c = containerRef.current;

    if (!c) {
      return;
    }

    const r = c.getBoundingClientRect();
    rectRef.current = { left: r.left, top: r.top };
  }, []);

  const measure = useCallback(() => {
    const c = containerRef.current;

    if (!c) {
      return;
    }

    const r = c.getBoundingClientRect();
    const w = r.width;
    const h = r.height;

    if (w === 0 || h === 0) {
      return;
    }

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
    const d: Dims = { baseFit, h, w, worldH, worldW };
    const p = layoutPositions(worldW, worldH, cols, LOOKS.length, tuningRef.current.maxTilt);
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

      for (const el of itemRefs.current) {
        if (el) {
          el.style.opacity = "0";
          el.style.filter = "blur(8px)";
        }
      }

      applyCameraTransform();
      setReady(true);

      return;
    }

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
        gsap.set(el, { rotation: 0, scale: g.cardScale, x: g.tileOffX, y: g.tileOffY });
      }

      preSelectionCamera.current = null;
    }
  }, [applyCameraTransform, refreshRect]);

  const triggerDragDeselect = useCallback(() => {
    const idx = selectedIdxRef.current;

    if (idx === null) {
      return;
    }

    const realEl = itemRefs.current[idx];

    if (!realEl) {
      return;
    }

    selectedIdxRef.current = null;
    transitioningRef.current = true;

    gsap.killTweensOf(camera.current);
    gsap.killTweensOf(realEl);

    const d = dimsRef.current;
    const pos = positionsRef.current;
    const minScaleDeselect = effectiveMinScale();
    const targetScale = Math.max((d.h * POST_DESELECT_HEIGHT_FRACTION) / CARD_H, minScaleDeselect);

    gsap.to(camera.current, {
      duration: 0.4,
      ease: "power2.out",
      onUpdate: applyCameraTransform,
      scale: targetScale,
    });

    realEl.style.pointerEvents = "";
    gsap.to(realEl, {
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        realEl.style.zIndex = "";
      },
      rotation: pos[idx]?.rot ?? 0,
      scale: 1,
    });

    for (let i = 0; i < LOOKS.length; i += 1) {
      if (i === idx) {
        continue;
      }

      const el = itemRefs.current[i];

      if (!el) {
        continue;
      }

      gsap.killTweensOf(el);
      gsap.to(el, { duration: 0.35, ease: "power2.out", opacity: 1 });
    }

    const dp = detailPanelRef.current;
    const cb = closeBtnRef.current;

    if (dp) {
      gsap.killTweensOf(dp);
      gsap.to(dp, { duration: 0.3, ease: "power2.in", opacity: 0, x: 24 });
    }

    if (cb) {
      gsap.to(cb, { duration: 0.25, ease: "power2.in", opacity: 0 });
    }

    deselectCallRef.current = gsap.delayedCall(0.4, () => {
      deselectCallRef.current = null;
      gsapManagedItems.current.clear();
      setSelectedIdx(null);
      transitioningRef.current = false;
      preSelectionCamera.current = null;
      const cont = containerRef.current;

      if (cont) {
        cont.style.cursor = drag.current.active ? "grabbing" : "grab";
      }
    });
  }, [applyCameraTransform, effectiveMinScale]);

  const handleClose = useCallback(() => {
    const idx = selectedIdxRef.current;

    if (idx === null) {
      return;
    }

    if (transitioningRef.current) {
      return;
    }

    transitioningRef.current = true;

    const d = dimsRef.current;
    const pos = positionsRef.current[idx];
    const realEl = itemRefs.current[idx];

    const dp = detailPanelRef.current;
    const cb = closeBtnRef.current;

    if (dp) {
      gsap.killTweensOf(dp);
      gsap.to(dp, { duration: 0.35, ease: "power2.in", opacity: 0, x: 36 });
    }

    if (cb) {
      gsap.to(cb, { duration: 0.3, ease: "power2.in", opacity: 0, scale: 0.85 });
    }

    const minScale = effectiveMinScale();
    const saved = preSelectionCamera.current;

    const restScale = saved
      ? Math.max(saved.scale, minScale)
      : Math.max(CAMERA_REST_FACTOR * d.baseFit, minScale);

    const restX = saved ? saved.x : (d.w - d.worldW * restScale) / 2;
    const restY = saved ? saved.y : (d.h - d.worldH * restScale) / 2;

    gsap.killTweensOf(camera.current);
    gsap.to(camera.current, {
      delay: 0.18,
      duration: 0.95,
      ease: "power3.inOut",
      onComplete: () => {
        if (realEl) {
          realEl.style.zIndex = "";
          realEl.style.pointerEvents = "";
        }

        gsapManagedItems.current.clear();
        selectedIdxRef.current = null;
        setSelectedIdx(null);
        transitioningRef.current = false;
        preSelectionCamera.current = null;
      },
      onUpdate: applyCameraTransform,
      scale: restScale,
      x: restX,
      y: restY,
    });

    if (realEl && pos) {
      gsap.killTweensOf(realEl);
      const closeWorldCx = (d.w / 2 - restX) / restScale;
      const closeWorldCy = (d.h / 2 - restY) / restScale;
      gsap.to(realEl, {
        delay: 0.18,
        duration: 0.95,
        ease: "power3.inOut",
        rotation: pos.rot,
        scale: 1,
        x: wrapOffset(pos.x, closeWorldCx, d.worldW),
        y: wrapOffset(pos.y, closeWorldCy, d.worldH),
      });
    }

    for (let i = 0; i < LOOKS.length; i += 1) {
      if (i === idx) {
        continue;
      }

      const el = itemRefs.current[i];

      if (!el) {
        continue;
      }

      gsap.killTweensOf(el);
      gsap.to(el, { delay: 0.18, duration: 0.6, ease: "power2.out", opacity: 1 });
    }
  }, [applyCameraTransform, effectiveMinScale]);

  const handleClickItem = useCallback(
    (idx: number) => {
      if (!enteredRef.current) {
        return;
      }

      const prevIdx = selectedIdxRef.current;

      if (prevIdx === idx) {
        return;
      }

      if (prevIdx === null && transitioningRef.current) {
        return;
      }

      transitioningRef.current = true;

      const d = dimsRef.current;
      const pos = positionsRef.current;
      const newPos = pos[idx];
      const newEl = itemRefs.current[idx];
      const prevPos = prevIdx === null ? null : pos[prevIdx];
      const prevEl = prevIdx === null ? null : itemRefs.current[prevIdx];

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
        preSelectionCamera.current = { scale: preCamS, x: preCamX, y: preCamY };
      }

      const rafOwnedNew = !gsapManagedItems.current.has(idx);

      gsapManagedItems.current.add(idx);

      if (prevIdx !== null) {
        gsapManagedItems.current.add(prevIdx);
      }

      selectedIdxRef.current = idx;

      gsap.killTweensOf(newEl);
      const lastWritten = rafOwnedNew ? lastWrittenRef.current[idx] : undefined;

      if (lastWritten) {
        gsap.set(newEl, lastWritten);
      }

      gsap.to(newEl, {
        duration: prevIdx === null ? 1 : 0.9,
        ease: "power3.inOut",
        opacity: 1,
        rotation: 0,
        scale: g.cardScale,
        x: g.tileOffX,
        y: g.tileOffY,
      });
      newEl.style.zIndex = "60";
      newEl.style.pointerEvents = "none";

      if (prevEl && prevPos) {
        gsap.killTweensOf(prevEl);
        gsap.to(prevEl, {
          duration: 0.65,
          ease: "power3.inOut",
          onComplete: () => {
            prevEl.style.zIndex = "";

            if (prevIdx !== null) {
              gsapManagedItems.current.delete(prevIdx);
            }
          },
          onStart: () => {
            prevEl.style.pointerEvents = "";
          },
          opacity: tuningRef.current.dimOpacity,
          rotation: prevPos.rot,
          scale: 1,
          x: wrapOffset(prevPos.x, worldCx, d.worldW),
          y: wrapOffset(prevPos.y, worldCy, d.worldH),
        });
      }

      dimOtherCards(itemRefs.current, idx, prevIdx, tuningRef.current.dimOpacity);

      gsap.killTweensOf(camera.current);
      gsap.to(camera.current, {
        duration: prevIdx === null ? 1.05 : 0.95,
        ease: "power3.inOut",
        onComplete: () => {
          transitioningRef.current = false;
        },
        onUpdate: applyCameraTransform,
        scale: g.cameraScale,
        x: g.cameraX,
        y: g.cameraY,
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
              { delay: 0.35, duration: 0.75, ease: "power3.out", opacity: 1, x: 0 },
            );
            const stages = dp.querySelectorAll<HTMLElement>("[data-detail-anim]");
            gsap.fromTo(
              stages,
              { filter: "blur(6px)", opacity: 0, y: 16 },
              {
                delay: 0.55,
                duration: 0.65,
                ease: "power3.out",
                filter: "blur(0px)",
                opacity: 1,
                stagger: 0.08,
                y: 0,
              },
            );
          }

          if (cb) {
            gsap.fromTo(
              cb,
              { opacity: 0, scale: 0.85 },
              { delay: 0.4, duration: 0.5, ease: "power3.out", opacity: 1, scale: 1 },
            );
          }
        });
      } else {
        restoreCloseButton(closeBtnRef.current);
        const dp = detailPanelRef.current;

        if (dp) {
          gsap.killTweensOf(dp);
          gsap.killTweensOf(dp.querySelectorAll("[data-detail-anim]"));
          gsap.to(dp, {
            duration: 0.28,
            ease: "power2.in",
            onComplete: () => {
              setSelectedIdx(idx);
              panelRafRef.current = requestAnimationFrame(() => {
                panelRafRef.current = null;
                const newDp = detailPanelRef.current;

                if (!newDp) {
                  return;
                }

                gsap.fromTo(
                  newDp,
                  { opacity: 0, x: 28 },
                  { duration: 0.55, ease: "power3.out", opacity: 1, x: 0 },
                );
                const newStages = newDp.querySelectorAll<HTMLElement>("[data-detail-anim]");
                gsap.fromTo(
                  newStages,
                  { filter: "blur(4px)", opacity: 0, y: 12 },
                  {
                    delay: 0.08,
                    duration: 0.5,
                    ease: "power3.out",
                    filter: "blur(0px)",
                    opacity: 1,
                    stagger: 0.06,
                    y: 0,
                  },
                );
              });
            },
            opacity: 0,
            x: 20,
          });
        } else {
          setSelectedIdx(idx);
        }
      }
    },
    [applyCameraTransform],
  );

  useEffect(
    () => () => {
      deselectCallRef.current?.kill();
      deselectCallRef.current = null;

      if (panelRafRef.current !== null) {
        cancelAnimationFrame(panelRafRef.current);
      }

      panelRafRef.current = null;
    },
    [],
  );

  useLayoutEffect(() => {
    if (!cameraInitedRef.current) {
      return;
    }

    const d = dimsRef.current;
    const cols = chooseCols(LOOKS.length, d.w / d.h);
    positionsRef.current = layoutPositions(d.worldW, d.worldH, cols, LOOKS.length, maxTilt);
  }, [maxTilt]);

  useEffect(() => {
    if (selectedIdxRef.current === null) {
      return;
    }

    dimOtherCards(itemRefs.current, selectedIdxRef.current, null, dimOpacity);
  }, [dimOpacity]);

  useLayoutEffect(() => {
    const c = containerRef.current;

    if (!c) {
      return noop;
    }

    measure();

    const ro = new ResizeObserver(() => {
      measure();
    });

    ro.observe(c);

    return () => {
      ro.disconnect();
      cameraInitedRef.current = false;
    };
  }, [measure]);

  useEffect(() => {
    const c = containerRef.current;

    if (!c) {
      return noop;
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!enteredRef.current) {
        return;
      }

      if (e.button !== 0 && e.pointerType === "mouse") {
        return;
      }

      const target = e.target instanceof Node ? e.target : null;

      if (target && detailPanelRef.current?.contains(target) === true) {
        return;
      }

      if (target && closeBtnRef.current?.contains(target) === true) {
        return;
      }

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

      if (!drag.current.active || drag.current.pointerId !== e.pointerId) {
        return;
      }

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
      if (drag.current.pointerId !== e.pointerId) {
        return;
      }

      drag.current.active = false;
      drag.current.pointerId = -1;
      c.style.cursor = "grab";

      if (drag.current.didMove && Math.hypot(drag.current.vx, drag.current.vy) > 0.6) {
        drag.current.inertiaActive = true;
      }
    };

    const onPointerLeave = () => {
      mouse.current.inside = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (selectedIdxRef.current !== null) {
        return;
      }

      e.preventDefault();

      if (!enteredRef.current) {
        return;
      }

      if (transitioningRef.current) {
        return;
      }

      if (drag.current.active && drag.current.didMove) {
        return;
      }

      drag.current.inertiaActive = false;
      drag.current.vx = 0;
      drag.current.vy = 0;
      gsap.killTweensOf(camera.current);

      const r = rectRef.current;
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;
      const currentScale = camera.current.scale;
      const { maxZoom: zoomCeiling, wheelSensitivity: sensitivity } = tuningRef.current;
      const zoomFactor = Math.exp(-e.deltaY * sensitivity);
      const minScale = effectiveMinScale();
      const newScale = clamp(currentScale * zoomFactor, minScale, Math.max(minScale, zoomCeiling));

      if (newScale === currentScale) {
        return;
      }

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
    window.addEventListener("pointercancel", onPointerUp);
    c.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", refreshRect, { capture: true, passive: true });

    const stepInertia = (sel: number | null) => {
      if (
        drag.current.inertiaActive &&
        !drag.current.active &&
        sel === null &&
        !transitioningRef.current
      ) {
        camera.current.x += drag.current.vx;
        camera.current.y += drag.current.vy;
        const friction = tuningRef.current.inertiaFriction;
        drag.current.vx *= friction;
        drag.current.vy *= friction;

        if (Math.hypot(drag.current.vx, drag.current.vy) < 0.12) {
          drag.current.inertiaActive = false;
          drag.current.vx = 0;
          drag.current.vy = 0;
        }

        applyCameraTransform();
      }
    };

    const stepDrift = (sel: number | null) => {
      const drift = tuningRef.current.driftSpeed;

      if (
        drift > 0 &&
        !reduceMotionRef.current &&
        enteredRef.current &&
        sel === null &&
        !transitioningRef.current &&
        !drag.current.active &&
        !drag.current.inertiaActive &&
        driftRamp.current.amount > 0.001
      ) {
        const speed = drift * driftRamp.current.amount;
        camera.current.x -= speed;
        camera.current.y -= speed;
        applyCameraTransform();
      }
    };

    const tick = () => {
      const sel = selectedIdxRef.current;
      const pos = positionsRef.current;
      const d = dimsRef.current;

      stepInertia(sel);
      stepDrift(sel);

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
        const { parallaxRange: range, parallaxStrength: strength } = tuningRef.current;

        for (let i = 0; i < refs.length; i += 1) {
          if (managed.has(i)) {
            continue;
          }

          const el = refs[i];
          const p = pos[i];

          if (!el || !p) {
            continue;
          }

          const tileOffX = wrapOffset(p.x, worldCx, tileW);
          const tileOffY = wrapOffset(p.y, worldCy, tileH);

          let par = PARALLAX_REST;

          if (doParallax) {
            const wrappedX = p.x + tileOffX;
            const wrappedY = p.y + tileOffY;
            const icx = camX + wrappedX * camS;
            const icy = camY + wrappedY * camS;
            par = cursorParallax(mx - icx, my - icy, range, strength);
          }

          const ox = par.extraX + tileOffX;
          const oy = par.extraY + tileOffY;
          el.style.transform = `translate3d(${ox}px, ${oy}px, 0) rotate(${p.rot}deg) scale(${par.lift})`;

          const w = written[i];

          if (w) {
            w.x = ox;
            w.y = oy;
            w.rotation = p.rot;
            w.scale = par.lift;
          } else {
            written[i] = { rotation: p.rot, scale: par.lift, x: ox, y: oy };
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

      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [applyCameraTransform, effectiveMinScale, handleClose, refreshRect, triggerDragDeselect]);

  useEffect(() => {
    if (!ready) {
      return noop;
    }

    enteredRef.current = true;
    const realItems = itemRefs.current.filter((el): el is HTMLDivElement => el !== null);
    const restScale = Math.max(CAMERA_REST_FACTOR * dimsRef.current.baseFit, effectiveMinScale());
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

      for (const el of realItems) {
        el.style.opacity = "1";
        el.style.filter = "none";
      }

      driftRamp.current.amount = 0;

      return noop;
    }

    driftObj.amount = 0;
    gsap.to(driftObj, { amount: 1, delay: 1.5, duration: 2.5, ease: "power2.in" });

    const tl = gsap.timeline({ delay: 0.12 });
    tl.to(
      realItems,
      {
        duration: 0.95,
        ease: "power3.out",
        filter: "blur(0px)",
        opacity: 1,
        stagger: { each: tuningRef.current.entranceStagger, from: "random" },
      },
      0,
    );
    tl.to(
      cameraObj,
      {
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
        scale: restScale,
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
      className="bg-background text-foreground relative size-full overflow-hidden select-none"
      style={{ cursor: "grab", touchAction: "none" }}
    >
      <style>{`
        [data-lookbook-root]{
          --background:${background};
          --foreground:${foreground};
          --muted:#ece4d4;
          --muted-foreground:${mutedForeground};
          --border:#ddd3c0;
        }
        [data-lookbook-root] .lbk-display{
          font-family:'Playfair Display',Georgia,'Times New Roman',serif;
          font-style:italic;
          font-weight:500;
        }
      `}</style>

      <BackgroundLines />

      <div
        ref={cameraRef}
        className="absolute top-0 left-0"
        style={{
          transformOrigin: "0 0",
          visibility: ready ? undefined : "hidden",
          willChange: "transform",
        }}
      >
        <div
          style={{
            height: dims?.worldH ?? 0,
            position: "relative",
            width: dims?.worldW ?? 0,
          }}
        >
          {LOOKS.map((look, i) => {
            const p = positions[i];
            const isDuplicate = i >= KEYBOARD_REACHABLE;

            return (
              // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- role is deliberately absent on the aria-hidden duplicates (they must not be focusable), so it cannot be a literal
              <div
                key={look.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onClick={() => {
                  if (drag.current.didMove) {
                    return;
                  }

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
                aria-expanded={
                  isDuplicate ? undefined : selectedLook?.lookNumber === look.lookNumber
                }
                aria-label={
                  isDuplicate ? undefined : `${look.name}, look number ${look.lookNumber}`
                }
                data-look-card={look.id}
                className="focus-visible:ring-foreground/40 focus-visible:ring-offset-background absolute cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  height: CARD_H,
                  left: p ? p.x - CARD_W / 2 : 0,
                  top: p ? p.y - CARD_H / 2 : 0,
                  width: CARD_W,
                  willChange: "transform",
                }}
              >
                <LookFigure look={look} className="pointer-events-none size-full" />
              </div>
            );
          })}
        </div>
      </div>

      {hint !== "" && (
        <div
          className="pointer-events-none absolute bottom-6 left-8 z-20"
          style={{
            opacity: selectedIdx === null ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        >
          <p className="text-muted-foreground text-[10px] tracking-[0.3em] uppercase">{hint}</p>
        </div>
      )}

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
};
