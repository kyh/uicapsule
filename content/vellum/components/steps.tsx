import { Check } from "lucide-react";
import type { ReactNode } from "react";

/** Where a multi-step job is: done, current, next. */
export const Steps = ({
  steps,
  current,
}: {
  steps: readonly { title: string; detail?: ReactNode }[];
  current: number;
}) => (
  <ol className="v-steps">
    {steps.map((step, index) => {
      let state = "next";

      if (index < current) {
        state = "done";
      } else if (index === current) {
        state = "current";
      }

      return (
        <li
          aria-current={state === "current" ? "step" : undefined}
          className="v-step"
          data-state={state}
          key={step.title}
        >
          <span aria-hidden className="v-step-mark">
            {state === "done" ? <Check strokeWidth={2} /> : index + 1}
          </span>
          <div className="v-stack-sm v-step-text">
            <span className={`v-label ${state === "next" ? "v-t2" : "v-t1"}`}>{step.title}</span>
            {step.detail ? <span className="v-caption v-t2">{step.detail}</span> : null}
          </div>
        </li>
      );
    })}
  </ol>
);
