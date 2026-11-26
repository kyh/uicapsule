import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRight, Check, Pause, X } from "lucide-react";

import { cssVars } from "../lib/css";
import { formatAgo } from "../lib/format";
import { useInterval } from "../lib/hooks";
import { Icon } from "./icon";
import { StatusArc } from "./status";
import type { StatusValue } from "./status";

export interface StatEntry {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: ReactNode;
}

/** A run of figures read left to right, parted by rules and sharing one edge. */
export const StatStrip = ({ stats, label }: { stats: StatEntry[]; label: string }) => (
  <dl aria-label={label} className="fj-stats" style={cssVars({ "--fj-cols": stats.length })}>
    {stats.map((stat) => (
      <div className="fj-stat" key={stat.label}>
        <dt className="fj-stat-label">{stat.label}</dt>
        <dd className="fj-stat-value">
          {stat.value}
          {stat.unit !== undefined && stat.unit !== "" ? <small>{stat.unit}</small> : null}
        </dd>
        {stat.delta ? <dd className="fj-stat-delta">{stat.delta}</dd> : null}
      </div>
    ))}
  </dl>
);

export const DataList = ({ entries }: { entries: { term: string; value: ReactNode }[] }) => (
  <dl className="fj-datalist">
    {entries.map((entry) => (
      <Fragment key={entry.term}>
        <dt>{entry.term}</dt>
        <dd>{entry.value}</dd>
      </Fragment>
    ))}
  </dl>
);

/** A time that keeps itself current, counted from mount so server and browser agree. */
export const RelativeTime = ({
  secondsAgo,
  live = true,
}: {
  secondsAgo: number;
  live?: boolean;
}) => {
  const [extra, setExtra] = useState(0);

  useInterval(
    () => {
      setExtra((value) => value + 15);
    },
    live ? 15_000 : null,
  );

  const total = secondsAgo + extra;
  const minutes = Math.round(total / 60);

  return (
    <time
      className="fj-data"
      dateTime={`PT${minutes}M`}
      title={`${minutes} minutes before you opened this page`}
    >
      {formatAgo(total)}
    </time>
  );
};

export interface TimelineStep {
  id: string;
  title: ReactNode;
  description: ReactNode;
  status: StatusValue | "paused" | "stopped";
  end: ReactNode;
}

const TimelineGlyph = ({ status }: { status: TimelineStep["status"] }) => {
  if (status === "running") {
    return <StatusArc size={12} />;
  }

  if (status === "ok") {
    return <Icon icon={Check} size={12} />;
  }

  if (status === "fail" || status === "stopped") {
    return <Icon icon={X} size={12} />;
  }

  if (status === "paused" || status === "waiting") {
    return <Icon icon={Pause} size={12} />;
  }

  return <span className="fj-tl-ring" />;
};

/** Steps on one line, oldest first; each says its outcome in words at the end. */
export const Timeline = ({ steps, label }: { steps: TimelineStep[]; label: string }) => (
  <ol aria-label={label} className="fj-timeline">
    {steps.map((step) => (
      <li className="fj-tl-item" key={step.id}>
        <span aria-hidden className="fj-tl-glyph" data-status={step.status}>
          <TimelineGlyph status={step.status} />
        </span>
        <div className="fj-item-main">
          <span className="fj-item-title">{step.title}</span>
          <span className="fj-item-desc">{step.description}</span>
        </div>
        <div className="fj-tl-end">{step.end}</div>
      </li>
    ))}
  </ol>
);

interface CollapsibleProps {
  label: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

/** Opens and closes with a cut. No height ever tweens. */
export const Collapsible = ({ label, children, defaultOpen = false }: CollapsibleProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        aria-expanded={open}
        className="fj-collapsible-trigger"
        onClick={() => {
          setOpen((value) => !value);
        }}
        type="button"
      >
        <Icon icon={ChevronRight} size={12} />
        {label}
      </button>
      {open ? children : null}
    </div>
  );
};
