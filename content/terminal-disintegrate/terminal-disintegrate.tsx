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

const HOLD1_END = 0.03;
const TRANS1_END = 0.36;
const HOLD2_END = 0.55;
const TRANS2_END = 0.85;
const FLIP_START = 0.78;
const FLIP_END = 0.86;

const PHASE_2_AT = (HOLD1_END + TRANS1_END) / 2;
const PHASE_3_AT = (HOLD2_END + TRANS2_END) / 2;

const ENTRANCE_MS = 2000;
const CURL_AMP_PX = 22;
const SCORCH_AMP = 0.45;

const TRANS_OPTS = { curlAmp: CURL_AMP_PX, scorchAmp: SCORCH_AMP };
const ENTRANCE_OPTS = { curlAmp: CURL_AMP_PX * 2.4, scorchAmp: SCORCH_AMP * 1.3 };

const SWEEP_MS = 8000;
const HOLD_MS = 900;
const CYCLE_MS = SWEEP_MS * 2 + HOLD_MS * 2;

const BG_LIGHT = "#cff060";
const FG_LIGHT = "#1c5f27";
const BG_DARK = "#1c5f27";
const FG_DARK = "#cff060";

const MONO_FAMILY =
  '"JetBrains Mono", "Cascadia Mono", "DejaVu Sans Mono", Menlo, Consolas, "Liberation Mono", "Noto Sans Mono", monospace';

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");

  return {
    b: Number.parseInt(h.slice(4, 6), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    r: Number.parseInt(h.slice(0, 2), 16),
  };
};

const mixHex = (a: string, b: string, t: number) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);

  const ch = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, "0");

  return `#${ch(ca.r, cb.r)}${ch(ca.g, cb.g)}${ch(ca.b, cb.b)}`;
};

const paletteAt = (p: number) => {
  if (p <= FLIP_START) {
    return { bg: BG_LIGHT, fg: FG_LIGHT };
  }

  if (p >= FLIP_END) {
    return { bg: BG_DARK, fg: FG_DARK };
  }

  const t = smoothstep((p - FLIP_START) / (FLIP_END - FLIP_START));

  return { bg: mixHex(BG_LIGHT, BG_DARK, t), fg: mixHex(FG_LIGHT, FG_DARK, t) };
};

interface Layout {
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
}

interface ParticleSets {
  entrance: Particle[];
  t1out: Particle[];
  t1in: Particle[];
  t2out: Particle[];
  t2in: Particle[];
}

interface Runtime {
  smoothP: number;
  targetP: number;
  lastDrawnP: number;
  entranceDone: boolean;
  entranceT: number;
  autoElapsed: number;
  interacted: boolean;
  lastNow: number | null;
  fg: string;
}

const phaseAt = (p: number) => {
  if (p < PHASE_2_AT) {
    return 1;
  }

  if (p < PHASE_3_AT) {
    return 2;
  }

  return 3;
};

const autoTargetAt = (u: number) => {
  if (u < SWEEP_MS) {
    return u / SWEEP_MS;
  }

  if (u < SWEEP_MS + HOLD_MS) {
    return 1;
  }

  if (u < SWEEP_MS * 2 + HOLD_MS) {
    return 1 - (u - SWEEP_MS - HOLD_MS) / SWEEP_MS;
  }

  return 0;
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

    if (!canvasEl || !rootEl) {
      return;
    }

    const ctx2d = canvasEl.getContext("2d");

    if (!ctx2d) {
      return;
    }

    const canvas: HTMLCanvasElement = canvasEl;
    const root: HTMLDivElement = rootEl;
    const ctx: CanvasRenderingContext2D = ctx2d;

    const grids = {
      btc: buildBtcFrame(),
      gold: buildGoldFrame(),
      stats: buildStatsFrame(),
    };

    const layout: Layout = {
      canvasH: 0,
      canvasW: 0,
      cellH: 0,
      cellW: 0,
      frameX1: 0,
      frameX2: 0,
      frameX3: 0,
      frameY: 0,
      h: 0,
      w: 0,
    };

    const particles: ParticleSets = {
      entrance: [],
      t1in: [],
      t1out: [],
      t2in: [],
      t2out: [],
    };

    const S: Runtime = {
      autoElapsed: -HOLD_MS,
      entranceDone: false,
      entranceT: 0,
      fg: FG_LIGHT,
      interacted: false,
      lastDrawnP: -1,
      lastNow: null,
      smoothP: 0,
      targetP: 0,
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      S.entranceDone = true;
      S.entranceT = 1;
    }

    const computeLayout = (stageW: number, stageH: number) => {
      const m = cellMetrics(stageW, stageH);

      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(stageW * dpr);
      canvas.height = Math.round(stageH * dpr);
      canvas.style.width = `${stageW}px`;
      canvas.style.height = `${stageH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = "top";
      ctx.font = `500 ${m.cellH * 0.92}px ${MONO_FAMILY}`;

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

      const common = { cellH: m.cellH, cellW: m.cellW, stageH, stageW };

      particles.entrance = buildEntrance(grids.btc, {
        ...common,
        frameX: leftX,
        frameY,
        rngSeed: 90_210,
      });
      particles.t1out = buildOutgoing(grids.btc, {
        ...common,
        frameX: leftX,
        frameY,
        rngSeed: 1337,
        windDir: 1,
      });
      particles.t1in = buildIncoming(grids.gold, {
        ...common,
        frameX: rightX,
        frameY,
        rngSeed: 2024,
        windDir: 1,
      });
      particles.t2out = buildOutgoing(grids.gold, {
        ...common,
        frameX: rightX,
        frameY,
        rngSeed: 4242,
        windDir: -1,
      });
      particles.t2in = buildIncoming(grids.stats, {
        ...common,
        frameX: leftX,
        frameY,
        rngSeed: 8675,
        windDir: -1,
      });

      S.lastDrawnP = -1;
    };

    const draw = () => {
      ctx.clearRect(0, 0, layout.w, layout.h);
      ctx.fillStyle = S.fg;

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
    };

    let shownFg = "";
    let shownBg = "";
    let shownPhase = 0;
    let shownValueNow = -1;
    let shownFade = -1;

    const applyPalette = (p: number) => {
      const { fg, bg } = paletteAt(p);
      S.fg = fg;

      if (fg !== shownFg) {
        shownFg = fg;
        root.style.setProperty("--terminal-fg", fg);
      }

      if (bg !== shownBg) {
        const el = bgRef.current;

        if (el) {
          shownBg = bg;
          el.style.background = bg;
        }
      }
    };

    const applyChrome = (p: number, fade: number) => {
      const phase = phaseAt(p);
      const valueNow = Math.round(clamp01(p) * 100);

      if (valueNow !== shownValueNow) {
        shownValueNow = valueNow;
        root.setAttribute("aria-valuenow", String(valueNow));
      }

      if (phase !== shownPhase) {
        shownPhase = phase;
        root.setAttribute("aria-valuetext", `screen ${phase} of 3`);

        if (chipRef.current) {
          chipRef.current.textContent = `terminal · 0${phase} / 03`;
        }
      }

      if (fade !== shownFade) {
        shownFade = fade;

        if (chipRef.current) {
          chipRef.current.style.opacity = String(0.55 * fade);
        }

        if (hintRef.current) {
          hintRef.current.style.opacity = String(0.4 * fade);
        }

        if (railTrackRef.current) {
          railTrackRef.current.style.opacity = String(0.18 * fade);
        }
      }

      if (railFillRef.current) {
        railFillRef.current.style.transform = `scaleY(${clamp01(p)})`;
      }
    };

    const DRAG_SLOP_PX = 3;
    const IDLE_RESUME_MS = 4000;
    const KEY_STEP = 0.02;
    const PAGE_STEP = 0.1;

    let dragId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let idleTimer = 0;

    const travel = () => Math.max(420, Math.min(layout.w, layout.h));

    const takeOver = () => {
      S.interacted = true;

      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }

      idleTimer = 0;

      if (dragId !== null) {
        return;
      }

      idleTimer = window.setTimeout(() => {
        idleTimer = 0;
        S.autoElapsed = clamp01(S.targetP) * SWEEP_MS;
        S.interacted = false;
      }, IDLE_RESUME_MS);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (dragId !== null) {
        return;
      }

      dragId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;

      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }

      idleTimer = 0;
      root.style.cursor = "grabbing";
      root.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragId !== e.pointerId) {
        return;
      }

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (S.interacted || Math.abs(dx) + Math.abs(dy) > DRAG_SLOP_PX) {
        takeOver();
      }

      S.targetP = clamp01(S.targetP + (-dx - dy) / travel());
    };

    const stepFor = (key: string) => {
      if (key === "ArrowRight" || key === "ArrowDown") {
        return KEY_STEP;
      }

      if (key === "ArrowLeft" || key === "ArrowUp") {
        return -KEY_STEP;
      }

      if (key === "PageDown") {
        return PAGE_STEP;
      }

      if (key === "PageUp") {
        return -PAGE_STEP;
      }

      if (key === "End") {
        return 1;
      }

      if (key === "Home") {
        return -1;
      }

      return 0;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const step = stepFor(e.key);

      if (step === 0) {
        return;
      }

      e.preventDefault();
      takeOver();
      S.targetP = clamp01(S.targetP + step);
    };

    const endDrag = (e: PointerEvent) => {
      if (dragId !== e.pointerId) {
        return;
      }

      dragId = null;
      root.style.cursor = "grab";

      if (root.hasPointerCapture(e.pointerId)) {
        root.releasePointerCapture(e.pointerId);
      }

      if (S.interacted) {
        takeOver();
      }
    };

    let raf = 0;
    let running = false;
    let ready = false;
    let onScreen = true;
    let cancelled = false;

    const tick = (now: number) => {
      if (!running) {
        return;
      }

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
          S.smoothP = S.targetP;
        }

        raf = requestAnimationFrame(tick);

        return;
      }

      if (!S.interacted && !reduce) {
        S.autoElapsed = (S.autoElapsed + dt) % CYCLE_MS;
        const u = Math.max(0, S.autoElapsed);
        S.targetP = autoTargetAt(u);
      }

      let sp = S.smoothP + (S.targetP - S.smoothP) * 0.12;

      if (Math.abs(S.targetP - sp) < 0.0002) {
        sp = S.targetP;
      }

      S.smoothP = sp;

      if (Math.abs(sp - S.lastDrawnP) > 0.00005) {
        applyPalette(sp);
        applyChrome(sp, 1);
        draw();
        S.lastDrawnP = sp;
      }

      raf = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (running || cancelled || !ready) {
        return;
      }

      running = true;
      S.lastNow = null;
      raf = requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      running = false;

      if (raf) {
        cancelAnimationFrame(raf);
      }

      raf = 0;
    };

    const syncLoop = () => {
      if (onScreen && document.visibilityState !== "hidden") {
        startLoop();
      } else {
        stopLoop();
      }
    };

    const begin = () => {
      if (cancelled || ready) {
        return;
      }

      const rect = root.getBoundingClientRect();

      if (rect.width < 1 || rect.height < 1) {
        return;
      }

      computeLayout(rect.width, rect.height);
      applyPalette(0);
      applyChrome(0, 0);
      ready = true;
      syncLoop();
    };

    const ro = new ResizeObserver((entries) => {
      const [entry] = entries;

      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;

      if (width < 1 || height < 1) {
        return;
      }

      if (ready) {
        computeLayout(width, height);
      } else {
        begin();
      }
    });

    ro.observe(root);

    const io = new IntersectionObserver((entries) => {
      const [entry] = entries;

      if (!entry) {
        return;
      }

      onScreen = entry.isIntersecting;
      syncLoop();
    });

    io.observe(root);

    let fontTimer = 0;

    if (document.fonts?.ready) {
      // oxlint-disable-next-line promise/avoid-new -- a cancellable timeout in the browser; there is no promise-returning timer to await here
      const timeout = new Promise<void>((resolve) => {
        fontTimer = window.setTimeout(resolve, 800);
      });

      const beginAfterFonts = async () => {
        await Promise.race([document.fonts.ready.catch(() => null), timeout]);
        begin();
      };

      void beginAfterFonts();
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

      if (fontTimer) {
        window.clearTimeout(fontTimer);
      }

      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }

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
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a range input cannot host the canvas; the keyboard and aria-value contract is the same
      role="slider"
      tabIndex={0}
      aria-label="An ASCII trading terminal whose screen disintegrates into embers and reassembles as the next screen"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      style={{
        background: BG_LIGHT,
        color: "var(--terminal-fg, #1c5f27)",
        cursor: "grab",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        touchAction: "pan-y",
        userSelect: "none",
        width: "100%",
      }}
    >
      <div
        ref={bgRef}
        aria-hidden
        style={{
          background: BG_LIGHT,
          inset: 0,
          pointerEvents: "none",
          position: "absolute",
          zIndex: 0,
        }}
      />

      <div
        aria-hidden
        style={{
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.06) 95%)",
          inset: 0,
          mixBlendMode: "multiply",
          pointerEvents: "none",
          position: "absolute",
          zIndex: 1,
        }}
      />

      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ inset: 0, pointerEvents: "none", position: "absolute", zIndex: 2 }}
      />

      <div
        ref={chipRef}
        aria-hidden
        style={{
          fontFamily: MONO_FAMILY,
          fontSize: 11,
          left: 22,
          letterSpacing: "0.25em",
          opacity: 0,
          pointerEvents: "none",
          position: "absolute",
          textTransform: "uppercase",
          top: 16,
          zIndex: 4,
        }}
      >
        terminal · 01 / 03
      </div>

      <div
        ref={hintRef}
        aria-hidden
        style={{
          bottom: 16,
          fontFamily: MONO_FAMILY,
          fontSize: 10,
          left: 22,
          letterSpacing: "0.3em",
          opacity: 0,
          pointerEvents: "none",
          position: "absolute",
          textTransform: "uppercase",
          zIndex: 4,
        }}
      >
        drag · disintegrate · resolve
      </div>

      <div
        ref={railTrackRef}
        aria-hidden
        style={{
          background: "currentColor",
          bottom: "7%",
          left: 0,
          opacity: 0,
          pointerEvents: "none",
          position: "absolute",
          top: "7%",
          width: 2,
          zIndex: 4,
        }}
      />

      <div
        ref={railFillRef}
        aria-hidden
        style={{
          background: "currentColor",
          height: "86%",
          left: 0,
          pointerEvents: "none",
          position: "absolute",
          top: "7%",
          transform: "scaleY(0)",
          transformOrigin: "top",
          width: 2,
          zIndex: 4,
        }}
      />
    </div>
  );
};
