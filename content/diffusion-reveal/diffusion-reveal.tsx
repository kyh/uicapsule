"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

/**
 * Diffusion reveal — the image-gen loading ritual done honestly: pure
 * noise resolves through coarse color blobs into the sharp frame, the way
 * a denoiser actually converges. Canvas compositing: the target scene is
 * painted once offscreen, then each frame draws it at climbing resolution
 * under decaying noise.
 */

const WIDTH = 520;
const HEIGHT = 300;
const DURATION_MS = 6200;
const STEPS = 30;

/** Paint the target "generation" — a dusk valley — onto a canvas. */
const paintScene = (ctx: CanvasRenderingContext2D, hueShift: number) => {
  const h = (base: number) => (base + hueShift) % 360;

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, `oklch(0.35 0.09 ${String(h(280))})`);
  sky.addColorStop(0.55, `oklch(0.62 0.15 ${String(h(35))})`);
  sky.addColorStop(0.78, `oklch(0.5 0.12 ${String(h(25))})`);
  sky.addColorStop(1, `oklch(0.3 0.06 ${String(h(300))})`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Sun
  const sun = ctx.createRadialGradient(
    WIDTH * 0.62,
    HEIGHT * 0.52,
    4,
    WIDTH * 0.62,
    HEIGHT * 0.52,
    70,
  );
  sun.addColorStop(0, "rgba(255,240,200,0.95)");
  sun.addColorStop(0.35, "rgba(255,200,120,0.55)");
  sun.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ridges
  const ridge = (baseY: number, amp: number, color: string, seed: number) => {
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT);
    for (let x = 0; x <= WIDTH; x += 8) {
      const y =
        baseY + Math.sin(x * 0.012 + seed) * amp + Math.sin(x * 0.031 + seed * 2.7) * amp * 0.45;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(WIDTH, HEIGHT);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  ridge(HEIGHT * 0.58, 18, `oklch(0.32 0.06 ${String(h(270))})`, 1.3);
  ridge(HEIGHT * 0.7, 24, `oklch(0.24 0.05 ${String(h(265))})`, 4.1);
  ridge(HEIGHT * 0.84, 16, `oklch(0.17 0.04 ${String(h(260))})`, 7.9);

  // Fog band
  const fog = ctx.createLinearGradient(0, HEIGHT * 0.62, 0, HEIGHT * 0.8);
  fog.addColorStop(0, "rgba(255,220,190,0)");
  fog.addColorStop(0.5, "rgba(255,220,190,0.16)");
  fog.addColorStop(1, "rgba(255,220,190,0)");
  ctx.fillStyle = fog;
  ctx.fillRect(0, HEIGHT * 0.55, WIDTH, HEIGHT * 0.3);
};

export const DiffusionReveal = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [seed, setSeed] = useState(0);
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;

    // Target scene, painted once.
    const scene = document.createElement("canvas");
    scene.width = WIDTH;
    scene.height = HEIGHT;
    const sceneCtx = scene.getContext("2d");
    if (!sceneCtx) return undefined;
    paintScene(sceneCtx, seed * 73);

    // Small noise tile, regenerated every few frames.
    const noise = document.createElement("canvas");
    noise.width = 128;
    noise.height = 128;
    const noiseCtx = noise.getContext("2d");
    if (!noiseCtx) return undefined;
    const refreshNoise = () => {
      const data = noiseCtx.createImageData(128, 128);
      for (let i = 0; i < data.data.length; i += 4) {
        const v = Math.random() * 255;
        data.data[i] = v;
        data.data[i + 1] = v * (0.85 + Math.random() * 0.3);
        data.data[i + 2] = v * (0.9 + Math.random() * 0.3);
        data.data[i + 3] = 255;
      }
      noiseCtx.putImageData(data, 0, 0);
    };

    let raf = 0;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      // Ease the convergence — denoisers sprint at the end.
      const eased = t * t * (3 - 2 * t);
      setProgress(t);
      if (t >= 1) setElapsed((now - start) / 1000);

      frame += 1;
      if (frame % 3 === 0 && t < 1) refreshNoise();

      // 1) coarse reconstruction: draw scene at low res, upscale smooth
      const res = Math.max(0.012, Math.pow(eased, 1.6));
      const rw = Math.max(6, Math.round(WIDTH * res));
      const rh = Math.max(4, Math.round(HEIGHT * res));
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      // downscale into corner then upscale full
      ctx.drawImage(scene, 0, 0, WIDTH, HEIGHT, 0, 0, rw, rh);
      ctx.drawImage(canvas, 0, 0, rw, rh, 0, 0, WIDTH, HEIGHT);

      // 2) noise veil, decaying hard near the end
      const noiseAlpha = Math.pow(1 - eased, 1.35);
      if (noiseAlpha > 0.004) {
        ctx.globalAlpha = noiseAlpha;
        for (let x = 0; x < WIDTH; x += 128) {
          for (let y = 0; y < HEIGHT; y += 128) {
            ctx.drawImage(noise, x, y);
          }
        }
        ctx.globalAlpha = 1;
      }

      if (t < 1) raf = requestAnimationFrame(tick);
    };

    setElapsed(null);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seed]);

  const step = Math.min(STEPS, Math.max(1, Math.ceil(progress * STEPS)));
  const done = progress >= 1;

  return (
    <div className="w-[560px] rounded-3xl bg-[#101116] p-5 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      {/* Prompt row */}
      <div className="mb-4 flex items-center justify-between gap-3 px-1.5">
        <p className="truncate text-[12.5px] text-white/65">
          <span className="mr-1.5 text-white/30">Prompt</span>a quiet valley at dusk, low fog, oil
          painting
        </p>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="shrink-0 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/[0.12]"
        >
          Regenerate
        </button>
      </div>

      {/* Image */}
      <motion.div
        animate={{ scale: done ? 1 : 0.995 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative overflow-hidden rounded-2xl ring-1 ring-white/[0.08]"
      >
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block w-full" />
        {/* Step chip */}
        <div className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white/85 backdrop-blur tabular-nums">
          {done && elapsed !== null
            ? `Done in ${elapsed.toFixed(1)}s`
            : `Denoising · step ${String(step)}/${String(STEPS)}`}
        </div>
      </motion.div>

      {/* Progress */}
      <div className="mt-4 px-1.5 pb-1">
        <div className="h-[4px] overflow-hidden rounded-full bg-white/[0.07]">
          <motion.div
            animate={{ width: `${String(progress * 100)}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
            className={`h-full rounded-full ${done ? "bg-emerald-400/80" : "bg-white/60"}`}
          />
        </div>
      </div>
    </div>
  );
};
