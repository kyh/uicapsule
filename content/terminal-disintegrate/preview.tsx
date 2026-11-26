"use client";

import { TerminalDisintegrate } from "./terminal-disintegrate";

export const controls = {
  lightBackground: { default: "#cff060", label: "Light background", type: "color" },
  lightForeground: { default: "#1c5f27", label: "Light glyphs", type: "color" },
  darkBackground: { default: "#1c5f27", label: "Dark background", type: "color" },
  darkForeground: { default: "#cff060", label: "Dark glyphs", type: "color" },
  autoPlay: { default: true, label: "Auto-play", type: "boolean" },
  sweepDuration: {
    default: 8000,
    label: "Sweep (ms)",
    max: 20_000,
    min: 2000,
    step: 500,
    type: "number",
  },
  holdDuration: {
    default: 900,
    label: "Hold (ms)",
    max: 4000,
    min: 0,
    step: 100,
    type: "number",
  },
  entranceDuration: {
    default: 2000,
    label: "Entrance (ms)",
    max: 6000,
    min: 400,
    step: 100,
    type: "number",
  },
  turbulence: { default: 22, label: "Turbulence", max: 60, min: 0, step: 1, type: "number" },
  scorch: { default: 0.45, label: "Scorch", max: 1, min: 0, step: 0.05, type: "number" },
  vignette: { default: true, label: "Vignette", type: "boolean" },
  showChrome: { default: true, label: "Chrome", type: "boolean" },
  hint: {
    default: "drag · disintegrate · resolve",
    label: "Hint",
    placeholder: "Hint text",
    type: "text",
  },
} as const;

interface PreviewProps {
  lightBackground: string;
  lightForeground: string;
  darkBackground: string;
  darkForeground: string;
  autoPlay: boolean;
  sweepDuration: number;
  holdDuration: number;
  entranceDuration: number;
  turbulence: number;
  scorch: number;
  vignette: boolean;
  showChrome: boolean;
  hint: string;
}

const Preview = ({
  lightBackground = controls.lightBackground.default,
  lightForeground = controls.lightForeground.default,
  darkBackground = controls.darkBackground.default,
  darkForeground = controls.darkForeground.default,
  autoPlay = controls.autoPlay.default,
  sweepDuration = controls.sweepDuration.default,
  holdDuration = controls.holdDuration.default,
  entranceDuration = controls.entranceDuration.default,
  turbulence = controls.turbulence.default,
  scorch = controls.scorch.default,
  vignette = controls.vignette.default,
  showChrome = controls.showChrome.default,
  hint = controls.hint.default,
}: Partial<PreviewProps>) => (
  <main className="h-dvh w-full overflow-hidden">
    <TerminalDisintegrate
      key={entranceDuration}
      lightBackground={lightBackground}
      lightForeground={lightForeground}
      darkBackground={darkBackground}
      darkForeground={darkForeground}
      autoPlay={autoPlay}
      sweepDuration={sweepDuration}
      holdDuration={holdDuration}
      entranceDuration={entranceDuration}
      turbulence={turbulence}
      scorch={scorch}
      vignette={vignette}
      showChrome={showChrome}
      hint={hint}
    />
  </main>
);

export default Preview;
