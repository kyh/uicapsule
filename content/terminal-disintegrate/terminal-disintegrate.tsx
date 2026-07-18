"use client";

import type { Particle } from "./terminal-particles";

import { useEffect, useRef } from "react";

import { buildBtcFrame, buildGoldFrame, buildStatsFrame } from "./terminal-frames";
import {
  buildEntrance,
  buildIncoming,
  buildOutgoing,
  cellMetrics,
  clamp01,
  renderGrid,
  renderParticles,
  smoothstep,
} from "./terminal-particles";

// --- Choreography -----------------------------------------------------------
// A single 0..1 scalar drives everything: hold, disintegrate, hold,
// disintegrate, hold. The palette inverts inside the second transition.
const HOLD1_END = 0.03;
const TRANS1_END = 0.36;
const HOLD2_END = 0.55;
const TRANS2_END = 0.85;
const FLIP_START = 0.78;
const FLIP_END = 0.86;

// Derived, so retuning the choreography can never desync the phase readout.
const PHASE_2_AT = (HOLD1_END + TRANS1_END) / 2;
const PHASE_3_AT = (HOLD2_END + TRANS2_END) / 2;

// --- Animation tunables -----------------------------------------------------
const ENTRANCE_MS = 2000;
const CURL_AMP_PX = 22;
const SCORCH_AMP = 0.45;

// The entrance is deliberately wilder than the transitions.
const TRANS_OPTS = { curlAmp: CURL_AMP_PX, scorchAmp: SCORCH_AMP };
const ENTRANCE_OPTS = { curlAmp: CURL_AMP_PX * 2.4, scorchAmp: SCORCH_AMP * 1.3 };

// Idle autoplay ping-pongs 0 -> 1 -> 0 until the first drag. Snapping 1 back to
// 0 would replay both transitions in half a second and hard-flip the palette,
// so it reverses through them instead.
const SWEEP_MS = 8000;
const HOLD_MS = 900;
const CYCLE_MS = SWEEP_MS * 2 + HOLD_MS * 2;

// --- Palette ----------------------------------------------------------------
const BG_LIGHT = "#cff060";
const FG_LIGHT = "#1c5f27";
const BG_DARK = "#1c5f27";
const FG_DARK = "#cff060";

// Pinned, never inherited: every pixel here is a box-drawing or block-element
// glyph, so the stack has to lead with faces that actually ship U+2500/U+2580.
const MONO_FAMILY =
  '"JetBrains Mono", "Cascadia Mono", "DejaVu Sans Mono", Menlo, Consolas, "Liberation Mono", "Noto Sans Mono", monospace';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const ch = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(ca.r, cb.r)}${ch(ca.g, cb.g)}${ch(ca.b, cb.b)}`;
}

function paletteAt(p: number): { fg: string; bg: string } {
  if (p <= FLIP_START) return { fg: FG_LIGHT, bg: BG_LIGHT };
  if (p >= FLIP_END) return { fg: FG_DARK, bg: BG_DARK };
  const t = smoothstep((p - FLIP_START) / (FLIP_END - FLIP_START));
  return { fg: mixHex(FG_LIGHT, FG_DARK, t), bg: mixHex(BG_LIGHT, BG_DARK, t) };
}

type Layout = {
  w: number;
  h: number;
  cellW: number;
  cellH: number;
  canvasW: number;
  canvasH: number;
  frameY: number;
  frameX1: number;
  frameX2: number;
  frameX3: number;
};

type ParticleSets = {
  entrance: Particle[];
  t1out: Particle[];
  t1in: Particle[];
  t2out: Particle[];
  t2in: Particle[];
};

type Runtime = {
  smoothP: number;
  targetP: number;
  lastDrawnP: number;
  entranceDone: boolean;
  entranceT: number;
  autoElapsed: number;
  interacted: boolean;
  lastNow: number | null;
  fg: string;
};

export const TerminalDisintegrate = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chipRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const railTrackRef = useRef<HTMLDivElement | null>(null);
  const railFillRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const rootEl = rootRef.current;
    if (!canvasEl || !rootEl) return;

    const ctx2d = canvasEl.getContext("2d");
    if (!ctx2d) return;

    // Re-bound as non-nullable so the hoisted helpers below close over a
    // narrowed type without needing assertions.
    const canvas: HTMLCanvasElement = canvasEl;
    const root: HTMLDivElement = rootEl;
    const ctx: CanvasRenderingContext2D = ctx2d;

    // The three screen grids are pure data — built once, never rebuilt.
    const grids = {
      btc: buildBtcFrame(),
      gold: buildGoldFrame(),
      stats: buildStatsFrame(),
    };

    const layout: Layout = {
      w: 0,
      h: 0,
      cellW: 0,
      cellH: 0,
      canvasW: 0,
      canvasH: 0,
      frameY: 0,
      frameX1: 0,
      frameX2: 0,
      frameX3: 0,
    };

    const particles: ParticleSets = {
      entrance: [],
      t1out: [],
      t1in: [],
      t2out: [],
      t2in: [],
    };

    const S: Runtime = {
      smoothP: 0,
      targetP: 0,
      lastDrawnP: -1,
      entranceDone: false,
      entranceT: 0,
      // Negative so the assembled first screen holds before it starts burning;
      // `u` clamps at 0 until the lead-in is spent.
      autoElapsed: -HOLD_MS,
      interacted: false,
      lastNow: null,
      fg: FG_LIGHT,
    };

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      S.entranceDone = true;
      S.entranceT = 1;
    }

    function computeLayout(stageW: number, stageH: number) {
      const m = cellMetrics(stageW, stageH);

      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(stageW * dpr);
      canvas.height = Math.round(stageH * dpr);
      canvas.style.width = `${stageW}px`;
      canvas.style.height = `${stageH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = "top";

      // The three frames deliberately sit at two different X positions. The
      // disintegration is a stage traversal — left, right, left — which is what
      // makes the outgoing and incoming clouds visibly cross mid-flight rather
      // than shimmer in place.
      // The 8px slack reserve is what keeps the left frame off the stage edge;
      // the progress rail is pinned at left:0 so the two can never coincide.
      const slack = Math.max(0, stageW - m.canvasW);
      const offset = Math.max(0, Math.min(slack / 2 - 8, m.canvasW * 0.55));
      const leftX = stageW / 2 - offset - m.canvasW / 2;
      const rightX = stageW / 2 + offset - m.canvasW / 2;
      const frameY = Math.max(0, (stageH - m.canvasH) / 2);

      layout.w = stageW;
      layout.h = stageH;
      layout.cellW = m.cellW;
      layout.cellH = m.cellH;
      layout.canvasW = m.canvasW;
      layout.canvasH = m.canvasH;
      layout.frameY = frameY;
      layout.frameX1 = leftX;
      layout.frameX2 = rightX;
      layout.frameX3 = leftX;

      const common = { cellW: m.cellW, cellH: m.cellH, stageW, stageH };

      particles.entrance = buildEntrance(grids.btc, {
        ...common,
        frameX: leftX,
        frameY,
        rngSeed: 90210,
      });
      particles.t1out = buildOutgoing(grids.btc, {
        ...common,
        frameX: leftX,
        frameY,
        windDir: 1,
        rngSeed: 1337,
      });
      particles.t1in = buildIncoming(grids.gold, {
        ...common,
        frameX: rightX,
        frameY,
        windDir: 1,
        rngSeed: 2024,
      });
      particles.t2out = buildOutgoing(grids.gold, {
        ...common,
        frameX: rightX,
        frameY,
        windDir: -1,
        rngSeed: 4242,
      });
      particles.t2in = buildIncoming(grids.stats, {
        ...common,
        frameX: leftX,
        frameY,
        windDir: -1,
        rngSeed: 8675,
      });

      S.lastDrawnP = -1;
    }

    function draw() {
      ctx.clearRect(0, 0, layout.w, layout.h);
      ctx.fillStyle = S.fg;
      ctx.font = `500 ${layout.cellH * 0.92}px ${MONO_FAMILY}`;
      ctx.textBaseline = "top";

      if (!S.entranceDone) {
        renderParticles(ctx, particles.entrance, S.entranceT, ENTRANCE_OPTS);
        return;
      }

      const p = S.smoothP;
      const { frameX1, frameX2, frameX3, frameY, cellW, cellH } = layout;

      if (p <= HOLD1_END) {
        renderGrid(ctx, grids.btc, frameX1, frameY, cellW, cellH);
      } else if (p <= TRANS1_END) {
        const local = (p - HOLD1_END) / (TRANS1_END - HOLD1_END);
        renderParticles(ctx, particles.t1out, local, TRANS_OPTS);
        renderParticles(ctx, particles.t1in, local, TRANS_OPTS);
      } else if (p <= HOLD2_END) {
        renderGrid(ctx, grids.gold, frameX2, frameY, cellW, cellH);
      } else if (p <= TRANS2_END) {
        const local = (p - HOLD2_END) / (TRANS2_END - HOLD2_END);
        renderParticles(ctx, particles.t2out, local, TRANS_OPTS);
        renderParticles(ctx, particles.t2in, local, TRANS_OPTS);
      } else {
        renderGrid(ctx, grids.stats, frameX3, frameY, cellW, cellH);
      }
    }

    function applyPalette(p: number) {
      const { fg, bg } = paletteAt(p);
      S.fg = fg;
      root.style.setProperty("--terminal-fg", fg);
      if (bgRef.current) bgRef.current.style.background = bg;
    }

    function applyChrome(p: number, fade: number) {
      const phase = p < PHASE_2_AT ? 1 : p < PHASE_3_AT ? 2 : 3;
      root.setAttribute("aria-valuenow", String(Math.round(clamp01(p) * 100)));
      root.setAttribute("aria-valuetext", `screen ${phase} of 3`);
      const chip = chipRef.current;
      if (chip) {
        chip.style.opacity = String(0.55 * fade);
        chip.textContent = `terminal · 0${phase} / 03`;
      }
      if (hintRef.current) hintRef.current.style.opacity = String(0.4 * fade);
      if (railTrackRef.current) railTrackRef.current.style.opacity = String(0.18 * fade);
      if (railFillRef.current) {
        railFillRef.current.style.transform = `scaleY(${clamp01(p)})`;
      }
    }

    // --- Driver: pointer drag + keys, with autoplay whenever the reader idles -
    // Deliberately no wheel handler: this lives inside a card in a scrolling
    // feed, and swallowing wheel events would trap the reader.
    const DRAG_SLOP_PX = 3;
    const IDLE_RESUME_MS = 4000;
    const KEY_STEP = 0.02;
    const PAGE_STEP = 0.1;

    let dragId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let idleTimer = 0;

    const travel = () => Math.max(420, Math.min(layout.w, layout.h));

    // Taking over is always temporary. A bare tap or a click that lands on the
    // card must never be able to strand the component on a frozen frame, so
    // control returns to autoplay once the reader has been still for a while —
    // re-seeded at wherever they left the scalar, not snapped back to zero.
    function takeOver() {
      S.interacted = true;
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        idleTimer = 0;
        S.autoElapsed = clamp01(S.targetP) * SWEEP_MS;
        S.interacted = false;
      }, IDLE_RESUME_MS);
    }

    function onPointerDown(e: PointerEvent) {
      if (dragId !== null) return;
      dragId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      root.style.cursor = "grabbing";
      root.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (dragId !== e.pointerId) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      // Only real movement counts as a grab; a jittery tap stays autoplaying.
      if (S.interacted || Math.abs(dx) + Math.abs(dy) > DRAG_SLOP_PX) takeOver();
      // Dragging left or up advances, matching both carousel and scroll habits.
      S.targetP = clamp01(S.targetP + (-dx - dy) / travel());
    }

    function stepFor(key: string): number {
      if (key === "ArrowRight" || key === "ArrowDown") return KEY_STEP;
      if (key === "ArrowLeft" || key === "ArrowUp") return -KEY_STEP;
      if (key === "PageDown") return PAGE_STEP;
      if (key === "PageUp") return -PAGE_STEP;
      if (key === "End") return 1;
      if (key === "Home") return -1;
      return 0;
    }

    function onKeyDown(e: KeyboardEvent) {
      const step = stepFor(e.key);
      if (step === 0) return;
      e.preventDefault();
      takeOver();
      S.targetP = clamp01(S.targetP + step);
    }

    function endDrag(e: PointerEvent) {
      if (dragId !== e.pointerId) return;
      dragId = null;
      root.style.cursor = "grab";
      if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
    }

    // --- Loop ---------------------------------------------------------------
    let raf = 0;
    let running = false;
    let ready = false;
    let onScreen = true;
    let cancelled = false;

    function tick(now: number) {
      if (!running) return;

      const dt = S.lastNow === null ? 16.7 : Math.min(64, now - S.lastNow);
      S.lastNow = now;

      if (!S.entranceDone) {
        S.entranceT = Math.min(1, S.entranceT + dt / ENTRANCE_MS);
        const fade = S.entranceT < 0.5 ? 0 : (S.entranceT - 0.5) / 0.5;
        applyPalette(0);
        applyChrome(0, fade);
        draw();
        if (S.entranceT >= 1) {
          S.entranceDone = true;
          // Adopt whatever the driver accumulated during the entrance, so a
          // reader who scrubbed early doesn't watch the transitions replay.
          S.smoothP = S.targetP;
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      if (!S.interacted && !reduce) {
        S.autoElapsed = (S.autoElapsed + dt) % CYCLE_MS;
        const u = Math.max(0, S.autoElapsed);
        S.targetP =
          u < SWEEP_MS
            ? u / SWEEP_MS
            : u < SWEEP_MS + HOLD_MS
              ? 1
              : u < SWEEP_MS * 2 + HOLD_MS
                ? 1 - (u - SWEEP_MS - HOLD_MS) / SWEEP_MS
                : 0;
      }

      // Critically-damped follow. Without it the disintegration reads as a
      // jump-cut instead of a burn.
      let sp = S.smoothP + (S.targetP - S.smoothP) * 0.12;
      if (Math.abs(S.targetP - sp) < 0.0002) sp = S.targetP;
      S.smoothP = sp;

      if (Math.abs(sp - S.lastDrawnP) > 0.00005) {
        applyPalette(sp);
        applyChrome(sp, 1);
        draw();
        S.lastDrawnP = sp;
      }

      raf = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (running || cancelled || !ready) return;
      running = true;
      S.lastNow = null;
      raf = requestAnimationFrame(tick);
    }

    function stopLoop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function syncLoop() {
      if (onScreen && document.visibilityState !== "hidden") startLoop();
      else stopLoop();
    }

    function begin() {
      if (cancelled || ready) return;
      const rect = root.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      computeLayout(rect.width, rect.height);
      applyPalette(0);
      applyChrome(0, 0);
      ready = true;
      syncLoop();
    }

    // A freshly-mounted iframe reports a 0x0 box first; ignore that callback.
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width < 1 || height < 1) return;
      if (ready) computeLayout(width, height);
      else begin();
    });
    ro.observe(root);

    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      onScreen = entry.isIntersecting;
      syncLoop();
    });
    io.observe(root);

    // Measure against the real font rather than a fallback, but never wait
    // forever for it.
    let fontTimer = 0;
    if (document.fonts?.ready) {
      const timeout = new Promise<void>((res) => {
        fontTimer = window.setTimeout(res, 800);
      });
      void Promise.race([document.fonts.ready, timeout]).then(begin, begin);
    } else {
      begin();
    }

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", endDrag);
    root.addEventListener("pointercancel", endDrag);
    root.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", syncLoop);

    return () => {
      cancelled = true;
      stopLoop();
      if (fontTimer) window.clearTimeout(fontTimer);
      if (idleTimer) window.clearTimeout(idleTimer);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", endDrag);
      root.removeEventListener("pointercancel", endDrag);
      root.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", syncLoop);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      // A scrubbable scalar, not a picture: drag or arrow-key it through the
      // three screens. The label carries what the canvas shows.
      role="slider"
      tabIndex={0}
      aria-label="An ASCII trading terminal whose screen disintegrates into embers and reassembles as the next screen"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
        cursor: "grab",
        background: BG_LIGHT,
        color: "var(--terminal-fg, #1c5f27)",
      }}
    >
      <div
        ref={bgRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: BG_LIGHT,
          pointerEvents: "none",
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.06) 95%)",
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />

      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
      />

      <div
        ref={chipRef}
        aria-hidden
        style={{
          position: "absolute",
          top: 16,
          left: 22,
          zIndex: 4,
          opacity: 0,
          fontFamily: MONO_FAMILY,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.25em",
          pointerEvents: "none",
        }}
      >
        terminal · 01 / 03
      </div>

      <div
        ref={hintRef}
        aria-hidden
        style={{
          position: "absolute",
          bottom: 16,
          left: 22,
          zIndex: 4,
          opacity: 0,
          fontFamily: MONO_FAMILY,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.3em",
          pointerEvents: "none",
        }}
      >
        drag · disintegrate · resolve
      </div>

      <div
        ref={railTrackRef}
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: "7%",
          bottom: "7%",
          width: 2,
          zIndex: 4,
          opacity: 0,
          background: "currentColor",
          pointerEvents: "none",
        }}
      />

      <div
        ref={railFillRef}
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: "7%",
          height: "86%",
          width: 2,
          zIndex: 4,
          transformOrigin: "top",
          transform: "scaleY(0)",
          background: "currentColor",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
