"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export const controls = {
  type: {
    default: "block",
    label: "Animation",
    options: [
      { label: "Pixel grid", value: "block" },
      { label: "Fade", value: "default" },
    ],
    type: "select",
  },
  placement: { default: "top", options: ["top", "right", "bottom", "left"], type: "select" },
  width: { default: 200, max: 400, min: 80, step: 10, type: "number" },
  aspectRatio: {
    default: "16/9",
    options: [
      { label: "16:9", value: "16/9" },
      { label: "4:3", value: "4/3" },
      { label: "1:1", value: "1/1" },
      { label: "3:4", value: "3/4" },
    ],
    type: "select",
  },
  cols: { default: 11, label: "Columns", max: 24, min: 2, step: 1, type: "number" },
  rows: { default: 8, max: 16, min: 2, step: 1, type: "number" },
  stepMs: { default: 70, label: "Block fade (ms)", max: 200, min: 20, step: 5, type: "number" },
  panelColor: { default: "#020617", label: "Panel", type: "color" },
  guides: { default: true, label: "Guide lines", type: "boolean" },
  guideColor: { default: "#334155", label: "Guide color", type: "color" },
  label: { default: "Hover", label: "Trigger label", placeholder: "Hover", type: "text" },
  background: { default: "#1d293d", label: "Backdrop", type: "color" },
} as const;

interface PreviewProps {
  aspectRatio: string;
  background: string;
  cols: number;
  guideColor: string;
  guides: boolean;
  label: string;
  panelColor: string;
  placement: "top" | "right" | "bottom" | "left";
  rows: number;
  stepMs: number;
  type: "block" | "default";
  width: number;
}

const Preview = ({
  aspectRatio = controls.aspectRatio.default,
  background = controls.background.default,
  cols = controls.cols.default,
  guideColor = controls.guideColor.default,
  guides = controls.guides.default,
  label = controls.label.default,
  panelColor = controls.panelColor.default,
  placement = controls.placement.default,
  rows = controls.rows.default,
  stepMs = controls.stepMs.default,
  type = controls.type.default,
  width = controls.width.default,
}: Partial<PreviewProps>) => (
  <div
    className="flex h-screen items-center justify-center text-slate-50"
    style={{ backgroundColor: background }}
  >
    <Tooltip placement={placement}>
      <TooltipTrigger className="p-4">{label}</TooltipTrigger>
      <TooltipContent
        type={type}
        cols={cols}
        rows={rows}
        blockDuration={stepMs / 1000}
        panelColor={panelColor}
        guides={guides}
        guideColor={guideColor}
      >
        <div style={{ aspectRatio, width }} />
      </TooltipContent>
    </Tooltip>
  </div>
);

export default Preview;
