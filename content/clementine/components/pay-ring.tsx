import { useId } from "react";

import { Figure } from "./figure";

import "./pay-ring.css";

export interface RingPart {
  name: string;
  amount: number;
  tone: "ink" | "quiet" | "accent" | "line" | "open";
}

const R = 70;
const C = 2 * Math.PI * R;
const GAP = 2;

/** A paycheck drawn as one segment per pot, with what is left to spend hatched and its total in the middle. */
export const PayRing = ({
  parts,
  total,
  centerLabel,
  centerValue,
}: {
  parts: readonly RingPart[];
  total: number;
  centerLabel: string;
  centerValue: number;
}) => {
  const hatch = useId();
  const visible = parts.filter((part) => part.amount > 0);

  const arcs = visible.map((part, index) => {
    const before = visible.slice(0, index).reduce((sum, item) => sum + item.amount, 0);
    const length = Math.max(1, (part.amount / total) * C - GAP);

    return { ...part, length, offset: -((before / total) * C + GAP / 2) };
  });

  return (
    <div className="cl-ring">
      <svg aria-hidden className="cl-ring__svg" viewBox="0 0 180 180">
        <defs>
          <pattern
            height={5}
            id={hatch}
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
            width={5}
          >
            <rect className="cl-ring__hatch-bg" height={5} width={5} />
            <rect className="cl-ring__hatch-line" height={5} width={2} />
          </pattern>
        </defs>
        {arcs.map((arc) => (
          <circle
            className="cl-ring__arc"
            cx={90}
            cy={90}
            data-tone={arc.tone}
            key={arc.name}
            r={R}
            stroke={arc.tone === "open" ? `url(#${hatch})` : undefined}
            strokeDasharray={`${String(arc.length)} ${String(C)}`}
            strokeDashoffset={arc.offset}
          />
        ))}
      </svg>
      <div className="cl-ring__center">
        <Figure align="center" size="large" value={centerValue} />
        <span className="cl-ring__label">{centerLabel}</span>
      </div>
    </div>
  );
};
