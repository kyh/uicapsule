"use client";

import { useEffect, useRef, useState, type FC } from "react";

type VentSceneProps = {
  tempF: number;
  fanSpeed: number;
  powerOn: boolean;
  acOn: boolean;
};

const STRANDS = 38;
const SEGMENTS = 16;
const SLIT_Y = 0.5;
const SLIT_WIDTH = 0.46;

const tintFor = (tempF: number, acOn: boolean): readonly [number, number, number] => {
  if (!acOn) return [168, 176, 188];
  const k = Math.min(1, Math.max(0, (tempF - 60) / 20));
  const cold: readonly [number, number, number] = [90, 140, 240];
  const mid: readonly [number, number, number] = [150, 178, 226];
  const hot: readonly [number, number, number] = [235, 105, 105];
  const from = k < 0.5 ? cold : mid;
  const to = k < 0.5 ? mid : hot;
  const t = k < 0.5 ? k * 2 : (k - 0.5) * 2;
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ];
};

// Deterministic per-strand pseudo-random, stable across frames.
const seeded = (index: number, channel: number) => {
  const value = Math.sin(index * 127.1 + channel * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export const VentScene: FC<VentSceneProps> = ({ tempF, fanSpeed, powerOn, acOn }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const settingsRef = useRef({ tempF, fanSpeed, powerOn, acOn });
  const steerRef = useRef({ current: 0, target: 0, reach: 1, reachTarget: 1 });
  const intensityRef = useRef(0);
  const smoothFanRef = useRef(fanSpeed);
  const pointerRef = useRef({ x: 0, y: 0, alpha: 0 });
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  useEffect(() => {
    settingsRef.current = { tempF, fanSpeed, powerOn, acOn };
  }, [tempF, fanSpeed, powerOn, acOn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const offscreen = document.createElement("canvas");
    offscreenRef.current = offscreen;
    const offContext = offscreen.getContext("2d");
    if (!offContext) return;

    let frame = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        offscreen.width = width;
        offscreen.height = height;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        offContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return rect;
    };

    const step = (timeMs: number) => {
      frame = requestAnimationFrame(step);
      const rect = resize();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      const time = timeMs * 0.001;
      const { tempF: temp, fanSpeed: fan, powerOn: on, acOn: cool } = settingsRef.current;

      intensityRef.current += ((on ? 1 : 0) - intensityRef.current) * 0.06;
      smoothFanRef.current += (fan - smoothFanRef.current) * 0.08;
      const steer = steerRef.current;
      // Shortest-arc lerp so aiming across the top doesn't spin the long way round.
      const arc = ((steer.target - steer.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      steer.current += arc * 0.1;
      steer.reach += (steer.reachTarget - steer.reach) * 0.08;

      const intensity = intensityRef.current;
      const smoothFan = smoothFanRef.current;
      const tint = tintFor(temp, cool);
      const unit = h / 340;

      // Backdrop.
      const backdrop = context.createLinearGradient(0, 0, 0, h);
      backdrop.addColorStop(0, "#eef0f3");
      backdrop.addColorStop(0.35, "#e4e8ec");
      backdrop.addColorStop(1, "#d2d8df");
      context.fillStyle = backdrop;
      context.fillRect(0, 0, w, h);

      const slitCx = w / 2;
      const slitY = h * SLIT_Y;
      const slitW = w * SLIT_WIDTH;

      // Ambient temperature wash under the plume.
      if (intensity > 0.02) {
        const wash = context.createRadialGradient(slitCx, slitY, 0, slitCx, slitY, h * 0.85);
        wash.addColorStop(
          0,
          `rgba(${tint[0]},${tint[1]},${tint[2]},${(0.16 * intensity).toFixed(3)})`,
        );
        wash.addColorStop(1, `rgba(${tint[0]},${tint[1]},${tint[2]},0)`);
        context.fillStyle = wash;
        context.fillRect(0, 0, w, h);
      }

      // Air strands, drawn sharp offscreen then composited through blur.
      if (intensity > 0.01) {
        offContext.clearRect(0, 0, w, h);
        offContext.globalCompositeOperation = "lighter";
        offContext.lineCap = "round";

        const reach = h * 0.52 * (0.62 + smoothFan * 0.055) * steer.reach;
        const pulseSpeed = 1.4 + smoothFan * 0.75;
        const flutter = 0.75 + smoothFan * 0.11;

        for (let index = 0; index < STRANDS; index += 1) {
          const across = seeded(index, 1) - 0.5;
          const lengthSeed = 0.55 + 0.45 * seeded(index, 2);
          const phase = seeded(index, 3) * Math.PI * 2;
          const curl = 0.07 + seeded(index, 4) * 0.15;
          const speedSeed = 0.7 + seeded(index, 5) * 0.7;
          const breathe = 1 + 0.14 * Math.sin(time * 0.55 * speedSeed * flutter + phase);
          const length = reach * lengthSeed * breathe;

          let x = slitCx + across * slitW * 0.86 + Math.sin(steer.current) * 4 * unit;
          let y = slitY + Math.cos(steer.current) * 4 * unit;
          const strandAlpha = (0.55 + 0.45 * seeded(index, 6)) * intensity;

          for (let segment = 1; segment <= SEGMENTS; segment += 1) {
            const s = segment / SEGMENTS;
            const angle =
              steer.current +
              across * (0.5 + 1.05 * s) +
              Math.sin(time * speedSeed * 1.25 * flutter + s * 2.8 + phase) * curl * s;
            const stepLength = length / SEGMENTS;
            const nextX = x + Math.sin(angle) * stepLength;
            const nextY = y + Math.cos(angle) * stepLength;

            const pulse = 0.68 + 0.32 * Math.sin(s * 6.2 - time * pulseSpeed + phase);
            const alpha = Math.pow(1 - s, 1.55) * Math.min(s * 9, 1) * 0.5 * strandAlpha * pulse;
            if (alpha > 0.008) {
              offContext.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
              offContext.lineWidth = (0.9 + s * 7.5) * unit;
              offContext.beginPath();
              offContext.moveTo(x, y);
              offContext.lineTo(nextX, nextY);
              offContext.stroke();
            }
            x = nextX;
            y = nextY;
          }
        }

        // Heavy pass = mist body, light pass = fiber detail.
        context.save();
        if (typeof context.filter === "string") {
          context.filter = "blur(7px)";
          context.drawImage(offscreen, 0, 0, w, h);
          context.filter = "blur(1.5px)";
          context.globalAlpha = 0.75;
          context.drawImage(offscreen, 0, 0, w, h);
        } else {
          context.globalAlpha = 0.3;
          for (let dx = -2; dx <= 2; dx += 2) {
            context.drawImage(offscreen, dx, 1, w, h);
          }
          context.globalAlpha = 0.75;
          context.drawImage(offscreen, 0, 0, w, h);
        }
        context.restore();

        // Bright rush at the slit.
        const rush = context.createRadialGradient(slitCx, slitY, 0, slitCx, slitY, slitW * 0.42);
        rush.addColorStop(0, `rgba(255,255,255,${(0.9 * intensity).toFixed(3)})`);
        rush.addColorStop(0.4, `rgba(255,255,255,${(0.35 * intensity).toFixed(3)})`);
        rush.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = rush;
        context.save();
        context.translate(slitCx, slitY);
        context.scale(1, 0.42);
        context.translate(-slitCx, -slitY);
        context.beginPath();
        context.arc(slitCx, slitY, slitW * 0.42, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      // The slit itself, drawn above the air so it stays crisp.
      context.beginPath();
      context.roundRect(slitCx - slitW / 2, slitY - 3.5 * unit, slitW, 7 * unit, 5 * unit);
      const slot = context.createLinearGradient(0, slitY - 3.5 * unit, 0, slitY + 3.5 * unit);
      slot.addColorStop(0, "#4d5766");
      slot.addColorStop(0.5, "#333c49");
      slot.addColorStop(1, "#5b6574");
      context.fillStyle = slot;
      context.fill();
      // Bottom lip highlight.
      context.beginPath();
      context.roundRect(slitCx - slitW / 2, slitY + 3.5 * unit, slitW, 1.4 * unit, 1);
      context.fillStyle = "rgba(255,255,255,0.75)";
      context.fill();

      // Subtle touch circle under the pointer while dragging.
      const pointer = pointerRef.current;
      pointer.alpha += ((draggingRef.current ? 1 : 0) - pointer.alpha) * 0.16;
      if (pointer.alpha > 0.02) {
        const touchRadius = 26 * unit;
        context.beginPath();
        context.arc(pointer.x, pointer.y, touchRadius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255,255,255,${(0.3 * pointer.alpha).toFixed(3)})`;
        context.fill();
        context.strokeStyle = `rgba(73,84,100,${(0.3 * pointer.alpha).toFixed(3)})`;
        context.lineWidth = 1.5;
        context.stroke();
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  // The plume aims at the pointer: direction sets the angle (any way, up included),
  // distance from the slit sets reach.
  const aimStream = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !draggingRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    pointerRef.current.x = px;
    pointerRef.current.y = py;
    const dx = px - rect.width / 2;
    const dy = py - rect.height * SLIT_Y;
    if (Math.hypot(dx, dy) < 10) return;
    steerRef.current.target = Math.atan2(dx, dy);
    const distance = Math.hypot(dx, dy) / (rect.height * 0.52);
    steerRef.current.reachTarget = Math.max(0.35, Math.min(1.3, distance));
  };

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full touch-none ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onPointerDown={(event) => {
        if (!settingsRef.current.powerOn) return;
        draggingRef.current = true;
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        aimStream(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        aimStream(event.clientX, event.clientY);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
        setDragging(false);
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
        setDragging(false);
      }}
    />
  );
};
