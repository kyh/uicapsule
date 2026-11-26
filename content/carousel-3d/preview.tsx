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

const widestCardWithoutOverlap = (radius: number, bend: number, count: number) =>
  Math.floor(20 * (radius - BEND_MULTIPLIER * Math.max(0, bend)) * Math.tan(Math.PI / count)) / 10;

export const controls = {
  cardCount: {
    default: images.length,
    group: "Layout",
    label: "Cards",
    max: images.length,
    min: 5,
    step: 1,
    type: "number",
  },
  radius: {
    default: DEFAULT_RING_RADIUS,
    group: "Layout",
    label: "Ring radius",
    max: 7,
    min: 3,
    step: 0.1,
    type: "number",
  },
  imageWidth: {
    default: 3,
    group: "Layout",
    label: "Card width",
    max: widestCardWithoutOverlap(DEFAULT_RING_RADIUS, DEFAULT_BEND, images.length),
    min: 1.5,
    step: 0.1,
    type: "number",
  },
  cornerRadius: {
    default: 0.15,
    group: "Layout",
    label: "Corner radius",
    max: 0.5,
    min: 0,
    step: 0.01,
    type: "number",
  },
  bendAmount: {
    default: DEFAULT_BEND,
    group: "Layout",
    label: "Bend",
    max: 0.5,
    min: -0.5,
    step: 0.01,
    type: "number",
  },
  friction: {
    default: 0.95,
    group: "Motion",
    label: "Friction",
    max: 0.97,
    min: 0.9,
    step: 0.005,
    type: "number",
  },
  enableSnapping: { default: true, group: "Motion", label: "Snap to card", type: "boolean" },
  autorotate: { default: true, group: "Motion", label: "Auto-rotate", type: "boolean" },
  autorotateSpeed: {
    default: 0.02,
    group: "Motion",
    label: "Auto-rotate speed",
    max: 0.1,
    min: 0.005,
    step: 0.005,
    type: "number",
  },
  adjacentOpacity: {
    default: 1,
    group: "Style",
    label: "Side card opacity",
    max: 1,
    min: 0,
    step: 0.05,
    type: "number",
  },
  farOpacity: {
    default: 1,
    group: "Style",
    label: "Far card opacity",
    max: 1,
    min: 0,
    step: 0.05,
    type: "number",
  },
  backgroundColor: { default: "#6F6D66", group: "Style", label: "Background", type: "color" },
} as const;

interface PreviewProps {
  adjacentOpacity: number;
  autorotate: boolean;
  autorotateSpeed: number;
  backgroundColor: string;
  bendAmount: number;
  cardCount: number;
  cornerRadius: number;
  enableSnapping: boolean;
  farOpacity: number;
  friction: number;
  imageWidth: number;
  radius: number;
}

const Preview = ({
  backgroundColor = controls.backgroundColor.default,
  adjacentOpacity = controls.adjacentOpacity.default,
  autorotate = controls.autorotate.default,
  autorotateSpeed = controls.autorotateSpeed.default,
  bendAmount = controls.bendAmount.default,
  cardCount = controls.cardCount.default,
  cornerRadius = controls.cornerRadius.default,
  enableSnapping = controls.enableSnapping.default,
  farOpacity = controls.farOpacity.default,
  friction = controls.friction.default,
  imageWidth = controls.imageWidth.default,
  radius = controls.radius.default,
}: Partial<PreviewProps>) => (
  <ImageCarouselCanvas backgroundColor={backgroundColor}>
    <ImageCarousel
      images={images.slice(0, cardCount)}
      adjacentOpacity={adjacentOpacity}
      autorotate={autorotate}
      autorotateSpeed={autorotateSpeed}
      bendAmount={bendAmount}
      cornerRadius={cornerRadius}
      enableSnapping={enableSnapping}
      farOpacity={farOpacity}
      friction={friction}
      imageWidth={Math.min(imageWidth, widestCardWithoutOverlap(radius, bendAmount, cardCount))}
      radius={radius}
    />
  </ImageCarouselCanvas>
);

export default Preview;
