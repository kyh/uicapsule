"use client";

import { SeekFilmstrip } from "./seek-filmstrip";

export const controls = {
  title: { default: "One Day — timelapse", label: "Title", placeholder: "Caption", type: "text" },
  loopSeconds: { default: 48, label: "Day length (s)", max: 120, min: 6, step: 1, type: "number" },
  startHour: {
    default: 7.2,
    label: "Start time (h)",
    max: 23.9,
    min: 0,
    step: 0.1,
    type: "number",
  },
  autoplay: { default: true, label: "Autoplay", type: "boolean" },
  frameCount: { default: 12, label: "Strip frames", max: 24, min: 4, step: 1, type: "number" },
  previewWidth: {
    default: 176,
    label: "Preview width",
    max: 260,
    min: 120,
    step: 2,
    type: "number",
  },
  scrubDim: { default: 0.3, label: "Scrub dim", max: 0.8, min: 0, step: 0.05, type: "number" },
  stiffness: { default: 420, label: "Stiffness", max: 800, min: 120, step: 10, type: "number" },
  damping: { default: 32, label: "Damping", max: 60, min: 18, step: 1, type: "number" },
  accent: { default: "#ffffff", label: "Accent", type: "color" },
  panelColor: { default: "#0a1122", label: "Panel", type: "color" },
} as const;

interface PreviewProps {
  accent: string;
  autoplay: boolean;
  damping: number;
  frameCount: number;
  loopSeconds: number;
  panelColor: string;
  previewWidth: number;
  scrubDim: number;
  startHour: number;
  stiffness: number;
  title: string;
}

const Preview = ({
  accent = controls.accent.default,
  autoplay = controls.autoplay.default,
  damping = controls.damping.default,
  frameCount = controls.frameCount.default,
  loopSeconds = controls.loopSeconds.default,
  panelColor = controls.panelColor.default,
  previewWidth = controls.previewWidth.default,
  scrubDim = controls.scrubDim.default,
  startHour = controls.startHour.default,
  stiffness = controls.stiffness.default,
  title = controls.title.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_45%_70%_at_50%_-15%,rgb(147_197_253/0.16)_0%,transparent_70%),radial-gradient(ellipse_at_50%_50%,#0f1d3d_0%,#081330_50%,#030817_100%)] p-5">
    <SeekFilmstrip
      key={`${String(startHour)}-${String(autoplay)}`}
      accent={accent}
      autoplay={autoplay}
      damping={damping}
      frameCount={frameCount}
      loopSeconds={loopSeconds}
      panelColor={panelColor}
      previewWidth={previewWidth}
      scrubDim={scrubDim}
      startTime={startHour / 24}
      stiffness={stiffness}
      title={title}
    />
  </main>
);

export default Preview;
