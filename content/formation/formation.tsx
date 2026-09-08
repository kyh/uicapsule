"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { X } from "lucide-react";

import type { FmLayout, FormationMode, Pose, Work } from "./formation-poses";
import {
  clamp,
  copyPose,
  easeInOut,
  focusScore,
  getLayout,
  GLASS_NORMAL_MAP,
  HOVER_EASE,
  HOVER_ZOOM,
  lerpPose,
  MODES,
  MORPH_DUR,
  MORPH_STAGGER,
  PARALLAX_MAX,
  PERSP,
  poseFor,
  poseTransform,
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

// Narrowest *root* width that gets the custom lens cursor. The lens is also a
// fine-pointer affordance only — on touch it would freeze at its last known
// position. Both conditions live in JS (`LoopState.lens`, which also drives the
// element's `display`) rather than a CSS media query, because a query would test
// the viewport while every other measurement here is root-relative: embedded
// narrower than the window, the two disagree.
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
  /** Is the lens cursor currently rendered? Recomputed on layout, not per frame. */
  lens: boolean;
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
  /**
   * The pointer currently being tracked, if any. `committed` means it has moved
   * past the tap slop and is now scrubbing — i.e. it *is* the drag state, so
   * there is no separate `dragging` flag to fall out of sync with it.
   */
  press: { x: number; y: number; id: number; committed: boolean } | null;
  /** Previous pointer x, root-relative — the scrub delta is measured against it. */
  lastX: number;
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
  lens: false,
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
  press: null,
  lastX: 0,
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

/** Scrubbing is exactly "a tracked pointer that has passed the tap slop". */
const isDragging = (s: LoopState) => s.press?.committed === true;

const isUI = (target: EventTarget | null) =>
  target instanceof Element && target.closest("[data-fm-ui]") !== null;

interface FormationProps {
  works: Work[];
}

export const Formation = ({ works }: FormationProps): ReactNode => {
  const [mode, setMode] = useState<FormationMode>("flat");
  const [detail, setDetail] = useState<{ card: CardState } | null>(null);

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
      copyPose(card.cur, p);
      if (card.outer) {
        card.outer.style.transform = poseTransform(p);
        card.outer.style.opacity = String(p.o);
      }
      card.inner?.style.setProperty("--hv", "0");
      const score = focusScore(p);
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
      setDetail(null);
      return;
    }
    closingRef.current = true;
    const lids = [lidTopRef.current, lidBotRef.current];
    const tl = gsap.timeline({
      onComplete: () => {
        closingRef.current = false;
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
  // Every handler is gated on the tracked `pointerId`: on touch, a second
  // contact landing mid-swipe must not hijack the drag (or, worse, be read as a
  // tap and open the detail view under the finger that is still scrubbing).
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (openRef.current) return;
    if (isUI(e.target)) return;
    if (S.press) return;
    const box = boxRef.current;
    const lx = e.clientX - box.left;
    const ly = e.clientY - box.top;
    S.cursor.x = lx;
    S.cursor.y = ly;
    S.cursor.inside = true;
    S.lastX = lx;
    S.press = { x: lx, y: ly, id: e.pointerId, committed: false };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const press = S.press;
    if (press && press.id !== e.pointerId) return;
    const box = boxRef.current;
    const lx = e.clientX - box.left;
    const ly = e.clientY - box.top;
    S.cursor.x = lx;
    S.cursor.y = ly;
    S.cursor.inside = true;
    S.overUI = isUI(e.target);
    if (openRef.current) return;
    if (press && !S.morphing) {
      if (!press.committed) {
        const dist = Math.hypot(lx - press.x, ly - press.y);
        // 8px of slop, so a click still opens the detail view.
        if (dist > 8) {
          press.committed = true;
          try {
            rootRef.current?.setPointerCapture(press.id);
          } catch {
            /* noop */
          }
        }
      }
      if (press.committed) {
        const gain = modeRef.current === "flat" || modeRef.current === "ring" ? 1.4 : 1;
        const d = (lx - S.lastX) * gain;
        S.browse += d;
        S.vel = d;
      }
    }
    S.lastX = lx;
  };

  /** `mayTap`: a press that never committed opens the detail view it ended on. */
  const endPress = (e: ReactPointerEvent<HTMLElement>, mayTap: boolean) => {
    const press = S.press;
    if (!press || press.id !== e.pointerId) return;
    const root = rootRef.current;
    if (root?.hasPointerCapture(press.id)) root.releasePointerCapture(press.id);
    S.press = null;
    if (mayTap && !press.committed && !openRef.current) {
      const card = resolveCardAt(press.x, press.y);
      if (card) openDetail(card);
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => endPress(e, true);

  // The browser can claim a touch gesture mid-drag (vertical scroll on the
  // `pan-y` root). Release the same state as pointerup, but never treat the
  // interrupted press as a tap — that would open the detail view mid-scroll.
  const onPointerCancel = (e: ReactPointerEvent<HTMLElement>) => endPress(e, false);

  const onPointerLeave = () => {
    // An uncommitted press can be released outside the root — no capture has
    // been taken yet, so its `pointerup` lands elsewhere and never reaches us.
    // Dropping it here is what stops the next re-entry from resuming a drag
    // with no button held.
    if (S.press && !S.press.committed) S.press = null;
    if (isDragging(S)) return;
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
      // The lens's visibility and the loop's "may I hide the native cursor?"
      // test are the same decision, made once here, in the same units.
      st.lens = !st.reduced && st.pointerFine && box.w >= LENS_MIN_W;
      if (glassRef.current) glassRef.current.style.display = st.lens ? "block" : "none";
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

    // Seeds the layout and, under reduced motion, paints the one static frame.
    relayout();

    const updateGlass = () => {
      const el = glassRef.current;
      if (!el || !st.lens) return;
      st.glass.x += (st.cursor.x - st.glass.x) * 0.22;
      st.glass.y += (st.cursor.y - st.glass.y) * 0.22;
      const scaleTgt = isDragging(st) ? 0.78 : st.hoverCard ? 1.5 : 1;
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
          const score = focusScore(card.cur);
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
      const dragging = isDragging(st);

      // Measure first, then write. `hoverHit` reads every card's client rect, so
      // any style write before it forces a synchronous layout every frame.
      // Refresh the root's origin so hit-testing survives the page moving.
      const rr = root.getBoundingClientRect();
      box.left = rr.left;
      box.top = rr.top;

      // Hover hit-test (skipped while the detail view owns the screen, so
      // `hoverCard` stays as `openDetail` left it).
      if (!openRef.current) {
        if (dragging || st.morphing) st.hoverCard = null;
        else if (st.cursor.inside) st.hoverCard = hoverHit(st.cursor.x, st.cursor.y);
      }

      updateGlass();

      // Only surrender the native cursor when the lens is actually on screen and
      // standing in for it — never at narrow widths, never over the open detail.
      if (openRef.current) root.style.cursor = "auto";
      else if (st.lens) root.style.cursor = st.overUI ? "auto" : "none";
      else
        root.style.cursor = dragging
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
      if (!dragging && !st.morphing) {
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
          lerpPose(card.cur, card.from, poseFor(mode2, card.index, L, 0), easeInOut(p));
        }
        if (allDone) st.morphing = false;
      } else {
        for (const card of cards) {
          const t2 = poseFor(mode2, card.index, L, st.browse);
          const cur = card.cur;
          // Snap on the first frame, and across tilt mode's wrap seam.
          if (!st.seeded || (mode2 === "tilt" && Math.abs(t2.x - cur.x) > L.W)) copyPose(cur, t2);
          else lerpPose(cur, cur, t2, SPRING);
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
          card.outer.style.transform = poseTransform(cur);
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
    for (const card of cards) copyPose(card.from, card.cur);
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
    if (!detail) return;
    const lids = [lidTopRef.current, lidBotRef.current];
    const reveals = detailBoxRef.current?.querySelectorAll("[data-fm-reveal]");
    // The dialog is modal (the stage behind it is `inert`), so focus has to move
    // into it — otherwise Tab lands on controls hidden behind an opaque overlay.
    const restoreTo = document.activeElement;
    closeBtnRef.current?.focus({ preventScroll: true });

    // The <h2> ships hidden below its clip mask via `translateY(120%)`, which
    // GSAP reads back as a *pixel* `y` and would then add the percentage on top
    // of. Zeroing `y` here hands the offset over to `yPercent` cleanly — the
    // 120% has to stay height-relative for the tween to land flush.
    const setTitle = (yPercent: number) => gsap.set(titleRef.current, { y: 0, yPercent });

    const restoreFocus = () => {
      if (restoreTo instanceof HTMLElement) restoreTo.focus({ preventScroll: true });
    };

    if (S.reduced) {
      gsap.set(lids, { scaleY: 0 });
      gsap.set([bdRef.current, imgWrapRef.current, scrimRef.current, closeBtnRef.current], {
        opacity: 1,
      });
      gsap.set(imgInnerRef.current, { scale: 1 });
      gsap.set(ruleRef.current, { scaleX: 1 });
      setTitle(0);
      if (reveals) gsap.set(reveals, { y: 0, opacity: 1 });
      openingRef.current = false;
      return restoreFocus;
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
    setTitle(120);
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
      restoreFocus();
    };
  }, [detail, S]);

  const stageStyle: CustomCSS = {
    touchAction: "pan-y",
    fontFamily: SANS,
    "--fm-bg": "#0a0a0a",
    "--fm-fg": "#fafafa",
    background: "linear-gradient(180deg, #121215 0%, #09090b 100%)",
    color: "rgba(255,255,255,0.92)",
  };

  const open = detail !== null;
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

      {/* The 3D stage. `inert` while the detail is open so Tab can't reach a
          card sitting behind an opaque overlay. */}
      <div
        className="absolute inset-0"
        inert={open}
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
              // Not a <button>: this element's transform is rewritten every
              // frame and it must stay free of UA box/typography styling. It
              // carries the button *semantics* instead, so the detail view has a
              // keyboard entry point to match the pointer one.
              role="button"
              tabIndex={0}
              aria-label={card.work.title}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                openDetail(card);
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
      <div
        inert={open}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6 sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-5 sm:justify-end sm:px-0 sm:pr-6"
      >
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
      {work && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={work.title}
          className="absolute inset-0"
          style={{ zIndex: 5000 }}
        >
          {/* Click-anywhere-to-close: the image plate above this backdrop is
              full-bleed, so it (and everything decorative inside it) has to stay
              transparent to pointer events for the backdrop to be reachable at
              all. The close button opts back in. */}
          <div
            ref={bdRef}
            onClick={closeDetail}
            className="absolute inset-0"
            style={{ background: "#050505", opacity: 0 }}
          />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
              className="pointer-events-auto absolute flex items-center justify-center rounded-full text-white"
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
        aria-hidden
        style={{
          position: "absolute",
          // `relayout` owns this — it flips to `block` only where the lens is
          // both wanted (fine pointer, wide enough root) and animated.
          display: "none",
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
