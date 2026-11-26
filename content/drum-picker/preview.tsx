"use client";

import { DrumPicker } from "./drum-picker";

export const controls = {
  format: {
    default: "12h",
    label: "Format",
    options: [
      { label: "12-hour", value: "12h" },
      { label: "24-hour", value: "24h" },
    ],
    type: "select",
  },
  minuteStep: {
    default: "1",
    label: "Minute step",
    options: [
      { label: "1 min", value: "1" },
      { label: "5 min", value: "5" },
      { label: "15 min", value: "15" },
    ],
    type: "select",
  },
  initialHour: { default: 9, label: "Start hour", max: 23, min: 0, step: 1, type: "number" },
  initialMinute: { default: 41, label: "Start minute", max: 59, min: 0, step: 1, type: "number" },
  itemHeight: { default: 38, label: "Row height", max: 48, min: 28, step: 1, type: "number" },
  visibleItems: { default: 7, label: "Visible rows", max: 9, min: 5, step: 2, type: "number" },
  curvature: { default: 62, label: "Curvature", max: 80, min: 0, step: 1, type: "number" },
  glide: { default: 220, label: "Glide", max: 600, min: 80, step: 10, type: "number" },
  momentum: { default: 0.55, label: "Momentum", max: 1, min: 0.2, step: 0.05, type: "number" },
  fog: { default: true, label: "Edge fog", type: "boolean" },
  accent: { default: "#ff637e", label: "Accent", type: "color" },
  surface: { default: "#1d0b10", label: "Surface", type: "color" },
  textColor: { default: "#ffffff", label: "Text", type: "color" },
  title: { default: "Alarm", label: "Title", placeholder: "Alarm", type: "text" },
  hint: {
    default: "Flick a wheel — it snaps to rest",
    label: "Hint",
    placeholder: "Hint text",
    type: "text",
  },
} as const;

interface PreviewProps {
  format: "12h" | "24h";
  minuteStep: "1" | "5" | "15";
  initialHour: number;
  initialMinute: number;
  itemHeight: number;
  visibleItems: number;
  curvature: number;
  glide: number;
  momentum: number;
  fog: boolean;
  accent: string;
  surface: string;
  textColor: string;
  title: string;
  hint: string;
}

const Preview = ({
  format = controls.format.default,
  minuteStep = controls.minuteStep.default,
  initialHour = controls.initialHour.default,
  initialMinute = controls.initialMinute.default,
  itemHeight = controls.itemHeight.default,
  visibleItems = controls.visibleItems.default,
  curvature = controls.curvature.default,
  glide = controls.glide.default,
  momentum = controls.momentum.default,
  fog = controls.fog.default,
  accent = controls.accent.default,
  surface = controls.surface.default,
  textColor = controls.textColor.default,
  title = controls.title.default,
  hint = controls.hint.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_60%_45%_at_50%_100%,rgb(239_68_68/0.16)_0%,transparent_70%),radial-gradient(circle_at_50%_35%,#3a0b14_0%,#22060c_50%,#0f0306_100%)] p-5">
    <DrumPicker
      key={`${format}-${minuteStep}-${initialHour}-${initialMinute}-${itemHeight}`}
      format={format}
      minuteStep={Number(minuteStep)}
      initialHour={initialHour}
      initialMinute={initialMinute}
      itemHeight={itemHeight}
      visibleItems={visibleItems}
      curvature={curvature}
      glide={glide}
      momentum={momentum}
      fog={fog}
      accent={accent}
      surface={surface}
      textColor={textColor}
      title={title}
      hint={hint}
    />
  </main>
);

export default Preview;
