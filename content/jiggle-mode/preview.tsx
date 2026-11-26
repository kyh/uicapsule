"use client";

import { JiggleMode } from "./jiggle-mode";
import type { ClayTone } from "./phone-frame";

export const controls = {
  appCount: { default: 20, label: "Apps", max: 20, min: 4, step: 1, type: "number" },
  wobbleAngle: { default: 2, label: "Wobble", max: 6, min: 0.5, step: 0.25, type: "number" },
  wobbleDuration: {
    default: 0.13,
    label: "Wobble period",
    max: 0.4,
    min: 0.08,
    step: 0.01,
    type: "number",
  },
  longPressMs: { default: 450, label: "Hold time", max: 1200, min: 150, step: 50, type: "number" },
  liftScale: { default: 1.14, label: "Drag lift", max: 1.4, min: 1, step: 0.02, type: "number" },
  showLabels: { default: true, label: "Labels", type: "boolean" },
  showDock: { default: true, label: "Dock", type: "boolean" },
  hint: { default: "Hold an icon to edit", label: "Hint", placeholder: "No hint", type: "text" },
  tone: {
    default: "ochre",
    label: "Frame",
    options: [
      { label: "Ochre", value: "ochre" },
      { label: "Espresso", value: "espresso" },
      { label: "Graphite", value: "graphite" },
      { label: "Moss", value: "moss" },
      { label: "Plum", value: "plum" },
      { label: "Slate", value: "slate" },
      { label: "Teal", value: "teal" },
      { label: "Terracotta", value: "terracotta" },
    ],
    type: "select",
  },
  wallpaper: { default: "#1a1209", label: "Wallpaper", type: "color" },
  glowTop: { default: "#d97706", label: "Top glow", type: "color" },
  glowRight: { default: "#ea580c", label: "Right glow", type: "color" },
  glowBottom: { default: "#be185d", label: "Bottom glow", type: "color" },
} as const;

interface PreviewProps {
  appCount: number;
  glowBottom: string;
  glowRight: string;
  glowTop: string;
  hint: string;
  liftScale: number;
  longPressMs: number;
  showDock: boolean;
  showLabels: boolean;
  tone: ClayTone;
  wallpaper: string;
  wobbleAngle: number;
  wobbleDuration: number;
}

const Preview = ({
  appCount = controls.appCount.default,
  glowBottom = controls.glowBottom.default,
  glowRight = controls.glowRight.default,
  glowTop = controls.glowTop.default,
  hint = controls.hint.default,
  liftScale = controls.liftScale.default,
  longPressMs = controls.longPressMs.default,
  showDock = controls.showDock.default,
  showLabels = controls.showLabels.default,
  tone = controls.tone.default,
  wallpaper = controls.wallpaper.default,
  wobbleAngle = controls.wobbleAngle.default,
  wobbleDuration = controls.wobbleDuration.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_60%_70%_at_50%_45%,#6a4514_0%,#3a250b_45%,#1a1005_80%,#0f0903_100%)] p-5">
    <JiggleMode
      key={appCount}
      appCount={appCount}
      glowColors={[glowTop, glowRight, glowBottom]}
      hint={hint}
      liftScale={liftScale}
      longPressMs={longPressMs}
      showDock={showDock}
      showLabels={showLabels}
      tone={tone}
      wallpaper={wallpaper}
      wobbleAngle={wobbleAngle}
      wobbleDuration={wobbleDuration}
    />
  </main>
);

export default Preview;
