import type { CSSProperties, ReactNode } from "react";

import { StatusMark } from "./status";

type AlertTone = "fail" | "warn" | "ok" | "info";

const TONE_MARK = { fail: "fail", info: "idle", ok: "ok", warn: "warn" } as const;

interface AlertProps {
  tone?: AlertTone;
  word: string;
  children: ReactNode;
  actions?: ReactNode;
  framed?: boolean;
}

/** A tinted band with a state word, a sentence and an optional action. */
export const Alert = ({ tone = "fail", word, children, actions, framed }: AlertProps) => (
  <div
    className="hx-alert"
    data-framed={framed || undefined}
    data-tone={tone}
    role={tone === "fail" ? "alert" : "status"}
  >
    <span className={`hx-status hx-label-sm ${tone === "info" ? "hx-ink-2" : `hx-${tone}-text`}`}>
      <StatusMark status={TONE_MARK[tone]} />
      {word}
    </span>
    <p className="hx-body-sm hx-measure">{children}</p>
    {actions ? <div className="hx-row-wrap hx-alert-actions">{actions}</div> : null}
  </div>
);

/** A glyph, a heading, a sentence and one action for an empty result. */
export const EmptyState = ({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) => (
  <div className="hx-stack hx-empty">
    <span className="hx-ink-3">{icon}</span>
    <h4 className="hx-heading-sm">{title}</h4>
    <p className="hx-body-sm hx-ink-2 hx-empty-text">{children}</p>
    {action}
  </div>
);

/** Static placeholder bars sized like the content they stand in for. */
export const Skeleton = ({ width = "100%", height = 12 }: { width?: string; height?: number }) => (
  <span
    aria-hidden
    className="hx-skel"
    style={{ "--h": `${height}px`, "--w": width } as CSSProperties}
  />
);
