"use client";

import { DEFAULT_ACCENTS, VoxelLanding } from "./voxel-landing";

export const controls = {
  autoTour: { default: true, label: "Auto tour", type: "boolean" },
  tourSpeed: { default: 1, label: "Tour speed", max: 2, min: 0.5, step: 0.1, type: "number" },
  zoom: { default: 1, label: "Zoom", max: 1.6, min: 0.7, step: 0.05, type: "number" },
  accent1: { default: DEFAULT_ACCENTS[0], label: "Accent 1", type: "color" },
  accent2: { default: DEFAULT_ACCENTS[1], label: "Accent 2", type: "color" },
  accent3: { default: DEFAULT_ACCENTS[2], label: "Accent 3", type: "color" },
  accent4: { default: DEFAULT_ACCENTS[3], label: "Accent 4", type: "color" },
  brand: { default: "Voxelworks", label: "Brand", placeholder: "Brand name", type: "text" },
  tagline: {
    default: "A tiny nation of cubes",
    label: "Tagline",
    placeholder: "Hero tagline",
    type: "text",
  },
} as const;

interface PreviewProps {
  autoTour: boolean;
  tourSpeed: number;
  zoom: number;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  brand: string;
  tagline: string;
}

const Preview = ({
  autoTour = controls.autoTour.default,
  tourSpeed = controls.tourSpeed.default,
  zoom = controls.zoom.default,
  accent1 = controls.accent1.default,
  accent2 = controls.accent2.default,
  accent3 = controls.accent3.default,
  accent4 = controls.accent4.default,
  brand = controls.brand.default,
  tagline = controls.tagline.default,
}: Partial<PreviewProps>) => (
  <main className="h-dvh w-full bg-[#0f1114]">
    <VoxelLanding
      autoTour={autoTour}
      tourSpeed={tourSpeed}
      zoom={zoom}
      accents={[accent1, accent2, accent3, accent4]}
      brand={brand}
      tagline={tagline}
    />
  </main>
);

export default Preview;
