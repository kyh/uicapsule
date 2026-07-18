"use client";

import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

import { Fragment, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

import type { DesktopTile, DockAppId } from "./desktop-data";
import type { OpenWindow, WindowCtx, WindowKind } from "./window-types";

import {
  AppGlyph,
  BellSlashGlyph,
  IOSBatteryGlyph,
  MacBatteryGlyph,
  SignalBarsGlyph,
  WifiGlyph,
} from "./app-icons";
import {
  DOCK_APPS,
  FILES,
  GROUP_APPS,
  HERO_FILE,
  MOBILE_PRIMARY,
  TILES,
  VEIL_GRADIENT,
  WALLPAPER_DARK,
  WALLPAPER_LIGHT,
  tileId,
  tileName,
  tilePos,
} from "./desktop-data";
import { WindowView } from "./window-bodies";
import { PhotoLightbox } from "./window-frame";
import { DEFAULT_WINDOW_SIZES } from "./window-types";

/* ---------------------------------------------------------------- tuning -- */

const DOCK_ICON_BASE = 56;
const DOCK_ICON_MAX = 96;
const DOCK_HOVER_RANGE = 140;
const DOCK_SIZE_LERP = 0.28;
/**
 * Second-order smoothing on the cursor itself. Together with the per-icon size
 * lerp this is what separates the dock from a CSS `:hover { scale }`.
 */
const DOCK_CURSOR_LERP = 0.22;
const MOBILE_ICON_BASE = 72;

const TILE_SIZE = 78;
const FEATURED_SIZE = 180;
/** Boot "slot machine" reel. */
const REEL_FRAME_MS = 100;
const REEL_DELAY_MS = 250;
/** Hard cap on waiting for the thumbnail preload before booting anyway. */
const PRELOAD_CAP_MS = 1400;

const HERO_ID = HERO_FILE.id;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const DOCK_SHADOW =
  "0 30px 80px -20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.18)";

/**
 * The one place this component needs real CSS: scrollbar colouring inside the
 * scrollable surfaces (light and dark variants), and the terminal caret blink.
 */
const SCOPED_CSS = `
.dos-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.22) transparent; }
.dos-scroll::-webkit-scrollbar { width: 11px; height: 11px; }
.dos-scroll::-webkit-scrollbar-track { background: transparent; }
.dos-scroll::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.22);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: content-box;
}
/* Same metrics, inverted thumb — for the terminal and the mobile springboard,
   which scroll over near-black surfaces. */
.dos-scroll-dark { scrollbar-color: rgba(255,255,255,0.22) transparent; }
.dos-scroll-dark::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); background-clip: content-box; }
@keyframes dos-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
.dos-caret { animation: dos-blink 1.06s steps(1, end) infinite; }
@media (prefers-reduced-motion: reduce) { .dos-caret { animation: none } }
`;

/* ----------------------------------------------------------------- state -- */

interface TilePosition {
  x: number;
  y: number;
  z: number;
}

interface DragState {
  id: string | null;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
  pointerId: number;
  el: HTMLDivElement | null;
  z: number;
  lastX: number;
  lastY: number;
}

interface OpenSpec {
  kind: WindowKind;
  fileId?: string;
  folderName?: string;
}

export const DesktopOS = (): ReactNode => {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [tilePositions, setTilePositions] = useState<Record<string, TilePosition>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entranceDone, setEntranceDone] = useState(false);
  const [windows, setWindows] = useState<readonly OpenWindow[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const wallpaperWrapRef = useRef<HTMLDivElement>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const featuredThumbRef = useRef<HTMLDivElement>(null);
  const featuredImgRef = useRef<HTMLImageElement>(null);
  const groupBackdropRef = useRef<HTMLDivElement>(null);
  const groupPanelRef = useRef<HTMLDivElement>(null);

  const tileRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tilePositionsRef = useRef<Record<string, TilePosition>>({});
  const isMobileRef = useRef(false);
  const winCounter = useRef(0);
  const entranceStartedRef = useRef(false);

  const dockIconEls = useRef<Map<DockAppId, HTMLDivElement>>(new Map());
  const dockIconSizes = useRef<Map<DockAppId, number>>(new Map());
  const dockCursor = useRef({ x: -9999, smooth: -9999, active: false });
  const dockSettling = useRef(false);
  const rafId = useRef<number | null>(null);

  const dragRef = useRef<DragState>({
    id: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
    pointerId: -1,
    el: null,
    z: 0,
    lastX: 0,
    lastY: 0,
  });

  /* ------------------------------------------------------ window manager -- */

  const openWindow = (spec: OpenSpec): void => {
    const sec = sectionRef.current;
    const sw = sec?.clientWidth ?? 1280;
    const sh = sec?.clientHeight ?? 800;
    const base = DEFAULT_WINDOW_SIZES[spec.kind];

    let w: number;
    let h: number;
    let x: number;
    let y: number;

    if (isMobileRef.current) {
      w = Math.max(200, sw - 32);
      h = Math.max(220, sh - 60 - 128);
      x = 16;
      y = 60;
    } else {
      w = Math.min(base.w, Math.max(280, sw - 32));
      // Reserve 140px of vertical slack so the 28px cascade below always has
      // somewhere to go — otherwise every window opens at exactly y=28 in a
      // short frame and two open windows stack pixel-perfect.
      h = Math.min(base.h, Math.max(200, sh - 140));
      const offset = Math.min(windows.length, 5) * 28;
      x = clamp((sw - w) / 2 - 40 + offset, 8, Math.max(8, sw - w - 8));
      y = clamp(Math.max(28, (sh - h) / 2 - 40) + offset, 28, Math.max(28, sh - h - 8));
    }

    const uid = winCounter.current + 1;
    winCounter.current = uid;

    setWindows((prev) => {
      const z = prev.reduce((max, win) => Math.max(max, win.z), 100) + 1;

      return [
        ...prev,
        {
          uid,
          kind: spec.kind,
          fileId: spec.fileId,
          folderName: spec.folderName,
          title: spec.folderName ?? "",
          x,
          y,
          w,
          h,
          z,
        },
      ];
    });
  };

  const closeWindow = (uid: number): void => {
    setWindows((prev) => prev.filter((win) => win.uid !== uid));
  };

  const focusWindow = (uid: number): void => {
    setWindows((prev) => {
      const max = prev.reduce((acc, win) => Math.max(acc, win.z), 100);

      return prev.map((win) => (win.uid === uid ? { ...win, z: max + 1 } : win));
    });
  };

  const moveWindow = (uid: number, x: number, y: number): void => {
    setWindows((prev) => prev.map((win) => (win.uid === uid ? { ...win, x, y } : win)));
  };

  const ctx: WindowCtx = {
    isMobile,
    openQuickLook: (fileId) => openWindow({ kind: "quicklook", fileId }),
    openLightbox: (src) => setLightbox(src),
    closeWindow,
  };

  const openTile = (tile: DesktopTile): void => {
    if (tile.kind === "folder") {
      openWindow({ kind: "finder", folderName: tile.name });
    } else {
      openWindow({ kind: "quicklook", fileId: tile.file.id });
    }
  };

  const handleDockApp = (id: DockAppId): void => {
    switch (id) {
      case "files":
        openWindow({ kind: "finder", folderName: "Archive" });
        break;
      case "preview":
        openWindow({ kind: "quicklook", fileId: HERO_ID });
        break;
      case "photos":
        openWindow({ kind: "photos" });
        break;
      case "notes":
        openWindow({ kind: "notes" });
        break;
      case "terminal":
        openWindow({ kind: "terminal" });
        break;
      case "trash":
        openWindow({ kind: "finder", folderName: "Trash" });
        break;
    }
  };

  /* ------------------------------------------------------ tile positions -- */

  /**
   * Percentage-seeded layout, re-clamped on every resize so icons can never
   * leave an arbitrarily-sized frame.
   */
  const seedPositions = (): void => {
    const sec = sectionRef.current;
    const vw = sec?.clientWidth ?? 1280;
    const vh = sec?.clientHeight ?? 800;

    setTilePositions((prev) => {
      const next: Record<string, TilePosition> = {};

      TILES.forEach((tile, i) => {
        const id = tileId(tile);
        const seed = tilePos(tile);
        const existing = prev[id];
        const baseX = existing ? existing.x : (seed.xPct / 100) * vw;
        const baseY = existing ? existing.y : (seed.yPct / 100) * vh;
        next[id] = {
          x: clamp(baseX, 8, Math.max(8, vw - 88)),
          y: clamp(baseY, 8, Math.max(8, vh - 236)),
          z: existing ? existing.z : 10 + i,
        };
      });

      return next;
    });
    setSeeded(true);
  };

  /* ------------------------------------------------------ mount + resize -- */

  useEffect(() => {
    isMobileRef.current = window.matchMedia("(max-width: 767px)").matches;
    setIsMobile(isMobileRef.current);

    // The boot timeline does not start until the thumbnail preload settles (up
    // to PRELOAD_CAP_MS). Seed the wallpaper's pre-boot state here instead, or
    // the first thing on screen is a crisp wallpaper that snaps to blur(24px).
    const wrap = wallpaperWrapRef.current;
    if (wrap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (isMobileRef.current) gsap.set(wrap, { opacity: 0 });
      else gsap.set(wrap, { filter: "blur(24px)", scale: 1.04 });
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    seedPositions();

    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (): void => {
      isMobileRef.current = mq.matches;
      setIsMobile(mq.matches);
      seedPositions();
    };
    const onResize = (): void => seedPositions();

    mq.addEventListener("change", onChange);
    window.addEventListener("resize", onResize);

    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("resize", onResize);
    };
  }, [mounted]);

  // Mirror positions into a ref so the boot timeline can read them without
  // taking `tilePositions` as a dependency — a tile drag must not replay boot.
  useEffect(() => {
    tilePositionsRef.current = tilePositions;
  }, [tilePositions]);

  /* ------------------------------------------------------- boot sequence -- */

  useEffect(() => {
    if (!mounted || !seeded) return;
    if (entranceStartedRef.current) return;

    const sec = sectionRef.current;
    if (!sec) return;

    entranceStartedRef.current = true;

    const wrap = wallpaperWrapRef.current;
    const menu = menuBarRef.current;
    const dock = dockRef.current;
    const thumb = featuredThumbRef.current;

    let cancelled = false;
    let timeline: ReturnType<typeof gsap.timeline> | null = null;
    let reelTimeout: number | null = null;
    let reelInterval: number | null = null;
    let capTimeout: number | null = null;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      if (wrap) gsap.set(wrap, { opacity: 1, scale: 1, filter: "none" });
      if (menu) gsap.set(menu, { opacity: 1, y: 0 });
      if (dock) gsap.set(dock, { opacity: 1, y: 0 });
      tileRefs.current.forEach((el) => gsap.set(el, { opacity: 1 }));
      setEntranceDone(true);

      return () => {
        entranceStartedRef.current = false;
      };
    }

    const runMobile = (): void => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline = tl;

      if (wrap) {
        tl.fromTo(wrap, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.45 }, 0);
      }
      if (menu) {
        tl.fromTo(menu, { y: -28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0.05);
      }

      TILES.forEach((tile, i) => {
        const el = tileRefs.current.get(tileId(tile));
        if (!el) return;
        tl.fromTo(
          el,
          { opacity: 0, y: 10, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5 },
          0.2 + 0.04 * (i % 10),
        );
      });

      if (dock) {
        tl.fromTo(dock, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.35);
      }
      tl.call(() => setEntranceDone(true), undefined, 1.0);
    };

    const runDesktop = (): void => {
      const positions = tilePositionsRef.current;
      const sw = sec.clientWidth;
      const sh = sec.clientHeight;
      const centreX = sw / 2 - 48;
      const centreY = sh / 2 - 58;
      const heroPos = positions[HERO_ID];
      const heroEl = tileRefs.current.get(HERO_ID);

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline = tl;

      if (wrap) {
        tl.set(wrap, { filter: "blur(24px)", scale: 1.04 }, 0);
        tl.to(wrap, { filter: "blur(0px)", scale: 1, duration: 0.4 }, 0.95);
      }

      if (thumb) {
        gsap.set(thumb, { xPercent: -50, yPercent: -50 });
        tl.fromTo(
          thumb,
          { y: 320, opacity: 0, scale: 0.85, filter: "blur(8px)" },
          { y: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.5 },
          0,
        );
      }

      TILES.forEach((tile, i) => {
        const id = tileId(tile);
        if (id === HERO_ID) return;
        const el = tileRefs.current.get(id);
        const pos = positions[id];
        if (!el || !pos) return;
        tl.fromTo(
          el,
          {
            opacity: 0,
            x: centreX,
            y: centreY,
            scale: 0.35,
            filter: "blur(8px)",
          },
          {
            opacity: 1,
            x: pos.x,
            y: pos.y,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.55,
          },
          1.15 + 0.02 * (i % 10),
        );
      });

      if (thumb && heroPos) {
        // Hand-off: the 180px featured card shrinks into the 78px hero tile.
        tl.to(
          thumb,
          {
            x: heroPos.x + 48 - sw / 2,
            y: heroPos.y + 39 - sh / 2,
            scale: TILE_SIZE / FEATURED_SIZE,
            duration: 0.36,
            ease: "power3.inOut",
          },
          1.3,
        );
      }

      if (thumb) tl.to(thumb, { opacity: 0, duration: 0.15 }, 1.66);
      if (heroEl) tl.to(heroEl, { opacity: 1, duration: 0.15 }, 1.66);
      if (menu) {
        tl.fromTo(menu, { y: -32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 1.75);
      }
      if (dock) {
        tl.fromTo(dock, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, 1.9);
      }
      tl.call(() => setEntranceDone(true), undefined, 2.15);

      // Riffle through every thumbnail like a slot-machine reel, landing back
      // on the hero frame just before the card flies to its tile.
      const reel = FILES.map((file) => file.thumb);
      let frame = 0;
      reelTimeout = window.setTimeout(() => {
        reelInterval = window.setInterval(() => {
          frame += 1;
          const img = featuredImgRef.current;
          const next = reel[frame];
          if (next === undefined) {
            if (reelInterval !== null) window.clearInterval(reelInterval);
            if (img) img.src = HERO_FILE.thumb;
            return;
          }
          if (img) img.src = next;
        }, REEL_FRAME_MS);
      }, REEL_DELAY_MS);
    };

    // Layout mode and tile positions are read here, not at effect setup: the
    // preload gate below can delay `start` by up to PRELOAD_CAP_MS, and a
    // breakpoint cross in that window must build the timeline for the tree
    // that is actually on screen.
    const start = (): void => {
      if (cancelled) return;
      if (isMobileRef.current) runMobile();
      else runDesktop();
    };

    // The reel mutates <img src> every 100ms. Without a preload the whole
    // sequence flashes empty frames against a cold CDN — so wait for the
    // thumbnails, but never longer than PRELOAD_CAP_MS.
    let pending = FILES.length;
    let launched = false;
    const launch = (): void => {
      if (launched || cancelled) return;
      launched = true;
      start();
    };

    FILES.forEach((file) => {
      const img = new Image();
      const settle = (): void => {
        pending -= 1;
        if (pending <= 0) launch();
      };
      img.addEventListener("load", settle, { once: true });
      img.addEventListener("error", settle, { once: true });
      img.src = file.thumb;
    });
    capTimeout = window.setTimeout(launch, PRELOAD_CAP_MS);

    return () => {
      cancelled = true;
      // Reset so React 19 StrictMode's second mount replays the intro.
      entranceStartedRef.current = false;
      timeline?.kill();
      if (reelTimeout !== null) window.clearTimeout(reelTimeout);
      if (reelInterval !== null) window.clearInterval(reelInterval);
      if (capTimeout !== null) window.clearTimeout(capTimeout);
    };
  }, [mounted, seeded]);

  /* -------------------------------------------------- dock magnification -- */

  useEffect(() => {
    const tick = (): void => {
      const cursor = dockCursor.current;

      // Idle dock costs nothing: no rect reads, no style writes.
      if (!isMobileRef.current && (cursor.active || dockSettling.current)) {
        cursor.smooth += (cursor.x - cursor.smooth) * DOCK_CURSOR_LERP;

        let settled = true;
        dockIconEls.current.forEach((el, id) => {
          // Live rect each frame: magnified neighbours push each other apart,
          // exactly as they do in the real dock.
          const rect = el.getBoundingClientRect();
          const centre = rect.left + rect.width / 2;
          const dist = Math.abs(cursor.smooth - centre);
          const t = Math.max(0, 1 - dist / DOCK_HOVER_RANGE);
          const falloff = t * t * (3 - 2 * t); // smoothstep
          const target = cursor.active
            ? DOCK_ICON_BASE + (DOCK_ICON_MAX - DOCK_ICON_BASE) * falloff
            : DOCK_ICON_BASE;

          const current = dockIconSizes.current.get(id) ?? DOCK_ICON_BASE;
          const next = current + (target - current) * DOCK_SIZE_LERP;
          dockIconSizes.current.set(id, next);
          if (Math.abs(target - next) > 0.1) settled = false;
          el.style.width = `${next.toFixed(2)}px`;
          el.style.height = `${next.toFixed(2)}px`;
        });

        dockSettling.current = cursor.active || !settled;
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
  }, []);

  // Sizes live in their own map so a re-render (which detaches and reattaches
  // every ref callback) cannot snap a magnified icon back to its base size.
  const setDockIconRef =
    (id: DockAppId) =>
    (el: HTMLDivElement | null): void => {
      if (el) dockIconEls.current.set(id, el);
      else dockIconEls.current.delete(id);
    };

  const dockPointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    dockCursor.current.x = e.clientX;
    if (!dockCursor.current.active) {
      dockCursor.current.smooth = e.clientX;
      dockCursor.current.active = true;
    }
    dockSettling.current = true;
  };

  const dockPointerLeave = (): void => {
    dockCursor.current.active = false;
    dockCursor.current.x = -9999;
    dockSettling.current = true;
  };

  /* ------------------------------------------------ group panel entrance -- */

  useEffect(() => {
    if (!groupPanelOpen) return;

    const tweens: gsap.core.Tween[] = [];
    if (groupBackdropRef.current) {
      tweens.push(
        gsap.fromTo(groupBackdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22 }),
      );
    }
    if (groupPanelRef.current) {
      tweens.push(
        gsap.fromTo(
          groupPanelRef.current,
          { opacity: 0, scale: 0.86, filter: "blur(8px)" },
          {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.34,
            ease: "power3.out",
          },
        ),
      );
    }

    return () => {
      tweens.forEach((tween) => tween.kill());
    };
  }, [groupPanelOpen]);

  /* ----------------------------------------------------------- ESC stack -- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;

      if (lightbox) {
        setLightbox(null);
        return;
      }
      if (groupPanelOpen) {
        setGroupPanelOpen(false);
        return;
      }
      if (windows.length > 0) {
        const top = windows.reduce((a, b) => (b.z > a.z ? b : a));
        closeWindow(top.uid);
        return;
      }
      if (selectedId) setSelectedId(null);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, groupPanelOpen, windows, selectedId]);

  /* ----------------------------------------------------------- tile drag -- */

  const onTilePointerDown = (e: ReactPointerEvent<HTMLDivElement>, tile: DesktopTile): void => {
    const id = tileId(tile);

    if (isMobileRef.current) {
      dragRef.current = {
        ...dragRef.current,
        id,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        el: null,
        pointerId: -1,
      };
      return;
    }

    if (e.button !== 0) return;
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);

    const pos = tilePositions[id];
    const newZ =
      Object.values(tilePositions).reduce((max, entry) => Math.max(max, entry.z), 10) + 1;
    el.style.zIndex = String(newZ);

    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos?.x ?? 0,
      originY: pos?.y ?? 0,
      moved: false,
      pointerId: e.pointerId,
      el,
      z: newZ,
      lastX: pos?.x ?? 0,
      lastY: pos?.y ?? 0,
    };
    setSelectedId(id);
  };

  const onTilePointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (!drag.id) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    // 4px of travel is the line between "clicked it" and "dragged it".
    if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    if (isMobileRef.current || !drag.el) return;

    const sec = sectionRef.current;
    if (!sec) return;

    const nx = clamp(drag.originX + dx, 4, Math.max(4, sec.clientWidth - 100));
    const ny = clamp(drag.originY + dy, 4, Math.max(4, sec.clientHeight - 226));
    drag.lastX = nx;
    drag.lastY = ny;
    // Written straight to the DOM during the drag; committed to state on up.
    drag.el.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
  };

  const onTilePointerUp = (e: ReactPointerEvent<HTMLDivElement>, tile: DesktopTile): void => {
    const drag = dragRef.current;
    const wasMoved = drag.moved;

    if (
      !isMobileRef.current &&
      drag.el &&
      drag.pointerId >= 0 &&
      drag.el.hasPointerCapture(drag.pointerId)
    ) {
      drag.el.releasePointerCapture(drag.pointerId);
    }

    if (!wasMoved) {
      dragRef.current.id = null;
      openTile(tile);
      return;
    }

    if (!isMobileRef.current) {
      const id = tileId(tile);
      setTilePositions((prev) => ({
        ...prev,
        [id]: { x: drag.lastX, y: drag.lastY, z: drag.z },
      }));
    }
    dragRef.current.id = null;
  };

  const onTileKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>, tile: DesktopTile): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openTile(tile);
    }
  };

  /* ------------------------------------------------------------- renders -- */

  const renderTileInner = (tile: DesktopTile, size: number): ReactNode => {
    const selected = selectedId === tileId(tile);

    return (
      <>
        {tile.kind === "folder" ? (
          <div
            className={`relative ${selected ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]" : ""}`}
            style={{ width: size, height: size }}
          >
            <AppGlyph id="folder" />
          </div>
        ) : (
          <div
            className={`relative overflow-hidden rounded-[14px] border bg-[rgba(255,255,255,0.04)] transition-[box-shadow,transform] duration-150 ease-out ${
              selected
                ? "border-white/70 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6),0_0_0_2px_rgba(255,255,255,0.15)]"
                : "border-white/15 shadow-[0_12px_24px_-10px_rgba(0,0,0,0.6)]"
            }`}
            style={{ width: size, height: size }}
          >
            <img
              src={tile.file.thumb}
              alt={tile.file.name}
              draggable={false}
              className="size-full object-cover"
            />
          </div>
        )}

        <div
          className={`mt-2 max-w-[110px] truncate rounded-[5px] px-1.5 py-[1px] text-center text-[11px] leading-tight font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
            selected ? "bg-[#3b82f6] text-white" : "text-white"
          }`}
        >
          {tileName(tile)}
        </div>
      </>
    );
  };

  const registerTileRef =
    (id: string) =>
    (el: HTMLDivElement | null): void => {
      if (el) tileRefs.current.set(id, el);
      else tileRefs.current.delete(id);
    };

  /**
   * Tiles are hidden by CSS only while the boot timeline still owns their
   * opacity. Crossing the 767px breakpoint swaps the desktop tile list for the
   * springboard grid (and back), which mounts brand-new elements that GSAP has
   * never touched — a permanent `opacity-0` class would leave those orphans
   * invisible forever, since the one-shot boot never replays.
   */
  const renderDesktopTile = (tile: DesktopTile, index: number): ReactNode => {
    const id = tileId(tile);
    const pos = tilePositions[id];

    return (
      <div
        key={id}
        role="button"
        tabIndex={0}
        aria-label={tileName(tile)}
        ref={registerTileRef(id)}
        onPointerDown={(e) => onTilePointerDown(e, tile)}
        onPointerMove={onTilePointerMove}
        onPointerUp={(e) => onTilePointerUp(e, tile)}
        onKeyDown={(e) => onTileKeyDown(e, tile)}
        className={`absolute z-[4] flex cursor-grab flex-col items-center outline-none select-none active:cursor-grabbing ${entranceDone ? "" : "opacity-0"}`}
        style={{
          width: 96,
          transform: pos ? `translate3d(${pos.x}px, ${pos.y}px, 0)` : "translate3d(0px, 0px, 0)",
          zIndex: pos?.z ?? 10 + index,
          touchAction: "none",
        }}
      >
        {renderTileInner(tile, TILE_SIZE)}
      </div>
    );
  };

  const renderMobileTile = (tile: DesktopTile): ReactNode => {
    const id = tileId(tile);

    return (
      <div
        key={id}
        role="button"
        tabIndex={0}
        aria-label={tileName(tile)}
        ref={registerTileRef(id)}
        onPointerDown={(e) => onTilePointerDown(e, tile)}
        onPointerMove={onTilePointerMove}
        onPointerUp={(e) => onTilePointerUp(e, tile)}
        onKeyDown={(e) => onTileKeyDown(e, tile)}
        className={`flex flex-col items-center outline-none select-none ${entranceDone ? "" : "opacity-0"}`}
        style={{ touchAction: "manipulation" }}
      >
        {renderTileInner(tile, 64)}
      </div>
    );
  };

  const desktopDock = (
    <div ref={dockRef} className="absolute inset-x-0 bottom-5 z-30 flex justify-center opacity-0">
      <div
        onPointerMove={dockPointerMove}
        onPointerLeave={dockPointerLeave}
        className="flex items-end gap-1.5 rounded-[26px] border border-white/25 bg-white/[0.14] px-3 pt-3 pb-3 backdrop-blur-2xl backdrop-saturate-150"
        style={{ height: DOCK_ICON_BASE + 24, boxShadow: DOCK_SHADOW }}
      >
        {DOCK_APPS.map((app) => (
          <Fragment key={app.id}>
            {app.id === "trash" && (
              <span className="mx-0.5 my-2 w-px self-stretch bg-white/[0.22]" aria-hidden="true" />
            )}
            <div className="group relative flex items-end">
              <span
                className="pointer-events-none absolute -top-[44px] left-1/2 -translate-x-1/2 translate-y-1 rounded-[6px] border border-white/20 bg-black/75 px-2.5 py-[5px] text-[12px] font-medium whitespace-nowrap text-white opacity-0 backdrop-blur-md transition-all duration-150 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
                style={{ boxShadow: "0 8px 18px -6px rgba(0,0,0,0.6)" }}
              >
                {app.name}
                <span
                  className="absolute top-full left-1/2 size-0 -translate-x-1/2"
                  style={{
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: "5px solid rgba(0,0,0,0.75)",
                  }}
                />
              </span>
              <button
                type="button"
                aria-label={app.name}
                onClick={() => handleDockApp(app.id)}
                className="block"
              >
                <div
                  ref={setDockIconRef(app.id)}
                  className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
                  style={{ width: DOCK_ICON_BASE, height: DOCK_ICON_BASE }}
                >
                  <AppGlyph id={app.id} />
                </div>
              </button>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );

  const mobileDock = (
    <div ref={dockRef} className="absolute inset-x-0 bottom-4 z-30 px-4 opacity-0">
      <div
        className="flex w-full items-end justify-evenly rounded-[26px] border border-white/25 bg-white/[0.14] px-3 pt-3 pb-3 backdrop-blur-2xl backdrop-saturate-150"
        style={{ boxShadow: DOCK_SHADOW }}
      >
        {MOBILE_PRIMARY.map((id) => {
          const app = DOCK_APPS.find((entry) => entry.id === id);

          return (
            <button
              key={id}
              type="button"
              aria-label={app?.name ?? id}
              onClick={() => handleDockApp(id)}
              className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
              style={{ width: MOBILE_ICON_BASE, height: MOBILE_ICON_BASE }}
            >
              <AppGlyph id={id} />
            </button>
          );
        })}
        <button
          type="button"
          aria-label="More apps"
          onClick={() => setGroupPanelOpen(true)}
          className={`rounded-[14px] border border-white/30 bg-white/15 p-[6px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_10px_rgba(0,0,0,0.35)] backdrop-blur-md ${
            groupPanelOpen ? "ring-2 ring-white/40" : ""
          }`}
          style={{ width: MOBILE_ICON_BASE, height: MOBILE_ICON_BASE }}
        >
          {/*
            `grid-rows-3` is load-bearing: with only an implicit row the single
            row of glyphs is stretched to the definite `h-full` height and each
            mini-icon renders as a tall bar.
          */}
          <div className="grid h-full grid-cols-3 grid-rows-3 gap-[3px]">
            {GROUP_APPS.map((id) => (
              <span key={id} className="size-full overflow-hidden rounded-[3px]">
                <AppGlyph id={id} />
              </span>
            ))}
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <main
      ref={sectionRef}
      className="relative isolate h-full w-full overflow-hidden bg-[#1a1612]"
      style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{SCOPED_CSS}</style>

      <div ref={wallpaperWrapRef} className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-100 transition-opacity duration-500 dark:opacity-0"
          style={{ background: WALLPAPER_LIGHT }}
        />
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 dark:opacity-100"
          style={{ background: WALLPAPER_DARK }}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: VEIL_GRADIENT }}
      />

      <div
        className="absolute inset-0 z-[3]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setSelectedId(null);
        }}
      />

      {mounted && (
        <>
          {isMobile ? (
            <div className="dos-scroll dos-scroll-dark absolute inset-x-0 top-[64px] bottom-[120px] z-[4] grid grid-cols-3 content-start gap-x-2 gap-y-4 overflow-y-auto px-4 pt-2 pb-4">
              {TILES.map((tile) => renderMobileTile(tile))}
            </div>
          ) : (
            TILES.map((tile, i) => renderDesktopTile(tile, i))
          )}

          {/*
            Both bars switch on `isMobile` rather than a `sm:` utility: the
            springboard/desktop split is decided at 767px, and a 640px Tailwind
            breakpoint would put the macOS bar above the iOS grid at 720px.
          */}
          <div ref={menuBarRef} className="absolute inset-x-0 top-0 z-[5] opacity-0">
            {isMobile ? (
              <div className="flex h-12 items-center justify-between px-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-semibold tracking-tight">14:08</span>
                  <BellSlashGlyph />
                </div>
                <div className="flex items-center gap-1">
                  <SignalBarsGlyph />
                  <WifiGlyph />
                  <IOSBatteryGlyph />
                </div>
              </div>
            ) : (
              <div className="flex h-7 items-center justify-between bg-black/15 px-4 backdrop-blur-md">
                <div className="flex items-center gap-4 text-[11px] text-white/80">
                  <span className="size-3 rounded-[2px] bg-white" aria-hidden="true" />
                  <span className="font-bold">Finder</span>
                  <span className="text-white/70">File</span>
                  <span className="text-white/70">Edit</span>
                  <span className="text-white/70">View</span>
                  <span className="text-white/70">Window</span>
                  <span className="text-white/70">Help</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-white/80">
                  <span className="text-white">
                    <MacBatteryGlyph />
                  </span>
                  <span>100%</span>
                  <span>Wed 14:08</span>
                </div>
              </div>
            )}
          </div>

          {!isMobile && !entranceDone && (
            <div
              ref={featuredThumbRef}
              className="absolute top-1/2 left-1/2 z-40 size-[180px] overflow-hidden rounded-[28px] border border-white/15 opacity-0"
              style={{
                boxShadow: "0 40px 90px -12px rgba(0,0,0,0.7), 0 0 0 4px rgba(255,255,255,0.06)",
              }}
            >
              <img
                ref={featuredImgRef}
                src={HERO_FILE.thumb}
                alt=""
                draggable={false}
                className="size-full object-cover"
              />
            </div>
          )}

          {isMobile ? mobileDock : desktopDock}

          {groupPanelOpen && (
            <div
              ref={groupBackdropRef}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setGroupPanelOpen(false);
              }}
              className="absolute inset-0 z-[45] flex items-center justify-center bg-black/35 p-6 backdrop-blur-md"
            >
              <div
                ref={groupPanelRef}
                className="w-full max-w-[360px] rounded-[28px] border border-white/[0.22] bg-white/[0.13] p-6 backdrop-blur-2xl backdrop-saturate-150"
                style={{ boxShadow: DOCK_SHADOW }}
              >
                <p className="text-[12px] font-semibold tracking-[0.18em] text-white/75 uppercase">
                  More
                </p>
                <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-5">
                  {GROUP_APPS.map((id) => {
                    const app = DOCK_APPS.find((entry) => entry.id === id);

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          handleDockApp(id);
                          setGroupPanelOpen(false);
                        }}
                        className="flex flex-col items-center gap-2"
                      >
                        <span
                          className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
                          style={{ width: 58, height: 58 }}
                        >
                          <AppGlyph id={id} />
                        </span>
                        <span className="text-[11.5px] font-medium text-white/85">
                          {app?.name ?? id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 z-[50]">
            {windows.map((win) => (
              <WindowView
                key={win.uid}
                win={win}
                ctx={ctx}
                sectionRef={sectionRef}
                onClose={closeWindow}
                onFocus={focusWindow}
                onMove={moveWindow}
              />
            ))}
          </div>

          {lightbox && <PhotoLightbox src={lightbox} onClose={() => setLightbox(null)} />}
        </>
      )}
    </main>
  );
};
