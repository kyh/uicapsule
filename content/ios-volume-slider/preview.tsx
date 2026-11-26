"use client";

import { Volume } from "./ios-volume-slider";

export const controls = {
  trackHeight: { default: 200, label: "Height", max: 320, min: 120, step: 4, type: "number" },
  trackWidth: { default: 60, label: "Width", max: 120, min: 24, step: 2, type: "number" },
  cornerRadius: { default: 12, label: "Corner radius", max: 30, min: 0, step: 1, type: "number" },
  overscroll: { default: 50, label: "Stretch", max: 100, min: 10, step: 1, type: "number" },
  bounce: { default: 0.5, label: "Bounce", max: 0.9, min: 0, step: 0.05, type: "number" },
  max: { default: 100, label: "Max value", max: 200, min: 10, step: 10, type: "number" },
  startLevel: { default: 0, label: "Start %", max: 100, min: 0, step: 1, type: "number" },
  fillColor: { default: "#ffffff", label: "Fill", type: "color" },
  trackColor: { default: "#262626", label: "Track", type: "color" },
  showReadout: { default: true, label: "Readout", type: "boolean" },
  textColor: { default: "#d4d4d4", label: "Text", type: "color" },
  background: { default: "#171717", label: "Background", type: "color" },
} as const;

interface PreviewProps {
  background: string;
  bounce: number;
  cornerRadius: number;
  fillColor: string;
  max: number;
  overscroll: number;
  showReadout: boolean;
  startLevel: number;
  textColor: string;
  trackColor: string;
  trackHeight: number;
  trackWidth: number;
}

const Preview = ({
  background = controls.background.default,
  bounce = controls.bounce.default,
  cornerRadius = controls.cornerRadius.default,
  fillColor = controls.fillColor.default,
  max = controls.max.default,
  overscroll = controls.overscroll.default,
  showReadout = controls.showReadout.default,
  startLevel = controls.startLevel.default,
  textColor = controls.textColor.default,
  trackColor = controls.trackColor.default,
  trackHeight = controls.trackHeight.default,
  trackWidth = controls.trackWidth.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center" style={{ background }}>
    <Volume
      key={`${max}-${startLevel}`}
      bounce={bounce}
      cornerRadius={cornerRadius}
      defaultValue={Math.round((max * startLevel) / 100)}
      fillColor={fillColor}
      max={max}
      overscroll={overscroll}
      showReadout={showReadout}
      textColor={textColor}
      trackColor={trackColor}
      trackHeight={trackHeight}
      trackWidth={trackWidth}
    />
  </main>
);

export default Preview;
