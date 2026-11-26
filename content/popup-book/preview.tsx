"use client";

import { PopupBook } from "./popup-book";
import { CITIES } from "./popup-cities";

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
  turnSpeed: {
    default: 1,
    label: "Turn speed",
    max: 2,
    min: 0.5,
    step: 0.05,
    type: "number",
  },
  startCity: {
    default: "San Francisco",
    label: "Start city",
    options: ["San Francisco", "Paris", "Kyoto", "New York", "Venice", "Santorini"],
    type: "select",
  },
} as const;

interface PreviewProps {
  autoPlay: boolean;
  interval: number;
  turnSpeed: number;
  startCity: (typeof controls.startCity.options)[number];
}

const Preview = ({
  autoPlay = controls.autoPlay.default,
  interval = controls.interval.default,
  turnSpeed = controls.turnSpeed.default,
  startCity = controls.startCity.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,#fbf8f1_0%,#ece7dc_60%,#d9d3c6_100%)] p-5">
    <PopupBook
      key={startCity}
      autoPlay={autoPlay}
      interval={interval}
      turnSpeed={turnSpeed}
      startIndex={Math.max(
        0,
        CITIES.findIndex((city) => city.name === startCity),
      )}
    />
  </main>
);

export default Preview;
