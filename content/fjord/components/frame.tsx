import type { ReactNode } from "react";

interface HeadProps {
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  titleId?: string;
}

/** A widget or a decision: grey shell, header on the grey, one white body 4px in, footer back on the grey. */
export const Panel = ({ children, label }: { children: ReactNode; label?: string }) => (
  <section aria-label={label} className="fj-panel">
    {children}
  </section>
);

export const PanelHead = ({ title, meta, action, titleId }: HeadProps) => (
  <header className="fj-panel-head">
    <h4 className="fj-panel-title" id={titleId}>
      {title}
    </h4>
    {Boolean(meta) && <span className="fj-panel-meta">{meta}</span>}
    {Boolean(action) && <div className="fj-panel-action">{action}</div>}
  </header>
);

export const PanelBody = ({ children, pad }: { children: ReactNode; pad?: boolean }) => (
  <div className="fj-panel-body" data-pad={pad === true ? "" : undefined}>
    {children}
  </div>
);

export const PanelFoot = ({ children }: { children: ReactNode }) => (
  <footer className="fj-panel-foot">{children}</footer>
);

/** A working surface: paper, one frame line, a rule under its header. */
export const Card = ({ children, label }: { children: ReactNode; label?: string }) => (
  <section aria-label={label} className="fj-card">
    {children}
  </section>
);

export const CardHead = ({ title, meta, action, titleId }: HeadProps) => (
  <header className="fj-card-head">
    <h4 className="fj-card-title" id={titleId}>
      {title}
    </h4>
    {Boolean(meta) && <span className="fj-card-meta">{meta}</span>}
    {Boolean(action) && <div className="fj-card-action">{action}</div>}
  </header>
);

export const CardBody = ({ children }: { children: ReactNode }) => (
  <div className="fj-card-body">{children}</div>
);

export const CardFoot = ({ children }: { children: ReactNode }) => (
  <footer className="fj-card-foot">{children}</footer>
);

interface ItemProps {
  title: ReactNode;
  description?: ReactNode;
  end?: ReactNode;
  start?: ReactNode;
  size?: "sm";
}

/** The list row: 56px with a description, 40px without. */
export const Item = ({ title, description, end, start, size }: ItemProps) => (
  <div className="fj-item" data-size={size}>
    {start}
    <div className="fj-item-main">
      <div className="fj-item-title">{title}</div>
      {Boolean(description) && <div className="fj-item-desc">{description}</div>}
    </div>
    {Boolean(end) && <div className="fj-item-end">{end}</div>}
  </div>
);
