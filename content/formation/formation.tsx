"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { X } from "lucide-react";

import type { FmLayout, FormationMode, Pose, Work } from "./formation-poses";
import {
  clamp,
  easeInOut,
  getLayout,
  GLASS_NORMAL_MAP,
  HOVER_EASE,
  HOVER_ZOOM,
  lerp,
  MODES,
  MORPH_DUR,
  MORPH_STAGGER,
  PARALLAX_MAX,
  PERSP,
  poseFor,
  SPRING,
  SWAP_BAND,
  SWAP_FLOOR,
  SWAP_SPEED_REF,
} from "./formation-poses";

// Name real font stacks rather than leaning on `font-sans` / `font-mono`
// utilities, which resolve to undefined vars (and therefore serif) in a bare
// preview frame.
const SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

// Narrowest frame that gets the custom lens cursor. Kept in sync with the
// `min-width` in the scoped `.fm-glass` media query below — the rAF loop must
// not hide the native cursor for a lens that CSS has set to `display:none`.
const LENS_MIN_W = 640;

interface CustomCSS extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

/** Per-card mutable engine state. One object replaces six parallel arrays. */
interface CardState {
  index: number;
  work: Work;
  /** Pose written to the DOM this frame. */
  cur: Pose;
  /** Pose snapshot captured when a morph begins. */
  from: Pose;
  /** Eased hover amount, 0..1, published as `--hv`. */
  hov: number;
  /** Eased depth-swap cross-fade amount, 0..1. */
  swap: number;
  prevZ: number;
  outer: HTMLDivElement | null;
  inner: HTMLDivElement | null;
}

interface LoopState {
  raf: number;
  lastTime: number;
  onScreen: boolean;
  visible: boolean;
  reduced: boolean;
  pointerFine: boolean;
  browse: number;
  vel: number;
  morphing: boolean;
  morphMs: number;
  seeded: boolean;
  hoverCard: CardState | null;
  lastFocused: CardState | null;
  curTX: number;
  curTY: number;
  /** Pointer position, root-relative. */
  cursor: { x: number; y: number; inside: boolean };
  glass: { x: number; y: number; scale: number; opacity: number };
  dragging: boolean;
  press: { x: number; y: number; id: number; committed: boolean } | null;
  lastX: number;
  lastY: number;
  overUI: boolean;
}

const zeroPose = (): Pose => ({
  x: 0,
  y: 0,
  z: 0,
  rx: 0,
  ry: 0,
  rz: 0,
  s: 1,
  o: 0,
});

const createState = (): LoopState => ({
  raf: 0,
  lastTime: 0,
  onScreen: true,
  visible: true,
  reduced: false,
  pointerFine: false,
  browse: 0,
  vel: 0,
  morphing: false,
  morphMs: 0,
  seeded: false,
  hoverCard: null,
  lastFocused: null,
  curTX: 0,
  curTY: 0,
  cursor: { x: 0, y: 0, inside: false },
  glass: { x: -100, y: -100, scale: 1, opacity: 0 },
  dragging: false,
  press: null,
  lastX: 0,
  lastY: 0,
  overUI: false,
});

const makeCards = (works: Work[]): CardState[] =>
  works.map((work, index) => ({
    index,
    work,
    cur: zeroPose(),
    from: zeroPose(),
    hov: 0,
    swap: 0,
    prevZ: 0,
    outer: null,
    inner: null,
  }));

const pad = (n: number) => String(n).padStart(2, "0");

const isUI = (target: EventTarget | null) =>
  target instanceof Element && target.closest("[data-fm-ui]") !== null;

interface FormationProps {
  works: Work[];
}

export const Formation = ({ works }: FormationProps): ReactNode => {
  const [mode, setMode] = useState<FormationMode>("flat");
  const [detail, setDetail] = useState<{ card: CardState } | null>(null);
  const [mounted, setMounted] = useState(false);

  const rawId = useId();
  const filterId = `fm-liquid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const rootRef = useRef<HTMLElement | null>(null);
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const glassRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<HTMLSpanElement | null>(null);

  // Detail-overlay refs
  const bdRef = useRef<HTMLDivElement | null>(null);
  const imgWrapRef = useRef<HTMLDivElement | null>(null);
  const imgInnerRef = useRef<HTMLDivElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);
  const detailBoxRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const ruleRef = useRef<HTMLSpanElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lidTopRef = useRef<HTMLDivElement | null>(null);
  const lidBotRef = useRef<HTMLDivElement | null>(null);

  // Mutable engine state (never triggers a re-render)
  const sRef = useRef<LoopState | null>(null);
  if (!sRef.current) sRef.current = createState();
  const S = sRef.current;

  // Per-card state, rebuilt only when the `works` array itself changes.
  const worksRef = useRef<Work[] | null>(null);
  const cardsRef = useRef<CardState[]>([]);
  if (worksRef.current !== works) {
    worksRef.current = works;
    cardsRef.current = makeCards(works);
  }
  const cards = cardsRef.current;
  const n = cards.length;

  const layoutRef = useRef<FmLayout | null>(null);
  /** Root's live client box — pointer coords are converted against it. */
  const boxRef = useRef({ left: 0, top: 0, w: 0, h: 0 });
  const modeRef = useRef<FormationMode>("flat");
  const openRef = useRef(false);
  const openingRef = useRef(false);
  const closingRef = useRef(false);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTlRef = useRef<gsap.core.Timeline | null>(null);
  const firstMode = useRef(true);
  const fnRef = useRef<{ closeDetail: () => void; renderStatic: () => void }>({
    closeDetail: () => {},
    renderStatic: () => {},
  });

  // ── Geometry helpers (read refs only — safe to capture once) ─────────────
  const applyCardSizes = () => {
    const L = layoutRef.current;
    if (!L) return;
    for (const card of cards) {
      const outer = card.outer;
      if (!outer) continue;
      outer.style.width = `${L.cardW}px`;
      outer.style.height = `${L.cardH}px`;
      outer.style.marginLeft = `${-L.cardW / 2}px`;
      outer.style.marginTop = `${-L.cardH / 2}px`;
    }
  };

  /** Painter's-algorithm hit test in root-relative space; highest z wins. */
  const rectHit = (px: number, py: number, sticky: boolean) => {
    const box = boxRef.current;
    const inRect = (el: HTMLDivElement) => {
      const r = el.getBoundingClientRect();
      const l = r.left - box.left;
      const t = r.top - box.top;
      return px >= l && px <= l + r.width && py >= t && py <= t + r.height;
    };
    const stickyCard = S.hoverCard;
    // Bias toward whatever is already hovered so a hairline overlap can't flicker.
    if (sticky && stickyCard && stickyCard.cur.o >= 0.5 && stickyCard.outer) {
      if (inRect(stickyCard.outer)) return stickyCard;
    }
    let best: CardState | null = null;
    let bestZ = -Infinity;
    for (const card of cards) {
      if (card.cur.o < 0.5) continue;
      const el = card.outer;
      if (!el) continue;
      if (inRect(el) && card.cur.z > bestZ) {
        bestZ = card.cur.z;
        best = card;
      }
    }
    return best;
  };
  const hoverHit = (px: number, py: number) => rectHit(px, py, true);
  const resolveCardAt = (px: number, py: number) => rectHit(px, py, false);

  const renderStatic = () => {
    const L = layoutRef.current;
    if (!L) return;
    const m = modeRef.current;
    let focused: CardState | null = null;
    let best = Infinity;
    for (const card of cards) {
      const p = poseFor(m, card.index, L, 0);
      const cur = card.cur;
      cur.x = p.x;
      cur.y = p.y;
      cur.z = p.z;
      cur.s = p.s;
      cur.o = p.o;
      if (card.outer) {
        card.outer.style.transform = `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg) scale(${p.s})`;
        card.outer.style.opacity = String(p.o);
      }
      card.inner?.style.setProperty("--hv", "0");
      const score = Math.abs(p.x) + Math.abs(p.y) - p.z;
      if (score < best) {
        best = score;
        focused = card;
      }
    }
    if (parallaxRef.current) parallaxRef.current.style.transform = "";
    if (counterRef.current && focused) {
      counterRef.current.textContent = `${pad(focused.index + 1)} — ${pad(n)}`;
    }
  };

  // ── Detail open / close ──────────────────────────────────────────────────
  const openDetail = (card: CardState) => {
    if (openingRef.current || closingRef.current || openRef.current) return;
    S.hoverCard = null;
    openRef.current = true;
    openingRef.current = true;
    setDetail({ card });
    setMounted(true);
  };

  const closeDetail = () => {
    if (closingRef.current || !openRef.current) return;
    // A close can interrupt the (long) open blink rather than waiting it out.
    if (openingRef.current) {
      openTlRef.current?.kill();
      openingRef.current = false;
    }
    if (S.reduced) {
      openRef.current = false;
      setMounted(false);
      setDetail(null);
      return;
    }
    closingRef.current = true;
    const lids = [lidTopRef.current, lidBotRef.current];
    const tl = gsap.timeline({
      onComplete: () => {
        closingRef.current = false;
        setMounted(false);
        setDetail(null);
      },
    });
    closeTlRef.current = tl;
    tl.to(detailBoxRef.current, { autoAlpha: 0, duration: 0.28, ease: "power2.in" }, 0)
      .to(lids, { scaleY: 1, duration: 0.6, ease: "power2.inOut" }, 0.05)
      .add(() => {
        openRef.current = false;
        gsap.set([imgWrapRef.current, scrimRef.current, bdRef.current, closeBtnRef.current], {
          opacity: 0,
        });
      }, 0.66)
      .to(lids, { scaleY: 0, duration: 0.95, ease: "power3.out" }, 0.74);
  };

  // ── Pointer input (React handlers → latest closures) ─────────────────────
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (openRef.current) return;
    if (isUI(e.target)) return;
    const box = boxRef.current;
    const lx = e.clientX - box.left;
    const ly = e.clientY - box.top;
    S.cursor.x = lx;
    S.cursor.y = ly;
    S.cursor.inside = true;
    S.lastX = lx;
    S.lastY = ly;
    S.press = { x: lx, y: ly, id: e.pointerId, committed: false };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const box = boxRef.current;
    const lx = e.clientX - box.left;
    const ly = e.clientY - box.top;
    S.cursor.x = lx;
    S.cursor.y = ly;
    S.cursor.inside = true;
    S.overUI = isUI(e.target);
    if (openRef.current) return;
    const press = S.press;
    if (press && !S.morphing) {
      if (!press.committed) {
        const dist = Math.hypot(lx - press.x, ly - press.y);
        // 8px of slop, so a click still opens the detail view.
        if (dist > 8) {
          press.committed = true;
          S.dragging = true;
          try {
            rootRef.current?.setPointerCapture(press.id);
          } catch {
            /* noop */
          }
        }
      }
      if (S.dragging) {
        const gain = modeRef.current === "flat" || modeRef.current === "ring" ? 1.4 : 1;
        const d = (lx - S.lastX) * gain;
        S.browse += d;
        S.vel = d;
      }
    }
    S.lastX = lx;
    S.lastY = ly;
  };

  const onPointerUp = () => {
    const press = S.press;
    if (press) {
      try {
        rootRef.current?.releasePointerCapture(press.id);
      } catch {
        /* noop */
      }
      if (!press.committed && !openRef.current) {
        const card = resolveCardAt(press.x, press.y);
        if (card) openDetail(card);
      }
    }
    S.press = null;
    S.dragging = false;
  };

  // The browser can claim a touch gesture mid-drag (vertical scroll on the
  // `pan-y` root). Release the same state as pointerup, but never treat the
  // interrupted press as a tap — that would open the detail view mid-scroll.
  const onPointerCancel = () => {
    const press = S.press;
    if (press) {
      try {
        rootRef.current?.releasePointerCapture(press.id);
      } catch {
        /* noop */
      }
    }
    S.press = null;
    S.dragging = false;
  };

  const onPointerLeave = () => {
    if (S.dragging) return;
    S.cursor.inside = false;
    S.hoverCard = null;
  };

  // Keep listener-bound callbacks fresh.
  useEffect(() => {
    fnRef.current = { closeDetail, renderStatic };
  });

  // ── Mount: layout, engine loop, lifecycle ────────────────────────────────
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const st = S;

    st.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    st.pointerFine = window.matchMedia("(pointer: fine)").matches;

    const box = boxRef.current;

    const measure = () => {
      const r = root.getBoundingClientRect();
      box.left = r.left;
      box.top = r.top;
      // A freshly mounted iframe reports 0x0 on the first ResizeObserver tick.
      if (r.width < 1 || r.height < 1) return false;
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      const changed = w !== box.w || h !== box.h;
      box.w = w;
      box.h = h;
      return changed;
    };

    // buildFlatRing is ~180k iterations; only pay it when the box really resizes.
    const relayout = () => {
      if (!measure()) return;
      layoutRef.current = getLayout(box.w, box.h, n);
      st.pointerFine = window.matchMedia("(pointer: fine)").matches;
      // Seed (or re-seed) the virtual cursor at centre so the parallax rests
      // neutral. The first measure inside a fresh iframe can be 0x0, so this has
      // to live here rather than after a single relayout() call.
      if (!st.cursor.inside) {
        st.cursor.x = box.w / 2;
        st.cursor.y = box.h / 2;
      }
      applyCardSizes();
      if (st.reduced) renderStatic();
    };

    relayout();

    if (st.reduced) {
      if (glassRef.current) glassRef.current.style.display = "none";
      renderStatic();
    }

    // The lens element is `display:none` below LENS_MIN_W (see the scoped style
    // tag), so nothing may animate it — or hide the system cursor for it — while
    // the frame is narrower than that.
    const updateGlass = (rendered: boolean) => {
      const el = glassRef.current;
      if (!el || !rendered) return;
      st.glass.x += (st.cursor.x - st.glass.x) * 0.22;
      st.glass.y += (st.cursor.y - st.glass.y) * 0.22;
      const scaleTgt = st.dragging ? 0.78 : st.hoverCard ? 1.5 : 1;
      st.glass.scale += (scaleTgt - st.glass.scale) * 0.18;
      const opTgt = st.cursor.inside && !st.overUI && !openRef.current ? 1 : 0;
      const opEase = st.overUI ? 0.3 : 0.18;
      st.glass.opacity += (opTgt - st.glass.opacity) * opEase;
      el.style.transform = `translate3d(${st.glass.x - 28}px, ${st.glass.y - 28}px, 0) scale(${st.glass.scale})`;
      el.style.opacity = String(st.glass.opacity);
    };

    const updateCounter = () => {
      let focused = st.hoverCard;
      if (!focused) {
        let best = Infinity;
        for (const card of cards) {
          const p = card.cur;
          const score = Math.abs(p.x) + Math.abs(p.y) - p.z;
          if (score < best) {
            best = score;
            focused = card;
          }
        }
      }
      if (focused && focused !== st.lastFocused) {
        st.lastFocused = focused;
        if (counterRef.current) {
          counterRef.current.textContent = `${pad(focused.index + 1)} — ${pad(n)}`;
        }
      }
    };

    const staggerDenom = Math.max(1, n - 1);

    const frame = (now: number) => {
      const L = layoutRef.current;
      if (!L) {
        st.raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(50, now - (st.lastTime || now));
      st.lastTime = now;
      const mode2 = modeRef.current;

      // Refresh the root's origin so hit-testing survives the page moving.
      const rr = root.getBoundingClientRect();
      box.left = rr.left;
      box.top = rr.top;

      const lensRendered = st.pointerFine && box.w >= LENS_MIN_W;
      updateGlass(lensRendered);

      // Only surrender the native cursor when the lens is actually on screen and
      // standing in for it — never at narrow widths, never over the open detail.
      if (openRef.current) root.style.cursor = "auto";
      else if (lensRendered) root.style.cursor = st.overUI ? "auto" : "none";
      else
        root.style.cursor = st.dragging
          ? "grabbing"
          : st.hoverCard
            ? "pointer"
            : mode2 === "flat"
              ? "default"
              : "grab";

      if (openRef.current) {
        st.raf = requestAnimationFrame(frame);
        return;
      }

      // Scrub momentum
      if (!st.dragging && !st.morphing) {
        st.browse += st.vel;
        st.vel *= 0.92;
        if (Math.abs(st.vel) < 0.02) st.vel = 0;
      }

      // Parallax lean
      const ty = (st.cursor.x / L.W - 0.5) * PARALLAX_MAX;
      const tx = (0.5 - st.cursor.y / L.H) * PARALLAX_MAX;
      st.curTX += (tx - st.curTX) * 0.06;
      st.curTY += (ty - st.curTY) * 0.06;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `rotateX(${st.curTX}deg) rotateY(${st.curTY}deg)`;
      }

      // Hover hit-test
      if (!st.dragging && !st.morphing && st.cursor.inside) {
        st.hoverCard = hoverHit(st.cursor.x, st.cursor.y);
      } else if (st.dragging || st.morphing) {
        st.hoverCard = null;
      }

      // Pose
      if (st.morphing) {
        st.morphMs += dt;
        let allDone = true;
        for (const card of cards) {
          const p = clamp(
            (st.morphMs - (MORPH_STAGGER * card.index) / staggerDenom) / MORPH_DUR,
            0,
            1,
          );
          if (p < 1) allDone = false;
          const pe = easeInOut(p);
          const t2 = poseFor(mode2, card.index, L, 0);
          const f = card.from;
          const cur = card.cur;
          cur.x = lerp(f.x, t2.x, pe);
          cur.y = lerp(f.y, t2.y, pe);
          cur.z = lerp(f.z, t2.z, pe);
          cur.rx = lerp(f.rx, t2.rx, pe);
          cur.ry = lerp(f.ry, t2.ry, pe);
          cur.rz = lerp(f.rz, t2.rz, pe);
          cur.s = lerp(f.s, t2.s, pe);
          cur.o = lerp(f.o, t2.o, pe);
        }
        if (allDone) st.morphing = false;
      } else {
        for (const card of cards) {
          const t2 = poseFor(mode2, card.index, L, st.browse);
          const cur = card.cur;
          // Snap on the first frame, and across tilt mode's wrap seam.
          if (!st.seeded || (mode2 === "tilt" && Math.abs(t2.x - cur.x) > L.W)) {
            cur.x = t2.x;
            cur.y = t2.y;
            cur.z = t2.z;
            cur.rx = t2.rx;
            cur.ry = t2.ry;
            cur.rz = t2.rz;
            cur.s = t2.s;
            cur.o = t2.o;
          } else {
            cur.x += (t2.x - cur.x) * SPRING;
            cur.y += (t2.y - cur.y) * SPRING;
            cur.z += (t2.z - cur.z) * SPRING;
            cur.rx += (t2.rx - cur.rx) * SPRING;
            cur.ry += (t2.ry - cur.ry) * SPRING;
            cur.rz += (t2.rz - cur.rz) * SPRING;
            cur.s += (t2.s - cur.s) * SPRING;
            cur.o += (t2.o - cur.o) * SPRING;
          }
        }
        st.seeded = true;
      }

      // Hover ease → --hv
      for (const card of cards) {
        card.hov += ((card === st.hoverCard ? 1 : 0) - card.hov) * HOVER_EASE;
      }

      // Depth-swap cross-fade (second pass — all poses final)
      for (const card of cards) {
        let tgt = 0;
        const a = card.cur;
        for (const other of cards) {
          if (other === card) continue;
          const b = other.cur;
          if (
            Math.abs(a.x - b.x) < (L.cardW * a.s + L.cardW * b.s) / 2 &&
            Math.abs(a.y - b.y) < (L.cardH * a.s + L.cardH * b.s) / 2
          ) {
            const gapNow = a.z - b.z;
            const prox = Math.max(0, 1 - Math.abs(gapNow) / SWAP_BAND);
            const gapPrev = card.prevZ - other.prevZ;
            const cross = Math.min(1, Math.abs(gapNow - gapPrev) / SWAP_SPEED_REF);
            const v = prox * cross;
            if (v > tgt) tgt = v;
          }
        }
        card.swap += (tgt - card.swap) * 0.3;
      }

      // Write
      for (const card of cards) {
        const cur = card.cur;
        if (card.outer) {
          card.outer.style.transform = `translate3d(${cur.x}px, ${cur.y}px, ${cur.z}px) rotateX(${cur.rx}deg) rotateY(${cur.ry}deg) rotateZ(${cur.rz}deg) scale(${cur.s})`;
          card.outer.style.opacity = String(cur.o * (1 - card.swap * (1 - SWAP_FLOOR)));
        }
        card.inner?.style.setProperty("--hv", String(card.hov));
        card.prevZ = cur.z;
      }

      updateCounter();
      st.raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!st.raf && !st.reduced) {
        st.lastTime = 0;
        st.raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      if (st.raf) {
        cancelAnimationFrame(st.raf);
        st.raf = 0;
      }
    };
    const evalRun = () => {
      if (st.onScreen && st.visible) start();
      else stop();
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        st.onScreen = entry.isIntersecting;
        evalRun();
      },
      { threshold: 0 },
    );
    io.observe(root);

    const onVis = () => {
      st.visible = document.visibilityState === "visible";
      evalRun();
    };
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(() => relayout());
    ro.observe(root);
    window.addEventListener("resize", relayout);

    const onWheel = (e: WheelEvent) => {
      if (isUI(e.target)) return;
      if (openRef.current || st.reduced) return;
      e.preventDefault();
      if (st.morphing) return;
      const gain = modeRef.current === "flat" || modeRef.current === "ring" ? 0.6 : 0.8;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const impulse = -delta * gain;
      st.browse += impulse;
      st.vel = impulse * 0.25;
    };
    root.addEventListener("wheel", onWheel, { passive: false });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openRef.current) fnRef.current.closeDetail();
    };
    window.addEventListener("keydown", onKey);

    if (!st.reduced) start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", relayout);
      root.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      closeTlRef.current?.kill();
      closeTlRef.current = null;
      // Let a StrictMode remount re-seed poses from scratch, and re-arm the
      // "first mode" short-circuit so the remount doesn't morph from a zero pose.
      st.seeded = false;
      firstMode.current = true;
      box.w = 0;
      box.h = 0;
    };
    // applyCardSizes / hoverHit / renderStatic close over refs and `cards` only,
    // so re-running the engine for them would tear down the loop for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, n, S]);

  // Entrance bloom (the card inners), kicked off on fonts.ready.
  useEffect(() => {
    const inners = cards.map((c) => c.inner).filter((el): el is HTMLDivElement => el !== null);
    if (!inners.length) return;
    if (S.reduced) {
      gsap.set(inners, { opacity: 1, scale: 1, filter: "none", yPercent: 0 });
      return;
    }
    gsap.set(inners, {
      opacity: 0,
      scale: 0.7,
      filter: "blur(10px)",
      yPercent: 8,
    });
    let cancelled = false;
    let tween: gsap.core.Tween | null = null;
    const play = () => {
      if (cancelled) return;
      tween = gsap.to(inners, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        yPercent: 0,
        duration: 1.0,
        ease: "power4.out",
        delay: 0.1,
        stagger: { each: 0.035, from: "edges" },
      });
    };
    void document.fonts.ready.then(play);
    return () => {
      cancelled = true;
      tween?.kill();
    };
  }, [cards, S]);

  // Mode change → begin the morph (or static re-render under reduced motion).
  useEffect(() => {
    modeRef.current = mode;
    if (firstMode.current) {
      firstMode.current = false;
      return;
    }
    if (S.reduced) {
      fnRef.current.renderStatic();
      return;
    }
    for (const card of cards) {
      const c = card.cur;
      const f = card.from;
      f.x = c.x;
      f.y = c.y;
      f.z = c.z;
      f.rx = c.rx;
      f.ry = c.ry;
      f.rz = c.rz;
      f.s = c.s;
      f.o = c.o;
    }
    S.browse = 0;
    S.vel = 0;
    S.morphing = true;
    S.morphMs = 0;
    // No cleanup here: this effect re-runs on every mode change, so resetting
    // `firstMode` from a cleanup would swallow every other morph. The reset
    // lives in the engine effect's cleanup, which only runs on unmount.
  }, [mode, cards, S]);

  // Detail open timeline (the eyelid blink).
  useEffect(() => {
    if (!detail || !mounted) return;
    const lids = [lidTopRef.current, lidBotRef.current];
    const reveals = detailBoxRef.current?.querySelectorAll("[data-fm-reveal]");

    if (S.reduced) {
      gsap.set(lids, { scaleY: 0 });
      gsap.set([bdRef.current, imgWrapRef.current, scrimRef.current, closeBtnRef.current], {
        opacity: 1,
      });
      gsap.set(imgInnerRef.current, { scale: 1 });
      gsap.set(ruleRef.current, { scaleX: 1 });
      gsap.set(titleRef.current, { yPercent: 0 });
      if (reveals) gsap.set(reveals, { y: 0, opacity: 1 });
      openingRef.current = false;
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        openingRef.current = false;
      },
    });
    openTlRef.current = tl;
    gsap.set(lids, { scaleY: 0 });
    gsap.set(bdRef.current, { opacity: 0 });
    gsap.set(imgWrapRef.current, { opacity: 0 });
    gsap.set(imgInnerRef.current, { scale: 1.4 });
    gsap.set(scrimRef.current, { opacity: 0 });
    gsap.set(closeBtnRef.current, { opacity: 0 });
    gsap.set(ruleRef.current, { scaleX: 0 });
    gsap.set(titleRef.current, { yPercent: 120 });
    gsap.set(detailBoxRef.current, { autoAlpha: 1 });
    if (reveals) gsap.set(reveals, { y: 26, opacity: 0 });

    tl.to(lids, { scaleY: 1, duration: 0.6, ease: "power2.inOut" }, 0)
      .add(() => {
        gsap.set(bdRef.current, { opacity: 1 });
        gsap.set(imgWrapRef.current, { opacity: 1 });
      }, 0.62)
      .to(imgInnerRef.current, { scale: 1, duration: 2.2, ease: "power2.out" }, 0.62)
      .to(lids, { scaleY: 0, duration: 1.0, ease: "power3.out" }, 0.7)
      .to(scrimRef.current, { opacity: 1, duration: 0.7 }, 1.1)
      .to(closeBtnRef.current, { opacity: 1, duration: 0.5 }, 1.45)
      .to(ruleRef.current, { scaleX: 1, duration: 0.6 }, 1.45)
      .to(titleRef.current, { yPercent: 0, duration: 0.95, ease: "power4.out" }, 1.5)
      .to(reveals ?? [], { y: 0, opacity: 1, duration: 0.7, stagger: 0.1 }, 1.62);

    return () => {
      tl.kill();
    };
  }, [detail, mounted, S]);

  const stageStyle: CustomCSS = {
    touchAction: "pan-y",
    fontFamily: SANS,
    "--fm-bg": "#0a0a0a",
    "--fm-fg": "#fafafa",
    background: "linear-gradient(180deg, #121215 0%, #09090b 100%)",
    color: "rgba(255,255,255,0.92)",
  };

  const open = mounted && detail !== null;
  const work = detail?.card.work ?? null;
  const detailNo = detail ? `${pad(detail.card.index + 1)} — ${pad(n)}` : "";

  return (
    <section
      ref={rootRef}
      className="relative h-full w-full select-none overflow-hidden"
      style={stageStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
    >
      {/* The lens is a fine-pointer affordance only — on touch it would freeze
          at its last known position. Scoped <style> rather than Tailwind
          variants so a brand-new package can't miss utility generation. */}
      <style>{`.fm-glass{display:none}@media (pointer:fine) and (min-width:${LENS_MIN_W}px){.fm-glass{display:block}}`}</style>

      {/* Liquid-glass filter: three displacement passes at 33/31/29 recombined
          per channel, which is where the chromatic fringing comes from. */}
      <svg width={0} height={0} aria-hidden className="absolute">
        <filter
          id={filterId}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={GLASS_NORMAL_MAP}
            x="0"
            y="0"
            width="56"
            height="56"
            preserveAspectRatio="none"
            result="map"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="src" />
          <feDisplacementMap
            in="src"
            in2="map"
            scale="33"
            xChannelSelector="R"
            yChannelSelector="G"
            result="d1"
          />
          <feDisplacementMap
            in="src"
            in2="map"
            scale="31"
            xChannelSelector="R"
            yChannelSelector="G"
            result="d2"
          />
          <feDisplacementMap
            in="src"
            in2="map"
            scale="29"
            xChannelSelector="R"
            yChannelSelector="G"
            result="d3"
          />
          <feColorMatrix
            in="d1"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="cr"
          />
          <feColorMatrix
            in="d2"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="cg"
          />
          <feColorMatrix
            in="d3"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="cb"
          />
          <feBlend in="cr" in2="cg" mode="screen" result="crg" />
          <feBlend in="crg" in2="cb" mode="screen" result="crgb" />
          <feGaussianBlur in="crgb" stdDeviation="0.5" />
        </filter>
      </svg>

      {/* The 3D stage */}
      <div
        className="absolute inset-0"
        style={{ perspective: `${PERSP}px`, perspectiveOrigin: "50% 50%" }}
      >
        <div
          ref={parallaxRef}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {cards.map((card) => (
            <div
              key={card.index}
              ref={(el) => {
                card.outer = el;
              }}
              className="absolute left-1/2 top-1/2"
              style={{ transformStyle: "preserve-3d", opacity: 0 }}
            >
              {/* Outer is driven by the rAF loop, inner by GSAP. Keeping them
                  separate is what stops the two systems fighting. */}
              <div
                ref={(el) => {
                  card.inner = el;
                }}
                className="absolute inset-0 overflow-hidden"
                style={{
                  borderRadius: 12,
                  boxShadow: "0 16px 40px -16px rgba(0,0,0,0.55)",
                  opacity: 0,
                }}
              >
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    borderRadius: 12,
                    transform: `scale(calc(1 + ${HOVER_ZOOM} * var(--hv, 0)))`,
                  }}
                >
                  {/* A background image, not <img>: no native drag ghost to fight. */}
                  <div
                    className="absolute inset-0"
                    style={{
                      borderRadius: 12,
                      backgroundImage: `url(${card.work.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "saturate(0.98) contrast(1.03)",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Focus counter */}
      <footer
        className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex items-end justify-end p-5 sm:px-8"
        style={{ color: "var(--fm-fg)" }}
      >
        <span
          ref={counterRef}
          className="hidden uppercase sm:block"
          style={{
            fontFamily: MONO,
            fontVariantNumeric: "tabular-nums",
            fontSize: "0.64rem",
            letterSpacing: "0.2em",
            opacity: 0.5,
          }}
        >
          {`01 — ${pad(n)}`}
        </span>
      </footer>

      {/* Formation dock */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6 sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-5 sm:justify-end sm:px-0 sm:pr-6">
        <div
          role="tablist"
          data-fm-ui
          className="pointer-events-auto flex gap-1 rounded-full p-1"
          style={{
            background: "color-mix(in srgb, var(--fm-bg) 72%, transparent)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid color-mix(in srgb, var(--fm-fg) 12%, transparent)",
            boxShadow: "0 14px 40px -20px rgba(0,0,0,0.5)",
          }}
        >
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setMode(m.id)}
                className="rounded-full transition-colors"
                style={{
                  fontFamily: SANS,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  padding: "6px 14px",
                  border: "1px solid transparent",
                  background: active ? "var(--fm-fg)" : "transparent",
                  color: active ? "var(--fm-bg)" : "var(--fm-fg)",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail — eyelid blink */}
      {open && work && (
        <div className="absolute inset-0" style={{ zIndex: 5000 }}>
          <div
            ref={bdRef}
            onClick={closeDetail}
            className="absolute inset-0"
            style={{ background: "#050505", opacity: 0 }}
          />
          <div className="absolute inset-0 overflow-hidden">
            <div ref={imgWrapRef} className="absolute inset-0" style={{ opacity: 0 }}>
              <div
                ref={imgInnerRef}
                className="absolute inset-0"
                style={{ transformOrigin: "center", transform: "scale(1.4)" }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${work.image})`,
                    backgroundColor: "#0a0a0a",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "saturate(0.98) contrast(1.03)",
                  }}
                />
              </div>
            </div>

            <div
              ref={scrimRef}
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: 0,
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.42) 36%, rgba(0,0,0,0) 64%), linear-gradient(0deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 44%)",
              }}
            />

            <div
              ref={detailBoxRef}
              className="absolute text-white"
              style={{
                left: "6vw",
                right: "6vw",
                bottom: "8vh",
                maxWidth: 760,
              }}
            >
              <div
                data-fm-reveal
                className="mb-4 flex items-center gap-3 uppercase"
                style={{
                  fontFamily: MONO,
                  fontSize: "0.72rem",
                  letterSpacing: "0.24em",
                  opacity: 0,
                }}
              >
                <span
                  ref={ruleRef}
                  style={{
                    display: "inline-block",
                    width: 32,
                    height: 2,
                    background: work.accent,
                    transformOrigin: "left center",
                    transform: "scaleX(0)",
                  }}
                />
                {work.category}
              </div>

              <div className="overflow-hidden">
                <h2
                  ref={titleRef}
                  style={{
                    fontFamily: SANS,
                    fontWeight: 800,
                    fontSize: "clamp(2.6rem, 6.4vw, 5.4rem)",
                    lineHeight: 0.97,
                    letterSpacing: "-0.04em",
                    transform: "translateY(120%)",
                  }}
                >
                  {work.title}
                </h2>
              </div>

              <div
                data-fm-reveal
                className="mt-6 inline-flex items-baseline gap-3 pt-4 uppercase"
                style={{
                  fontFamily: MONO,
                  fontSize: "0.62rem",
                  letterSpacing: "0.2em",
                  fontVariantNumeric: "tabular-nums",
                  borderTop: "1px solid rgba(255,255,255,0.22)",
                  opacity: 0,
                  transform: "translateY(26px)",
                }}
              >
                <span style={{ opacity: 0.55 }}>№</span>
                <span>{detailNo}</span>
              </div>
            </div>

            <button
              ref={closeBtnRef}
              data-fm-ui
              type="button"
              aria-label="Close"
              onClick={closeDetail}
              className="absolute flex items-center justify-center rounded-full text-white"
              style={{
                right: 20,
                top: 20,
                width: 44,
                height: 44,
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                opacity: 0,
              }}
            >
              <X className="size-5" />
            </button>

            <div
              ref={lidTopRef}
              className="absolute inset-x-0 top-0"
              style={{
                height: "51%",
                background: "#050505",
                transformOrigin: "top",
                transform: "scaleY(0)",
                zIndex: 20,
              }}
            />
            <div
              ref={lidBotRef}
              className="absolute inset-x-0 bottom-0"
              style={{
                height: "51%",
                background: "#050505",
                transformOrigin: "bottom",
                transform: "scaleY(0)",
                zIndex: 20,
              }}
            />
          </div>
        </div>
      )}

      {/* Liquid-glass cursor */}
      <div
        ref={glassRef}
        className="fm-glass"
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 6000,
          width: 56,
          height: 56,
          borderRadius: 9999,
          pointerEvents: "none",
          opacity: 0,
          willChange: "transform",
          transform: "translate3d(-100px, -100px, 0)",
          backdropFilter: `url(#${filterId}) saturate(1.5) brightness(1.05)`,
          WebkitBackdropFilter: `url(#${filterId}) saturate(1.5) brightness(1.05)`,
          background:
            "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.5), rgba(255,255,255,0.04) 44%, rgba(255,255,255,0) 70%)",
          boxShadow:
            "inset 0 1px 2px rgba(255,255,255,0.85), inset 0 0 0 1px rgba(255,255,255,0.3), inset 0 -12px 18px rgba(0,0,0,0.16), inset 0 12px 18px rgba(255,255,255,0.12), 0 12px 30px -8px rgba(0,0,0,0.4)",
        }}
      />
    </section>
  );
};
