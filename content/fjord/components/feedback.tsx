import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CircleCheck, Info, OctagonX, TriangleAlert } from "lucide-react";

import type { Kind } from "./badge";
import { cssVars } from "../lib/css";
import { Icon } from "./icon";

const noop = () => null;

const ALERT_ICON = { fail: OctagonX, info: Info, ok: CircleCheck, warn: TriangleAlert } as const;

interface AlertProps {
  status: keyof typeof ALERT_ICON;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

/** A notice on paper: a glyph for how bad, a heading that says what broke, and what to do about it. */
export const Alert = ({ status, title, children, actions }: AlertProps) => (
  <div className="fj-alert" data-status={status} role={status === "fail" ? "alert" : "status"}>
    <Icon icon={ALERT_ICON[status]} />
    <div className="fj-alert-body">
      <p className="fj-alert-title">{title}</p>
      <div className="fj-alert-text">{children}</div>
    </div>
    {Boolean(actions) && <div className="fj-alert-actions">{actions}</div>}
  </div>
);

interface EmptyProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

/** Top left of the body: a title, one line and the action. No art, no centred void. */
export const EmptyState = ({ title, children, actions }: EmptyProps) => (
  <div className="fj-empty">
    <p className="fj-empty-title">{title}</p>
    <p className="fj-empty-text">{children}</p>
    {Boolean(actions) && <div className="fj-hstack">{actions}</div>}
  </div>
);

export const Skeleton = ({ width }: { width: string }) => (
  <span aria-hidden className="fj-skeleton" style={{ width }} />
);

const SHOW_DELAY = 150;
const HOLD_MIN = 400;

/** Shows the skeleton only when loading outlasts 150ms, then holds it at least 400ms so it never blinks. */
export const useSkeletonGate = (loading: boolean) => {
  const [shown, setShown] = useState(false);
  const [since, setSince] = useState(0);

  useEffect(() => {
    if (loading && !shown) {
      const timer = window.setTimeout(() => {
        setShown(true);
        setSince(Date.now());
      }, SHOW_DELAY);

      return () => {
        window.clearTimeout(timer);
      };
    }

    if (!loading && shown) {
      const wait = Math.max(0, HOLD_MIN - (Date.now() - since));

      const timer = window.setTimeout(() => {
        setShown(false);
      }, wait);

      return () => {
        window.clearTimeout(timer);
      };
    }

    return noop;
  }, [loading, shown, since]);

  return shown;
};

interface ProgressProps {
  label: string;
  value?: number;
  max?: number;
  valueText?: string;
  kind?: Kind;
  trouble?: "warn" | "fail";
}

/** How far the work got. Without a value it slides; the slide is one of the two loops Fjord allows. */
export const Progress = ({ label, value, max = 100, valueText, kind, trouble }: ProgressProps) => {
  const percent = value === undefined ? undefined : Math.min(100, (value / max) * 100);

  return (
    <div className="fj-progress" data-kind={kind} data-trouble={trouble}>
      <div className="fj-progress-head">
        <span>{label}</span>
        <span>{valueText ?? (percent === undefined ? "" : `${Math.round(percent)}%`)}</span>
      </div>
      <progress
        aria-label={label}
        aria-valuetext={valueText}
        className="fj-sr"
        max={max}
        value={value}
      />
      <div
        aria-hidden
        className="fj-progress-track"
        data-indeterminate={value === undefined ? "" : undefined}
      >
        <span
          className="fj-progress-fill"
          style={percent === undefined ? undefined : { width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export const StepProgress = ({
  label,
  done,
  total,
  trouble,
}: {
  label: string;
  done: number;
  total: number;
  trouble?: number;
}) => (
  <div
    className="fj-steps"
    data-trouble={trouble === undefined ? undefined : "fail"}
    style={cssVars({ "--fj-count": total })}
  >
    <progress aria-label={label} className="fj-sr" max={total} value={done} />
    {Array.from({ length: total }, (_, index) => index).map((step) => (
      <span
        aria-hidden
        data-done={step < done && step !== trouble ? "" : undefined}
        data-trouble={step === trouble ? "" : undefined}
        key={step}
      />
    ))}
  </div>
);
