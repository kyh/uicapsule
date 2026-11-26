"use client";

import { BEND_MULTIPLIER, ImageCarousel, ImageCarouselCanvas } from "./carousel-3d";

const rootUrl = "https://d24l2zb4cwkekfpl.public.blob.vercel-storage.com/carousel-3d";

const cards = [
  { src: `${rootUrl}/1.webp` },
  { src: `${rootUrl}/2.webp` },
  { src: `${rootUrl}/3.webp` },
  { src: `${rootUrl}/4.webp` },
  { src: `${rootUrl}/5.webp` },
  { src: `${rootUrl}/6.webp` },
  { src: `${rootUrl}/7.webp` },
  { src: `${rootUrl}/8.webp` },
];

const images = cards.map((card) => card.src);

const DEFAULT_RING_RADIUS = 5;
const DEFAULT_BEND = 0.1;

const widestCardWithoutOverlap =
  Math.floor(
    20 * (DEFAULT_RING_RADIUS - BEND_MULTIPLIER * DEFAULT_BEND) * Math.tan(Math.PI / cards.length),
  ) / 10;

export const controls = {
  radius: {
    default: DEFAULT_RING_RADIUS,
    label: "Ring radius",
    max: 9,
    min: 3,
    step: 0.1,
    type: "number",
  },
  imageWidth: {
    default: 3,
    label: "Card width",
    max: widestCardWithoutOverlap,
    min: 1.5,
    step: 0.1,
    type: "number",
  },
  cornerRadius: {
    default: 0.15,
    label: "Corner radius",
    max: 0.5,
    min: 0,
    step: 0.01,
    type: "number",
  },
  bendAmount: {
    default: DEFAULT_BEND,
    label: "Bend",
    max: 0.5,
    min: -0.5,
    step: 0.01,
    type: "number",
  },
  adjacentOpacity: {
    default: 1,
    label: "Side card opacity",
    max: 1,
    min: 0,
    step: 0.05,
    type: "number",
  },
  farOpacity: {
    default: 1,
    label: "Far card opacity",
    max: 1,
    min: 0,
    step: 0.05,
    type: "number",
  },
  enableSnapping: { default: true, label: "Snap to card", type: "boolean" },
  autorotate: { default: true, label: "Auto-rotate", type: "boolean" },
  autorotateSpeed: {
    default: 0.02,
    label: "Auto-rotate speed",
    max: 0.1,
    min: 0.005,
    step: 0.005,
    type: "number",
  },
  backgroundColor: { default: "#6F6D66", label: "Background", type: "color" },
} as const;

interface PreviewProps {
  adjacentOpacity: number;
  autorotate: boolean;
  autorotateSpeed: number;
  backgroundColor: string;
  bendAmount: number;
  cornerRadius: number;
  enableSnapping: boolean;
  farOpacity: number;
  imageWidth: number;
  radius: number;
}

const Preview = ({
  backgroundColor = controls.backgroundColor.default,
  adjacentOpacity = controls.adjacentOpacity.default,
  autorotate = controls.autorotate.default,
  autorotateSpeed = controls.autorotateSpeed.default,
  bendAmount = controls.bendAmount.default,
  cornerRadius = controls.cornerRadius.default,
  enableSnapping = controls.enableSnapping.default,
  farOpacity = controls.farOpacity.default,
  imageWidth = controls.imageWidth.default,
  radius = controls.radius.default,
}: Partial<PreviewProps>) => (
  <ImageCarouselCanvas backgroundColor={backgroundColor}>
    <ImageCarousel
      images={images}
      adjacentOpacity={adjacentOpacity}
      autorotate={autorotate}
      autorotateSpeed={autorotateSpeed}
      bendAmount={bendAmount}
      cornerRadius={cornerRadius}
      enableSnapping={enableSnapping}
      farOpacity={farOpacity}
      imageWidth={imageWidth}
      radius={radius}
    />
  </ImageCarouselCanvas>
);

export default Preview;
