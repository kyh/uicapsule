import { useWidth } from "../lib/use-width";
import { cssVars } from "../lib/css-vars";

export interface Lane {
  id: string;
  label: string;
}

export type StepState = "done" | "active" | "pending";

export interface LaneStep {
  label: string;
  from: string;
  to?: string;
  meta?: string;
  state?: StepState;
}

interface SwimlanesProps {
  label: string;
  lanes: Lane[];
  steps: LaneStep[];
}

const ROW = 52;
const STEP = 36;
const PAD = 8;
const MIN_LANE = 112;

/** Lays a flow's steps over one column per system, with elbow connectors drawn as each step finishes. */
export const Swimlanes = ({ label, lanes, steps }: SwimlanesProps) => {
  const { ref, width } = useWidth<HTMLDivElement>(640);
  const { ref: viewRef, width: viewWidth } = useWidth<HTMLDivElement>(640);
  const laneW = width / lanes.length;
  const hidden = lanes.length - Math.floor(viewWidth / MIN_LANE);

  const index = (id: string) =>
    Math.max(
      0,
      lanes.findIndex((lane) => lane.id === id),
    );

  const span = (step: LaneStep) => {
    const a = index(step.from);
    const b = step.to !== undefined && step.to !== "" ? index(step.to) : a;

    return [Math.min(a, b), Math.max(a, b)] as const;
  };

  const centre = (step: LaneStep) => {
    const [a, b] = span(step);

    return Math.round(((a + b + 1) / 2) * laneW) + 0.5;
  };

  return (
    <figure aria-label={label} className="hx-lanes-figure">
      <div className="hx-lanes-scroll" ref={viewRef}>
        <div className="hx-lanes-inner" style={cssVars({ "--lanes": lanes.length })}>
          <div className="hx-lanes" style={cssVars({ "--lanes": lanes.length })}>
            {lanes.map((lane) => (
              <div className="hx-lane-head hx-micro" key={lane.id}>
                {lane.label}
              </div>
            ))}
          </div>
          <div ref={ref} className="hx-lane-field" style={cssVars({ "--rows": steps.length })}>
            <svg
              aria-hidden
              className="hx-lane-svg"
              height={steps.length * ROW + PAD}
              viewBox={`0 0 ${width} ${steps.length * ROW + PAD}`}
              width={width}
            >
              {steps.slice(1).map((step, offset) => {
                const prev = steps[offset];

                if (!prev) {
                  return null;
                }

                const x1 = centre(prev);
                const x2 = centre(step);
                const y1 = offset * ROW + PAD + STEP;
                const y2 = (offset + 1) * ROW + PAD;
                const mid = Math.round((y1 + y2) / 2) + 0.5;
                const drawn = prev.state === "done";

                return (
                  <g key={`${prev.label}-${step.label}`}>
                    <path
                      className={drawn ? "hx-lane-path hx-lane-draw" : "hx-lane-path"}
                      d={`M ${x1} ${y1} V ${mid} H ${x2} V ${y2 - 3}`}
                      data-drawn={drawn}
                      pathLength={1}
                    />
                    {drawn ? (
                      <rect
                        fill="var(--hx-rule-control)"
                        height={4}
                        width={4}
                        x={x2 - 2}
                        y={y2 - 4}
                      />
                    ) : null}
                  </g>
                );
              })}
            </svg>
            <ol aria-label={label}>
              {steps.map((step, row) => {
                const [a, b] = span(step);

                return (
                  <li
                    className="hx-lane-step"
                    data-state={step.state}
                    data-tone={step.state === "active" ? "accent" : undefined}
                    key={step.label}
                    style={cssVars({
                      "--from": a,
                      "--row": row,
                      "--span": b - a + 1,
                    })}
                  >
                    <span className="hx-micro hx-truncate">{step.label}</span>
                    {step.meta !== undefined && step.meta !== "" ? (
                      <span className="hx-code-sm hx-ink-3 hx-truncate">{step.meta}</span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
      {hidden > 0 ? (
        <figcaption className="hx-lanes-cue hx-code-sm hx-ink-3">
          Scroll sideways for {hidden} more {hidden === 1 ? "system" : "systems"} →
        </figcaption>
      ) : null}
    </figure>
  );
};
