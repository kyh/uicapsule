"use client";

import { PopupBook } from "./popup-book";

export const controls = {
  autoPlay: { default: true, label: "Auto-play", type: "boolean" },
  interval: {
    default: 2800,
    label: "Page interval (ms)",
    max: 8000,
    min: 1500,
    step: 100,
    type: "number",
  },
} as const;

interface PreviewProps {
  autoPlay: boolean;
  interval: number;
}

const Preview = ({
  autoPlay = controls.autoPlay.default,
  interval = controls.interval.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,#fbf8f1_0%,#ece7dc_60%,#d9d3c6_100%)] p-5">
    <PopupBook autoPlay={autoPlay} interval={interval} />
  </main>
);

export default Preview;
