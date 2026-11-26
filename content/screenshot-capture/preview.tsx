"use client";

import type { CSSProperties } from "react";

import type { ClayTone } from "./phone-frame";
import { ScreenshotCapture } from "./screenshot-capture";
import type { ThumbnailCorner } from "./screenshot-capture";

export const controls = {
  linger: { default: 4.5, label: "Linger (s)", max: 10, min: 1, step: 0.5, type: "number" },
  thumbScale: {
    default: 0.2,
    label: "Thumbnail size",
    max: 0.23,
    min: 0.12,
    step: 0.01,
    type: "number",
  },
  bounce: { default: 0.22, label: "Bounce", max: 0.6, min: 0, step: 0.02, type: "number" },
  corner: {
    default: "left",
    label: "Corner",
    options: [
      { label: "Bottom left", value: "left" },
      { label: "Bottom right", value: "right" },
    ],
    type: "select",
  },
  flash: { default: true, label: "Flash", type: "boolean" },
  ringColor: { default: "#ffffff", label: "Border", type: "color" },
  label: { default: "Screenshot", label: "Button", placeholder: "Screenshot", type: "text" },
  hint: {
    default: "Capture, then swipe the thumbnail away",
    label: "Hint",
    placeholder: "Hint text",
    type: "text",
  },
  eyebrow: { default: "Golden hour", label: "Eyebrow", placeholder: "Golden hour", type: "text" },
  title: {
    default: "Dolomites, Italy",
    label: "Title",
    placeholder: "Dolomites, Italy",
    type: "text",
  },
  tone: {
    default: "espresso",
    label: "Phone",
    options: [
      { label: "Espresso", value: "espresso" },
      { label: "Graphite", value: "graphite" },
      { label: "Moss", value: "moss" },
      { label: "Ochre", value: "ochre" },
      { label: "Plum", value: "plum" },
      { label: "Slate", value: "slate" },
      { label: "Teal", value: "teal" },
      { label: "Terracotta", value: "terracotta" },
    ],
    type: "select",
  },
} as const;

interface PreviewProps {
  bounce: number;
  corner: ThumbnailCorner;
  eyebrow: string;
  flash: boolean;
  hint: string;
  label: string;
  linger: number;
  ringColor: string;
  thumbScale: number;
  title: string;
  tone: ClayTone;
}

const backdrop: CSSProperties = {
  background: [
    "radial-gradient(ellipse 70% 38% at 50% 100%, rgb(214 120 96 / 0.42), transparent 72%)",
    "radial-gradient(ellipse 60% 50% at 50% 78%, rgb(160 68 88 / 0.35), transparent 75%)",
    "linear-gradient(180deg, #170c17 0%, #2a1224 45%, #4a1f30 80%, #5c2a32 100%)",
  ].join(", "),
};

const Preview = ({
  bounce = controls.bounce.default,
  corner = controls.corner.default,
  eyebrow = controls.eyebrow.default,
  flash = controls.flash.default,
  hint = controls.hint.default,
  label = controls.label.default,
  linger = controls.linger.default,
  ringColor = controls.ringColor.default,
  thumbScale = controls.thumbScale.default,
  title = controls.title.default,
  tone = controls.tone.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden p-5" style={backdrop}>
    <ScreenshotCapture
      bounce={bounce}
      corner={corner}
      eyebrow={eyebrow}
      flash={flash}
      hint={hint}
      label={label}
      lingerMs={linger * 1000}
      ringColor={ringColor}
      thumbScale={thumbScale}
      title={title}
      tone={tone}
    />
  </main>
);

export default Preview;
