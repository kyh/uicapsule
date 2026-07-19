"use client";

import { memo, useEffect, useRef } from "react";

// 16-bit color palette (reduced color options)
const STAR_COLORS = [
  "#FFFFFF", // White
  "#FFFFAA", // Light yellow
  "#AAAAFF", // Light blue
  "#FFAAAA", // Light red
  "#AAFFAA", // Light green
  "#FFAAFF", // Light purple
  "#AAFFFF", // Light cyan
] as const;

// Configuration constants
const starDensity = 0.00004; // Reduced density for larger stars
const twinkleProbability = 0.7;
const minTwinkleSpeed = 2;
const maxTwinkleSpeed = 4;
const pixelSize = 5;
const starRegenerationInterval = 5000; // Interval to regenerate stars (in ms)
const percentToRegenerate = 0.15; // Percentage of stars to regenerate at each interval

// Shooting star configuration
const shootingStarPixelSize = 2;
const targetFps = 16; // 16 FPS for that retro feel
const frameInterval = 1000 / targetFps;
const shootingStarWidth = 4; // 4 pixels wide
const shootingStarHeight = 2; // 2 pixels high
const shootingStarMargin = 30; // How far off-canvas a star travels before it is culled

// Type definitions
type BackgroundStar = {
  x: number;
  y: number;
  color: string;
  baseOpacity: number;
  currentOpacity: number;
  twinkle: boolean;
  twinkleSpeed: number;
  twinkleDirection: number; // -1 fading out, 1 fading in
  twinkleTimer: number;
};

type TrailPoint = {
  x: number;
  y: number;
  opacity: number;
};

type ShootingStar = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
  trail: TrailPoint[];
};

const randomStarColor = (): string => {
  const colorIndex = Math.floor(Math.random() * STAR_COLORS.length);
  return STAR_COLORS[colorIndex] ?? STAR_COLORS[0];
};

// A background star snapped to the pixel grid, at a random spot on the canvas.
const createBackgroundStar = (width: number, height: number): BackgroundStar => {
  const shouldTwinkle = Math.random() < twinkleProbability;
  const gridX = Math.floor(Math.random() * (width / pixelSize)) * pixelSize;
  const gridY = Math.floor(Math.random() * (height / pixelSize)) * pixelSize;
  const color = randomStarColor();
  const baseOpacity = Math.random() * 0.5 + 0.5;

  return {
    x: gridX,
    y: gridY,
    color,
    baseOpacity,
    currentOpacity: baseOpacity,
    twinkle: shouldTwinkle,
    twinkleSpeed: minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed),
    twinkleDirection: -1, // -1 fading out, 1 fading in
    twinkleTimer: 0,
  };
};

// A shooting star entering from anywhere along the top edge. The angle spans
// 45-135 degrees, where 90 is straight down, 45 down-right and 135 down-left.
const createShootingStar = (width: number): ShootingStar => ({
  x: Math.random() * width,
  y: 0,
  angle: 45 + Math.random() * 90,
  speed: Math.random() * 5 + 8,
  distance: 0,
  trail: [], // Empty trail initially
});

export const BackgroundPixelStars = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let backgroundStars: BackgroundStar[] = [];
    let shootingStars: ShootingStar[] = [];

    const initBackgroundStars = (): void => {
      const area = canvas.width * canvas.height;
      const numStars = Math.floor(area * starDensity);

      backgroundStars = [];
      for (let i = 0; i < numStars; i++) {
        backgroundStars.push(createBackgroundStar(canvas.width, canvas.height));
      }
    };

    // Swap out a slice of the field so the sky slowly reshuffles.
    const regenerateBackgroundStars = (): void => {
      if (backgroundStars.length === 0) return;

      const numToRegenerate = Math.max(1, Math.floor(backgroundStars.length * percentToRegenerate));

      for (let i = 0; i < numToRegenerate; i++) {
        const randomIndex = Math.floor(Math.random() * backgroundStars.length);
        backgroundStars[randomIndex] = createBackgroundStar(canvas.width, canvas.height);
      }
    };

    const drawBackgroundStars = (): void => {
      for (const star of backgroundStars) {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.currentOpacity;
        ctx.fillRect(star.x, star.y, pixelSize, pixelSize);

        if (!star.twinkle) continue;

        star.twinkleTimer += 1 / targetFps;

        if (star.twinkleTimer >= star.twinkleSpeed) {
          star.twinkleTimer = 0;
          star.twinkleDirection *= -1; // Reverse direction
        }

        // Calculate new opacity based on discrete steps
        const progress = star.twinkleTimer / star.twinkleSpeed;
        if (progress < 0.5) {
          star.currentOpacity =
            star.twinkleDirection < 0 ? star.baseOpacity : star.baseOpacity * 0.3;
        } else {
          star.currentOpacity =
            star.twinkleDirection < 0 ? star.baseOpacity * 0.3 : star.baseOpacity;
        }
      }
    };

    const updateShootingStars = (): void => {
      shootingStars = shootingStars
        .map((star) => {
          // Calculate new position
          const newX = star.x + star.speed * Math.cos((star.angle * Math.PI) / 180);
          const newY = star.y + star.speed * Math.sin((star.angle * Math.PI) / 180);
          const newDistance = star.distance + star.speed;

          const newTrail = [...star.trail];

          // Only add to trail every few frames for pixelated effect
          if (newDistance % 8 < star.speed) {
            newTrail.push({
              x: star.x,
              y: star.y,
              opacity: 1.0,
            });
          }

          // Update trail opacity and remove old trail pieces
          const updatedTrail = newTrail
            .map((point) => ({ ...point, opacity: point.opacity - 0.1 }))
            .filter((point) => point.opacity > 0);

          return {
            ...star,
            x: newX,
            y: newY,
            distance: newDistance,
            trail: updatedTrail,
          };
        })
        .filter(
          (star) =>
            // Remove stars that are out of bounds
            star.x >= -shootingStarMargin &&
            star.x <= canvas.width + shootingStarMargin &&
            star.y >= -shootingStarMargin &&
            star.y <= canvas.height + shootingStarMargin,
        );
    };

    const drawShootingStars = (): void => {
      for (const star of shootingStars) {
        const radians = (star.angle * Math.PI) / 180;

        // Draw trail
        for (const point of star.trail) {
          ctx.save();
          ctx.translate(point.x, point.y);
          ctx.rotate(radians);
          ctx.translate(-point.x, -point.y);

          ctx.fillStyle = `rgba(180, 242, 255, ${point.opacity})`;
          ctx.fillRect(point.x, point.y, shootingStarPixelSize, shootingStarPixelSize);

          ctx.restore();
        }

        // Draw star (pixelated representation)
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(radians);
        ctx.translate(-star.x, -star.y);

        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 1.0;

        for (let y = 0; y < shootingStarHeight; y++) {
          for (let x = 0; x < shootingStarWidth; x++) {
            // Skip some pixels for pixelated look
            if ((x === 0 && y === 1) || (x === 3 && y === 0)) continue;

            ctx.fillRect(
              star.x + x * shootingStarPixelSize,
              star.y + y * shootingStarPixelSize,
              shootingStarPixelSize,
              shootingStarPixelSize,
            );
          }
        }

        ctx.restore();
      }
    };

    let frameId = 0;
    let lastRenderTime = 0;

    const animateCanvas = (timestamp: number): void => {
      frameId = requestAnimationFrame(animateCanvas);

      // Skip frames to limit to target FPS
      if (timestamp - lastRenderTime < frameInterval) return;
      lastRenderTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBackgroundStars();

      if (shootingStars.length) {
        updateShootingStars();
        drawShootingStars();
      }
    };

    const resizeCanvas = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initBackgroundStars();
    };

    resizeCanvas();
    frameId = requestAnimationFrame(animateCanvas);

    // Spawn shooting stars on a random 2-6 second cadence.
    let shootingStarTimer: ReturnType<typeof setTimeout> | undefined;
    const spawnShootingStar = (): void => {
      shootingStars = [...shootingStars, createShootingStar(canvas.width)];

      const randomDelay = Math.random() * 4000 + 2000; // 2-6 seconds
      shootingStarTimer = setTimeout(spawnShootingStar, randomDelay);
    };
    spawnShootingStar();

    const regenerationInterval = setInterval(regenerateBackgroundStars, starRegenerationInterval);

    window.addEventListener("resize", resizeCanvas);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(regenerationInterval);
      clearTimeout(shootingStarTimer);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0" />;
});
