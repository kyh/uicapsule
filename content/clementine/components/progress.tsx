import type { ReactNode } from "react";

import "./progress.css";

export const Progress = ({
  label,
  value,
  max = 100,
  detail,
  tone = "accent",
}: {
  label: string;
  value: number;
  max?: number;
  detail?: ReactNode;
  tone?: "accent" | "success" | "ink";
}) => (
  <div className="cl-progress">
    <div className="cl-progress__head">
      <span className="cl-progress__label">{label}</span>
      {detail ? <span className="cl-progress__detail">{detail}</span> : null}
    </div>
    <progress aria-label={label} className="cl-sr" max={max} value={value} />
    <div aria-hidden className="cl-progress__track" data-tone={tone}>
      <span
        className="cl-progress__fill"
        style={{ transform: `scaleX(${Math.min(1, Math.max(0, value / max))})` }}
      />
    </div>
  </div>
);
