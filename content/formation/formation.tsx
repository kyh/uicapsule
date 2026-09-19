"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

import type { FmLayout, FormationMode, Pose, Work } from "./formation-poses";
import {
  clamp,
  copyPose,
  easeInOut,
  focusScore,
  getLayout,
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
  /**
   * The pointer currently being tracked, if any. `committed` means it has moved
   * past the tap slop and is now scrubbing — i.e. it *is* the drag state, so
   * there is no separate `dragging` flag to fall out of sync with it.
   */
  press: { x: number; y: number; id: number; committed: boolean } | null;
  /** Previous pointer x, root-relative — the scrub delta is measured against it. */
  lastX: number;
}

const zeroPose = (): Pose => ({
  o: 0,
  rx: 0,
  ry: 0,
  rz: 0,
  s: 1,
  x: 0,
  y: 0,
  z: 0,
});

const createState = (): LoopState => ({
  browse: 0,
  curTX: 0,
  curTY: 0,
  cursor: { inside: false, x: 0, y: 0 },
  hoverCard: null,
  lastFocused: null,
  lastTime: 0,
  lastX: 0,
  morphMs: 0,
  morphing: false,
  onScreen: true,
  press: null,
  raf: 0,
  reduced: false,
  seeded: false,
  vel: 0,
  visible: true,
});

const makeCards = (works: Work[]): CardState[] =>
  works.map((work, index) => ({
    cur: zeroPose(),
    from: zeroPose(),
    hov: 0,
    index,
    inner: null,
    outer: null,
    prevZ: 0,
    swap: 0,
    work,
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

  const rootRef = useRef<HTMLElement | null>(null);
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<HTMLSpanElement | null>(null);

  // Mutable engine state (never triggers a re-render)
  const sRef = useRef<LoopState | null>(null);
  if (!sRef.current) {
    sRef.current = createState();
  }
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
  const boxRef = useRef({ h: 0, left: 0, top: 0, w: 0 });
  const modeRef = useRef<FormationMode>("flat");
  const firstMode = useRef(true);
  const renderStaticRef = useRef<() => void>(() => {
    /* empty */
  });

  // ── Geometry helpers (read refs only — safe to capture once) ─────────────
  const applyCardSizes = () => {
    const L = layoutRef.current;
    if (!L) {
      return;
    }
    for (const card of cards) {
      const { outer } = card;
      if (!outer) {
        continue;
      }
      outer.style.width = `${L.cardW}px`;
      outer.style.height = `${L.cardH}px`;
      outer.style.marginLeft = `${-L.cardW / 2}px`;
      outer.style.marginTop = `${-L.cardH / 2}px`;
    }
  };

  /** Painter's-algorithm hit test in root-relative space; highest z wins. */
  const hoverHit = (px: number, py: number) => {
    const box = boxRef.current;
    const inRect = (el: HTMLDivElement) => {
      const r = el.getBoundingClientRect();
      const l = r.left - box.left;
      const t = r.top - box.top;
      return px >= l && px <= l + r.width && py >= t && py <= t + r.height;
    };
    const stickyCard = S.hoverCard;
    // Bias toward whatever is already hovered so a hairline overlap can't flicker.
    if (stickyCard && stickyCard.cur.o >= 0.5 && stickyCard.outer && inRect(stickyCard.outer)) {
      return stickyCard;
    }
    let best: CardState | null = null;
    let bestZ = -Infinity;
    for (const card of cards) {
      if (card.cur.o < 0.5) {
        continue;
      }
      const el = card.outer;
      if (!el) {
        continue;
      }
      if (inRect(el) && card.cur.z > bestZ) {
        bestZ = card.cur.z;
        best = card;
      }
    }
    return best;
  };

  const renderStatic = () => {
    const L = layoutRef.current;
    if (!L) {
      return;
    }
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
    if (parallaxRef.current) {
      parallaxRef.current.style.transform = "";
    }
    if (counterRef.current && focused) {
      counterRef.current.textContent = `${pad(focused.index + 1)} — ${pad(n)}`;
    }
  };

  // ── Pointer input (React handlers → latest closures) ─────────────────────
  // Every handler is gated on the tracked `pointerId`: on touch, a second
  // contact landing mid-swipe must not hijack the drag.
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (isUI(e.target)) {
      return;
    }
    if (S.press) {
      return;
    }
    const box = boxRef.current;
    const lx = e.clientX - box.left;
    const ly = e.clientY - box.top;
    S.cursor.x = lx;
    S.cursor.y = ly;
    S.cursor.inside = true;
    S.lastX = lx;
    S.press = { committed: false, id: e.pointerId, x: lx, y: ly };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const { press } = S;
    if (press && press.id !== e.pointerId) {
      return;
    }
    const box = boxRef.current;
    const lx = e.clientX - box.left;
    const ly = e.clientY - box.top;
    S.cursor.x = lx;
    S.cursor.y = ly;
    S.cursor.inside = true;
    if (press && !S.morphing) {
      if (!press.committed) {
        const dist = Math.hypot(lx - press.x, ly - press.y);
        // 8px of slop so a jittery tap on touch doesn't nudge the carousel.
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

  const endPress = (e: ReactPointerEvent<HTMLElement>) => {
    const { press } = S;
    if (!press || press.id !== e.pointerId) {
      return;
    }
    const root = rootRef.current;
    if (root?.hasPointerCapture(press.id)) {
      root.releasePointerCapture(press.id);
    }
    S.press = null;
  };

  const onPointerLeave = () => {
    // An uncommitted press can be released outside the root — no capture has
    // been taken yet, so its `pointerup` lands elsewhere and never reaches us.
    // Dropping it here is what stops the next re-entry from resuming a drag
    // with no button held.
    if (S.press && !S.press.committed) {
      S.press = null;
    }
    if (isDragging(S)) {
      return;
    }
    S.cursor.inside = false;
    S.hoverCard = null;
  };

  // Keep the mode effect's reduced-motion path on the latest closure.
  useEffect(() => {
    renderStaticRef.current = renderStatic;
  });

  // ── Mount: layout, engine loop, lifecycle ────────────────────────────────
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const st = S;

    st.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const box = boxRef.current;

    const measure = () => {
      const r = root.getBoundingClientRect();
      box.left = r.left;
      box.top = r.top;
      // A freshly mounted iframe reports 0x0 on the first ResizeObserver tick.
      if (r.width < 1 || r.height < 1) {
        return false;
      }
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      const changed = w !== box.w || h !== box.h;
      box.w = w;
      box.h = h;
      return changed;
    };

    // buildFlatRing is ~180k iterations; only pay it when the box really resizes.
    const relayout = () => {
      if (!measure()) {
        return;
      }
      layoutRef.current = getLayout(box.w, box.h, n);
      // Seed (or re-seed) the virtual cursor at centre so the parallax rests
      // neutral. The first measure inside a fresh iframe can be 0x0, so this has
      // to live here rather than after a single relayout() call.
      if (!st.cursor.inside) {
        st.cursor.x = box.w / 2;
        st.cursor.y = box.h / 2;
      }
      applyCardSizes();
      if (st.reduced) {
        renderStatic();
      }
    };

    // Seeds the layout and, under reduced motion, paints the one static frame.
    relayout();

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

    const advancePoses = (L: FmLayout, mode2: FormationMode, dt: number) => {
      if (st.morphing) {
        st.morphMs += dt;
        let allDone = true;
        for (const card of cards) {
          const p = clamp(
            (st.morphMs - (MORPH_STAGGER * card.index) / staggerDenom) / MORPH_DUR,
            0,
            1,
          );
          if (p < 1) {
            allDone = false;
          }
          lerpPose(card.cur, card.from, poseFor(mode2, card.index, L, 0), easeInOut(p));
        }
        if (allDone) {
          st.morphing = false;
        }
        return;
      }
      for (const card of cards) {
        const t2 = poseFor(mode2, card.index, L, st.browse);
        const { cur } = card;
        // Snap on the first frame, and across tilt mode's wrap seam.
        if (!st.seeded || (mode2 === "tilt" && Math.abs(t2.x - cur.x) > L.W)) {
          copyPose(cur, t2);
        } else {
          lerpPose(cur, cur, t2, SPRING);
        }
      }
      st.seeded = true;
    };

    // Depth-swap cross-fade target: how hard this card is crossing another in z.
    const swapTarget = (card: CardState, L: FmLayout) => {
      let tgt = 0;
      const a = card.cur;
      for (const other of cards) {
        if (other === card) {
          continue;
        }
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
          if (v > tgt) {
            tgt = v;
          }
        }
      }
      return tgt;
    };

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

      if (dragging || st.morphing) {
        st.hoverCard = null;
      } else if (st.cursor.inside) {
        st.hoverCard = hoverHit(st.cursor.x, st.cursor.y);
      }

      root.style.cursor = dragging ? "grabbing" : "grab";

      // Scrub momentum
      if (!dragging && !st.morphing) {
        st.browse += st.vel;
        st.vel *= 0.92;
        if (Math.abs(st.vel) < 0.02) {
          st.vel = 0;
        }
      }

      // Parallax lean
      const ty = (st.cursor.x / L.W - 0.5) * PARALLAX_MAX;
      const tx = (0.5 - st.cursor.y / L.H) * PARALLAX_MAX;
      st.curTX += (tx - st.curTX) * 0.06;
      st.curTY += (ty - st.curTY) * 0.06;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `rotateX(${st.curTX}deg) rotateY(${st.curTY}deg)`;
      }

      advancePoses(L, mode2, dt);

      // Hover ease → --hv
      for (const card of cards) {
        card.hov += ((card === st.hoverCard ? 1 : 0) - card.hov) * HOVER_EASE;
      }

      // Depth-swap cross-fade (second pass — all poses final)
      for (const card of cards) {
        card.swap += (swapTarget(card, L) - card.swap) * 0.3;
      }

      // Write
      for (const card of cards) {
        const { cur } = card;
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
      if (st.onScreen && st.visible) {
        start();
      } else {
        stop();
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) {
          return;
        }
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
      if (isUI(e.target)) {
        return;
      }
      if (st.reduced) {
        return;
      }
      e.preventDefault();
      if (st.morphing) {
        return;
      }
      const gain = modeRef.current === "flat" || modeRef.current === "ring" ? 0.6 : 0.8;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const impulse = -delta * gain;
      st.browse += impulse;
      st.vel = impulse * 0.25;
    };
    root.addEventListener("wheel", onWheel, { passive: false });

    if (!st.reduced) {
      start();
    }

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", relayout);
      root.removeEventListener("wheel", onWheel);
      // Let a StrictMode remount re-seed poses from scratch, and re-arm the
      // "first mode" short-circuit so the remount doesn't morph from a zero pose.
      st.seeded = false;
      firstMode.current = true;
      box.w = 0;
      box.h = 0;
    };
    // applyCardSizes / hoverHit / renderStatic close over refs and `cards` only,
    // so re-running the engine for them would tear down the loop for nothing.
    // oxlint-disable-next-line react/rule-suppression -- the component reads its engine refs during render by design; letting the compiler in surfaces ~20 refs/immutability errors that need a state-model rewrite, not a deps fix
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, n, S]);

  // Entrance bloom (the card inners), kicked off on fonts.ready.
  useEffect(() => {
    const inners = cards.map((c) => c.inner).filter((el): el is HTMLDivElement => el !== null);
    if (!inners.length) {
      return;
    }
    if (S.reduced) {
      gsap.set(inners, { filter: "none", opacity: 1, scale: 1, yPercent: 0 });
      return;
    }
    gsap.set(inners, {
      filter: "blur(10px)",
      opacity: 0,
      scale: 0.7,
      yPercent: 8,
    });
    let cancelled = false;
    let tween: gsap.core.Tween | null = null;
    const play = () => {
      if (cancelled) {
        return;
      }
      tween = gsap.to(inners, {
        delay: 0.1,
        duration: 1,
        ease: "power4.out",
        filter: "blur(0px)",
        opacity: 1,
        scale: 1,
        stagger: { each: 0.035, from: "edges" },
        yPercent: 0,
      });
    };
    const playWhenReady = async () => {
      await document.fonts.ready;
      play();
    };
    void playWhenReady();
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
      renderStaticRef.current();
      return;
    }
    for (const card of cards) {
      copyPose(card.from, card.cur);
    }
    S.browse = 0;
    S.vel = 0;
    S.morphing = true;
    S.morphMs = 0;
    // No cleanup here: this effect re-runs on every mode change, so resetting
    // `firstMode` from a cleanup would swallow every other morph. The reset
    // lives in the engine effect's cleanup, which only runs on unmount.
  }, [mode, cards, S]);

  const stageStyle: CustomCSS = {
    "--fm-bg": "#0a0a0a",
    "--fm-fg": "#fafafa",
    background: "linear-gradient(180deg, #121215 0%, #09090b 100%)",
    color: "rgba(255,255,255,0.92)",
    fontFamily: SANS,
    touchAction: "pan-y",
  };

  return (
    <section
      ref={rootRef}
      className="relative h-full w-full select-none overflow-hidden"
      style={stageStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onPointerLeave={onPointerLeave}
    >
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
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the card is a composite of DOM children that <img> cannot hold; role="img" deliberately presents it as one labelled picture
              role="img"
              aria-label={card.work.title}
              className="absolute left-1/2 top-1/2"
              style={{ opacity: 0, transformStyle: "preserve-3d" }}
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
                      backgroundImage: `url(${card.work.image})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                      borderRadius: 12,
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
            fontSize: "0.64rem",
            fontVariantNumeric: "tabular-nums",
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
            WebkitBackdropFilter: "blur(12px)",
            backdropFilter: "blur(12px)",
            background: "color-mix(in srgb, var(--fm-bg) 72%, transparent)",
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
                  background: active ? "var(--fm-fg)" : "transparent",
                  border: "1px solid transparent",
                  color: active ? "var(--fm-bg)" : "var(--fm-fg)",
                  fontFamily: SANS,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  padding: "6px 14px",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
