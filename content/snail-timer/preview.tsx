"use client";

import { useState } from "react";
import { SnailTimer } from "./snail-timer";

export const controls = {
  initialSeconds: {
    default: 45,
    label: "Duration (seconds)",
    max: 120,
    min: 5,
    step: 5,
    type: "number",
  },
  gaitDuration: {
    default: 1,
    label: "Gait (seconds)",
    max: 3,
    min: 0.3,
    step: 0.1,
    type: "number",
  },
  outlineColor: { default: "#7247ff", label: "Outline", type: "color" },
  fillColor: { default: "#9a70ea", label: "Fill", type: "color" },
  label: {
    default: "seconds remaining",
    label: "Label",
    placeholder: "seconds remaining",
    type: "text",
  },
} as const;

const phaseLabels = {
  done: "Restart Countdown",
  running: "Stop Timer",
  stopped: "Start Countdown",
};

interface PreviewProps {
  initialSeconds: number;
  gaitDuration: number;
  outlineColor: string;
  fillColor: string;
  label: string;
}

const Preview = ({
  initialSeconds = controls.initialSeconds.default,
  gaitDuration = controls.gaitDuration.default,
  outlineColor = controls.outlineColor.default,
  fillColor = controls.fillColor.default,
  label = controls.label.default,
}: Partial<PreviewProps>) => {
  const [phase, setPhase] = useState<"stopped" | "running" | "done">("stopped");
  const [run, setRun] = useState(0);

  const handleToggle = () => {
    if (phase === "done") {
      setRun((prev) => prev + 1);
    }

    setPhase(phase === "running" ? "stopped" : "running");
  };

  const handleTimeout = () => {
    setPhase("done");
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <button type="button" onClick={handleToggle}>
        {phaseLabels[phase]}
      </button>
      <SnailTimer
        key={`${initialSeconds}-${run}`}
        started={phase === "running"}
        onTimeout={handleTimeout}
        initialSeconds={initialSeconds}
        gaitDuration={gaitDuration}
        outlineColor={outlineColor}
        fillColor={fillColor}
        label={label}
      />
    </div>
  );
};

export default Preview;
