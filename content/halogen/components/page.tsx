import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  title: string;
  meta: string;
  lead: string;
  children: ReactNode;
}

/** A top-level page region: heading with meta beside it, a lead sentence, then content. */
export const Section = ({ id, title, meta, lead, children }: SectionProps) => (
  <section aria-labelledby={`${id}-title`} className="hx-section" id={id}>
    <div className="hx-section-head">
      <h2 className="hx-title" id={`${id}-title`}>
        {title}
      </h2>
      <span className="hx-code-sm hx-ink-3">{meta}</span>
      <p className="hx-body hx-measure">{lead}</p>
    </div>
    {children}
  </section>
);

interface GroupProps {
  id: string;
  title: string;
  meta?: string;
  lead?: string;
  children: ReactNode;
}

/** A titled group inside a section. */
export const Group = ({ id, title, meta, lead, children }: GroupProps) => (
  <section aria-labelledby={`${id}-title`} className="hx-group" id={id}>
    <div className="hx-group-head">
      <h3 className="hx-heading" id={`${id}-title`}>
        {title}
      </h3>
      {meta !== undefined && meta !== "" ? (
        <span className="hx-code-sm hx-ink-3 hx-end">{meta}</span>
      ) : null}
    </div>
    {lead !== undefined && lead !== "" ? (
      <p className="hx-body-sm hx-ink-2 hx-measure">{lead}</p>
    ) : null}
    {children}
  </section>
);

interface CellProps {
  name: string;
  path?: string;
  note: string;
  wide?: boolean;
  edge?: boolean;
  children: ReactNode;
}

/** A specimen cell: name, path, live stage and a usage note. */
export const SpecCell = ({ name, path, note, wide, edge, children }: CellProps) => (
  <article
    aria-label={name}
    className="hx-cell"
    data-edge={edge === true || undefined}
    data-wide={wide === true || undefined}
  >
    <header className="hx-cell-head">
      <h4 className="hx-code">{name}</h4>
      {path !== undefined && path !== "" ? (
        <span className="hx-code-sm hx-ink-3 hx-end">{path}</span>
      ) : null}
    </header>
    <div className="hx-cell-stage">{children}</div>
    <p className="hx-cell-note hx-caption">{note}</p>
  </article>
);

export const Sheet = ({ children }: { children: ReactNode }) => (
  <div className="hx-sheet">{children}</div>
);
