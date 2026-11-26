"use client";

import type { UnlockPatternId } from "./pattern-unlock";
import { UNLOCK_PATTERNS, PatternUnlock } from "./pattern-unlock";

const PATTERN_IDS = ["l", "z", "u", "square"] as const satisfies readonly UnlockPatternId[];

export const controls = {
  pattern: {
    default: "l",
    group: "Pattern",
    label: "Pattern",
    options: PATTERN_IDS.map((value) => ({ label: UNLOCK_PATTERNS[value].label, value })),
    type: "select",
  },
  grid: { default: 3, group: "Pattern", label: "Grid", max: 5, min: 3, step: 1, type: "number" },
  spacing: {
    default: 92,
    group: "Pattern",
    label: "Spacing",
    max: 104,
    min: 64,
    step: 2,
    type: "number",
  },
  color: { default: "#38bdf8", group: "Trail", label: "Trail", type: "color" },
  successColor: { default: "#34d399", group: "Trail", label: "Success", type: "color" },
  errorColor: { default: "#ef4444", group: "Trail", label: "Error", type: "color" },
  lineWidth: {
    default: 4,
    group: "Trail",
    label: "Line width",
    max: 10,
    min: 1,
    step: 0.5,
    type: "number",
  },
  glow: { default: 8, group: "Trail", label: "Glow", max: 24, min: 0, step: 1, type: "number" },
  ripple: { default: true, group: "Feedback", label: "Ripples", type: "boolean" },
  shake: {
    default: 12,
    group: "Feedback",
    label: "Shake",
    max: 28,
    min: 0,
    step: 1,
    type: "number",
  },
  successHold: {
    default: 2.2,
    group: "Feedback",
    label: "Unlocked hold",
    max: 5,
    min: 1,
    step: 0.1,
    type: "number",
  },
  errorHold: {
    default: 0.8,
    group: "Feedback",
    label: "Error hold",
    max: 3,
    min: 0.4,
    step: 0.1,
    type: "number",
  },
  prompt: {
    default: "Draw your pattern",
    group: "Copy",
    label: "Prompt",
    placeholder: "Prompt",
    type: "text",
  },
  hint: { default: true, group: "Copy", label: "Hint", type: "boolean" },
  successText: {
    default: "Unlocked",
    group: "Copy",
    label: "Success text",
    placeholder: "Unlocked",
    type: "text",
  },
  errorText: {
    default: "Try again",
    group: "Copy",
    label: "Error text",
    placeholder: "Try again",
    type: "text",
  },
} as const;

interface PreviewProps {
  color: string;
  errorColor: string;
  errorHold: number;
  errorText: string;
  glow: number;
  grid: number;
  hint: boolean;
  lineWidth: number;
  prompt: string;
  ripple: boolean;
  shake: number;
  pattern: UnlockPatternId;
  spacing: number;
  successColor: string;
  successHold: number;
  successText: string;
}

const Preview = ({
  color = controls.color.default,
  errorColor = controls.errorColor.default,
  errorHold = controls.errorHold.default,
  errorText = controls.errorText.default,
  glow = controls.glow.default,
  grid = controls.grid.default,
  hint = controls.hint.default,
  lineWidth = controls.lineWidth.default,
  prompt = controls.prompt.default,
  ripple = controls.ripple.default,
  shake = controls.shake.default,
  pattern = controls.pattern.default,
  spacing = controls.spacing.default,
  successColor = controls.successColor.default,
  successHold = controls.successHold.default,
  successText = controls.successText.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[repeating-linear-gradient(0deg,rgb(134_239_172/0.025)_0_1px,transparent_1px_4px),radial-gradient(circle_at_50%_45%,rgb(34_197_94/0.13)_0%,transparent_45%),linear-gradient(180deg,#07130c_0%,#040b07_60%,#020503_100%)] p-5">
    <PatternUnlock
      key={grid}
      color={color}
      errorColor={errorColor}
      errorHold={errorHold}
      errorText={errorText}
      glow={glow}
      grid={grid}
      hint={hint ? `The pattern is ${UNLOCK_PATTERNS[pattern].article} — start top-left` : ""}
      lineWidth={lineWidth}
      pattern={UNLOCK_PATTERNS[pattern].build(grid)}
      prompt={prompt}
      ripple={ripple}
      shake={shake}
      spacing={spacing}
      successColor={successColor}
      successHold={successHold}
      successText={successText}
    />
  </main>
);

export default Preview;
