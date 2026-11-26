"use client";

import { useMemo } from "react";

import { GravityWall } from "./gravity-wall";
import type { Photo } from "./photos";
import { PHOTOS } from "./photos";

const [firstPhoto, ...otherPhotos] = PHOTOS;

export const controls = {
  wellScale: {
    default: 1,
    group: "Gravity",
    label: "Well size",
    max: 1.6,
    min: 0.8,
    step: 0.05,
    type: "number",
  },
  falloff: {
    default: 1.3,
    group: "Gravity",
    label: "Bend reach",
    max: 2.5,
    min: 1.05,
    step: 0.05,
    type: "number",
  },
  follow: {
    default: 0.25,
    group: "Gravity",
    label: "Follow",
    max: 1,
    min: 0.03,
    step: 0.01,
    type: "number",
  },
  photoCount: {
    default: PHOTOS.length,
    group: "Layout",
    label: "Photos",
    max: PHOTOS.length,
    min: 3,
    step: 1,
    type: "number",
  },
  cellHeight: {
    default: 100,
    group: "Layout",
    label: "Tile height",
    max: 180,
    min: 64,
    step: 1,
    type: "number",
  },
  gap: { default: 12, group: "Layout", label: "Gap", max: 40, min: 0, step: 1, type: "number" },
  tilt: { default: 1.8, group: "Layout", label: "Tilt", max: 8, min: 0, step: 0.1, type: "number" },
  cornerRadius: {
    default: 3,
    group: "Layout",
    label: "Corner radius",
    max: 24,
    min: 0,
    step: 1,
    type: "number",
  },
  drift: {
    default: 1,
    group: "Motion",
    label: "Drift speed",
    max: 4,
    min: 0,
    step: 0.1,
    type: "number",
  },
  panEase: {
    default: 0.07,
    group: "Motion",
    label: "Pan speed",
    max: 0.3,
    min: 0.02,
    step: 0.01,
    type: "number",
  },
  vignette: {
    default: 0.5,
    group: "Surface",
    label: "Vignette",
    max: 1,
    min: 0,
    step: 0.05,
    type: "number",
  },
  background: { default: "#0a0a0a", group: "Surface", label: "Background", type: "color" },
} as const;

interface PreviewProps {
  background: string;
  cellHeight: number;
  cornerRadius: number;
  drift: number;
  falloff: number;
  follow: number;
  gap: number;
  panEase: number;
  photoCount: number;
  tilt: number;
  vignette: number;
  wellScale: number;
}

const Preview = ({
  background = controls.background.default,
  cellHeight = controls.cellHeight.default,
  cornerRadius = controls.cornerRadius.default,
  drift = controls.drift.default,
  falloff = controls.falloff.default,
  follow = controls.follow.default,
  gap = controls.gap.default,
  panEase = controls.panEase.default,
  photoCount = controls.photoCount.default,
  tilt = controls.tilt.default,
  vignette = controls.vignette.default,
  wellScale = controls.wellScale.default,
}: Partial<PreviewProps>) => {
  const photos = useMemo<readonly [Photo, ...Photo[]]>(
    () => [firstPhoto, ...otherPhotos.slice(0, Math.max(0, photoCount - 1))],
    [photoCount],
  );

  return (
    <GravityWall
      photos={photos}
      layout={{ cellHeight, gap, tilt }}
      motion={{ drift, falloff, follow, panEase, wellScale }}
      cornerRadius={cornerRadius}
      background={background}
      vignette={vignette}
    />
  );
};

export default Preview;
