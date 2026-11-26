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
} as const;

interface PreviewProps {
  initialSeconds: number;
}

const Preview = ({ initialSeconds = controls.initialSeconds.default }: Partial<PreviewProps>) => {
  const [started, setStarted] = useState(false);

  const handleToggleStarted = () => {
    setStarted((prev) => !prev);
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <button type="button" onClick={handleToggleStarted}>
        {started ? "Stop Timer" : "Start Countdown"}
      </button>
      <SnailTimer key={initialSeconds} started={started} initialSeconds={initialSeconds} />
    </div>
  );
};

export default Preview;
