"use client";

import { memo, useEffect, useRef } from "react";

const noop = () => null;

export const STAR_PALETTES = {
  cool: ["#FFFFFF", "#AAAAFF", "#AAFFFF", "#AAD4FF"],
  mono: ["#FFFFFF"],
  retro: ["#FFFFFF", "#FFFFAA", "#AAAAFF", "#FFAAAA", "#AAFFAA", "#FFAAFF", "#AAFFFF"],
  warm: ["#FFFFFF", "#FFFFAA", "#FFAAAA", "#FFD4AA"],
} as const satisfies Record<string, readonly string[]>;

const fallbackStarColor = "#FFFFFF";
const shootingStarWidth = 4;
const shootingStarHeight = 2;
const shootingStarMargin = 30;

interface BackgroundStar {
  x: number;
  y: number;
  color: string;
  baseOpacity: number;
  currentOpacity: number;
  twinkle: boolean;
  twinkleSpeed: number;
  twinkleDirection: number;
  twinkleTimer: number;
}

interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
}

interface ShootingStar {
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
  trail: TrailPoint[];
}

export interface BackgroundPixelStarsProps {
  /** Colors a background star picks from at random. */
  colors?: readonly string[];
  /** Background stars per 100,000 px² of canvas. */
  density?: number;
  /** Frame rate the canvas redraws at; low values read as retro stepping. */
  fps?: number;
  /** Seconds a twinkle half-cycle lasts, lower bound. */
  minTwinklePeriod?: number;
  /** Seconds a twinkle half-cycle lasts, upper bound. */
  maxTwinklePeriod?: number;
  /** Size of one background star pixel, in px. */
  pixelSize?: number;
  /** Seconds between reshuffles of part of the starfield. */
  reshuffleInterval?: number;
  /** Fraction of stars (0–1) replaced on each reshuffle. */
  reshuffleFraction?: number;
  /** Shooting star head color. */
  shootingStarColor?: string;
  /** Average seconds between shooting stars. */
  shootingStarInterval?: number;
  /** Size of one shooting star pixel, in px. */
  shootingStarPixelSize?: number;
  /** Slowest shooting star speed in px per frame; each one adds up to 5 more. */
  shootingStarSpeed?: number;
  /** Shooting star trail color. */
  trailColor?: string;
  /** Chance (0–1) that a background star twinkles. */
  twinkleProbability?: number;
}

interface StarFieldConfig {
  colors: readonly string[];
  maxTwinklePeriod: number;
  minTwinklePeriod: number;
  pixelSize: number;
  twinkleProbability: number;
}

const randomStarColor = (colors: readonly string[]) => {
  const colorIndex = Math.floor(Math.random() * colors.length);

  return colors[colorIndex] ?? fallbackStarColor;
};

const createBackgroundStar = (width: number, height: number, config: StarFieldConfig) => {
  const { pixelSize } = config;
  const shouldTwinkle = Math.random() < config.twinkleProbability;
  const gridX = Math.floor(Math.random() * (width / pixelSize)) * pixelSize;
  const gridY = Math.floor(Math.random() * (height / pixelSize)) * pixelSize;
  const color = randomStarColor(config.colors);
  const baseOpacity = Math.random() * 0.5 + 0.5;

  return {
    baseOpacity,
    color,
    currentOpacity: baseOpacity,
    twinkle: shouldTwinkle,
    twinkleDirection: -1,
    twinkleSpeed:
      config.minTwinklePeriod + Math.random() * (config.maxTwinklePeriod - config.minTwinklePeriod),
    twinkleTimer: 0,
    x: gridX,
    y: gridY,
  };
};

const createShootingStar = (width: number, baseSpeed: number) => ({
  angle: 45 + Math.random() * 90,
  distance: 0,
  speed: Math.random() * 5 + baseSpeed,
  trail: [],
  x: Math.random() * width,
  y: 0,
});

const BackgroundPixelStarsCanvas = ({
  colors = STAR_PALETTES.retro,
  density = 4,
  fps = 16,
  maxTwinklePeriod = 4,
  minTwinklePeriod = 2,
  pixelSize = 5,
  reshuffleFraction = 0.15,
  reshuffleInterval = 5,
  shootingStarColor = "#ffffff",
  shootingStarInterval = 4,
  shootingStarPixelSize = 2,
  shootingStarSpeed = 8,
  trailColor = "#b4f2ff",
  twinkleProbability = 0.7,
}: BackgroundPixelStarsProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return noop;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return noop;
    }

    const targetFps = Math.max(1, fps);
    const frameInterval = 1000 / targetFps;

    const starField = {
      colors,
      maxTwinklePeriod: Math.max(minTwinklePeriod, maxTwinklePeriod),
      minTwinklePeriod: Math.min(minTwinklePeriod, maxTwinklePeriod),
      pixelSize: Math.max(1, pixelSize),
      twinkleProbability,
    } satisfies StarFieldConfig;

    const starsPerPixel = density / 100_000;

    let backgroundStars: BackgroundStar[] = [];
    let shootingStars: ShootingStar[] = [];

    const initBackgroundStars = () => {
      const area = canvas.width * canvas.height;
      const numStars = Math.floor(area * starsPerPixel);

      backgroundStars = [];

      for (let i = 0; i < numStars; i += 1) {
        backgroundStars.push(createBackgroundStar(canvas.width, canvas.height, starField));
      }
    };

    const regenerateBackgroundStars = () => {
      if (backgroundStars.length === 0) {
        return;
      }

      const numToRegenerate = Math.max(1, Math.floor(backgroundStars.length * reshuffleFraction));

      for (let i = 0; i < numToRegenerate; i += 1) {
        const randomIndex = Math.floor(Math.random() * backgroundStars.length);
        backgroundStars[randomIndex] = createBackgroundStar(canvas.width, canvas.height, starField);
      }
    };

    const drawBackgroundStars = () => {
      for (const star of backgroundStars) {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.currentOpacity;
        ctx.fillRect(star.x, star.y, starField.pixelSize, starField.pixelSize);

        if (!star.twinkle) {
          continue;
        }

        star.twinkleTimer += 1 / targetFps;

        if (star.twinkleTimer >= star.twinkleSpeed) {
          star.twinkleTimer = 0;
          star.twinkleDirection *= -1;
        }

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

    const updateShootingStars = () => {
      shootingStars = shootingStars
        .map((star) => {
          const newX = star.x + star.speed * Math.cos((star.angle * Math.PI) / 180);
          const newY = star.y + star.speed * Math.sin((star.angle * Math.PI) / 180);
          const newDistance = star.distance + star.speed;

          const newTrail = [...star.trail];

          if (newDistance % 8 < star.speed) {
            newTrail.push({
              opacity: 1,
              x: star.x,
              y: star.y,
            });
          }

          const updatedTrail = newTrail.flatMap((point) => {
            const opacity = point.opacity - 0.1;

            return opacity > 0 ? [{ opacity, x: point.x, y: point.y }] : [];
          });

          return {
            ...star,
            distance: newDistance,
            trail: updatedTrail,
            x: newX,
            y: newY,
          };
        })
        .filter(
          (star) =>
            star.x >= -shootingStarMargin &&
            star.x <= canvas.width + shootingStarMargin &&
            star.y >= -shootingStarMargin &&
            star.y <= canvas.height + shootingStarMargin,
        );
    };

    const drawShootingStars = () => {
      for (const star of shootingStars) {
        const radians = (star.angle * Math.PI) / 180;

        for (const point of star.trail) {
          ctx.save();
          ctx.translate(point.x, point.y);
          ctx.rotate(radians);
          ctx.translate(-point.x, -point.y);

          ctx.fillStyle = trailColor;
          ctx.globalAlpha = point.opacity;
          ctx.fillRect(point.x, point.y, shootingStarPixelSize, shootingStarPixelSize);

          ctx.restore();
        }

        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(radians);
        ctx.translate(-star.x, -star.y);

        ctx.fillStyle = shootingStarColor;
        ctx.globalAlpha = 1;

        for (let y = 0; y < shootingStarHeight; y += 1) {
          for (let x = 0; x < shootingStarWidth; x += 1) {
            if ((x === 0 && y === 1) || (x === 3 && y === 0)) {
              continue;
            }

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

    const animateCanvas = (timestamp: number) => {
      frameId = requestAnimationFrame(animateCanvas);

      if (timestamp - lastRenderTime < frameInterval) {
        return;
      }

      lastRenderTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBackgroundStars();

      if (shootingStars.length) {
        updateShootingStars();
        drawShootingStars();
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initBackgroundStars();
    };

    resizeCanvas();
    frameId = requestAnimationFrame(animateCanvas);

    let shootingStarTimer: ReturnType<typeof setTimeout> | undefined;

    const spawnShootingStar = () => {
      shootingStars = [...shootingStars, createShootingStar(canvas.width, shootingStarSpeed)];

      const randomDelay = shootingStarInterval * 1000 * (0.5 + Math.random());
      shootingStarTimer = setTimeout(spawnShootingStar, randomDelay);
    };

    spawnShootingStar();

    const regenerationInterval = setInterval(
      regenerateBackgroundStars,
      Math.max(0.1, reshuffleInterval) * 1000,
    );

    window.addEventListener("resize", resizeCanvas);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(regenerationInterval);
      clearTimeout(shootingStarTimer);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [
    colors,
    density,
    fps,
    maxTwinklePeriod,
    minTwinklePeriod,
    pixelSize,
    reshuffleFraction,
    reshuffleInterval,
    shootingStarColor,
    shootingStarInterval,
    shootingStarPixelSize,
    shootingStarSpeed,
    trailColor,
    twinkleProbability,
  ]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0" />;
};

export const BackgroundPixelStars = memo(BackgroundPixelStarsCanvas);
