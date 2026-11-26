"use client";

import { VoiceDictator } from "./voice-dictator";

export const controls = {
  autoDictate: { default: false, group: "Dictation", label: "Auto Dictate", type: "boolean" },
  script: {
    default: "",
    group: "Dictation",
    label: "Script",
    placeholder: "Random sample",
    type: "text",
  },
  placeholder: {
    default:
      "Generate expressive prompts by speaking naturally. We will render a faux transcript here.",
    group: "Dictation",
    label: "Idle Text",
    type: "text",
  },
  speechRate: {
    default: 1,
    group: "Dictation",
    label: "Speech Rate",
    max: 3,
    min: 0.5,
    step: 0.1,
    type: "number",
  },
  reactivity: {
    default: 1,
    group: "Motion",
    label: "Reactivity",
    max: 2,
    min: 0.25,
    step: 0.05,
    type: "number",
  },
  smoothing: {
    default: 0.95,
    group: "Motion",
    label: "Smoothing",
    max: 0.99,
    min: 0.8,
    step: 0.01,
    type: "number",
  },
  ringRadius: {
    default: 0.21,
    group: "Shape",
    label: "Ring Radius",
    max: 0.45,
    min: 0.1,
    step: 0.01,
    type: "number",
  },
  ringThickness: {
    default: 0.07,
    group: "Shape",
    label: "Ring Thickness",
    max: 0.15,
    min: 0.02,
    step: 0.005,
    type: "number",
  },
  ditherSize: {
    default: 1,
    group: "Shape",
    label: "Dither Size",
    max: 3,
    min: 1,
    step: 1,
    type: "number",
  },
  orbSize: {
    default: 32,
    group: "Shape",
    label: "Orb Size",
    max: 64,
    min: 16,
    step: 2,
    type: "number",
  },
  glow: {
    default: 0.5,
    group: "Color",
    label: "Glow",
    max: 1.5,
    min: 0,
    step: 0.05,
    type: "number",
  },
  ringColor: { default: "#ffffff", group: "Color", label: "Ring Color", type: "color" },
  background: { default: "#000000", group: "Color", label: "Background", type: "color" },
} as const;

interface PreviewProps {
  autoDictate: boolean;
  background: string;
  ditherSize: number;
  glow: number;
  orbSize: number;
  placeholder: string;
  reactivity: number;
  ringColor: string;
  ringRadius: number;
  ringThickness: number;
  script: string;
  smoothing: number;
  speechRate: number;
}

const Preview = ({
  autoDictate = controls.autoDictate.default,
  background = controls.background.default,
  ditherSize = controls.ditherSize.default,
  glow = controls.glow.default,
  orbSize = controls.orbSize.default,
  placeholder = controls.placeholder.default,
  reactivity = controls.reactivity.default,
  ringColor = controls.ringColor.default,
  ringRadius = controls.ringRadius.default,
  ringThickness = controls.ringThickness.default,
  script = controls.script.default,
  smoothing = controls.smoothing.default,
  speechRate = controls.speechRate.default,
}: Partial<PreviewProps>) => (
  <VoiceDictator
    autoDictate={autoDictate}
    background={background}
    ditherSize={ditherSize}
    glow={glow}
    orbSize={orbSize}
    placeholder={placeholder}
    reactivity={reactivity}
    ringColor={ringColor}
    ringRadius={ringRadius}
    ringThickness={ringThickness}
    script={script}
    smoothing={smoothing}
    speechRate={speechRate}
  />
);

export default Preview;
