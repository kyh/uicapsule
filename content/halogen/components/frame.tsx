import type { ReactNode } from "react";

import { cx } from "../lib/cx";

interface FrameProps {
  label?: string;
  plain?: boolean;
  className?: string;
  children: ReactNode;
}

/** The outlined region. Split its insides with rules, not further frames. */
export const Frame = ({ label, plain, className, children }: FrameProps) => (
  <section
    aria-label={label}
    className={cx("hx-frame", className)}
    data-plain={plain === true || undefined}
  >
    {children}
  </section>
);

interface FrameHeadProps {
  title: ReactNode;
  status?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

/** The head row: mono name, status, meta, then actions at the end. */
export const FrameHead = ({ title, status, meta, actions }: FrameHeadProps) => (
  <header className="hx-head">
    <span className="hx-head-title hx-code">{title}</span>
    {status}
    {Boolean(meta) && <span className="hx-head-meta hx-code-sm">{meta}</span>}
    {Boolean(actions) && <div className="hx-head-actions">{actions}</div>}
  </header>
);

export const FrameBody = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cx("hx-body-pad", className)}>{children}</div>
);

export const FrameFoot = ({ children }: { children: ReactNode }) => (
  <footer className="hx-foot">{children}</footer>
);
