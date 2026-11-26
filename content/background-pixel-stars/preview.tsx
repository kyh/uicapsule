"use client";

import { BackgroundPixelStars, STAR_PALETTES } from "./background-pixel-stars";

export const controls = {
  palette: {
    default: "retro",
    group: "Stars",
    label: "Palette",
    options: [
      { label: "Retro", value: "retro" },
      { label: "Mono", value: "mono" },
      { label: "Warm", value: "warm" },
      { label: "Cool", value: "cool" },
    ],
    type: "select",
  },
  density: {
    default: 4,
    group: "Stars",
    label: "Density",
    max: 30,
    min: 0.5,
    step: 0.5,
    type: "number",
  },
  pixelSize: {
    default: 5,
    group: "Stars",
    label: "Pixel size",
    max: 12,
    min: 1,
    step: 1,
    type: "number",
  },
  twinkleProbability: {
    default: 0.7,
    group: "Twinkle",
    label: "Twinkle chance",
    max: 1,
    min: 0,
    step: 0.05,
    type: "number",
  },
  minTwinklePeriod: {
    default: 2,
    group: "Twinkle",
    label: "Twinkle min (s)",
    max: 8,
    min: 0.5,
    step: 0.5,
    type: "number",
  },
  maxTwinklePeriod: {
    default: 4,
    group: "Twinkle",
    label: "Twinkle max (s)",
    max: 8,
    min: 0.5,
    step: 0.5,
    type: "number",
  },
  reshuffleInterval: {
    default: 5,
    group: "Twinkle",
    label: "Reshuffle every (s)",
    max: 20,
    min: 1,
    step: 1,
    type: "number",
  },
  reshuffleFraction: {
    default: 0.15,
    group: "Twinkle",
    label: "Reshuffle amount",
    max: 1,
    min: 0.05,
    step: 0.05,
    type: "number",
  },
  fps: {
    default: 16,
    group: "Twinkle",
    label: "Frame rate",
    max: 60,
    min: 4,
    step: 1,
    type: "number",
  },
  shootingStarInterval: {
    default: 4,
    group: "Meteors",
    label: "Meteor every (s)",
    max: 15,
    min: 0.5,
    step: 0.5,
    type: "number",
  },
  shootingStarSpeed: {
    default: 8,
    group: "Meteors",
    label: "Meteor speed",
    max: 30,
    min: 2,
    step: 1,
    type: "number",
  },
  shootingStarPixelSize: {
    default: 2,
    group: "Meteors",
    label: "Meteor pixel",
    max: 6,
    min: 1,
    step: 1,
    type: "number",
  },
  shootingStarColor: { default: "#ffffff", group: "Meteors", label: "Meteor", type: "color" },
  trailColor: { default: "#b4f2ff", group: "Meteors", label: "Trail", type: "color" },
  background: { default: "#000000", group: "Backdrop", label: "Background", type: "color" },
  texture: { default: true, group: "Backdrop", label: "Backdrop texture", type: "boolean" },
} as const;

interface PreviewProps {
  background: string;
  density: number;
  fps: number;
  maxTwinklePeriod: number;
  minTwinklePeriod: number;
  palette: keyof typeof STAR_PALETTES;
  pixelSize: number;
  reshuffleFraction: number;
  reshuffleInterval: number;
  shootingStarColor: string;
  shootingStarInterval: number;
  shootingStarPixelSize: number;
  shootingStarSpeed: number;
  texture: boolean;
  trailColor: string;
  twinkleProbability: number;
}

const textureImage =
  "url('https://d24l2zb4cwkekfpl.public.blob.vercel-storage.com/background-pixel-stars/bg.png')";

const Preview = ({
  background = controls.background.default,
  density = controls.density.default,
  fps = controls.fps.default,
  maxTwinklePeriod = controls.maxTwinklePeriod.default,
  minTwinklePeriod = controls.minTwinklePeriod.default,
  palette = controls.palette.default,
  pixelSize = controls.pixelSize.default,
  reshuffleFraction = controls.reshuffleFraction.default,
  reshuffleInterval = controls.reshuffleInterval.default,
  shootingStarColor = controls.shootingStarColor.default,
  shootingStarInterval = controls.shootingStarInterval.default,
  shootingStarPixelSize = controls.shootingStarPixelSize.default,
  shootingStarSpeed = controls.shootingStarSpeed.default,
  texture = controls.texture.default,
  trailColor = controls.trailColor.default,
  twinkleProbability = controls.twinkleProbability.default,
}: Partial<PreviewProps>) => (
  <div
    className="h-dvh w-dvw bg-[size:10px]"
    style={{
      backgroundBlendMode: "screen",
      backgroundColor: background,
      backgroundImage: texture ? textureImage : "none",
    }}
  >
    <BackgroundPixelStars
      colors={STAR_PALETTES[palette]}
      density={density}
      fps={fps}
      maxTwinklePeriod={maxTwinklePeriod}
      minTwinklePeriod={minTwinklePeriod}
      pixelSize={pixelSize}
      reshuffleFraction={reshuffleFraction}
      reshuffleInterval={reshuffleInterval}
      shootingStarColor={shootingStarColor}
      shootingStarInterval={shootingStarInterval}
      shootingStarPixelSize={shootingStarPixelSize}
      shootingStarSpeed={shootingStarSpeed}
      trailColor={trailColor}
      twinkleProbability={twinkleProbability}
    />
  </div>
);

export default Preview;
