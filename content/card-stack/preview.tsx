"use client";

import { useMemo } from "react";

import { CardStack } from "./card-stack";

const rootUrl = "https://d24l2zb4cwkekfpl.public.blob.vercel-storage.com/card-stack-1";

const cards = [
  { alt: "UI Capsule", href: "https://www.uicapsule.com", src: `${rootUrl}/uic.webp` },
  { alt: "KYH", href: "https://kyh.io", src: `${rootUrl}/kyh.webp` },
  { alt: "Vibed Games", href: "https://vibedgames.com", src: `${rootUrl}/vg.webp` },
  { alt: "Founding", href: "https://founding.so", src: `${rootUrl}/found.webp` },
  { alt: "Init", href: "https://init.kyh.io", src: `${rootUrl}/init.webp` },
  { alt: "TC", href: "https://tc.kyh.io", src: `${rootUrl}/tc.webp` },
  { alt: "Data Embed", href: "https://dataembed.com", src: `${rootUrl}/data.webp` },
  { alt: "Yours Sincerely", href: "https://yourssincerely.org", src: `${rootUrl}/ys.webp` },
];

export const controls = {
  cardCount: { default: 8, label: "Cards", max: 8, min: 4, step: 1, type: "number" },
  cardWidth: { default: 40, label: "Card width", max: 50, min: 20, step: 1, type: "number" },
  aspectRatio: {
    default: 1.75,
    label: "Aspect ratio",
    max: 2.5,
    min: 1,
    step: 0.05,
    type: "number",
  },
  radius: { default: 12, label: "Radius", max: 40, min: 0, step: 1, type: "number" },
  depth: { default: 60, label: "Depth", max: 120, min: 20, step: 1, type: "number" },
  rise: { default: 15, label: "Rise", max: 30, min: 5, step: 1, type: "number" },
  perspective: { default: 150, label: "Perspective", max: 300, min: 50, step: 5, type: "number" },
  tilt: { default: 10, label: "Tilt", max: 15, min: 0, step: 1, type: "number" },
  scrollSpeed: { default: 1, label: "Scroll speed", max: 3, min: 0.25, step: 0.05, type: "number" },
  smoothing: { default: 0.8, label: "Smoothing", max: 2, min: 0.1, step: 0.05, type: "number" },
  autoplayInterval: {
    default: 0,
    label: "Autoplay (s)",
    max: 5,
    min: 0,
    step: 0.5,
    type: "number",
  },
  background: { default: "#121212", label: "Background", type: "color" },
} as const;

interface PreviewProps {
  aspectRatio: number;
  autoplayInterval: number;
  background: string;
  cardCount: number;
  cardWidth: number;
  depth: number;
  perspective: number;
  radius: number;
  rise: number;
  scrollSpeed: number;
  smoothing: number;
  tilt: number;
}

const Preview = ({
  aspectRatio = controls.aspectRatio.default,
  autoplayInterval = controls.autoplayInterval.default,
  background = controls.background.default,
  cardCount = controls.cardCount.default,
  cardWidth = controls.cardWidth.default,
  depth = controls.depth.default,
  perspective = controls.perspective.default,
  radius = controls.radius.default,
  rise = controls.rise.default,
  scrollSpeed = controls.scrollSpeed.default,
  smoothing = controls.smoothing.default,
  tilt = controls.tilt.default,
}: Partial<PreviewProps>) => {
  const shownCards = useMemo(() => cards.slice(0, cardCount), [cardCount]);

  return (
    <CardStack
      aspectRatio={aspectRatio}
      autoplayInterval={autoplayInterval}
      background={background}
      cardWidth={cardWidth}
      cards={shownCards}
      depth={depth}
      perspective={perspective}
      radius={radius}
      rise={rise}
      scrollSpeed={scrollSpeed}
      smoothing={smoothing}
      tilt={tilt}
    />
  );
};

export default Preview;
