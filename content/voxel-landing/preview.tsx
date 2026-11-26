"use client";

import { VoxelLanding } from "./voxel-landing";

export const controls = {
  autoTour: { default: true, label: "Auto tour", type: "boolean" },
} as const;

interface PreviewProps {
  autoTour: boolean;
}

const Preview = ({ autoTour = controls.autoTour.default }: Partial<PreviewProps>) => (
  <main className="h-dvh w-full bg-[#0f1114]">
    <VoxelLanding key={String(autoTour)} autoTour={autoTour} />
  </main>
);

export default Preview;
