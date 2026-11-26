import type { ReactNode } from "react";

import { cx } from "./lib/cx";

export const Section = ({
  id,
  title,
  lead,
  jumps,
  children,
}: {
  id: string;
  title: string;
  lead: string;
  jumps: readonly { id: string; name: string }[];
  children: ReactNode;
}) => (
  <section aria-labelledby={`${id}-title`} className="cl-section" id={id}>
    <header className="cl-section__head">
      <h2 className="cl-section__title" id={`${id}-title`}>
        {title}
      </h2>
      <p className="cl-section__lead">{lead}</p>
      <nav aria-label={`${title}, jump to`}>
        <ul className="cl-jumps">
          {jumps.map((jump) => (
            <li key={jump.id}>
              <a href={`#${jump.id}`}>{jump.name}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
    {children}
  </section>
);

export const Block = ({
  id,
  title,
  lead,
  children,
  className,
}: {
  id?: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <div className={cx("cl-block", className)} id={id}>
    <h3 className="cl-block__title">{title}</h3>
    {Boolean(lead) && <p className="cl-block__lead">{lead}</p>}
    {children}
  </div>
);

export const Frame = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx("cl-frame", className)}>{children}</div>
);

export const Specimen = ({
  name,
  note,
  children,
  wide = false,
}: {
  name: string;
  note: string;
  children: ReactNode;
  wide?: boolean;
}) => (
  <article className="cl-spec" data-wide={wide || undefined}>
    <header className="cl-spec__head">
      <h4 className="cl-spec__name">{name}</h4>
      <p className="cl-spec__note">{note}</p>
    </header>
    <div className="cl-spec__stage">{children}</div>
  </article>
);
