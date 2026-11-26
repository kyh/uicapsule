"use client";

import { LookbookCamera } from "./lookbook-camera";

export const controls = {
  driftSpeed: {
    default: 0.45,
    group: "Camera",
    label: "Drift",
    max: 2,
    min: 0,
    step: 0.05,
    type: "number",
  },
  inertiaFriction: {
    default: 0.93,
    group: "Camera",
    label: "Glide",
    max: 0.97,
    min: 0.8,
    step: 0.01,
    type: "number",
  },
  wheelSensitivity: {
    default: 0.0018,
    group: "Camera",
    label: "Zoom speed",
    max: 0.004,
    min: 0.0005,
    step: 0.0001,
    type: "number",
  },
  maxZoom: {
    default: 6,
    group: "Camera",
    label: "Max zoom",
    max: 8,
    min: 2,
    step: 0.5,
    type: "number",
  },
  parallaxStrength: {
    default: 9,
    group: "Parallax",
    label: "Parallax",
    max: 24,
    min: 0,
    step: 1,
    type: "number",
  },
  parallaxRange: {
    default: 320,
    group: "Parallax",
    label: "Parallax reach",
    max: 640,
    min: 80,
    step: 10,
    type: "number",
  },
  maxTilt: {
    default: 2,
    group: "Cards",
    label: "Card tilt",
    max: 10,
    min: 0,
    step: 0.5,
    type: "number",
  },
  dimOpacity: {
    default: 0.22,
    group: "Cards",
    label: "Dim others",
    max: 0.8,
    min: 0,
    step: 0.02,
    type: "number",
  },
  entranceStagger: {
    default: 0.04,
    group: "Cards",
    label: "Entrance stagger",
    max: 0.08,
    min: 0,
    step: 0.01,
    type: "number",
  },
  background: { default: "#fffdf8", group: "Page", label: "Paper", type: "color" },
  foreground: { default: "#221e18", group: "Page", label: "Ink", type: "color" },
  mutedForeground: { default: "#6f6757", group: "Page", label: "Muted ink", type: "color" },
  hint: {
    default: "Drag to pan · scroll to zoom · click a look",
    group: "Page",
    label: "Hint",
    placeholder: "Hidden when empty",
    type: "text",
  },
} as const;

interface PreviewProps {
  background: string;
  dimOpacity: number;
  driftSpeed: number;
  entranceStagger: number;
  foreground: string;
  hint: string;
  inertiaFriction: number;
  maxTilt: number;
  maxZoom: number;
  mutedForeground: string;
  parallaxRange: number;
  parallaxStrength: number;
  wheelSensitivity: number;
}

const Preview = ({
  background = controls.background.default,
  dimOpacity = controls.dimOpacity.default,
  driftSpeed = controls.driftSpeed.default,
  entranceStagger = controls.entranceStagger.default,
  foreground = controls.foreground.default,
  hint = controls.hint.default,
  inertiaFriction = controls.inertiaFriction.default,
  maxTilt = controls.maxTilt.default,
  maxZoom = controls.maxZoom.default,
  mutedForeground = controls.mutedForeground.default,
  parallaxRange = controls.parallaxRange.default,
  parallaxStrength = controls.parallaxStrength.default,
  wheelSensitivity = controls.wheelSensitivity.default,
}: Partial<PreviewProps>) => (
  <div className="h-dvh w-full overflow-hidden">
    <LookbookCamera
      key={entranceStagger}
      background={background}
      dimOpacity={dimOpacity}
      driftSpeed={driftSpeed}
      entranceStagger={entranceStagger}
      foreground={foreground}
      hint={hint}
      inertiaFriction={inertiaFriction}
      maxTilt={maxTilt}
      maxZoom={maxZoom}
      mutedForeground={mutedForeground}
      parallaxRange={parallaxRange}
      parallaxStrength={parallaxStrength}
      wheelSensitivity={wheelSensitivity}
    />
  </div>
);

export default Preview;
