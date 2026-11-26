"use client";

import { TerminalDisintegrate } from "./terminal-disintegrate";

export const controls = {
  turbulence: {
    default: 22,
    group: "Effect",
    label: "Turbulence",
    max: 60,
    min: 0,
    step: 1,
    type: "number",
  },
  scorch: {
    default: 0.45,
    group: "Effect",
    label: "Scorch",
    max: 1,
    min: 0,
    step: 0.05,
    type: "number",
  },
  vignette: { default: true, group: "Effect", label: "Vignette", type: "boolean" },
  autoPlay: { default: true, group: "Playback", label: "Auto-play", type: "boolean" },
  sweepDuration: {
    default: 8000,
    group: "Playback",
    label: "Sweep (ms)",
    max: 20_000,
    min: 2000,
    step: 500,
    type: "number",
  },
  holdDuration: {
    default: 900,
    group: "Playback",
    label: "Hold (ms)",
    max: 4000,
    min: 0,
    step: 100,
    type: "number",
  },
  entranceDuration: {
    default: 2000,
    group: "Playback",
    label: "Entrance (ms)",
    max: 6000,
    min: 400,
    step: 100,
    type: "number",
  },
  lightBackground: { default: "#cff060", group: "Color", label: "Light background", type: "color" },
  lightForeground: { default: "#1c5f27", group: "Color", label: "Light glyphs", type: "color" },
  darkBackground: { default: "#1c5f27", group: "Color", label: "Dark background", type: "color" },
  darkForeground: { default: "#cff060", group: "Color", label: "Dark glyphs", type: "color" },
  showChrome: { default: true, group: "Chrome", label: "Chrome", type: "boolean" },
  hint: {
    default: "drag · disintegrate · resolve",
    group: "Chrome",
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
